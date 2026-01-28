'use client';

import React from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface DateFieldProps {
  config: CrudFieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function DateField({ config, value, onChange, error, disabled }: DateFieldProps) {
  const inputType = config.inputType === 'datetime' ? 'datetime-local' :
                    config.inputType === 'time' ? 'time' : 'date';

  // Format value for input
  const formatValue = (val: string) => {
    if (!val) return '';
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;

      if (inputType === 'date') {
        return date.toISOString().split('T')[0];
      } else if (inputType === 'datetime-local') {
        return date.toISOString().slice(0, 16);
      } else if (inputType === 'time') {
        return date.toISOString().slice(11, 16);
      }
      return val;
    } catch {
      return val;
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
      <input
        type={inputType}
        value={formatValue(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || config.disabled || config.readonly}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-2`}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
