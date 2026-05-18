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
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.errors?.length ? ': ' + data.errors.join('; ') : ''
    throw new Error((data.message || `请求失败 (${res.status})`) + detail)
  }
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data
  return data
}

// ===== Mock data =====
const USE_MOCK = true

let mockAssistants = [
  { id: '1', studentId: '2021001', name: '张三', positionLevel: '一级岗', status: 'active', isOnDuty: true, phone: '13800138001' },
  { id: '2', studentId: '2021002', name: '李四', positionLevel: '二级岗', status: 'active', isOnDuty: true, phone: '13800138002' },
  { id: '3', studentId: '2021003', name: '王五', positionLevel: '一级岗', status: 'inactive', isOnDuty: false, phone: '13800138003' },
  { id: '4', studentId: '2021004', name: '赵六', positionLevel: '二级岗', status: 'active', isOnDuty: false, phone: '13800138004' },
  { id: '5', studentId: '2021005', name: '孙七', positionLevel: '一级岗', status: 'active', isOnDuty: true, phone: '13800138005' },
]

let mockApprovals = [
  { id: '1', applicant: '张三', studentId: '2021001', applyDate: '2026-05-10', cardDate: '2026-05-08', reason: '忘记打卡', status: 'pending' },
  { id: '2', applicant: '李四', studentId: '2021002', applyDate: '2026-05-11', cardDate: '2026-05-09', reason: '系统故障', status: 'pending' },
  { id: '3', applicant: '王五', studentId: '2021003', applyDate: '2026-05-09', cardDate: '2026-05-07', reason: '外出开会', status: 'approved' },
  { id: '4', applicant: '赵六', studentId: '2021004', applyDate: '2026-05-08', cardDate: '2026-05-06', reason: '忘记带卡', status: 'rejected', rejectReason: '理由不充分' },
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

let mockClockState = { '2021001': { clockedIn: true, lastCheckIn: new Date(Date.now() - 3600000 * 3).toISOString(), lastCheckOut: null, todayRecords: [{ checkIn: new Date(Date.now() - 3600000 * 3).toISOString(), checkOut: null, hours: 3 }] } }

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
  'GET /api/teacher/approvals': mockHandler((q) => q?.status === 'all' ? [...mockApprovals] : mockApprovals.filter(a => a.status === (q?.status || 'pending'))),
  'POST /api/teacher/approvals/:id/approve': mockHandler((id) => { const a = mockApprovals.find(x => x.id === id); if (a) a.status = 'approved'; return { success: true } }),
  'POST /api/teacher/approvals/:id/reject': mockHandler((id, body) => { const a = mockApprovals.find(x => x.id === id); if (a) { a.status = 'rejected'; a.rejectReason = body?.reason || '' } return { success: true } }),
  'GET /api/teacher/schedules': mockHandler((q) => mockSchedules.filter(s => s.date.startsWith(q?.month || '2026-05'))),
  'POST /api/teacher/schedules': mockHandler((body) => { const item = { id: uid(), ...body }; mockSchedules.push(item); return item }),
  'PUT /api/teacher/schedules/:id': mockHandler((id, body) => { const i = mockSchedules.findIndex(s => s.id === id); if (i !== -1) Object.assign(mockSchedules[i], body); return mockSchedules[i] }),
  'DELETE /api/teacher/schedules/:id': mockHandler((id) => { mockSchedules = mockSchedules.filter(s => s.id !== id); return { success: true } }),

  'GET /api/user/profile': mockHandler(() => { const a = mockAssistants.find(x => x.studentId === '2021001'); return a || { studentId: '2021001', name: '', positionLevel: '', status: 'inactive' } }),
  'GET /api/user/work-hours': mockHandler((q) => (mockWorkHours[q?.month || '2026-05'] || []).find(s => s.studentId === '2021001') || { studentId: '2021001', name: '', totalHours: 0, workDays: 0, daily: [] }),
  'GET /api/user/approvals': mockHandler(() => mockApprovals.filter(a => a.studentId === '2021001')),
  'POST /api/user/approvals': mockHandler((body) => { const item = { id: uid(), applicant: '张三', studentId: '2021001', applyDate: new Date().toISOString().slice(0, 10), cardDate: body.cardDate, reason: body.reason, status: 'pending' }; mockApprovals.push(item); return item }),
  'GET /api/user/clock-status': mockHandler(() => { const s = mockClockState['2021001'] || { clockedIn: false, todayRecords: [] }; if (s.clockedIn && s.todayRecords.length > 0) { const last = s.todayRecords[s.todayRecords.length - 1]; if (last && !last.checkOut) last.hours = Math.round((Date.now() - new Date(last.checkIn).getTime()) / 3600000 * 10) / 10 } return { ...s, date: new Date().toISOString().slice(0, 10) } }),
  'POST /api/user/clock-in': mockHandler(() => { const now = new Date().toISOString(); mockClockState['2021001'] = { clockedIn: true, lastCheckIn: now, lastCheckOut: null, todayRecords: [...(mockClockState['2021001']?.todayRecords || []), { checkIn: now, checkOut: null, hours: 0 }] }; return { success: true } }),
  'POST /api/user/clock-out': mockHandler(() => { const now = new Date().toISOString(); const s = mockClockState['2021001']; if (s?.clockedIn) { s.clockedIn = false; s.lastCheckOut = now; const last = s.todayRecords[s.todayRecords.length - 1]; if (last && !last.checkOut) { last.checkOut = now; last.hours = Math.round((Date.now() - new Date(last.checkIn).getTime()) / 3600000 * 10) / 10 } } return { success: true } }),
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

/** 获取审批列表（status: 'pending' | 'all'） */
export function fetchApprovals(status = 'pending') {
  return request(`GET /api/teacher/approvals?status=${status}`)
}

/** 通过审批 */
export function approveApplication(id) {
  return request(`POST /api/teacher/approvals/${id}/approve`, { method: 'POST', body: '{}' })
}

/** 拒绝审批 */
export function rejectApplication(id, reason) {
  return request(`POST /api/teacher/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
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

/** 获取个人档案 */
export function fetchMyProfile() {
  return request('GET /api/user/profile')
}

/** 获取我的工时记录（按月份） */
export function fetchMyWorkHours(month) {
  return request(`GET /api/user/work-hours?month=${month}`)
}

/** 获取我的补卡申请列表 */
export function fetchMyApprovals() {
  return request('GET /api/user/approvals')
}

/** 提交补卡申请 */
export function submitApproval(cardDate, reason) {
  return request('POST /api/user/approvals', { method: 'POST', body: JSON.stringify({ cardDate, reason }) })
}

/** 获取打卡状态 */
export function fetchClockStatus() {
  return request('GET /api/user/clock-status')
}

/** 签到 */
export function clockIn() {
  return request('POST /api/user/clock-in', { method: 'POST', body: '{}' })
}

/** 签退 */
export function clockOut() {
  return request('POST /api/user/clock-out', { method: 'POST', body: '{}' })
}
