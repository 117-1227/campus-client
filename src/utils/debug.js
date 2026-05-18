// 调试日志模块 — 总开关关掉后所有日志静默，不影响生产
const ENABLED = import.meta.env.DEV

// 各模块开关，可单独关闭比较吵的模块
const TAG = {
  api: true,
  auth: true,
  component: true,
  state: false,
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

export { log, error, warn }
