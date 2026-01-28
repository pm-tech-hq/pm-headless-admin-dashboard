'use client';

import React, { useState } from 'react';
import { DashboardWidget } from './types';
import { WidgetType } from '@/components/ui/dashboard/types';

interface WidgetConfigPanelProps {
  widget: DashboardWidget;
  onUpdate: (updates: Partial<DashboardWidget>) => void;
  onClose: () => void;
  onRemove: () => void;
}

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'stats', label: 'Stats Card' },
  { value: 'kpi', label: 'KPI Card' },
  { value: 'lineChart', label: 'Line Chart' },
  { value: 'barChart', label: 'Bar Chart' },
  { value: 'pieChart', label: 'Pie Chart' },
  { value: 'areaChart', label: 'Area Chart' },
  { value: 'table', label: 'Data Table' },
  { value: 'list', label: 'List View' },
  { value: 'cards', label: 'Card Grid' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'progress', label: 'Progress Bars' },
  { value: 'text', label: 'Text Block' },
  { value: 'raw', label: 'Raw JSON' },
];

export function WidgetConfigPanel({
  widget,
  onUpdate,
  onClose,
  onRemove,
}: WidgetConfigPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="w-80 bg-white border-l border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-800">Configure Widget</h3>
        <button
          onClick={onClose}
          className="p-1 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Title</label>
          <input
            type="text"
            value={widget.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          />
        </div>

        {/* Widget Type */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Display Type</label>
          <select
            value={widget.type}
            onChange={(e) => onUpdate({ type: e.target.value as WidgetType })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            {WIDGET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* API URL */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Data Source URL</label>
          <input
            type="url"
            value={widget.apiUrl || ''}
            onChange={(e) => onUpdate({ apiUrl: e.target.value })}
            placeholder="https://api.example.com/data"
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          />
          <p className="text-xs text-neutral-500">
            Enter a public API endpoint that returns JSON data
          </p>
        </div>

        {/* Divider */}
        <hr className="border-neutral-200" />

        {/* Advanced Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-700">Advanced Settings</h4>

          {/* Refresh Interval */}
          <div className="space-y-1">
            <label className="block text-xs text-neutral-600">Auto Refresh (seconds)</label>
            <input
              type="number"
              min="0"
              value={(widget.config?.refreshInterval as number) || 0}
              onChange={(e) =>
                onUpdate({
                  config: { ...widget.config, refreshInterval: parseInt(e.target.value) || 0 },
                })
              }
              placeholder="0 (disabled)"
              className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>

          {/* Data Path */}
          <div className="space-y-1">
            <label className="block text-xs text-neutral-600">Data Path (JSON)</label>
            <input
              type="text"
              value={(widget.config?.dataPath as string) || ''}
              onChange={(e) =>
                onUpdate({
                  config: { ...widget.config, dataPath: e.target.value },
                })
              }
              placeholder="e.g., data.items"
              className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
            <p className="text-xs text-neutral-500">
              Path to extract data from response (e.g., &quot;data.results&quot;)
            </p>
          </div>
        </div>

        {/* Widget Info */}
        <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
          <p className="text-xs text-neutral-500">
            <strong>Widget ID:</strong> {widget.id}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-neutral-200 space-y-2">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRemove();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-3 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Widget
          </button>
        )}
      </div>
    </div>
  );
}

export default WidgetConfigPanel;
