// frontend/src/components/ResponsiveTable.js
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ResponsiveTable({ 
  columns, 
  data = [], 
  onRowClick, 
  className = '',
  emptyMessage = "No data available",
  loading = false,
  pagination = true,
  pageSize = 25
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when dataset size changes (e.g. search/filter applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data?.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const shouldPaginate = pagination && data.length > pageSize;
  const totalPages = shouldPaginate ? Math.ceil(data.length / pageSize) : 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = shouldPaginate ? (validPage - 1) * pageSize : 0;
  const currentData = shouldPaginate ? data.slice(startIndex, startIndex + pageSize) : data;

  return (
    <div className="space-y-4">
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
            {currentData.map((row, idx) => (
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
        {currentData.map((row, idx) => (
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

      {/* Pagination Controls */}
      {shouldPaginate && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-amber-200 text-sm text-gray-600 shadow-sm">
          <div>
            Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(startIndex + pageSize, data.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-900">{data.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validPage === 1}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900 font-medium hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </button>
            <span className="px-2 font-medium text-gray-700">
              {validPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validPage === totalPages}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900 font-medium hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResponsiveTable;