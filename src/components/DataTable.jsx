import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react';
import EmptyState from './EmptyState';

export function DataTable({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No records found',
  emptyIcon = Inbox,
  className = '',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;

    if (sortKey === col.key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Reset sort
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(col.key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !Array.isArray(data)) return data || [];

    return [...data].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Null or undefined values sent to the end
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Date comparison check
      const dateA = Date.parse(aVal);
      const dateB = Date.parse(bVal);
      if (!isNaN(dateA) && !isNaN(dateB) && typeof aVal === 'string' && (aVal.includes('-') || aVal.includes('/'))) {
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // String comparison
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  if (!data || data.length === 0) {
    return (
      <div className={`p-8 bg-white rounded-xl border border-gray-100 ${className}`}>
        <EmptyState
          icon={emptyIcon}
          title="No Data Available"
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/75">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key || col.label}
                    scope="col"
                    onClick={() => handleHeaderClick(col)}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap select-none ${
                      col.sortable ? 'cursor-pointer hover:bg-gray-100/60 hover:text-gray-800 transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-gray-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-brand-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-emerald-50/40 hover:text-gray-900'
                    : 'hover:bg-gray-50/70'
                }`}
              >
                {columns.map((col) => {
                  const cellValue = row[col.key];
                  return (
                    <td
                      key={col.key || col.label}
                      className={`px-4 py-3.5 whitespace-nowrap text-sm ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(cellValue, row, rowIndex)
                        : cellValue !== undefined && cellValue !== null
                        ? String(cellValue)
                        : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
