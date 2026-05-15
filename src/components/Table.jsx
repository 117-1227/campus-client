export default function Table({ columns, data, onRowClick, emptyText = '暂无数据', selectable, selected = [], onSelect, onSelectAll }) {
  const allSelected = data.length > 0 && data.every((row) => selected.includes(row.id))
  const someSelected = data.some((row) => selected.includes(row.id))
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = !allSelected && someSelected }} onChange={(e) => onSelectAll?.(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wide uppercase bg-gray-50/50" style={col.width ? { width: col.width } : {}}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr><td colSpan={(selectable ? 1 : 0) + columns.length} className="px-4 py-12 text-center"><span className="text-sm text-gray-400">{emptyText}</span></td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i} onClick={() => onRowClick?.(row)} className={'transition-colors ' + (onRowClick ? 'cursor-pointer hover:bg-indigo-50/50' : 'hover:bg-gray-50/80')}>
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => onSelect?.(row, e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
