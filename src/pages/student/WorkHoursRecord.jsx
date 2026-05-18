import { useState, useEffect, useCallback } from 'react'
import { fetchAttendanceSummary, fetchAttendanceSessions } from '../../utils/api'

function fmtShort(d) { return d ? new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--' }

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'open', label: '进行中' },
  { value: 'closed', label: '已完成' },
  { value: 'auto_closed', label: '自动收口' },
  { value: 'pending_confirm', label: '待确认' },
  { value: 'corrected', label: '已纠正' },
]

const STATUS_BADGE = {
  open: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-gray-50 text-gray-600',
  auto_closed: 'bg-amber-50 text-amber-700',
  pending_confirm: 'bg-orange-50 text-orange-700',
  corrected: 'bg-blue-50 text-blue-700',
}

const STATUS_LABEL = {
  open: '进行中',
  closed: '已完成',
  auto_closed: '自动收口',
  pending_confirm: '待确认',
  corrected: '已纠正',
}

export default function WorkHoursRecord() {
  const today = new Date()
  const cm = today.toISOString().slice(0, 7)
  const [month, setMonth] = useState(cm)

  // 汇总
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  // 班次明细
  const [sessions, setSessions] = useState([])
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsStatus, setSessionsStatus] = useState('')
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const from = `${month}-01`
  const to = (() => { const [y, m] = month.split('-').map(Number); const d = new Date(y, m, 0); return `${month}-${String(d.getDate()).padStart(2, '0')}` })()
  const limit = 10

  const fetchSummary = useCallback(async () => {
    if (!month) return
    setLoading(true)
    try {
      const s = await fetchAttendanceSummary(from, to)
      setData(s)
    } catch { /* ignore */ }
    setLoading(false)
  }, [month])

  const fetchSessions = useCallback(async () => {
    if (!month) return
    setSessionsLoading(true)
    try {
      const params = { from, to, page: sessionsPage, limit }
      if (sessionsStatus) params.status = sessionsStatus
      const result = await fetchAttendanceSessions(params)
      setSessions(result.data || [])
      setSessionsTotal(result.total || 0)
    } catch { setSessions([]); setSessionsTotal(0) }
    setSessionsLoading(false)
  }, [month, sessionsPage, sessionsStatus])

  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => { fetchSessions() }, [fetchSessions])

  const totalPages = Math.ceil(sessionsTotal / limit)

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">本月总工时</p>
          <p className="stat-number text-emerald-600">{data?.totalHours || '0'}h</p>
          <p className="text-xs text-gray-400 mt-1">累计工作小时</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">出勤班次</p>
          <p className="stat-number text-gray-900">{data?.sessionCount || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            日均 {data && data.byDate?.length > 0 ? (parseFloat(data.totalHours) / data.byDate.length).toFixed(1) : 0}h
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">当月月份</p>
          <p className="stat-number text-gray-900">{month.split('-')[1]}月</p>
          <p className="text-xs text-gray-400 mt-1">{month.split('-')[0]} 年</p>
        </div>
      </div>

      {/* 异常提示 */}
      {data?.hasUnconfirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <p className="text-sm text-amber-700">{data.unconfirmedTip}</p>
        </div>
      )}

      {/* 月份选择器 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          <input type="month" value={month} onChange={e => { setMonth(e.target.value); setSessionsPage(1); setSessionsStatus('') }} className="h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" />
        </div>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      {/* 每日工时汇总 */}
      {data && (
        <div className="card-8pt">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">每日工时汇总</h4>
          {data.byDate?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">日期</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">班次数</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">工时</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.byDate.map(d => (
                    <tr key={d.date}>
                      <td className="py-3 text-gray-700">{d.date}</td>
                      <td className="py-3 text-gray-700">{d.sessionCount}</td>
                      <td className="py-3 text-gray-900 font-medium tabular-nums">{d.hours}h</td>
                      <td className="py-3">
                        {d.hasAnomalies ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">含异常</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">本月暂无出勤记录</p>
          )}
        </div>
      )}

      {/* 班次明细 */}
      <div className="card-8pt">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900">班次明细</h4>
          <div className="flex items-center gap-1.5">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSessionsStatus(opt.value); setSessionsPage(1) }}
                className={'px-2.5 py-1 text-xs rounded-lg transition-colors ' + (sessionsStatus === opt.value ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {sessionsLoading ? (
          <p className="text-sm text-gray-400 py-8 text-center">加载中...</p>
        ) : sessions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">日期</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">班次</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">签到</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">签退</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">工时</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">状态</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td className="py-3 text-gray-700">{s.date}</td>
                      <td className="py-3 text-gray-700">{s.shiftLabel}</td>
                      <td className="py-3 text-gray-700 tabular-nums">{fmtShort(s.startTime)}</td>
                      <td className="py-3 text-gray-700 tabular-nums">{fmtShort(s.endTime)}</td>
                      <td className="py-3 text-gray-900 font-medium tabular-nums">{s.hours || '-'}h</td>
                      <td className="py-3">
                        <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + (STATUS_BADGE[s.status] || 'bg-gray-50 text-gray-600')}>
                          {STATUS_LABEL[s.status] || s.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-400 max-w-[160px] truncate" title={s.autoCloseReason || s.correctionNote || ''}>
                        {s.autoCloseReason || s.correctionNote || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                <p className="text-xs text-gray-400">共 {sessionsTotal} 条记录</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSessionsPage(p => Math.max(1, p - 1))}
                    disabled={sessionsPage <= 1}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="px-2 text-xs text-gray-500">{sessionsPage} / {totalPages}</span>
                  <button
                    onClick={() => setSessionsPage(p => Math.min(totalPages, p + 1))}
                    disabled={sessionsPage >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">暂无班次记录</p>
        )}
      </div>
    </div>
  )
}
