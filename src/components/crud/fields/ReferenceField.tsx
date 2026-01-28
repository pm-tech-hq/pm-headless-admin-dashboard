'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface ReferenceFieldProps {
  config: CrudFieldConfig;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  error?: string;
  disabled?: boolean;
}

interface ReferenceOption {
  value: string | number;
  label: string;
}

export function ReferenceField({ config, value, onChange, error, disabled }: ReferenceFieldProps) {
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOptions = useCallback(async () => {
    if (!config.referenceConfig) return;

    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      if (config.referenceConfig.limit) {
        params.set('limit', String(config.referenceConfig.limit));
      }
      if (config.referenceConfig.orderBy) {
        params.set('orderBy', config.referenceConfig.orderBy);
      }

      // Fetch from API
      const response = await fetch(
        `/api/schemas/${config.referenceConfig.schemaId}/data?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        const items = data.data || data.items || data.results || data || [];

        setOptions(
          items.map((item: Record<string, unknown>) => ({
            value: item[config.referenceConfig!.valueField] as string | number,
            label: String(item[config.referenceConfig!.displayField] || item[config.referenceConfig!.valueField]),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch reference options:', err);
    } finally {
      setLoading(false);
    }
  }, [config.referenceConfig, searchTerm]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // If we have static options from the config, use those
  const displayOptions = config.options?.length
    ? config.options.map(o => ({ value: o.value as string | number, label: o.label }))
    : options;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">
        {config.displayName}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.helpText && (
        <p className="text-xs text-neutral-500">{config.helpText}</p>
      )}

      {/* Search input for large datasets */}
      {config.referenceConfig && displayOptions.length > 10 && (
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg mb-1
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
        />
      )}

      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : val);
          }}
          disabled={disabled || config.disabled || config.readonly || loading}
          className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors appearance-none
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
            }
            ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2`}
        >
          <option value="">
            {loading ? 'Loading...' : `Select ${config.displayName}...`}
          </option>
          {displayOptions.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
