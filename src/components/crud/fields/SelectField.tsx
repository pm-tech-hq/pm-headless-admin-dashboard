'use client';

import React from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface SelectFieldProps {
  config: CrudFieldConfig;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function SelectField({ config, value, onChange, error, disabled }: SelectFieldProps) {
  const isMulti = config.inputType === 'multiselect';
  const options = config.options || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isMulti) {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      onChange(selectedOptions);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">
        {config.displayName}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.helpText && (
        <p className="text-xs text-neutral-500">{config.helpText}</p>
      )}
      <select
        value={isMulti ? (Array.isArray(value) ? value : []) : (value as string) || ''}
        onChange={handleChange}
        multiple={isMulti}
        disabled={disabled || config.disabled || config.readonly}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-2
          ${isMulti ? 'h-32' : ''}`}
      >
        {!isMulti && !config.required && (
          <option value="">Select {config.displayName}...</option>
        )}
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
