'use client';

import React from 'react';
import { WidgetTemplate } from './types';

interface WidgetPaletteProps {
  templates: WidgetTemplate[];
  onSelect: (template: WidgetTemplate) => void;
  onClose: () => void;
}

export function WidgetPalette({ templates, onSelect, onClose }: WidgetPaletteProps) {
  return (
    <div className="mb-4 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <h3 className="font-semibold text-neutral-800">Add Widget</h3>
        <button
          onClick={onClose}
          className="p-1 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <span className="text-2xl">{template.icon}</span>
            <span className="text-sm font-medium text-neutral-700 group-hover:text-blue-700">
              {template.name}
            </span>
            <span className="text-[10px] text-neutral-500 text-center line-clamp-2">
              {template.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default WidgetPalette;
