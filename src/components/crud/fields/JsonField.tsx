'use client';

import React, { useState, useEffect } from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface JsonFieldProps {
  config: CrudFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function JsonField({ config, value, onChange, error, disabled }: JsonFieldProps) {
  const [textValue, setTextValue] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setTextValue(JSON.stringify(value, null, 2) || '');
    } catch {
      setTextValue(String(value || ''));
    }
  }, [value]);

  const handleChange = (text: string) => {
    setTextValue(text);
    setParseError(null);

    if (!text.trim()) {
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
    } catch (e) {
      setParseError('Invalid JSON format');
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(textValue);
      setTextValue(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch {
      setParseError('Cannot format: Invalid JSON');
    }
  };

  const displayError = error || parseError;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          {config.displayName}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <button
          type="button"
          onClick={formatJson}
          disabled={disabled || config.readonly}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Format JSON
        </button>
      </div>
      {config.helpText && (
        <p className="text-xs text-neutral-500">{config.helpText}</p>
      )}
      <textarea
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={config.placeholder || '{\n  "key": "value"\n}'}
        disabled={disabled || config.disabled || config.readonly}
        rows={8}
        className={`w-full px-3 py-2 text-sm font-mono border rounded-lg transition-colors resize-y
          ${displayError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-200'
          }
          ${disabled || config.readonly ? 'bg-neutral-100 cursor-not-allowed' : 'bg-neutral-50'}
          focus:outline-none focus:ring-2`}
      />
      {displayError && (
        <p className="text-xs text-red-600">{displayError}</p>
      )}
    </div>
  );
}
