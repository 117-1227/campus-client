import { warn } from './debug'

const STORAGE_KEY = 'serverConfig'

const PRESETS = {
  remote: 'http://192.168.10.100:3000',
  local: 'http://localhost:3000',
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function write(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch { warn('config', 'localStorage 写入失败') }
}

// ===== 公开 API =====

export function getAll() {
  const cfg = read()
  return {
    useLocal: cfg.useLocal ?? false,
    remote: cfg.remote ? cfg.remote.trim() : PRESETS.remote,
    local: cfg.local ? cfg.local.trim() : PRESETS.local,
  }
}

export function setAll({ useLocal, remote, local }) {
  write({
    useLocal: !!useLocal,
    remote: (remote || '').trim(),
    local: (local || '').trim(),
  })
  notify()
}

export function reset() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { warn('config', 'localStorage 清除失败') }
  notify()
}

/** 返回当前激活的 API 基地址 */
export function getApiBase() {
  const { useLocal, remote, local } = getAll()
  const base = useLocal ? local : remote
  return base ? base.replace(/\/+$/, '') : ''
}

/** 返回预设的默认值（只读） */
export function getPresets() {
  return { ...PRESETS }
}

/** 返回由 vite define 注入的代理目标（只读），供设置面板展示 */
export function getProxyTarget() {
  try {
    return typeof __PROXY_TARGET__ !== 'undefined' ? __PROXY_TARGET__ : ''
  } catch {
    return ''
  }
}

// ===== 变更监听 =====

let listeners = []

export function onChange(fn) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter(l => l !== fn)
  }
}

function notify() {
  listeners.forEach(fn => {
    try { fn(getAll()) } catch { warn('config', '变更监听回调执行失败') }
  })
}
