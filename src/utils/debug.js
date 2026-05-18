// 调试日志模块 — 总开关关掉后所有日志静默，不影响生产
const ENABLED = import.meta.env.DEV

// 各模块开关，可单独关闭比较吵的模块
const TAG = {
  api: true,
  auth: true,
  component: true,
  state: false,
  global: true,
}

function now() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function log(tag, label, ...args) {
  if (!ENABLED || !TAG[tag]) return
  console.log(`%c[${tag}]%c ${label}`, 'color:#6366f1;font-weight:600', 'color:inherit', ...args)
}

function error(tag, label, ...args) {
  if (!ENABLED || !TAG[tag]) return
  console.error(`[${tag}] ${label}`, ...args)
}

function warn(tag, label, ...args) {
  if (!ENABLED || !TAG[tag]) return
  console.warn(`[${tag}] ${label}`, ...args)
}

// ===== 全局未捕获错误捕获（仅 DEV） =====

function emitCopyLine(type, message, file, line, col, stack) {
  const shortFile = file ? file.replace(/^.*[\\/]/, '') : ''
  const loc = shortFile ? `${shortFile}:${line}:${col}` : ''
  const summary = `[global] ${now()} | ${type}: ${message}${loc ? ' | ' + loc : ''}`

  // 醒目分隔线 + 可复制的单行摘要
  console.error(
    `%c━━━━━━ 🐛 复制这行给我 ━━━━━━%c\n${summary}\n%c━━━━━━━━━━━━━━━━━━━━━━`,
    'color:#dc2626;font-weight:700', 'color:#dc2626;font-weight:600', 'color:#dc2626;font-weight:700'
  )
  if (stack) console.error(stack)
}

if (ENABLED && TAG.global) {
  window.addEventListener('error', (e) => {
    if (!(e instanceof ErrorEvent)) return
    emitCopyLine('未捕获异常', e.message, e.filename, e.lineno, e.colno, e.error?.stack)
  })

  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason)
    emitCopyLine('未处理 Promise', msg, '', '', '', e.reason?.stack)
  })
}

export { log, error, warn }
