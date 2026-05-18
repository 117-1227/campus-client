import { useState, useCallback, useEffect } from 'react'
import Login from './pages/Login'
import TeacherShell from './components/TeacherShell'
import StudentShell from './components/StudentShell'
import Modal from './components/Modal'

function getStoredAuth() { try { const t = localStorage.getItem('token'); const u = JSON.parse(localStorage.getItem('user') || 'null'); if (t && u) return { token: t, user: u } } catch { } return null }
function parseJwt(token) { try { const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(atob(b)) } catch { return null } }
function getTokenExp(token) { const p = parseJwt(token); return p?.exp ? p.exp * 1000 : null }
function formatRemain(ms) { if (ms <= 0) return '已过期'; const m = Math.floor(ms / 60000); if (m < 60) return `${m} 分钟`; const h = Math.floor(m / 60); const rm = m % 60; return rm > 0 ? `${h} 小时 ${rm} 分钟` : `${h} 小时` }

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth)
  const [expiredModal, setExpiredModal] = useState(false)
  const [remainMs, setRemainMs] = useState(0)

  const handleLogin = useCallback((token, user) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); setAuth({ token, user }) }, [])
  const handleLogout = useCallback(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setAuth(null); setExpiredModal(false) }, [])

  useEffect(() => { if (!auth?.token) return; function check() { const exp = getTokenExp(auth.token); if (!exp) return; const r = exp - Date.now(); setRemainMs(r > 0 ? r : 0); if (Date.now() >= exp) setExpiredModal(true) } check(); const t = setInterval(check, 30000); return () => clearInterval(t) }, [auth])

  if (!auth) return <Login onLogin={handleLogin} />

  const role = auth.user?.role
  const shellProps = { auth, onLogout: handleLogout, remainMs, formatRemain, expiredModal }

  return (
    <>
      {/* 教师端暂停：role === 'teacher' 临时走学生端 */}
      {role === 'student' || role === 'teacher' ? <StudentShell {...shellProps} /> : <Login onLogin={handleLogin} />}
      <Modal isOpen={expiredModal} onClose={() => {}} title="登录已过期" footer={<button onClick={handleLogout} className="btn-8pt text-white bg-indigo-600 hover:bg-indigo-700">重新登录</button>}>
        <p className="text-sm text-gray-600 text-center">您的登录会话已过期，请重新登录以继续使用。</p>
      </Modal>
    </>
  )
}
