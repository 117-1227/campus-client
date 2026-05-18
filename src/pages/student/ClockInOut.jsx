import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAttendanceStatus, punch } from '../../utils/api'

function fmtTime(d) { return d ? new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--' }
function fmtShort(d) { return d ? new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--' }
function fmtDuration(ms) { const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000); const s = Math.floor((ms % 60000) / 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` }

function ConfirmModal({ open, title, message, detail, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-4">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
          {detail && <p className="text-xs text-gray-400 mt-2">{detail}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 h-11 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors">取消</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 h-11 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors ${confirmClass || 'bg-indigo-500 hover:bg-indigo-600'}`}>{loading ? '处理中...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function ClockInOut() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [modal, setModal] = useState(null) // { type: 'in' | 'out' | 'overtime' }
  const [now, setNow] = useState(new Date())
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  const openSession = status?.openSession
  const pendingReminder = status?.pendingReminder
  const todaySessions = status?.todaySessions || pendingReminder?.todaySessions || []
  const clockedIn = !!openSession

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const s = await fetchAttendanceStatus()
      setStatus(s)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  // 首次加载 + 每 60 秒轮询考勤状态
  useEffect(() => { fetchStatus(); const iv = setInterval(fetchStatus, 60000); return () => clearInterval(iv) }, [fetchStatus])

  // 有待确认的加班提醒时弹窗（仅当用户未主动关闭过此提醒）
  const dismissedSessionRef = useRef(null)
  useEffect(() => {
    if (pendingReminder && pendingReminder.sessionId !== dismissedSessionRef.current) {
      setModal({ type: 'overtime' })
    }
  }, [pendingReminder])

  function closeOvertime() {
    dismissedSessionRef.current = pendingReminder?.sessionId
    setModal(null)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!openSession) { setElapsed(0); return }
    setElapsed(Date.now() - new Date(openSession.startTime).getTime())
    const iv = setInterval(() => {
      setElapsed(Date.now() - new Date(openSession.startTime).getTime())
    }, 1000)
    return () => clearInterval(iv)
  }, [openSession?.startTime])

  function openModal(type) { setModal({ type }) }
  function closeModal() { setModal(null) }

  async function handleConfirm() {
    if (!modal) return
    setActionLoading(true)
    try {
      if (modal.type === 'overtime') {
        await punch('OUT')
      } else if (modal.type === 'in') {
        await punch('IN')
      } else if (modal.type === 'out') {
        await punch('OUT')
      }
    } catch (e) {
      alert(e.message || '操作失败')
    }
    setActionLoading(false)
    setModal(null)
    await fetchStatus()
  }

  if (loading && !status) return (
    <div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">加载中...</p></div>
  )

  return (
    <div className="space-y-6 w-full">
      {/* 顶部：数字时钟 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 text-center">
        <p className="text-sm text-gray-400 mb-2">{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} {now.toLocaleDateString('zh-CN', { weekday: 'long' })}</p>
        <p className="text-[4rem] font-light text-gray-900 tabular-nums leading-none tracking-tighter">{fmtTime(now)}</p>
        <div className="mt-4 inline-flex items-center gap-2">
          <span className={'w-2.5 h-2.5 rounded-full ' + (clockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300')} />
          <span className={'text-sm font-medium ' + (clockedIn ? 'text-emerald-600' : 'text-gray-500')}>
            {clockedIn ? `已上班 · ${openSession.shiftLabel}` : '未上班'}
          </span>
        </div>
      </div>

      {/* 中部：双栏卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左栏：状态 / 计时 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
          {clockedIn ? (
            <>
              <p className="text-xs text-gray-400 mb-1">本次上班已</p>
              <p className="text-[2.75rem] font-light text-gray-900 tabular-nums leading-none tracking-tight">{fmtDuration(elapsed)}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">签到时间</p>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">{fmtShort(openSession.startTime)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">预计下班</p>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">{openSession.expectedEndAt || '--:--'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm text-gray-500">今天还没有打卡记录</p>
              <p className="text-xs text-gray-400 mt-1">点击右侧按钮开始签到</p>
            </div>
          )}
        </div>

        {/* 右栏：操作按钮 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
          {clockedIn ? (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">完成今日工作后请及时签退</p>
                <p className="text-xs text-gray-400 mt-1">当前班次：{openSession.shiftLabel}</p>
              </div>
              <button
                onClick={() => openModal('out')}
                disabled={actionLoading}
                className="w-full max-w-xs h-14 inline-flex items-center justify-center gap-2 px-6 text-base font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                {actionLoading ? '处理中...' : '下班签退'}
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">确认到岗后请点击签到</p>
              </div>
              <button
                onClick={() => openModal('in')}
                disabled={actionLoading}
                className="w-full max-w-xs h-14 inline-flex items-center justify-center gap-2 px-6 text-base font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {actionLoading ? '处理中...' : '上班签到'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 底部：今日班次记录 */}
      {todaySessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">今日班次</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">班次</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">签到</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">签退</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">工时</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todaySessions.map((s, i) => (
                  <tr key={s.id || i}>
                    <td className="py-3 text-gray-700">{s.shiftLabel}</td>
                    <td className="py-3 text-gray-700 tabular-nums">{fmtShort(s.startTime)}</td>
                    <td className="py-3 text-gray-700 tabular-nums">{fmtShort(s.endTime)}</td>
                    <td className="py-3 text-gray-900 font-medium tabular-nums">{s.hours || '-'}h</td>
                    <td className="py-3">
                      <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + (s.status === 'open' ? 'bg-emerald-50 text-emerald-700' : s.status === 'closed' ? 'bg-gray-50 text-gray-600' : 'bg-amber-50 text-amber-700')}>
                        {{ open: '进行中', closed: '已完成', auto_closed: '自动收口', pending_confirm: '待确认' }[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 签到弹窗 */}
      <ConfirmModal
        open={modal?.type === 'in'}
        title="确认签到"
        message="确认现在开始上班打卡？"
        detail={`签到时间：${fmtTime(now)}`}
        confirmLabel="确认上班"
        confirmClass="bg-emerald-500 hover:bg-emerald-600"
        onConfirm={handleConfirm}
        onCancel={closeModal}
        loading={actionLoading}
      />

      {/* 签退弹窗 */}
      <ConfirmModal
        open={modal?.type === 'out'}
        title="确认签退"
        message="确认现在结束上班并签退？"
        detail={clockedIn ? `本次上班时长：${fmtDuration(elapsed)}` : undefined}
        confirmLabel="确认下班"
        confirmClass="bg-amber-500 hover:bg-amber-600"
        onConfirm={handleConfirm}
        onCancel={closeModal}
        loading={actionLoading}
      />

      {/* 加班提醒弹窗 */}
      <ConfirmModal
        open={modal?.type === 'overtime'}
        title="加班提醒"
        message={pendingReminder?.message || '您的班次已到休息时间'}
        detail={pendingReminder ? `标准下班时间：${pendingReminder.restTime}` : undefined}
        confirmLabel="我已完成，签退"
        confirmClass="bg-amber-500 hover:bg-amber-600"
        onConfirm={handleConfirm}
        onCancel={closeOvertime}
        loading={actionLoading}
      />
    </div>
  )
}
