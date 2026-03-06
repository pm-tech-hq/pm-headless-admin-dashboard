'use client';

import React from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface NumberFieldProps {
  config: CrudFieldConfig;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  disabled?: boolean;
}

export function NumberField({ config, value, onChange, error, disabled }: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(null);
    } else {
      const num = config.schemaField?.type === 'integer'
        ? parseInt(val, 10)
        : parseFloat(val);
      onChange(isNaN(num) ? null : num);
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
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={config.placeholder}
        disabled={disabled || config.disabled || config.readonly}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-2`}
        min={config.validation?.min}
        max={config.validation?.max}
        step={config.schemaField?.type === 'integer' ? 1 : 'any'}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
