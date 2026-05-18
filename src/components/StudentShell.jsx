import { useState, useEffect } from 'react'
import Profile from '../pages/student/Profile'
import WorkHoursRecord from '../pages/student/WorkHoursRecord'
import ClockInOut from '../pages/student/ClockInOut'
import { fetchAssistant } from '../utils/api'
import { log, warn } from '../utils/debug'
import Modal from './Modal'
import SettingsModal from './SettingsModal'

const PAGES = [
  { key: 'clockInOut', label: '打卡签到', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
  { key: 'profile', label: '个人档案', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>) },
  { key: 'workHoursRecord', label: '工时记录', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
]

const TITLES = { clockInOut: '打卡签到', profile: '个人档案', workHoursRecord: '工时记录' }

export default function StudentShell({ auth, onLogout, remainMs, formatRemain, expiredModal }) {
  const [currentPage, setCurrentPage] = useState('clockInOut')
  const [assistantName, setAssistantName] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

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
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>设置</span>
          </button>
          <div className="flex items-center justify-between"><p className="text-xs text-indigo-200">v1.0</p>{remainMs > 0 && <p className="text-xs text-indigo-200">剩余 {formatRemain(remainMs)}</p>}</div><p className="text-xs text-indigo-200/70 mt-2">© 版权归青穹团队所有</p>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 shrink-0"><div className="max-w-[1200px] mx-auto px-6 py-4"><h1 className="page-title text-gray-900">{TITLES[currentPage]}</h1></div></header>
        <div className="flex-1 overflow-auto"><div className="max-w-[1200px] mx-auto px-6 py-8">{renderPage()}</div></div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="确认退出" footer={
        <>
          <button onClick={() => setShowLogoutConfirm(false)} className="h-9 px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</button>
          <button onClick={() => { setShowLogoutConfirm(false); onLogout() }} className="h-9 px-5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">确定退出</button>
        </>
      }>
        <p className="text-sm text-gray-600">退出后需要重新登录，确认退出吗？</p>
      </Modal>
    </div>
  )
}
