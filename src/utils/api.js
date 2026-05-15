// ---- Real API ----
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

// ---- Mock layer ----
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

const mockRoutes = {
  'POST /api/login': mockHandler((body) => {
    if (!body?.username || !body?.password) throw new Error('用户名和密码为必填项')
    const creds = {
      teacher: { role: 'teacher', id: 't1' },
      student: { role: 'student', id: 's1', studentId: '2021001' },
    }
    const c = creds[body.username]
    if (c && body.password === '123456') return { status: 'success', id: c.id, username: body.username, role: c.role, studentId: c.studentId, token: `mock-jwt-${body.username}` }
    throw new Error('用户名或密码无效')
  }),

  // Teacher routes
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

  // Student routes
  'GET /api/student/profile': mockHandler(() => { const a = mockAssistants.find(x => x.studentId === '2021001'); return a || { studentId: '2021001', name: '', positionLevel: '', status: 'inactive' } }),
  'GET /api/student/work-hours': mockHandler((q) => (mockWorkHours[q?.month || '2026-05'] || []).find(s => s.studentId === '2021001') || { studentId: '2021001', name: '', totalHours: 0, workDays: 0, daily: [] }),
  'GET /api/student/approvals': mockHandler(() => mockApprovals.filter(a => a.studentId === '2021001')),
  'POST /api/student/approvals': mockHandler((body) => { const item = { id: uid(), applicant: '张三', studentId: '2021001', applyDate: new Date().toISOString().slice(0, 10), cardDate: body.cardDate, reason: body.reason, status: 'pending' }; mockApprovals.push(item); return item }),
  'GET /api/student/clock-status': mockHandler(() => { const s = mockClockState['2021001'] || { clockedIn: false, todayRecords: [] }; if (s.clockedIn && s.todayRecords.length > 0) { const last = s.todayRecords[s.todayRecords.length - 1]; if (last && !last.checkOut) last.hours = Math.round((Date.now() - new Date(last.checkIn).getTime()) / 3600000 * 10) / 10 } return { ...s, date: new Date().toISOString().slice(0, 10) } }),
  'POST /api/student/clock-in': mockHandler(() => { const now = new Date().toISOString(); mockClockState['2021001'] = { clockedIn: true, lastCheckIn: now, lastCheckOut: null, todayRecords: [...(mockClockState['2021001']?.todayRecords || []), { checkIn: now, checkOut: null, hours: 0 }] }; return { success: true } }),
  'POST /api/student/clock-out': mockHandler(() => { const now = new Date().toISOString(); const s = mockClockState['2021001']; if (s?.clockedIn) { s.clockedIn = false; s.lastCheckOut = now; const last = s.todayRecords[s.todayRecords.length - 1]; if (last && !last.checkOut) { last.checkOut = now; last.hours = Math.round((Date.now() - new Date(last.checkIn).getTime()) / 3600000 * 10) / 10 } } return { success: true } }),
}

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

export const requestMock = USE_MOCK ? mockRequest : request
