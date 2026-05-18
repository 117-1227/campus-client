import { useState, useEffect } from 'react'
import Modal from './Modal'
import { getAll, setAll, reset, getPresets, getProxyTarget } from '../utils/config'

export default function SettingsModal({ isOpen, onClose }) {
  const [useLocal, setUseLocal] = useState(false)
  const [remote, setRemote] = useState('')
  const [local, setLocal] = useState('')
  const [active, setActive] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const cfg = getAll()
    setUseLocal(cfg.useLocal)
    setRemote(cfg.remote)
    setLocal(cfg.local)
    setActive(cfg.useLocal ? 'local' : 'remote')
  }, [isOpen])

  const presets = getPresets()
  const proxyTarget = getProxyTarget()

  function handleSave() {
    setAll({ useLocal, remote, local })
    onClose()
  }

  function handleReset() {
    reset()
    const cfg = getAll()
    setUseLocal(cfg.useLocal)
    setRemote(cfg.remote)
    setLocal(cfg.local)
    setActive(cfg.useLocal ? 'local' : 'remote')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="服务器设置" footer={
      <>
        <button onClick={handleReset} className="h-9 px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">恢复默认</button>
        <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</button>
        <button onClick={handleSave} className="h-9 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">保存</button>
      </>
    }>
      <div className="space-y-5">
        {/* 当前激活 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">当前激活：</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {active === 'remote' ? '远程服务器' : '本地服务器'}
          </span>
        </div>

        {/* Vite 代理提示 */}
        {proxyTarget && (
          <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
            Vite 代理目标：<code className="text-gray-600">{proxyTarget}</code>
          </p>
        )}

        {/* 远程服务器 */}
        <label className={'block rounded-xl border-2 p-4 cursor-pointer transition-colors ' + (!useLocal ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300')}>
          <div className="flex items-center gap-3">
            <input type="radio" name="server" checked={!useLocal} onChange={() => setUseLocal(false)} className="w-4 h-4 text-indigo-600 accent-indigo-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">远程服务器</span>
              <span className="text-xs text-gray-400 ml-2">默认 {presets.remote}</span>
            </div>
          </div>
          <input
            type="text"
            value={remote}
            onChange={e => setRemote(e.target.value)}
            placeholder={presets.remote}
            className="mt-3 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-gray-400 bg-white"
          />
        </label>

        {/* 本地服务器 */}
        <label className={'block rounded-xl border-2 p-4 cursor-pointer transition-colors ' + (useLocal ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300')}>
          <div className="flex items-center gap-3">
            <input type="radio" name="server" checked={useLocal} onChange={() => setUseLocal(true)} className="w-4 h-4 text-indigo-600 accent-indigo-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">本地服务器</span>
              <span className="text-xs text-gray-400 ml-2">默认 {presets.local}</span>
            </div>
          </div>
          <input
            type="text"
            value={local}
            onChange={e => setLocal(e.target.value)}
            placeholder={presets.local}
            className="mt-3 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-gray-400 bg-white"
          />
        </label>
      </div>
    </Modal>
  )
}
