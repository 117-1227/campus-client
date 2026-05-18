// ===== Request infrastructure =====
async function realRequest(path, options = {}) {
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
    if (token) headers['Authorization'] = `Bearer ${token}`
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
  if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data
  return data
}

// ===== Mock data =====
const USE_MOCK = false  

let mockAssistants = [
  { id: '1', studentId: '2021001', name: '张三', position: '一级岗', status: 'active', isOnShift: true, phone: '13800138001' },
  { id: '2', studentId: '2021002', name: '李四', position: '二级岗', status: 'active', isOnShift: true, phone: '13800138002' },
  { id: '3', studentId: '2021003', name: '王五', position: '一级岗', status: 'inactive', isOnShift: false, phone: '13800138003' },
  { id: '4', studentId: '2021004', name: '赵六', position: '二级岗', status: 'active', isOnShift: false, phone: '13800138004' },
  { id: '5', studentId: '2021005', name: '孙七', position: '一级岗', status: 'active', isOnShift: true, phone: '13800138005' },
]

const mockWorkHours = {
  '2026-05': [
    { studentId: '2021001', name: '张三', totalHours: 48, workDays: 12, daily: [{ date: '2026-05-02', hours: 4, checkIn: '08:00', checkOut: '12:00' }, { date: '2026-05-03', hours: 4, checkIn: '08:05', checkOut: '11:55' }] },
    { studentId: '2021002', name: '李四', totalHours: 36, workDays: 9, daily: [{ date: '2026-05-03', hours: 4, checkIn: '08:10', checkOut: '12:00' }] },
    { studentId: '2021003', name: '王五', totalHours: 20, workDays: 5, daily: [] },
    { studentId: '2021004', name: '赵六', totalHours: 44, workDays: 11, daily: [] },
    { studentId: '2021005', name: '孙七', totalHours: 32, workDays: 8, daily: [] },
  ],
}

let mockSchedules = [
  { id: '1', assistantName: '张三', studentId: '2021001', date: '2026-05-02', shiftType: '早班', startTime: '08:00', endTime: '12:00', location: '图书馆A区' },
  { id: '2', assistantName: '李四', studentId: '2021002', date: '2026-05-02', shiftType: '午班', startTime: '13:00', endTime: '17:00', location: '实验楼B栋' },
]

let mockSessionId = 100
function mockSid() { return `sess-${String(mockSessionId++)}` }

let mockOpenSession = {
  id: mockSid(), assistantId: 'asst-001', date: new Date().toISOString().slice(0, 10), shiftType: 'morning', shiftLabel: '上午班',
  startTime: new Date(Date.now() - 3600000 * 3).toISOString(), endTime: null, durationMinutes: null, status: 'open'
}

let mockSessions = [
  { id: mockSid(), assistantId: 'asst-001', date: '2026-05-15', shiftType: 'afternoon', shiftLabel: '下午班', startTime: '2026-05-15T05:10:00.000Z', endTime: '2026-05-15T09:28:00.000Z', durationMinutes: 258, hours: '4.30', status: 'closed', autoCloseReason: null, correctionNote: null, punchInId: 'p-1', punchOutId: 'p-2' },
  { id: mockSid(), assistantId: 'asst-001', date: '2026-05-14', shiftType: 'morning', shiftLabel: '上午班', startTime: '2026-05-14T01:00:00.000Z', endTime: '2026-05-14T05:15:00.000Z', durationMinutes: 255, hours: '4.25', status: 'closed', autoCloseReason: null, correctionNote: null, punchInId: 'p-3', punchOutId: 'p-4' },
  { id: mockSid(), assistantId: 'asst-001', date: '2026-05-13', shiftType: 'evening', shiftLabel: '晚班', startTime: '2026-05-13T10:00:00.000Z', endTime: '2026-05-13T13:30:00.000Z', durationMinutes: 210, hours: '3.50', status: 'auto_closed', autoCloseReason: '超时自动收口', correctionNote: null, punchInId: 'p-5', punchOutId: null },
]

let nextId = 6
function uid() { return String(nextId++) }

function mockHandler(fn) {
  return (...args) => new Promise((resolve, reject) =>
    setTimeout(() => { try { resolve(fn(...args)) } catch (e) { reject(e) } }, 300)
  )
}

// ===== Mock routes =====
const mockRoutes = {
  'POST /api/user/login': mockHandler((body) => {
    if (!body?.studentId || !body?.password) throw new Error('学号和密码为必填项')
    const accounts = {
      '2021001': { id: 'a1', username: '2021001', password: '654321', assistantId: 'asst-001' },
      '2023000001': { id: 'a2', username: '2023000001', password: '000001', assistantId: 'asst-002' },
      '2023000005': { id: 'a3', username: '2023000005', password: '000005', assistantId: 'asst-003' },
    }
    const acc = accounts[body.studentId]
    if (acc && body.password === acc.password) return { id: acc.id, username: acc.username, assistantId: acc.assistantId, token: `mock-jwt-${body.studentId}` }
    throw new Error('学号或密码无效')
  }),

  'GET /api/teacher/assistants': mockHandler(() => [...mockAssistants]),
  'GET /api/teacher/work-hours': mockHandler((q) => mockWorkHours[q?.month || '2026-05'] || []),
  'GET /api/teacher/work-hours/:studentId': mockHandler((sid, q) => (mockWorkHours[q?.month || '2026-05'] || []).find(s => s.studentId === sid) || { studentId: sid, name: '', totalHours: 0, workDays: 0, daily: [] }),
  'GET /api/teacher/schedules': mockHandler((q) => mockSchedules.filter(s => s.date.startsWith(q?.month || '2026-05'))),
  'POST /api/teacher/schedules': mockHandler((body) => { const item = { id: uid(), ...body }; mockSchedules.push(item); return item }),
  'PUT /api/teacher/schedules/:id': mockHandler((id, body) => { const i = mockSchedules.findIndex(s => s.id === id); if (i !== -1) Object.assign(mockSchedules[i], body); return mockSchedules[i] }),
  'DELETE /api/teacher/schedules/:id': mockHandler((id) => { mockSchedules = mockSchedules.filter(s => s.id !== id); return { success: true } }),

  'GET /api/assistants/:id': mockHandler((id) => { const a = mockAssistants.find(x => x.id === id); if (a) return a; throw Object.assign(new Error('学助不存在'), { status: 404 }) }),
  'PUT /api/assistants/me': mockHandler((body) => {
    const a = mockAssistants.find(x => x.studentId === '2021001')
    if (!a) throw new Error('未找到学助档案')
    if (body?.currentPassword) {
      if (body.currentPassword !== '654321') throw new Error('当前密码不正确')
      if (!body.newPassword || body.newPassword.length < 6) throw new Error('新密码至少 6 位')
      if (body.currentPassword === body.newPassword) throw new Error('新密码不能与旧密码相同')
    }
    if (body?.phone !== undefined) a.phone = body.phone
    return { ...a, message: '更新成功' }
  }),

  // 考勤模块
  'GET /api/attendance/status': mockHandler(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const todaySessions = mockSessions.filter(s => s.date === today)
    if (mockOpenSession) todaySessions.push({ ...mockOpenSession, hours: Math.round((now - new Date(mockOpenSession.startTime).getTime()) / 3600000 * 100) / 100 + '' })
    let pendingReminder = null
    if (mockOpenSession) {
      const restTime = { morning: '12:30', afternoon: '18:00', evening: '22:00', other: '--:--' }[mockOpenSession.shiftType] || '--:--'
      pendingReminder = { sessionId: mockOpenSession.id, shiftType: mockOpenSession.shiftType, shiftLabel: mockOpenSession.shiftLabel, restTime, startTime: mockOpenSession.startTime, message: `您的${mockOpenSession.shiftLabel}已到休息时间（${restTime}），请确认：是否仍在加班？` }
    }
    return { openSession: mockOpenSession || null, pendingReminder, todaySessions, serverTime: now.toISOString() }
  }),

  'POST /api/attendance/punch': mockHandler((body) => {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const shiftType = hour < 12.5 ? 'morning' : hour < 18 ? 'afternoon' : hour < 22 ? 'evening' : 'other'
    const shiftLabel = { morning: '上午班', afternoon: '下午班', evening: '晚班', other: '其他' }[shiftType]
    const restTime = { morning: '12:30', afternoon: '18:00', evening: '22:00', other: '--:--' }[shiftType]
    if (body?.type === 'IN') {
      if (mockOpenSession) { const err = new Error('已有进行中的班次'); err.status = 409; throw err }
      mockOpenSession = { id: mockSid(), assistantId: 'asst-001', date: now.toISOString().slice(0, 10), shiftType, shiftLabel, startTime: now.toISOString(), endTime: null, durationMinutes: null, status: 'open' }
      return { message: `上班打卡成功（${shiftLabel}）`, sessionId: mockOpenSession.id, shiftType, shiftLabel, startTime: mockOpenSession.startTime, expectedEndAt: restTime, status: 'open' }
    }
    if (body?.type === 'OUT') {
      if (!mockOpenSession) { const err = new Error('当前没有进行中的班次'); err.status = 409; throw err }
      const dur = Math.round((now - new Date(mockOpenSession.startTime).getTime()) / 60000)
      mockOpenSession.endTime = now.toISOString(); mockOpenSession.durationMinutes = dur; mockOpenSession.hours = (dur / 60).toFixed(2); mockOpenSession.status = 'closed'; mockOpenSession.punchOutId = 'p-out-' + Date.now()
      const sess = { ...mockOpenSession }; mockSessions.unshift(sess); mockOpenSession = null
      return { message: '下班打卡成功', sessionId: sess.id, shiftLabel: sess.shiftLabel, startTime: sess.startTime, endTime: sess.endTime, durationMinutes: sess.durationMinutes, hours: sess.hours, status: 'closed' }
    }
    throw new Error('type 参数缺失或不合法')
  }),

  'GET /api/attendance/sessions': mockHandler((q) => {
    let list = [...mockSessions]
    if (q?.from) list = list.filter(s => s.date >= q.from)
    if (q?.to) list = list.filter(s => s.date <= q.to)
    if (q?.status) list = list.filter(s => s.status === q.status)
    const page = +q?.page || 1; const limit = +q?.limit || 20; const start = (page - 1) * limit
    return { data: list.slice(start, start + limit), total: list.length, page, limit }
  }),

  'GET /api/attendance/summary': mockHandler((q) => {
    const finished = mockSessions.filter(s => s.status === 'closed' || s.status === 'auto_closed' || s.status === 'corrected')
    let list = finished
    if (q?.from) list = list.filter(s => s.date >= q.from)
    if (q?.to) list = list.filter(s => s.date <= q.to)
    const totalMinutes = list.reduce((s, r) => s + (r.durationMinutes || 0), 0)
    const autoClosedCount = list.filter(s => s.status === 'auto_closed').length
    const byDate = []
    const dates = [...new Set(list.map(s => s.date))].sort()
    for (const d of dates) {
      const dayItems = list.filter(s => s.date === d)
      const dayMins = dayItems.reduce((s, r) => s + (r.durationMinutes || 0), 0)
      byDate.push({ date: d, minutes: dayMins, hours: (dayMins / 60).toFixed(2), sessionCount: dayItems.length, hasAnomalies: dayItems.some(s => s.status === 'auto_closed') })
    }
    return { totalMinutes, totalHours: (totalMinutes / 60).toFixed(2), sessionCount: list.length, autoClosedCount, hasUnconfirmed: autoClosedCount > 0, unconfirmedTip: autoClosedCount > 0 ? `您有 ${autoClosedCount} 条系统自动收口记录，请联系管理员核实工时` : null, byDate }
  }),
}

// ===== Mock dispatcher =====
function stripQuery(str) { const idx = str.indexOf('?'); return idx === -1 ? str : str.slice(0, idx) }
function extractQuery(str) { const idx = str.indexOf('?'); if (idx === -1) return undefined; const p = {}; for (const pair of str.slice(idx + 1).split('&')) { const [k, v] = pair.split('='); p[decodeURIComponent(k)] = decodeURIComponent(v || '') } return p }

async function mockRequest(path, options = {}) {
  const method = options.method || 'GET'
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : undefined) : undefined
  const query = extractQuery(path)
  const plainPath = stripQuery(path)
  if (mockRoutes[plainPath]) {
    const routeParts = plainPath.split('/')
    const cleanPath = stripQuery(path.replace(/^[A-Z]+ /, ''))
    const pathParts = cleanPath.split('/')
    const params = []
    for (let i = 0; i < routeParts.length; i++) { if (routeParts[i].startsWith(':')) params.push(pathParts[i] || (body && body[routeParts[i].slice(1)])) }
    const args = [...params, body || query || undefined].filter(v => v !== undefined)
    return mockRoutes[plainPath](...args)
  }
  for (const [routeKey, handler] of Object.entries(mockRoutes)) {
    const spaceIdx = routeKey.indexOf(' ')
    const routeMethod = routeKey.slice(0, spaceIdx)
    const routePath = routeKey.slice(spaceIdx + 1)
    if (routeMethod !== method) continue
    const routeParts = routePath.split('/')
    const cleanPath = stripQuery(plainPath.replace(/^[A-Z]+ /, ''))
    const pathParts = cleanPath.split('/')
    if (routeParts.length !== pathParts.length) continue
    const params = []; let match = true
    for (let i = 0; i < routeParts.length; i++) { if (routeParts[i].startsWith(':')) params.push(pathParts[i]); else if (routeParts[i] !== pathParts[i]) { match = false; break } }
    if (match) return handler(...params, body || query || undefined)
  }
  throw new Error(`Mock route not found: ${method} ${plainPath}`)
}

const request = USE_MOCK ? mockRequest : realRequest

// ===== API functions =====

/** 登录 — 使用学号作为账号 */
export function loginApi(studentId, password) {
  return request('POST /api/user/login', { method: 'POST', body: JSON.stringify({ studentId, password }) })
}

// ---- 教师端 ----

/** 获取学助列表 */
export function fetchAssistants() {
  return request('GET /api/teacher/assistants')
}

/** 获取工时统计列表（按月份） */
export function fetchTeacherWorkHours(month) {
  return request(`GET /api/teacher/work-hours?month=${month}`)
}

/** 获取单个学生工时详情 */
export function fetchTeacherWorkHoursDetail(studentId, month) {
  return request(`GET /api/teacher/work-hours/${studentId}?month=${month}`)
}

/** 获取排班列表（按月份） */
export function fetchSchedules(month) {
  return request(`GET /api/teacher/schedules?month=${month}`)
}

/** 添加排班 */
export function createSchedule(data) {
  return request('POST /api/teacher/schedules', { method: 'POST', body: JSON.stringify(data) })
}

/** 编辑排班 */
export function updateSchedule(id, data) {
  return request('PUT /api/teacher/schedules/:id', { method: 'PUT', body: JSON.stringify({ id, ...data }) })
}

/** 删除排班 */
export function deleteSchedule(id) {
  return request(`DELETE /api/teacher/schedules/${id}`, { method: 'DELETE' })
}

// ---- 学生端 ----

/** 获取学助档案 */
export function fetchAssistant(id) {
  return request(`GET /api/assistants/${id}`)
}

/** 更新个人资料（手机号 / 密码） */
export function updateMyProfile(data) {
  return request('PUT /api/assistants/me', { method: 'PUT', body: JSON.stringify(data) })
}

// ---- 考勤模块 ----

/** 获取考勤状态快照（含 openSession / pendingReminder / todaySessions） */
export function fetchAttendanceStatus() {
  return request('GET /api/attendance/status')
}

/** 打卡（上班或下班） */
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
