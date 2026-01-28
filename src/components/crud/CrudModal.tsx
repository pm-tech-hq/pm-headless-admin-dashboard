'use client';

import React, { useEffect, useRef } from 'react';
import { Schema } from '@/types/schema';
import { CrudFieldConfig, ValidationRule } from '@/types/crud';
import { CrudForm } from './CrudForm';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: Schema;
  mode: 'create' | 'edit' | 'view';
  initialData?: Record<string, unknown>;
  fieldConfigs?: CrudFieldConfig[];
  validationRules?: ValidationRule[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  title?: string;
  layout?: 'single-column' | 'two-column';
}

export function CrudModal({
  isOpen,
  onClose,
  schema,
  mode,
  initialData,
  fieldConfigs,
  validationRules,
  onSubmit,
  title,
  layout = 'single-column',
}: CrudModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalTitle =
    title ||
    (mode === 'create'
      ? `Create ${schema.name}`
      : mode === 'edit'
      ? `Edit ${schema.name}`
      : `View ${schema.name}`);

  const handleSubmit = async (data: Record<string, unknown>) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col
          ${layout === 'two-column' ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CrudForm
            schema={schema}
            mode={mode}
            initialData={initialData}
            fieldConfigs={fieldConfigs}
            validationRules={validationRules}
            onSubmit={handleSubmit}
            onCancel={onClose}
            layout={layout}
          />
        </div>
      </div>
    </div>
  );
}

export default CrudModal;
