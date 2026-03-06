'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { FilterOption } from './types';

interface FilterSelectProps {
  label: string;
  options: FilterOption[];
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
  showCount?: boolean;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  searchable = false,
  className = '',
  showCount = false,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const selectedValues = multiple
    ? (value as string[] | null) || []
    : value
    ? [value as string]
    : [];

  const selectedLabels = selectedValues
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const current = selectedValues;
      const newValue = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      onChange(newValue.length > 0 ? newValue : null);
    } else {
      onChange(optionValue === value ? null : optionValue);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const hasValue = selectedValues.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                   transition-colors w-full justify-between
                   ${hasValue
                     ? 'bg-neutral-900 text-white border-neutral-900'
                     : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                   }`}
      >
        <span className="truncate">
          {hasValue ? (
            multiple && selectedLabels.length > 1 ? (
              `${label} (${selectedLabels.length})`
            ) : (
              selectedLabels[0]
            )
          ) : (
            <span className="text-neutral-500">{label}</span>
          )}
        </span>
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
        <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[200px]
                       bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-neutral-100">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded
                         focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm
                               text-left transition-colors
                               ${isSelected
                                 ? 'bg-neutral-100 text-neutral-900'
                                 : 'text-neutral-700 hover:bg-neutral-50'
                               }`}
                  >
                    <span>{option.label}</span>
                    <div className="flex items-center gap-2">
                      {showCount && option.count !== undefined && (
                        <span className="text-xs text-neutral-400">
                          {option.count}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-neutral-900" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterSelect;
