'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Dashboard,
  DashboardWidget,
  DashboardLayoutItem,
  WidgetTemplate,
  WIDGET_TEMPLATES,
} from './types';
import { WidgetConfigPanel } from './WidgetConfigPanel';
import { WidgetPalette } from './WidgetPalette';

// Dynamically import GridLayout to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout: any = dynamic(
  () => import('react-grid-layout').then((mod) => mod.default),
  { ssr: false }
);

// Define Layout type locally
interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

interface DashboardBuilderProps {
  dashboard: Dashboard;
  onChange: (dashboard: Dashboard) => void;
  onSave?: (dashboard: Dashboard) => Promise<void>;
  readOnly?: boolean;
}

export function DashboardBuilder({
  dashboard,
  onChange,
  onSave,
  readOnly = false,
}: DashboardBuilderProps) {
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [saving, setSaving] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Get the current layout
  const currentLayout = useMemo(() => {
    return dashboard.layouts.lg || [];
  }, [dashboard.layouts]);

  // Get selected widget
  const selectedWidget = useMemo(() => {
    if (!selectedWidgetId) return null;
    return dashboard.widgets.find((w) => w.id === selectedWidgetId) || null;
  }, [dashboard.widgets, selectedWidgetId]);

  // Handle layout change
  const handleLayoutChange = useCallback(
    (newLayout: GridLayoutItem[]) => {
      const updatedLayouts: DashboardLayoutItem[] = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
        static: item.static,
      }));

      onChange({
        ...dashboard,
        layouts: {
          ...dashboard.layouts,
          lg: updatedLayouts,
          md: updatedLayouts,
          sm: updatedLayouts.map((item) => ({
            ...item,
            w: Math.min(item.w, 6),
            x: 0,
          })),
        },
        updatedAt: new Date(),
      });
    },
    [dashboard, onChange]
  );

  // Add widget from palette
  const handleAddWidget = useCallback(
    (template: WidgetTemplate) => {
      const newWidgetId = `widget-${Date.now()}`;
      const newWidget: DashboardWidget = {
        id: newWidgetId,
        type: template.type,
        title: template.name,
        config: template.defaultConfig,
      };

      const maxY = currentLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      const newLayoutItem: DashboardLayoutItem = {
        i: newWidgetId,
        x: 0,
        y: maxY,
        w: template.defaultSize.w,
        h: template.defaultSize.h,
        minW: template.minSize?.w,
        minH: template.minSize?.h,
        maxW: template.maxSize?.w,
        maxH: template.maxSize?.h,
      };

      onChange({
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget],
        layouts: {
          lg: [...currentLayout, newLayoutItem],
          md: [...dashboard.layouts.md, newLayoutItem],
          sm: [...dashboard.layouts.sm, { ...newLayoutItem, w: Math.min(newLayoutItem.w, 6), x: 0 }],
        },
        updatedAt: new Date(),
      });

      setShowPalette(false);
      setSelectedWidgetId(newWidgetId);
    },
    [dashboard, currentLayout, onChange]
  );

  // Update widget configuration
  const handleUpdateWidget = useCallback(
    (widgetId: string, updates: Partial<DashboardWidget>) => {
      onChange({
        ...dashboard,
        widgets: dashboard.widgets.map((w) =>
          w.id === widgetId ? { ...w, ...updates } : w
        ),
        updatedAt: new Date(),
      });
    },
    [dashboard, onChange]
  );

  // Remove widget
  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      onChange({
        ...dashboard,
        widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
        layouts: {
          lg: dashboard.layouts.lg.filter((item) => item.i !== widgetId),
          md: dashboard.layouts.md.filter((item) => item.i !== widgetId),
          sm: dashboard.layouts.sm.filter((item) => item.i !== widgetId),
        },
        updatedAt: new Date(),
      });

      if (selectedWidgetId === widgetId) {
        setSelectedWidgetId(null);
      }
    },
    [dashboard, onChange, selectedWidgetId]
  );

  // Save dashboard
  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(dashboard);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-neutral-100 p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-3 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-neutral-800">{dashboard.name}</h2>
            {readOnly && (
              <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
                View Only
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <button
                  onClick={() => setShowPalette(!showPalette)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Widget
                </button>
                {onSave && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Save
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Widget Palette */}
        {showPalette && !readOnly && (
          <WidgetPalette
            templates={WIDGET_TEMPLATES}
            onSelect={handleAddWidget}
            onClose={() => setShowPalette(false)}
          />
        )}

        {/* Grid Layout */}
        {dashboard.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-neutral-300">
            <svg className="w-16 h-16 text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <p className="text-neutral-500 font-medium">No widgets yet</p>
            <p className="text-sm text-neutral-400 mt-1">Click &quot;Add Widget&quot; to get started</p>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={currentLayout}
            cols={12}
            rowHeight={80}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            isDraggable={!readOnly}
            isResizable={!readOnly}
            draggableHandle=".widget-drag-handle"
            margin={[16, 16]}
          >
            {dashboard.widgets.map((widget) => (
              <div
                key={widget.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  selectedWidgetId === widget.id
                    ? 'ring-2 ring-blue-500 border-blue-500'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                onClick={() => !readOnly && setSelectedWidgetId(widget.id)}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-200 widget-drag-handle cursor-move">
                  <span className="text-sm font-medium text-neutral-700 truncate">{widget.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">
                      {widget.type}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWidget(widget.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Widget Content Preview */}
                <div className="p-3 h-[calc(100%-40px)] overflow-hidden">
                  {widget.apiUrl ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="truncate">{widget.apiUrl}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                      <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      <span className="text-[10px]">Configure data source</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {/* Config Panel */}
      {selectedWidget && !readOnly && (
        <WidgetConfigPanel
          widget={selectedWidget}
          onUpdate={(updates) => handleUpdateWidget(selectedWidget.id, updates)}
          onClose={() => setSelectedWidgetId(null)}
          onRemove={() => handleRemoveWidget(selectedWidget.id)}
        />
      )}
    </div>
  );
}

export default DashboardBuilder;
