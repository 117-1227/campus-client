import { useState, useEffect, useCallback } from 'react'
import { fetchAttendanceSummary } from '../../utils/api'

export default function WorkHoursRecord() {
  const today = new Date()
  const cm = today.toISOString().slice(0, 7)
  const [month, setMonth] = useState(cm)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const from = `${month}-01`
  const to = (() => { const [y, m] = month.split('-').map(Number); const d = new Date(y, m, 0); return `${month}-${String(d.getDate()).padStart(2, '0')}` })()

  const fetchData = useCallback(async () => {
    if (!month) return
    setLoading(true)
    try {
      const s = await fetchAttendanceSummary(from, to)
      setData(s)
    } catch { /* ignore */ }
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">本月总工时</p>
          <p className="stat-number text-emerald-600">{data?.totalHours || '0'}h</p>
          <p className="text-xs text-gray-400 mt-1">累计工作小时</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">出勤班次</p>
          <p className="stat-number text-gray-900">{data?.sessionCount || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            日均 {data && data.byDate?.length > 0 ? (parseFloat(data.totalHours) / data.byDate.length).toFixed(1) : 0}h
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">当月月份</p>
          <p className="stat-number text-gray-900">{month.split('-')[1]}月</p>
          <p className="text-xs text-gray-400 mt-1">{month.split('-')[0]} 年</p>
        </div>
      </div>

      {/* 异常提示 */}
      {data?.hasUnconfirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <p className="text-sm text-amber-700">{data.unconfirmedTip}</p>
        </div>
      )}

      {/* 月份选择器 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" />
        </div>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      {/* 每日汇总明细 */}
      {data && (
        <div className="card-8pt">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">每日汇总明细</h4>
          {data.byDate?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">日期</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">班次数</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">工时</th>
                    <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.byDate.map(d => (
                    <tr key={d.date}>
                      <td className="py-3 text-gray-700">{d.date}</td>
                      <td className="py-3 text-gray-700">{d.sessionCount}</td>
                      <td className="py-3 text-gray-900 font-medium tabular-nums">{d.hours}h</td>
                      <td className="py-3">
                        {d.hasAnomalies ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">含异常</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">本月暂无出勤记录</p>
          )}
        </div>
      )}
    </div>
  )
}
