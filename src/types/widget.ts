// Widget Type Definitions
// Comprehensive widget system with data binding and visualization

import { FieldType } from './schema';

/**
 * Widget categories for organization
 */
export type WidgetCategory =
  | 'chart'
  | 'table'
  | 'stat'
  | 'form'
  | 'list'
  | 'map'
  | 'timeline'
  | 'kanban'
  | 'text'
  | 'custom';

/**
 * Chart types for chart widgets
 */
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'donut'
  | 'radar'
  | 'funnel'
  | 'gauge';

/**
 * Data shape requirements for widgets
 */
export interface DataShapeRequirement {
  type: 'array' | 'object' | 'scalar' | 'any';
  minFields?: number;
  maxFields?: number;
  requiredFieldTypes?: FieldType[];
  recommendedFieldTypes?: FieldType[];
}

/**
 * Widget definition from the registry
 */
export interface WidgetDefinition {
  id: string;
  type: string;
  category: WidgetCategory;
  name: string;
  description: string;
  icon: string;

  // Configuration schema (JSON Schema format)
  configSchema: Record<string, unknown>;

  // Data requirements
  requiredDataShape: DataShapeRequirement;

  // Plugin source (if from plugin)
  pluginId?: string;

  // Default configuration
  defaultConfig?: Record<string, unknown>;
}

/**
 * Data mapping types
 */
export type DataMappingType = 'direct' | 'transform' | 'aggregate';

/**
 * Aggregation functions
 */
export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';

/**
 * Aggregation configuration
 */
export interface Aggregation {
  field: string;
  function: AggregationFunction;
  alias: string;
  groupBy?: string[];
}

/**
 * Data mapping configuration
 */
export interface DataMapping {
  type: DataMappingType;
  sourcePath?: string;                    // JSON path to data in response
  fieldMappings?: Record<string, string>; // Map widget fields to data fields
  transformFunction?: string;             // JavaScript transform function
  aggregations?: Aggregation[];
}

/**
 * Filter operators
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'between'
  | 'isNull'
  | 'isNotNull';

/**
 * Data filter configuration
 */
export interface DataFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Data sorting configuration
 */
export interface DataSort {
  field: string;
  direction: SortDirection;
}

/**
 * Table column configuration
 */
export interface TableColumnConfig {
  field: string;
  header: string;
  sortable: boolean;
  filterable: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  format?: string;            // Format string (e.g., 'currency', 'date:short')
  render?: 'text' | 'badge' | 'link' | 'image' | 'progress' | 'boolean' | 'custom';
  customRenderer?: string;    // Custom render function name
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

/**
 * Chart axis configuration
 */
export interface ChartAxisConfig {
  field: string;
  label?: string;
  format?: string;
  min?: number;
  max?: number;
  tickCount?: number;
}

/**
 * Chart series configuration
 */
export interface ChartSeriesConfig {
  field: string;
  name?: string;
  color?: string;
  type?: ChartType;           // For mixed charts
}

/**
 * Widget configuration (type-specific settings)
 */
export interface WidgetConfig {
  // Chart configuration
  chartType?: ChartType;
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig | ChartAxisConfig[];
  series?: ChartSeriesConfig[];
  colorScheme?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  smooth?: boolean;

  // Table configuration
  columns?: TableColumnConfig[];
  pageSize?: number;
  pageSizeOptions?: number[];
  enableSearch?: boolean;
  enableExport?: boolean;
  enableColumnResize?: boolean;
  enableRowSelection?: boolean;
  stickyHeader?: boolean;

  // Stat card configuration
  valueField?: string;
  labelField?: string;
  prefix?: string;
  suffix?: string;
  trend?: {
    field: string;
    comparison: 'previous' | 'percentage' | 'absolute';
    positiveColor?: string;
    negativeColor?: string;
  };
  icon?: string;
  iconColor?: string;

  // Form configuration
  formFields?: FormFieldConfig[];
  submitEndpoint?: string;
  submitMethod?: 'POST' | 'PUT' | 'PATCH';
  successMessage?: string;
  redirectOnSuccess?: string;

  // Kanban configuration
  groupByField?: string;
  titleField?: string;
  descriptionField?: string;
  statusColors?: Record<string, string>;

  // Map configuration
  latitudeField?: string;
  longitudeField?: string;
  mapLabelField?: string;
  clusterPoints?: boolean;
  mapProvider?: 'openstreetmap' | 'mapbox' | 'google';

  // Timeline configuration
  dateField?: string;
  eventField?: string;
  categoryField?: string;

  // General styling
  theme?: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number | string;
  customStyles?: Record<string, unknown>;
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'multiselect' |
        'checkbox' | 'radio' | 'date' | 'datetime' | 'textarea' | 'richtext' |
        'file' | 'image' | 'reference' | 'json' | 'hidden';
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: { label: string; value: unknown }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  referenceConfig?: {
    schemaId: string;
    displayField: string;
    valueField: string;
    searchFields?: string[];
  };
}

/**
 * Widget instance
 */
export interface Widget {
  id: string;
  definitionId: string;       // Widget type from registry
  title: string;
  description?: string;

  // Data binding
  dataSourceId?: string;
  endpointId?: string;
  schemaId?: string;
  apiUrl?: string;            // Direct API URL for simple widgets

  // Data transformation
  dataMapping: DataMapping;
  filters?: DataFilter[];
  sorting?: DataSort[];

  // Configuration
  config: WidgetConfig;

  // Layout
  position: { x: number; y: number };
  size: { width: number; height: number };

  // Refresh
  autoRefresh: boolean;
  refreshInterval?: number;   // milliseconds

  // Permissions
  permissionId?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Widget suggestion based on data shape
 */
export interface WidgetSuggestion {
  widgetId: string;
  widgetName: string;
  confidence: number;         // 0-1
  reason: string;
  suggestedConfig: Partial<WidgetConfig>;
}

/**
 * Widget data state
 */
export interface WidgetDataState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
  lastFetched?: Date;
  isRefreshing?: boolean;
}

/**
 * Legacy widget type for backward compatibility with existing code
 */
export type LegacyWidgetType =
  | 'Stats'
  | 'List'
  | 'Text'
  | 'Raw JSON'
  | 'Weather'
  | 'Stocks'
  | 'Exchange Rates'
  | 'Movies'
  | 'Books'
  | 'News'
  | 'Sports'
  | 'Gaming'
  | 'AI Models';

/**
 * Legacy widget for backward compatibility
 */
export interface LegacyWidget {
  id: string;
  title: string;
  type: LegacyWidgetType;
  content?: string;
  apiUrl?: string;
}

/**
 * Map legacy widget type to new definition ID
 */
export function mapLegacyWidgetType(legacyType: LegacyWidgetType): string {
  const mapping: Record<LegacyWidgetType, string> = {
    'Stats': 'stats-card',
    'List': 'data-list',
    'Text': 'text-display',
    'Raw JSON': 'json-viewer',
    'Weather': 'weather-widget',
    'Stocks': 'stock-ticker',
    'Exchange Rates': 'exchange-rates',
    'Movies': 'media-card',
    'Books': 'media-card',
    'News': 'news-feed',
    'Sports': 'sports-widget',
    'Gaming': 'gaming-widget',
    'AI Models': 'ai-models-widget',
  };

  return mapping[legacyType] || 'generic-widget';
}
