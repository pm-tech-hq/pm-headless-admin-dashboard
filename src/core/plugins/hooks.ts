'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPluginRegistry } from './registry';
import {
  Plugin,
  PluginConfig,
  PluginInstance,
  PluginHook,
  WidgetDefinition,
  DataTransformer,
} from './types';

/**
 * Hook to access the plugin registry
 */
export function usePluginRegistry() {
  const registry = getPluginRegistry();

  const register = useCallback(
    (plugin: Plugin, config?: PluginConfig) => {
      registry.register(plugin, config);
    },
    [registry]
  );

  const unregister = useCallback(
    (pluginId: string) => {
      registry.unregister(pluginId);
    },
    [registry]
  );

  return {
    registry,
    register,
    unregister,
  };
}

/**
 * Hook to get all registered plugins
 */
export function usePlugins(): PluginInstance[] {
  const registry = getPluginRegistry();
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);

  useEffect(() => {
    // Initial load
    setPlugins(registry.getAll());

    // Update every second (simple polling for demo)
    const interval = setInterval(() => {
      setPlugins(registry.getAll());
    }, 1000);

    return () => clearInterval(interval);
  }, [registry]);

  return plugins;
}

/**
 * Hook to get a specific plugin
 */
export function usePlugin(pluginId: string): PluginInstance | undefined {
  const registry = getPluginRegistry();
  const [plugin, setPlugin] = useState<PluginInstance | undefined>();

  useEffect(() => {
    setPlugin(registry.get(pluginId));

    const interval = setInterval(() => {
      setPlugin(registry.get(pluginId));
    }, 1000);

    return () => clearInterval(interval);
  }, [registry, pluginId]);

  return plugin;
}

/**
 * Hook to get all widget definitions from plugins
 */
export function usePluginWidgets(): WidgetDefinition[] {
  const registry = getPluginRegistry();
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);

  useEffect(() => {
    setWidgets(registry.getWidgets());

    const interval = setInterval(() => {
      setWidgets(registry.getWidgets());
    }, 1000);

    return () => clearInterval(interval);
  }, [registry]);

  return widgets;
}

/**
 * Hook to get all data transformers from plugins
 */
export function usePluginTransformers(): DataTransformer[] {
  const registry = getPluginRegistry();
  const [transformers, setTransformers] = useState<DataTransformer[]>([]);

  useEffect(() => {
    setTransformers(registry.getTransformers());

    const interval = setInterval(() => {
      setTransformers(registry.getTransformers());
    }, 1000);

    return () => clearInterval(interval);
  }, [registry]);

  return transformers;
}

/**
 * Hook to execute a plugin hook
 */
export function usePluginHook<T, R>(hook: PluginHook) {
  const registry = getPluginRegistry();

  const execute = useCallback(
    async (data: T): Promise<R> => {
      return registry.executeHook<T, R>(hook, data);
    },
    [registry, hook]
  );

  return execute;
}

/**
 * Hook to transform data using plugin transformers
 */
export function useDataTransform<T, R>(
  transformerId: string,
  data: T,
  options?: Record<string, unknown>
): R | null {
  const transformers = usePluginTransformers();

  const result = useMemo(() => {
    const transformer = transformers.find((t) => t.id === transformerId);
    if (!transformer) return null;

    try {
      return transformer.transform(data, options) as R;
    } catch (error) {
      console.error(`Transform error for ${transformerId}:`, error);
      return null;
    }
  }, [transformers, transformerId, data, options]);

  return result;
}

/**
 * Hook for plugin settings management
 */
export function usePluginSettings(pluginId: string) {
  const registry = getPluginRegistry();
  const plugin = usePlugin(pluginId);

  const settings = plugin?.config.settings || {};

  const updateSettings = useCallback(
    (newSettings: Record<string, unknown>) => {
      registry.configure(pluginId, { settings: newSettings });
    },
    [registry, pluginId]
  );

  const getSetting = useCallback(
    <T>(key: string, defaultValue?: T): T => {
      return (settings[key] as T) ?? (defaultValue as T);
    },
    [settings]
  );

  const setSetting = useCallback(
    (key: string, value: unknown) => {
      updateSettings({ ...settings, [key]: value });
    },
    [settings, updateSettings]
  );

  return {
    settings,
    updateSettings,
    getSetting,
    setSetting,
  };
}

/**
 * Hook to enable/disable plugins
 */
export function usePluginControl(pluginId: string) {
  const registry = getPluginRegistry();
  const plugin = usePlugin(pluginId);

  const enable = useCallback(() => {
    registry.enable(pluginId);
  }, [registry, pluginId]);

  const disable = useCallback(() => {
    registry.disable(pluginId);
  }, [registry, pluginId]);

  const toggle = useCallback(() => {
    if (plugin?.status === 'active') {
      disable();
    } else {
      enable();
    }
  }, [plugin, enable, disable]);

  return {
    isEnabled: plugin?.status === 'active',
    isLoading: plugin?.status === 'loading',
    hasError: plugin?.status === 'error',
    error: plugin?.error,
    enable,
    disable,
    toggle,
  };
}
