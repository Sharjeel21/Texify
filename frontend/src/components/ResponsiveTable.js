// frontend/src/components/ResponsiveTable.js
import React from 'react';
import { cn } from '../lib/utils';

export function ResponsiveTable({ 
  columns, 
  data, 
  onRowClick, 
  className = '',
  emptyMessage = "No data available",
  loading = false 
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border-2 border-amber-200 shadow-sm">
        <table className={cn("w-full border-collapse", className)}>
          <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  style={{ width: col.width }}
                  className="px-6 py-4 text-left text-sm font-bold text-amber-900 border-b-2 border-amber-300 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr 
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors duration-150",
                  onRowClick && "cursor-pointer hover:bg-amber-50",
                  className
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-sm text-gray-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {data.map((row, idx) => (
          <div
            key={idx}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "bg-white rounded-xl p-5 border-2 border-amber-200 shadow-sm transition-all duration-200",
              onRowClick && "cursor-pointer active:scale-[0.98] hover:shadow-md hover:border-amber-400"
            )}
          >
            {columns.map((col, colIdx) => (
              <div 
                key={colIdx} 
                className="flex justify-between items-start gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-semibold text-gray-600 flex-shrink-0 min-w-[100px]">
                  {col.header}
                </span>
                <span className="text-sm text-gray-900 text-right flex-1 font-medium">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;