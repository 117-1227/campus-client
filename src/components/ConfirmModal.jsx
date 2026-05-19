export default function ConfirmModal({ open, title, message, detail, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-4">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
          {detail && <p className="text-xs text-gray-400 mt-2">{detail}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 h-11 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors">取消</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 h-11 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors ${confirmClass || 'bg-indigo-500 hover:bg-indigo-600'}`}>{loading ? '处理中...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
