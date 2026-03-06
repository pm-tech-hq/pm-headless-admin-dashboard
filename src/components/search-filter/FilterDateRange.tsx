'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface DateRange {
  start: string | null;
  end: string | null;
}

interface FilterDateRangeProps {
  label: string;
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
  className?: string;
  presets?: { label: string; getValue: () => DateRange }[];
}

const defaultPresets = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date().toISOString().split('T')[0];
      return { start: today, end: today };
    },
  },
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'This month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Last month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
];

export function FilterDateRange({
  label,
  value,
  onChange,
  className = '',
  presets = defaultPresets,
}: FilterDateRangeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStart, setLocalStart] = useState(value?.start || '');
  const [localEnd, setLocalEnd] = useState(value?.end || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with external value
  useEffect(() => {
    setLocalStart(value?.start || '');
    setLocalEnd(value?.end || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayValue = () => {
    if (!value || (!value.start && !value.end)) return null;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (value.start && value.end) {
      if (value.start === value.end) {
        return formatDate(value.start);
      }
      return `${formatDate(value.start)} - ${formatDate(value.end)}`;
    }
    if (value.start) return `From ${formatDate(value.start)}`;
    if (value.end) return `Until ${formatDate(value.end)}`;
    return null;
  };

  const handleApply = () => {
    if (localStart || localEnd) {
      onChange({ start: localStart || null, end: localEnd || null });
    } else {
      onChange(null);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalStart('');
    setLocalEnd('');
    onChange(null);
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    setLocalStart(range.start || '');
    setLocalEnd(range.end || '');
    onChange(range);
    setIsOpen(false);
  };

  const hasValue = value && (value.start || value.end);
  const displayValue = formatDisplayValue();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                   transition-colors min-w-[140px] justify-between
                   ${hasValue
                     ? 'bg-neutral-900 text-white border-neutral-900'
                     : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                   }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="truncate">
            {displayValue || <span className="text-neutral-500">{label}</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasValue && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-white/20 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72
                       bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
          {/* Presets */}
          <div className="p-2 border-b border-neutral-100">
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="px-2 py-1 text-xs bg-neutral-100 text-neutral-700
                           rounded hover:bg-neutral-200 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  max={localEnd || undefined}
                  className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded
                           focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  min={localStart || undefined}
                  className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded
                           focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100
                         rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded
                         hover:bg-neutral-800 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterDateRange;
