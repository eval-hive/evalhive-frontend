import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface ResultsTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function ResultsTable<T>({ 
  data, 
  columns, 
  onRowClick, 
  emptyMessage = "No results found." 
}: ResultsTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof T | undefined, sortable: boolean | undefined) => {
    if (!key || !sortable) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center text-text-secondary">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background-alt">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-border/50' : ''}`}
                  onClick={() => handleSort(col.accessorKey, col.sortable)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable && col.accessorKey === sortConfig?.key && (
                      <span className="text-brand-indigo">
                        {sortConfig?.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {sortedData.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-background transition-colors' : ''}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
