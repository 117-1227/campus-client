async function request(path, options = {}) {
  let url = path.replace(/^[A-Z]+ /, '')
  if (options.body && typeof options.body === 'string') {
    try {
      const bodyObj = JSON.parse(options.body)
      url = url.replace(/:(\w+)/g, (_, key) => bodyObj[key] ?? `:${key}`)
    } catch { /* not JSON */ }
  }
  const headers = { 'Content-Type': 'application/json' }
  try {
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('[api] 请求', url, '| token 前 20 位:', token.slice(0, 20) + '...')
    } else {
      console.warn('[api] 请求', url, '| 无 token')
    }
  } catch { /* */ }
  const isFormData = options.body instanceof FormData
  if (isFormData) delete headers['Content-Type']
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } })
  const text = await res.text().catch(() => '')
  let data = {}
  try { if (text) data = JSON.parse(text) } catch { /* not JSON */ }
  if (!res.ok) {
    const detail = data.errors?.length ? ': ' + data.errors.join('; ') : ''
    const webMsg = text.startsWith('<!') || text.startsWith('<html') ? `服务器内部错误 (${res.status})` : text.slice(0, 200)
    const msg = data.message || data.error || webMsg || `请求失败 (${res.status})`
    throw new Error(msg + detail)
  }
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    // 若响应还包含 total/page/limit 等分页元数据，返回完整对象
    const keys = Object.keys(data)
    if (keys.length > 1) return data
    return data.data
  }
  return data
}

// ===== 登录 =====

/** 学号登录 */
export function loginApi(studentId, password) {
  return request('POST /api/user/login', { method: 'POST', body: JSON.stringify({ studentId, password }) })
}

/** 获取当前登录账户资料 */
export function fetchUserProfile() {
  return request('GET /api/user/profile')
}

// ===== 学助资料 =====

/** 获取学助档案 */
export function fetchAssistant(id) {
  return request(`GET /api/assistants/${id}`)
}

/** 更新个人资料（仅手机号 / 密码） */
export function updateMyProfile(data) {
  return request('PUT /api/assistants/me', { method: 'PUT', body: JSON.stringify(data) })
}

// ===== 考勤模块 =====

/** 获取考勤状态快照（含 openSession / pendingReminder / todaySessions） */
export function fetchAttendanceStatus() {
  return request('GET /api/attendance/status')
}

/** 打卡（IN 上班 / OUT 下班） */
export function punch(type, source = 'web') {
  return request('POST /api/attendance/punch', { method: 'POST', body: JSON.stringify({ type, source }) })
}

/** 查询历史班次明细（分页） */
export function fetchAttendanceSessions(params = {}) {
  const qs = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return request(`GET /api/attendance/sessions${qs ? '?' + qs : ''}`)
}

/** 查询工时汇总统计 */
export function fetchAttendanceSummary(from, to) {
  const qs = [from && `from=${from}`, to && `to=${to}`].filter(Boolean).join('&')
  return request(`GET /api/attendance/summary${qs ? '?' + qs : ''}`)
}
