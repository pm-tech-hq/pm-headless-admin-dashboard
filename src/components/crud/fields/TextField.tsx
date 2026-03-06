'use client';

import React from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface TextFieldProps {
  config: CrudFieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TextField({ config, value, onChange, error, disabled }: TextFieldProps) {
  const inputType = config.inputType === 'email' ? 'email' :
                    config.inputType === 'url' ? 'url' :
                    config.inputType === 'password' ? 'password' :
                    config.inputType === 'tel' ? 'tel' : 'text';

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
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        disabled={disabled || config.disabled || config.readonly}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-2`}
        minLength={config.validation?.minLength}
        maxLength={config.validation?.maxLength}
        pattern={config.validation?.pattern}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
