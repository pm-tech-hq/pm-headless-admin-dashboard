'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Schema, SchemaField } from '@/types/schema';
import { CrudFieldConfig, generateFieldConfig, CrudQueryParams } from '@/types/crud';

interface CrudTableProps {
  schema: Schema;
  data: Record<string, unknown>[];
  fieldConfigs?: CrudFieldConfig[];
  loading?: boolean;
  totalItems?: number;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  selectedIds?: (string | number)[];
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onSelectionChange?: (ids: (string | number)[]) => void;
  enableSelection?: boolean;
  enableActions?: boolean;
  className?: string;
}

export function CrudTable({
  schema,
  data,
  fieldConfigs,
  loading = false,
  totalItems,
  page = 1,
  pageSize = 10,
  sortField,
  sortDirection = 'asc',
  selectedIds = [],
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onEdit,
  onDelete,
  onSelectionChange,
  enableSelection = false,
  enableActions = true,
  className = '',
}: CrudTableProps) {
  // Generate column configs
  const columns = useMemo(() => {
    const configs = fieldConfigs || schema.fields.map((field) => generateFieldConfig(field));
    return configs.filter((config) => config.showInList);
  }, [schema.fields, fieldConfigs]);

  // Get primary key field
  const primaryKeyField = useMemo(() => {
    const pkField = schema.fields.find((f) => f.isPrimaryKey);
    return pkField?.name || 'id';
  }, [schema.fields]);

  // Handle sort click
  const handleSort = (field: string) => {
    if (!onSort) return;
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allIds = data.map((row) => row[primaryKeyField] as string | number);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  // Handle row select
  const handleRowSelect = (id: string | number, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    }
  };

  // Format cell value for display
  const formatCellValue = (config: CrudFieldConfig, value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-neutral-400">—</span>;
    }

    // Boolean display
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    // Number formatting
    if (typeof value === 'number') {
      const fieldName = config.fieldName.toLowerCase();
      if (fieldName.includes('price') || fieldName.includes('amount') || fieldName.includes('cost')) {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
      if (fieldName.includes('percent') || fieldName.includes('rate')) {
        return `${value.toFixed(2)}%`;
      }
      return value.toLocaleString();
    }

    // Date formatting
    if (config.schemaField?.type === 'date' || config.schemaField?.type === 'datetime') {
      const date = new Date(String(value));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    }

    // URL display
    if (config.schemaField?.type === 'url' && typeof value === 'string') {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate max-w-[200px] inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          {new URL(value).hostname}
        </a>
      );
    }

    // Email display
    if (config.schemaField?.type === 'email' && typeof value === 'string') {
      return (
        <a
          href={`mailto:${value}`}
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }

    // Enum/Status badge
    if (config.schemaField?.type === 'enum' && typeof value === 'string') {
      const colors: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        inactive: 'bg-neutral-100 text-neutral-600',
        pending: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-blue-100 text-blue-700',
        error: 'bg-red-100 text-red-700',
        draft: 'bg-neutral-100 text-neutral-600',
      };
      const colorClass = colors[value.toLowerCase()] || 'bg-neutral-100 text-neutral-700';
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
          {value}
        </span>
      );
    }

    // Default string display
    const strValue = String(value);
    if (strValue.length > 50) {
      return (
        <span className="truncate max-w-[200px] inline-block" title={strValue}>
          {strValue.slice(0, 50)}...
        </span>
      );
    }
    return strValue;
  };

  // Calculate pagination
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const showPagination = totalItems !== undefined && totalPages > 1;

  return (
    <div className={`bg-white border border-neutral-200 rounded-xl overflow-hidden ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {/* Selection checkbox */}
              {enableSelection && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((config) => (
                <th
                  key={config.fieldName}
                  onClick={() => handleSort(config.fieldName)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider ${
                    onSort ? 'cursor-pointer hover:bg-neutral-100' : ''
                  }`}
                  style={{ width: config.width }}
                >
                  <div className="flex items-center gap-1">
                    <span>{config.displayName}</span>
                    {onSort && sortField === config.fieldName && (
                      <svg
                        className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {enableActions && (onEdit || onDelete) && (
                <th className="w-24 px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {enableSelection && (
                    <td className="px-3 py-3">
                      <div className="w-4 h-4 bg-neutral-200 rounded" />
                    </td>
                  )}
                  {columns.map((config) => (
                    <td key={config.fieldName} className="px-4 py-3">
                      <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    </td>
                  ))}
                  {enableActions && (
                    <td className="px-4 py-3">
                      <div className="h-4 bg-neutral-200 rounded w-16 ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0) + (enableActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-neutral-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="font-medium">No data found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, rowIdx) => {
                const rowId = row[primaryKeyField] as string | number;
                const isSelected = selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId || rowIdx}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {/* Selection checkbox */}
                    {enableSelection && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelect(rowId, e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((config) => (
                      <td key={config.fieldName} className="px-4 py-3 text-sm text-neutral-700">
                        {formatCellValue(config, row[config.fieldName])}
                      </td>
                    ))}

                    {/* Actions */}
                    {enableActions && (onEdit || onDelete) && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="px-2 py-1 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>of {totalItems} items</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={page === 1}
              className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 text-sm text-neutral-600">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => onPageChange?.(totalPages)}
              disabled={page === totalPages}
              className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrudTable;
