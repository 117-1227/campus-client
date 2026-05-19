import { useState, useEffect } from 'react'
import Profile from '../pages/student/Profile'
import WorkHoursRecord from '../pages/student/WorkHoursRecord'
import ClockInOut from '../pages/student/ClockInOut'
import { fetchAssistant, fetchShiftNotice, respondShiftNotice } from '../utils/api'
import { log, warn } from '../utils/debug'
import Modal from './Modal'
import ConfirmModal from './ConfirmModal'

const PAGES = [
  { key: 'clockInOut', label: '打卡签到', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
  { key: 'profile', label: '个人档案', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>) },
  { key: 'workHoursRecord', label: '工时记录', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
]

const TITLES = { clockInOut: '打卡签到', profile: '个人档案', workHoursRecord: '工时记录' }

export default function StudentShell({ auth, onLogout, remainMs, formatRemain, expiredModal }) {
  const [currentPage, setCurrentPage] = useState('clockInOut')
  const [assistantName, setAssistantName] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const [shiftNotice, setShiftNotice] = useState(null)
  const [shiftLoading, setShiftLoading] = useState(false)

  useEffect(() => {
    async function poll() {
      try {
        const result = await fetchShiftNotice()
        if (result?.notice) setShiftNotice(result.notice)
      } catch (e) { warn('component', `通知轮询失败: ${e.message}`) }
    }
    poll()
    const iv = setInterval(poll, 10000)
    return () => clearInterval(iv)
  }, [])

  async function handleShiftResponse(response) {
    setShiftLoading(true)
    try {
      await respondShiftNotice(shiftNotice.id, response)
    } catch (e) {
      alert(e.message || '响应失败')
    }
    setShiftLoading(false)
    setShiftNotice(null)
  }

  useEffect(() => {
    const id = auth.user?.assistantId
    if (id) {
      fetchAssistant(id)
        .then(a => { log('component', `侧边栏名字获取成功: ${a.name || '(空)'}`); setAssistantName(a.name || '') })
        .catch(err => warn('component', `侧边栏名字获取失败: ${err.message}`))
    } else {
      warn('component', 'assistantId 为空，侧边栏回退显示学号')
    }
  }, [auth.user?.assistantId])

  const displayName = assistantName || auth.user?.username || '学生'
  const avatarChar = (assistantName || auth.user?.username || 'S').charAt(0).toUpperCase()
  log('state', `侧边栏渲染: displayName="${displayName}", assistantName="${assistantName}"`)
  const renderPage = () => { switch (currentPage) { case 'clockInOut': return <ClockInOut />; case 'profile': return <Profile />; case 'workHoursRecord': return <WorkHoursRecord />;default: return <ClockInOut /> } }

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      <aside className="w-60 bg-gradient-to-b from-indigo-500 to-purple-600 text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/10"><span className="text-base font-semibold tracking-tight text-white">校内学助工作平台</span></div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {PAGES.map(p => { const active = currentPage === p.key; return (
            <button key={p.key} onClick={() => setCurrentPage(p.key)} className={'w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all duration-150 ' + (active ? 'bg-white/15 text-white font-medium' : 'text-indigo-100 hover:text-white hover:bg-white/10')}>
              <span className={active ? 'text-white' : 'text-indigo-200'}>{p.icon}</span><span>{p.label}</span>
            </button>
          )})}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white shrink-0">{avatarChar}</div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{displayName}（学生）</p>
              <p className="text-xs text-indigo-200 truncate">{auth.user?.username || ''}</p>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="ml-auto p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="退出"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg></button>
          </div>
          <div className="flex items-center justify-between"><p className="text-xs text-indigo-200">v1.0</p>{remainMs > 0 && <p className="text-xs text-indigo-200">剩余 {formatRemain(remainMs)}</p>}</div><p className="text-xs text-indigo-200/70 mt-2">© 版权归青穹团队所有</p>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 shrink-0"><div className="max-w-[1200px] mx-auto px-6 py-4"><h1 className="page-title text-gray-900">{TITLES[currentPage]}</h1></div></header>
        <div className="flex-1 overflow-auto"><div className="max-w-[1200px] mx-auto px-6 py-8">{renderPage()}</div></div>
      </main>

      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="确认退出" footer={
        <>
          <button onClick={() => setShowLogoutConfirm(false)} className="h-9 px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</button>
          <button onClick={() => { setShowLogoutConfirm(false); onLogout() }} className="h-9 px-5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">确定退出</button>
        </>
      }>
        <p className="text-sm text-gray-600">退出后需要重新登录，确认退出吗？</p>
      </Modal>

      <ConfirmModal
        open={!!shiftNotice}
        title="管理员通知"
        message={`管理员请求您进行【${shiftNotice?.actionLabel}】打卡，是否确认？`}
        detail={shiftNotice?.secondsLeft != null ? `请在 ${shiftNotice.secondsLeft} 秒内响应，超时将自动拒绝` : undefined}
        confirmLabel="确认打卡"
        confirmClass="bg-indigo-500 hover:bg-indigo-600"
        onConfirm={() => handleShiftResponse('confirmed')}
        onCancel={() => handleShiftResponse('declined')}
        loading={shiftLoading}
      />
    </div>
  )
}
