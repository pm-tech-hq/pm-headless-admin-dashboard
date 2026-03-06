// Plugin System Type Definitions
// Extensible architecture for custom widgets, connectors, and integrations

import { WidgetDefinition } from './widget';
import { DataSourceType } from './data-source';

/**
 * Plugin types
 */
export type PluginType =
  | 'widget'
  | 'data-source-connector'
  | 'integration'
  | 'automation'
  | 'theme';

/**
 * Plugin permission request
 */
export interface PluginPermission {
  resource: string;
  actions: string[];
  reason: string;
}

/**
 * Plugin hook definition
 */
export interface PluginHook {
  name: string;
  handler: string;            // Function name in plugin module
}

/**
 * Data source connector definition
 */
export interface ConnectorDefinition {
  id: string;
  name: string;
  type: DataSourceType;
  description?: string;
  icon?: string;
  configSchema: Record<string, unknown>;
  connectionTestHandler?: string;
}

/**
 * Plugin manifest (package.json-like format)
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];

  type: PluginType;

  // Entry points
  main: string;               // Server-side entry
  client?: string;            // Client-side entry
  styles?: string;            // CSS file

  // Dependencies
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;

  // Permissions required
  permissions: PluginPermission[];

  // Configuration schema
  configSchema?: Record<string, unknown>;
  defaultConfig?: Record<string, unknown>;

  // Hooks this plugin uses
  hooks?: PluginHook[];

  // Widget definitions (for widget plugins)
  widgets?: WidgetDefinition[];

  // Data source connectors (for connector plugins)
  connectors?: ConnectorDefinition[];

  // Minimum platform version
  minPlatformVersion?: string;

  // Screenshots for plugin store
  screenshots?: string[];
}

/**
 * Plugin installation status
 */
export type PluginStatus = 'not_installed' | 'installed' | 'enabled' | 'disabled' | 'error';

/**
 * Plugin instance
 */
export interface Plugin {
  id: string;
  manifest: PluginManifest;

  // Installation status
  status: PluginStatus;
  isInstalled: boolean;
  isEnabled: boolean;
  installedAt?: Date;

  // Configuration
  config: Record<string, unknown>;

  // Runtime
  loadedAt?: Date;
  errors?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plugin lifecycle events
 */
export type PluginLifecycleEvent =
  | 'install'
  | 'uninstall'
  | 'enable'
  | 'disable'
  | 'configure'
  | 'upgrade';

/**
 * Plugin API - Data sources
 */
export interface PluginDataSourceAPI {
  fetch: (dataSourceId: string, endpoint: string, options?: RequestInit) => Promise<unknown>;
  list: () => Promise<{ id: string; name: string; type: string }[]>;
  getById: (id: string) => Promise<unknown>;
}

/**
 * Plugin API - Widgets
 */
export interface PluginWidgetAPI {
  register: (definition: WidgetDefinition) => void;
  unregister: (widgetId: string) => void;
  getAll: () => WidgetDefinition[];
}

/**
 * Plugin API - Notifications
 */
export interface PluginNotificationAPI {
  send: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  toast: (message: string, options?: { duration?: number; type?: string }) => void;
}

/**
 * Plugin API - Storage (plugin-scoped)
 */
export interface PluginStorageAPI {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: <T = unknown>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Plugin API - HTTP
 */
export interface PluginHttpAPI {
  get: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
  post: <T = unknown>(url: string, data: unknown, options?: RequestInit) => Promise<T>;
  put: <T = unknown>(url: string, data: unknown, options?: RequestInit) => Promise<T>;
  delete: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
}

/**
 * Plugin API - Events
 */
export interface PluginEventAPI {
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => () => void;
  off: (event: string, handler: (data: unknown) => void) => void;
}

/**
 * Plugin context (provided to plugin at runtime)
 */
export interface PluginContext {
  pluginId: string;
  config: Record<string, unknown>;

  // APIs available to plugins
  api: {
    dataSources: PluginDataSourceAPI;
    widgets: PluginWidgetAPI;
    notifications: PluginNotificationAPI;
    storage: PluginStorageAPI;
    http: PluginHttpAPI;
    events: PluginEventAPI;
  };

  // Platform info
  platform: {
    version: string;
    environment: 'development' | 'production';
  };
}

/**
 * Plugin module interface (what plugins must export)
 */
export interface PluginModule {
  // Lifecycle hooks
  onLoad?: (context: PluginContext) => Promise<void>;
  onUnload?: (context: PluginContext) => Promise<void>;
  onConfigure?: (context: PluginContext, newConfig: Record<string, unknown>) => Promise<void>;

  // Hook handlers (dynamically named)
  [key: string]: unknown;
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  type: PluginType;
  downloadUrl?: string;
  iconUrl?: string;
  rating?: number;
  downloads?: number;
  tags?: string[];
}

/**
 * Plugin store response
 */
export interface PluginStoreResponse {
  plugins: PluginRegistryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Plugin installation request
 */
export interface PluginInstallRequest {
  pluginId: string;
  source: 'store' | 'url' | 'file';
  url?: string;
  file?: File;
}

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
  success: boolean;
  plugin?: Plugin;
  error?: string;
  warnings?: string[];
}

/**
 * Plugin configuration update
 */
export interface PluginConfigUpdate {
  pluginId: string;
  config: Record<string, unknown>;
}

/**
 * Plugin error
 */
export interface PluginError {
  pluginId: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Available hooks that plugins can use
 */
export const PLUGIN_HOOKS = {
  // Data source hooks
  ON_DATA_SOURCE_CREATED: 'onDataSourceCreated',
  ON_DATA_SOURCE_UPDATED: 'onDataSourceUpdated',
  ON_DATA_SOURCE_DELETED: 'onDataSourceDeleted',
  ON_DATA_SOURCE_FETCH: 'onDataSourceFetch',

  // Schema hooks
  ON_SCHEMA_DETECTED: 'onSchemaDetected',
  ON_SCHEMA_UPDATED: 'onSchemaUpdated',

  // Widget hooks
  ON_WIDGET_CREATED: 'onWidgetCreated',
  ON_WIDGET_RENDER: 'onWidgetRender',
  ON_WIDGET_DATA_LOADED: 'onWidgetDataLoaded',

  // CRUD hooks
  BEFORE_CREATE: 'beforeCreate',
  AFTER_CREATE: 'afterCreate',
  BEFORE_UPDATE: 'beforeUpdate',
  AFTER_UPDATE: 'afterUpdate',
  BEFORE_DELETE: 'beforeDelete',
  AFTER_DELETE: 'afterDelete',

  // Auth hooks
  ON_USER_LOGIN: 'onUserLogin',
  ON_USER_LOGOUT: 'onUserLogout',

  // Dashboard hooks
  ON_DASHBOARD_LOAD: 'onDashboardLoad',
  ON_DASHBOARD_SAVE: 'onDashboardSave',
} as const;

export type PluginHookName = typeof PLUGIN_HOOKS[keyof typeof PLUGIN_HOOKS];
