'use client';

import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { FilterConfig, ActiveFilter, FilterOperator } from './types';
import { FilterSelect } from './FilterSelect';
import { FilterDateRange } from './FilterDateRange';

interface FilterPanelProps {
  filters: FilterConfig[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filter: ActiveFilter) => void;
  onFilterRemove: (filterId: string) => void;
  onClearAll: () => void;
  className?: string;
  compact?: boolean;
}

export function FilterPanel({
  filters,
  activeFilters,
  onFilterChange,
  onFilterRemove,
  onClearAll,
  className = '',
  compact = false,
}: FilterPanelProps) {
  const handleFilterChange = (config: FilterConfig, value: unknown) => {
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      onFilterRemove(config.id);
      return;
    }

    let operator: FilterOperator = 'eq';
    if (config.type === 'multiselect') operator = 'in';
    if (config.type === 'daterange') operator = 'between';
    if (config.type === 'text') operator = 'contains';

    onFilterChange({
      filterId: config.id,
      field: config.field,
      operator,
      value,
    });
  };

  const getFilterValue = (filterId: string) => {
    const active = activeFilters.find((f) => f.filterId === filterId);
    return active?.value ?? null;
  };

  const renderFilter = (config: FilterConfig) => {
    const value = getFilterValue(config.id);

    switch (config.type) {
      case 'select':
        return (
          <FilterSelect
            key={config.id}
            label={config.label}
            options={config.options || []}
            value={value as string | null}
            onChange={(v) => handleFilterChange(config, v)}
            placeholder={config.placeholder}
          />
        );

      case 'multiselect':
        return (
          <FilterSelect
            key={config.id}
            label={config.label}
            options={config.options || []}
            value={value as string[] | null}
            onChange={(v) => handleFilterChange(config, v)}
            placeholder={config.placeholder}
            multiple
            searchable
          />
        );

      case 'daterange':
        return (
          <FilterDateRange
            key={config.id}
            label={config.label}
            value={value as { start: string | null; end: string | null } | null}
            onChange={(v) => handleFilterChange(config, v)}
          />
        );

      case 'boolean':
        return (
          <FilterSelect
            key={config.id}
            label={config.label}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            value={value !== null ? String(value) : null}
            onChange={(v) => handleFilterChange(config, v === 'true')}
          />
        );

      default:
        return null;
    }
  };

  const activeCount = activeFilters.length;

  return (
    <div className={`${className}`}>
      <div className={`flex items-center gap-2 ${compact ? 'flex-wrap' : ''}`}>
        {/* Filter Icon */}
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <SlidersHorizontal className="w-4 h-4" />
          {!compact && <span>Filters</span>}
        </div>

        {/* Filter Controls */}
        {filters.map(renderFilter)}

        {/* Clear All */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600
                     hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear{!compact && ` (${activeCount})`}
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {!compact && activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeFilters.map((filter) => {
            const config = filters.find((f) => f.id === filter.filterId);
            if (!config) return null;

            const displayValue = formatFilterValue(filter.value, config);

            return (
              <span
                key={filter.filterId}
                className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100
                         text-sm text-neutral-700 rounded-full"
              >
                <span className="font-medium">{config.label}:</span>
                <span>{displayValue}</span>
                <button
                  onClick={() => onFilterRemove(filter.filterId)}
                  className="p-0.5 hover:bg-neutral-200 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatFilterValue(value: unknown, config: FilterConfig): string {
  if (config.type === 'multiselect' && Array.isArray(value)) {
    const labels = value
      .map((v) => config.options?.find((o) => o.value === v)?.label || v)
      .join(', ');
    return labels;
  }

  if (config.type === 'select') {
    return config.options?.find((o) => o.value === value)?.label || String(value);
  }

  if (config.type === 'daterange' && typeof value === 'object' && value !== null) {
    const range = value as { start: string | null; end: string | null };
    const formatDate = (d: string) => new Date(d).toLocaleDateString();
    if (range.start && range.end) {
      return `${formatDate(range.start)} - ${formatDate(range.end)}`;
    }
    if (range.start) return `From ${formatDate(range.start)}`;
    if (range.end) return `Until ${formatDate(range.end)}`;
  }

  if (config.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export default FilterPanel;
