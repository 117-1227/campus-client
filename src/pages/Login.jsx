import { useState } from 'react'
import { loginApi } from '../utils/api'
import { log, error as logError } from '../utils/debug'

export default function Login({ onLogin }) {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!studentId.trim() || !password.trim()) { setError('请输入学号和密码'); return }
    setLoading(true)
    try {
      const result = await loginApi(studentId.trim(), password)
      log('auth', `登录接口返回: ${result.username}, assistantId=${result.assistantId}`)
      onLogin(result.token, { id: result.id, username: result.username, role: 'student', assistantId: result.assistantId })
    } catch (err) { logError('auth', '登录失败', err.message); setError(err.message || '登录失败，请重试') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
          </div>
          <h1 className="page-title text-gray-900">校内学助工作平台</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="studentId">学号</label>
            <input id="studentId" type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="请输入学号" autoComplete="username" className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">密码</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" autoComplete="current-password" className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-6">演示：2023000001 / 000001（密码为学号后 6 位）</p>
      </div>
    </div>
  )
}
