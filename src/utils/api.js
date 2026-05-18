import { log, error as logError, warn } from './debug'

async function request(path, options = {}) {
  let url = path.replace(/^[A-Z]+ /, '')
  const method = options.method || 'GET'
  if (options.body && typeof options.body === 'string') {
    try {
      const bodyObj = JSON.parse(options.body)
      url = url.replace(/:(\w+)/g, (_, key) => bodyObj[key] ?? `:${key}`)
    } catch { /* not JSON */ }
  }
  const headers = { 'Content-Type': 'application/json' }
  let hasToken = false
  try {
    const token = localStorage.getItem('token')
    if (token) { headers['Authorization'] = `Bearer ${token}`; hasToken = true }
  } catch { /* */ }
  const isFormData = options.body instanceof FormData
  if (isFormData) delete headers['Content-Type']

  log('api', `${method} ${url}`, hasToken ? '🔑' : '🚫')

  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } })
  const text = await res.text().catch(() => '')
  let data = {}
  try { if (text) data = JSON.parse(text) } catch { /* not JSON */ }

  if (!res.ok) {
    const detail = data.errors?.length ? ': ' + data.errors.join('; ') : ''
    const webMsg = text.startsWith('<!') || text.startsWith('<html') ? `服务器内部错误 (${res.status})` : text.slice(0, 200)
    const msg = data.message || data.error || webMsg || `请求失败 (${res.status})`
    logError('api', `${method} ${url} → ${res.status} ${msg.slice(0, 80)}`)
    throw new Error(msg + detail)
  }

  const keys = Object.keys(data)
  const summary = Array.isArray(data) ? `array[${data.length}]` : keys.length ? `{${keys.slice(0, 4).join(',')}${keys.length > 4 ? '...' : ''}}` : '{}'
  log('api', `${method} ${url} → ${res.status} ${summary}`)

  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    if (keys.length > 1) return data
    return data.data
  }
  return data
}

// ===== 登录 =====

export function loginApi(studentId, password) {
  return request('POST /api/user/login', { method: 'POST', body: JSON.stringify({ studentId, password }) })
}

export function fetchUserProfile() {
  return request('GET /api/user/profile')
}

// ===== 学助资料 =====

export function fetchAssistant(id) {
  return request(`GET /api/assistants/${id}`)
}

export function updateMyProfile(data) {
  return request('PUT /api/assistants/me', { method: 'PUT', body: JSON.stringify(data) })
}

// ===== 考勤模块 =====

export function fetchAttendanceStatus() {
  return request('GET /api/attendance/status')
}

export function punch(type, source = 'web') {
  return request('POST /api/attendance/punch', { method: 'POST', body: JSON.stringify({ type, source }) })
}

export function fetchAttendanceSessions(params = {}) {
  const qs = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return request(`GET /api/attendance/sessions${qs ? '?' + qs : ''}`)
}

export function fetchAttendanceSummary(from, to) {
  const qs = [from && `from=${from}`, to && `to=${to}`].filter(Boolean).join('&')
  return request(`GET /api/attendance/summary${qs ? '?' + qs : ''}`)
}

// ===== 管理员通知（远程打卡） =====

export function fetchShiftNotice() {
  return request('GET /api/attendance/shift-notice')
}

export function respondShiftNotice(notificationId, response) {
  return request('POST /api/attendance/shift-notice/respond', { method: 'POST', body: JSON.stringify({ notificationId, response }) })
}
