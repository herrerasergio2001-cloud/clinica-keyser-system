'use client';

import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { ColumnDef, PaginatedResponse } from '@clinic/types';
import { LoadingSkeleton } from '../feedback/skeleton';

interface DataTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  meta?: PaginatedResponse<T>['meta'];
  loading?: boolean;
  error?: Error | null;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  onRowAction?: (row: T, action: string) => void;
  rowActions?: Array<{ label: string; icon?: React.ComponentType }>;
  selectable?: boolean;
  onSelect?: (selected: string[]) => void;
  keyField?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  meta,
  loading,
  error,
  onPageChange,
  onSort,
  onRowClick,
  onRowAction,
  rowActions,
  selectable,
  onSelect,
  keyField = 'id',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    onSort?.(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
    onSelect?.(Array.from(newSet));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length && data.length > 0) {
      setSelectedRows(new Set());
      onSelect?.([]);
    } else {
      const newSet = new Set(data.map((row) => String(row[keyField])));
      setSelectedRows(newSet);
      onSelect?.(Array.from(newSet));
    }
  };

  if (loading) {
    return <LoadingSkeleton count={5} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        <p className="font-medium">Error loading data</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        <p className="text-sm">No data found</p>
      </div>
    );
  }

  const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100"
                style={{ width: column.width }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="inline-flex items-center gap-2 hover:text-clinic-teal"
                  >
                    {column.label}
                    {sortColumn === column.key && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
            {rowActions && rowActions.length > 0 && <th className="px-4 py-3 w-12" />}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={String(row[keyField]) + i}
              className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
            >
              {selectable && (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(String(row[keyField]))}
                    onChange={() => handleSelectRow(String(row[keyField]))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-slate-700 dark:text-slate-300 cursor-pointer hover:text-clinic-teal"
                  onClick={() => onRowClick?.(row)}
                  style={{ width: column.width }}
                >
                  {column.render ? column.render(getValue(row, column.key), row) : getValue(row, column.key) ?? '—'}
                </td>
              ))}
              {rowActions && rowActions.length > 0 && (
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement row actions dropdown
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Página {meta.page} de {meta.pages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(meta.page - 1)}
              disabled={meta.page === 1}
              className="rounded px-3 py-1 text-xs font-medium border border-slate-300 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(meta.page + 1)}
              disabled={meta.page === meta.pages}
              className="rounded px-3 py-1 text-xs font-medium border border-slate-300 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
