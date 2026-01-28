'use client';

import React from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface CheckboxFieldProps {
  config: CrudFieldConfig;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function CheckboxField({ config, value, onChange, error, disabled }: CheckboxFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={config.fieldName}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled || config.disabled || config.readonly}
          className={`w-4 h-4 rounded border-neutral-300 text-blue-600
            focus:ring-blue-500 focus:ring-2 focus:ring-offset-0
            ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
        />
        <label
          htmlFor={config.fieldName}
          className="text-sm font-medium text-neutral-700 cursor-pointer"
        >
          {config.displayName}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {config.helpText && (
        <p className="text-xs text-neutral-500 ml-7">{config.helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 ml-7">{error}</p>
      )}
    </div>
  );
}
