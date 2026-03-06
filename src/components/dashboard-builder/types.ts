// Dashboard Builder Types

import { WidgetType } from '@/components/ui/dashboard/types';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  apiUrl?: string;
  config?: Record<string, unknown>;
}

export interface DashboardLayoutItem {
  i: string;  // Widget ID
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

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layouts: {
    lg: DashboardLayoutItem[];
    md: DashboardLayoutItem[];
    sm: DashboardLayoutItem[];
  };
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetTemplate {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultConfig?: Record<string, unknown>;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'stats',
    type: 'stats',
    name: 'Stats Card',
    description: 'Display numeric statistics',
    icon: '📊',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    id: 'kpi',
    type: 'kpi',
    name: 'KPI Card',
    description: 'Key performance indicators with trends',
    icon: '📈',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
  },
  {
    id: 'lineChart',
    type: 'lineChart',
    name: 'Line Chart',
    description: 'Time series visualization',
    icon: '📉',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'barChart',
    type: 'barChart',
    name: 'Bar Chart',
    description: 'Category comparison chart',
    icon: '📊',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'pieChart',
    type: 'pieChart',
    name: 'Pie Chart',
    description: 'Distribution visualization',
    icon: '🥧',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  {
    id: 'table',
    type: 'table',
    name: 'Data Table',
    description: 'Tabular data display',
    icon: '📋',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'list',
    type: 'list',
    name: 'List View',
    description: 'List of items',
    icon: '📝',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  {
    id: 'timeline',
    type: 'timeline',
    name: 'Timeline',
    description: 'Chronological events',
    icon: '⏱️',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
  },
  {
    id: 'gauge',
    type: 'gauge',
    name: 'Gauge',
    description: 'Single value meter',
    icon: '⏲️',
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 2 },
  },
  {
    id: 'progress',
    type: 'progress',
    name: 'Progress Bars',
    description: 'Comparative progress display',
    icon: '📶',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    id: 'cards',
    type: 'cards',
    name: 'Card Grid',
    description: 'Visual card layout',
    icon: '🃏',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'text',
    type: 'text',
    name: 'Text Block',
    description: 'Static text content',
    icon: '📄',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 1 },
  },
];
