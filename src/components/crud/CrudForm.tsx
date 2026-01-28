'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Schema, SchemaField } from '@/types/schema';
import { CrudFieldConfig, CrudFormState, generateFieldConfig, ValidationRule } from '@/types/crud';
import {
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  DateField,
  TextareaField,
  ReferenceField,
  JsonField,
  FileField,
} from './fields';

interface CrudFormProps {
  schema: Schema;
  mode: 'create' | 'edit' | 'view';
  initialData?: Record<string, unknown>;
  fieldConfigs?: CrudFieldConfig[];
  validationRules?: ValidationRule[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  layout?: 'single-column' | 'two-column';
  submitLabel?: string;
  className?: string;
}

export function CrudForm({
  schema,
  mode,
  initialData = {},
  fieldConfigs,
  validationRules = [],
  onSubmit,
  onCancel,
  layout = 'single-column',
  submitLabel,
  className = '',
}: CrudFormProps) {
  // Generate field configs from schema if not provided
  const configs = useMemo(() => {
    if (fieldConfigs) return fieldConfigs;
    return schema.fields.map((field) => generateFieldConfig(field));
  }, [schema.fields, fieldConfigs]);

  // Filter fields based on mode
  const visibleFields = useMemo(() => {
    return configs.filter((config) => {
      if (mode === 'create') return config.showInCreate;
      if (mode === 'edit') return config.showInEdit;
      return config.showInDetail;
    });
  }, [configs, mode]);

  // Form state
  const [formState, setFormState] = useState<CrudFormState>({
    mode,
    data: { ...initialData },
    originalData: initialData,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  });

  // Update field value
  const setValue = useCallback((fieldName: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [fieldName]: value },
      touched: { ...prev.touched, [fieldName]: true },
      isDirty: true,
    }));
  }, []);

  // Validate single field
  const validateField = useCallback(
    (fieldName: string, value: unknown): string | null => {
      const config = configs.find((c) => c.fieldName === fieldName);
      if (!config) return null;

      // Required validation
      if (config.required && (value === null || value === undefined || value === '')) {
        return `${config.displayName} is required`;
      }

      // Type-specific validations
      if (typeof value === 'string') {
        if (config.validation?.minLength && value.length < config.validation.minLength) {
          return `${config.displayName} must be at least ${config.validation.minLength} characters`;
        }
        if (config.validation?.maxLength && value.length > config.validation.maxLength) {
          return `${config.displayName} must be at most ${config.validation.maxLength} characters`;
        }
        if (config.validation?.pattern) {
          const regex = new RegExp(config.validation.pattern);
          if (!regex.test(value)) {
            return config.validation.patternMessage || `${config.displayName} format is invalid`;
          }
        }
      }

      if (typeof value === 'number') {
        if (config.validation?.min !== undefined && value < config.validation.min) {
          return `${config.displayName} must be at least ${config.validation.min}`;
        }
        if (config.validation?.max !== undefined && value > config.validation.max) {
          return `${config.displayName} must be at most ${config.validation.max}`;
        }
      }

      // Custom validation rules
      const customRules = validationRules.filter((r) => r.field === fieldName);
      for (const rule of customRules) {
        if (rule.type === 'email' && typeof value === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return rule.message || 'Invalid email format';
          }
        }
        if (rule.type === 'url' && typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            return rule.message || 'Invalid URL format';
          }
        }
      }

      return null;
    },
    [configs, validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    for (const config of visibleFields) {
      const error = validateField(config.fieldName, formState.data[config.fieldName]);
      if (error) {
        errors[config.fieldName] = error;
      }
    }

    setFormState((prev) => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));

    return Object.keys(errors).length === 0;
  }, [visibleFields, formState.data, validateField]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'view') return;

    if (!validateForm()) {
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(formState.data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Render field based on input type
  const renderField = (config: CrudFieldConfig) => {
    const value = formState.data[config.fieldName];
    const error = formState.touched[config.fieldName] ? formState.errors[config.fieldName] : undefined;
    const isDisabled = mode === 'view' || formState.isSubmitting;

    const commonProps = {
      config,
      error,
      disabled: isDisabled,
    };

    switch (config.inputType) {
      case 'text':
      case 'email':
      case 'url':
      case 'password':
      case 'tel':
        return (
          <TextField
            {...commonProps}
            value={String(value ?? '')}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'number':
      case 'range':
        return (
          <NumberField
            {...commonProps}
            value={value as number | null}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'select':
      case 'multiselect':
        return (
          <SelectField
            {...commonProps}
            value={value as string | string[]}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'checkbox':
        return (
          <CheckboxField
            {...commonProps}
            value={Boolean(value)}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'date':
      case 'datetime':
      case 'time':
        return (
          <DateField
            {...commonProps}
            value={String(value ?? '')}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'textarea':
      case 'richtext':
        return (
          <TextareaField
            {...commonProps}
            value={String(value ?? '')}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'reference':
        return (
          <ReferenceField
            {...commonProps}
            value={value as string | number | null}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'json':
        return (
          <JsonField
            {...commonProps}
            value={value}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      case 'file':
      case 'image':
        return (
          <FileField
            {...commonProps}
            value={value as string | File | null}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );

      default:
        return (
          <TextField
            {...commonProps}
            value={String(value ?? '')}
            onChange={(v) => setValue(config.fieldName, v)}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={`grid gap-4 ${
          layout === 'two-column' ? 'md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {visibleFields.map((config) => (
          <div
            key={config.fieldName}
            className={
              config.inputType === 'textarea' ||
              config.inputType === 'json' ||
              config.inputType === 'richtext'
                ? 'md:col-span-2'
                : ''
            }
          >
            {renderField(config)}
          </div>
        ))}
      </div>

      {/* Form Actions */}
      {mode !== 'view' && (
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={formState.isSubmitting}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {formState.isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitLabel || (mode === 'create' ? 'Create' : 'Save Changes')}
          </button>
        </div>
      )}
    </form>
  );
}

export default CrudForm;
