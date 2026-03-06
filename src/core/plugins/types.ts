// Plugin System Types

import { WidgetType } from '@/components/ui/dashboard/types';

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
}

export interface PluginConfig {
  enabled?: boolean;
  settings?: Record<string, unknown>;
}

export type PluginHook =
  | 'beforeDataFetch'
  | 'afterDataFetch'
  | 'beforeRender'
  | 'afterRender'
  | 'onWidgetCreate'
  | 'onWidgetUpdate'
  | 'onWidgetDelete'
  | 'onDashboardLoad'
  | 'onDashboardSave'
  | 'onSchemaDetect'
  | 'onError';

export interface PluginHookContext {
  pluginId: string;
  hook: PluginHook;
  timestamp: number;
}

export type HookHandler<T = unknown, R = void> = (
  data: T,
  context: PluginHookContext
) => R | Promise<R>;

export interface WidgetDefinition {
  type: string;
  name: string;
  description?: string;
  icon?: string;
  defaultConfig?: Record<string, unknown>;
  defaultSize?: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  configSchema?: Record<string, unknown>;
  render: (props: WidgetRenderProps) => React.ReactNode;
}

export interface WidgetRenderProps {
  data: unknown;
  config: Record<string, unknown>;
  width: number;
  height: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export interface DataTransformer {
  id: string;
  name: string;
  description?: string;
  transform: (data: unknown, options?: Record<string, unknown>) => unknown;
}

export interface Plugin {
  metadata: PluginMetadata;

  // Lifecycle
  initialize?: (config: PluginConfig) => void | Promise<void>;
  destroy?: () => void | Promise<void>;

  // Extensions
  widgets?: WidgetDefinition[];
  transformers?: DataTransformer[];

  // Hooks
  hooks?: Partial<Record<PluginHook, HookHandler<unknown, unknown>>>;
}

export interface PluginInstance {
  plugin: Plugin;
  config: PluginConfig;
  status: 'loading' | 'active' | 'disabled' | 'error';
  error?: Error;
  loadedAt?: Date;
}

export interface PluginRegistry {
  register(plugin: Plugin, config?: PluginConfig): void;
  unregister(pluginId: string): void;
  get(pluginId: string): PluginInstance | undefined;
  getAll(): PluginInstance[];
  enable(pluginId: string): void;
  disable(pluginId: string): void;
  configure(pluginId: string, config: Partial<PluginConfig>): void;
  getWidgets(): WidgetDefinition[];
  getTransformers(): DataTransformer[];
  executeHook<T, R>(hook: PluginHook, data: T): Promise<R>;
}
