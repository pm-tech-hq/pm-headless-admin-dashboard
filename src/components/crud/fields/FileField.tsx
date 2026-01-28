'use client';

import React, { useRef } from 'react';
import { CrudFieldConfig } from '@/types/crud';

interface FileFieldProps {
  config: CrudFieldConfig;
  value: string | File | null;
  onChange: (value: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function FileField({ config, value, onChange, error, disabled }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = config.inputType === 'image';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleClear = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getPreviewUrl = () => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (typeof value === 'string' && value) {
      return value;
    }
    return null;
  };

  const previewUrl = getPreviewUrl();

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">
        {config.displayName}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.helpText && (
        <p className="text-xs text-neutral-500">{config.helpText}</p>
      )}

      {/* Image Preview */}
      {isImage && previewUrl && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-neutral-200">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || config.readonly}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* File Input */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          disabled={disabled || config.disabled || config.readonly}
          accept={isImage ? 'image/*' : undefined}
          className="hidden"
          id={`file-${config.fieldName}`}
        />
        <label
          htmlFor={`file-${config.fieldName}`}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-lg cursor-pointer
            ${disabled || config.readonly
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-300'
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {isImage ? 'Upload Image' : 'Choose File'}
        </label>

        {value && !isImage && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="truncate max-w-[200px]">
              {value instanceof File ? value.name : 'Current file'}
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || config.readonly}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
