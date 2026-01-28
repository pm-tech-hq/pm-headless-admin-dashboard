'use client';

import React from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface TextareaFieldProps {
  config: CrudFieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TextareaField({ config, value, onChange, error, disabled }: TextareaFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">
        {config.displayName}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.helpText && (
        <p className="text-xs text-neutral-500">{config.helpText}</p>
      )}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        disabled={disabled || config.disabled || config.readonly}
        rows={4}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors resize-y
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-2`}
        minLength={config.validation?.minLength}
        maxLength={config.validation?.maxLength}
      />
      {config.validation?.maxLength && (
        <p className="text-xs text-neutral-400 text-right">
          {(value || '').length} / {config.validation.maxLength}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
