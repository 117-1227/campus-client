import { useState } from 'react'
import Profile from '../pages/student/Profile'
import WorkHoursRecord from '../pages/student/WorkHoursRecord'
import ClockInOut from '../pages/student/ClockInOut'

const PAGES = [
  { key: 'clockInOut', label: '打卡签到', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
  { key: 'profile', label: '个人档案', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>) },
  { key: 'workHoursRecord', label: '工时记录', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
]

const TITLES = { clockInOut: '打卡签到', profile: '个人档案', workHoursRecord: '工时记录' }

export default function StudentShell({ auth, onLogout, remainMs, formatRemain, expiredModal }) {
  const [currentPage, setCurrentPage] = useState('clockInOut')
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
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white shrink-0">{auth.user?.username?.charAt(0).toUpperCase() || 'S'}</div>
            <div className="min-w-0"><p className="text-sm text-white font-medium truncate">{auth.user?.username || 'student'}</p><p className="text-xs text-indigo-200">学生</p></div>
            <button onClick={onLogout} className="ml-auto p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="退出"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg></button>
          </div>
          <div className="flex items-center justify-between"><p className="text-xs text-indigo-200">v1.0</p>{remainMs > 0 && <p className="text-xs text-indigo-200">剩余 {formatRemain(remainMs)}</p>}</div><p className="text-xs text-indigo-200/70 mt-2">© 版权归青穹团队所有</p>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 shrink-0"><div className="max-w-[1200px] mx-auto px-6 py-4"><h1 className="page-title text-gray-900">{TITLES[currentPage]}</h1></div></header>
        <div className="flex-1 overflow-auto"><div className="max-w-[1200px] mx-auto px-6 py-8">{renderPage()}</div></div>
      </main>
    </div>
  )
}
