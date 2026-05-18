import { useState, useEffect, useCallback } from 'react'
import { fetchAssistant, fetchAttendanceStatus, updateMyProfile } from '../../utils/api'

function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [error, setError] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [success, setSuccess] = useState('')
  const [fetchError, setFetchError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const id = user.assistantId
      if (!id) { setFetchError('您的账号尚未绑定学助档案，请联系管理员'); return }
      const [p, a] = await Promise.all([fetchAssistant(id), fetchAttendanceStatus().catch(() => null)])
      setProfile(p); setAttendance(a); setPhone(p.phone || ''); setFetchError('')
    }
    catch (e) { setFetchError(e.message || '加载失败') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  function openEdit() { setError(''); setPwdError(''); setSuccess(''); setPhone(profile?.phone || ''); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); setEditModal(true) }

  async function handleSavePhone(e) {
    e.preventDefault()
    setError('')
    if (!phone.trim()) { setError('手机号不能为空'); return }
    setSavingPhone(true)
    try { await updateMyProfile({ phone: phone.trim() }); setSuccess('手机号已更新'); await fetchData() }
    catch (err) { setError(err.message || '保存失败') }
    finally { setSavingPhone(false) }
  }

  async function handleChangePwd(e) {
    e.preventDefault()
    setPwdError('')
    if (!oldPwd) { setPwdError('请输入旧密码'); return }
    if (!newPwd || newPwd.length < 6) { setPwdError('新密码至少 6 位'); return }
    if (newPwd !== confirmPwd) { setPwdError('两次密码不一致'); return }
    setSavingPwd(true)
    try { await updateMyProfile({ currentPassword: oldPwd, newPassword: newPwd }); setSuccess('密码已修改'); setOldPwd(''); setNewPwd(''); setConfirmPwd('') }
    catch (err) { setPwdError(err.message || '修改失败') }
    finally { setSavingPwd(false) }
  }

  if (!profile) {
    if (loading) return (
      <div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">加载中...</p></div>
    )
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-8 text-center">
        <svg className="w-8 h-8 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        <p className="text-sm text-red-700 font-medium">加载失败</p>
        <p className="text-xs text-red-500 mt-1">{fetchError || '无法获取个人资料'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card-8pt">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-600 shrink-0">
            {profile.name?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.studentId}</p>
          </div>
          <button
            onClick={openEdit}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            编辑资料
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">岗位等级</p>
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' + (profile.position === '一级岗' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
              {profile.position || '-'}
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">手机</p>
            <p className="text-sm font-medium text-gray-900">{profile.phone || '-'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">打卡状态</p>
            <div className="flex items-center gap-1.5">
              <span className={'w-2 h-2 rounded-full ' + (attendance?.openSession ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400')} />
              <p className="text-sm font-medium text-gray-900">
                {attendance?.openSession ? `上班中 · ${attendance.openSession.shiftLabel || ''}` : '已下班'}
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">入职时间</p>
            <p className="text-sm font-medium text-gray-900">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : '-'}</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* 编辑资料弹窗（含手机号 + 密码修改） */}
      <Modal open={editModal} title="编辑资料" onClose={() => setEditModal(false)}>
        <div className="space-y-6">
          {/* 手机号 */}
          <form onSubmit={handleSavePhone}>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">手机号</h4>
            <div className="flex gap-3">
              <input
                type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="flex-1 h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
              <button type="submit" disabled={savingPhone} className="h-10 px-4 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors shrink-0">
                {savingPhone ? '...' : '保存'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </form>

          {/* 分割线 */}
          <div className="border-t border-gray-100" />

          {/* 修改密码 */}
          <form onSubmit={handleChangePwd}>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">修改密码</h4>
            <div className="space-y-3">
              <input
                type="password" value={oldPwd}
                onChange={e => setOldPwd(e.target.value)}
                placeholder="旧密码"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
              <input
                type="password" value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="新密码（至少 6 位）"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
              <input
                type="password" value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="确认新密码"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
            </div>
            {pwdError && <p className="text-xs text-red-600 mt-2">{pwdError}</p>}
            <button type="submit" disabled={savingPwd} className="mt-3 w-full h-10 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors">
              {savingPwd ? '修改中...' : '确认修改'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
