// Plugin Registry Implementation

import {
  Plugin,
  PluginConfig,
  PluginInstance,
  PluginRegistry,
  PluginHook,
  PluginHookContext,
  WidgetDefinition,
  DataTransformer,
} from './types';

class PluginRegistryImpl implements PluginRegistry {
  private plugins = new Map<string, PluginInstance>();
  private hookListeners = new Map<PluginHook, Set<{ pluginId: string; handler: Function }>>();

  register(plugin: Plugin, config: PluginConfig = {}): void {
    const { id } = plugin.metadata;

    if (this.plugins.has(id)) {
      console.warn(`Plugin ${id} is already registered. Skipping.`);
      return;
    }

    const instance: PluginInstance = {
      plugin,
      config: {
        enabled: config.enabled ?? true,
        settings: config.settings ?? {},
      },
      status: 'loading',
    };

    this.plugins.set(id, instance);

    // Initialize if enabled
    if (instance.config.enabled) {
      this.initializePlugin(instance);
    } else {
      instance.status = 'disabled';
    }
  }

  private async initializePlugin(instance: PluginInstance): Promise<void> {
    try {
      // Call initialize hook
      if (instance.plugin.initialize) {
        await instance.plugin.initialize(instance.config);
      }

      // Register hooks
      if (instance.plugin.hooks) {
        for (const [hook, handler] of Object.entries(instance.plugin.hooks)) {
          if (handler) {
            this.addHookListener(hook as PluginHook, instance.plugin.metadata.id, handler);
          }
        }
      }

      instance.status = 'active';
      instance.loadedAt = new Date();
    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error : new Error('Plugin initialization failed');
      console.error(`Failed to initialize plugin ${instance.plugin.metadata.id}:`, error);
    }
  }

  private addHookListener(hook: PluginHook, pluginId: string, handler: Function): void {
    if (!this.hookListeners.has(hook)) {
      this.hookListeners.set(hook, new Set());
    }
    this.hookListeners.get(hook)!.add({ pluginId, handler });
  }

  private removeHookListeners(pluginId: string): void {
    for (const listeners of this.hookListeners.values()) {
      for (const listener of listeners) {
        if (listener.pluginId === pluginId) {
          listeners.delete(listener);
        }
      }
    }
  }

  unregister(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (!instance) return;

    // Call destroy hook
    if (instance.plugin.destroy) {
      try {
        instance.plugin.destroy();
      } catch (error) {
        console.error(`Error destroying plugin ${pluginId}:`, error);
      }
    }

    // Remove hook listeners
    this.removeHookListeners(pluginId);

    this.plugins.delete(pluginId);
  }

  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  getAll(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  enable(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (instance.status === 'active') return;

    instance.config.enabled = true;
    this.initializePlugin(instance);
  }

  disable(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (instance.status === 'disabled') return;

    // Call destroy hook
    if (instance.plugin.destroy) {
      try {
        instance.plugin.destroy();
      } catch (error) {
        console.error(`Error destroying plugin ${pluginId}:`, error);
      }
    }

    // Remove hook listeners
    this.removeHookListeners(pluginId);

    instance.config.enabled = false;
    instance.status = 'disabled';
  }

  configure(pluginId: string, config: Partial<PluginConfig>): void {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    instance.config = {
      ...instance.config,
      ...config,
      settings: {
        ...instance.config.settings,
        ...config.settings,
      },
    };
  }

  getWidgets(): WidgetDefinition[] {
    const widgets: WidgetDefinition[] = [];

    for (const instance of this.plugins.values()) {
      if (instance.status === 'active' && instance.plugin.widgets) {
        widgets.push(...instance.plugin.widgets);
      }
    }

    return widgets;
  }

  getTransformers(): DataTransformer[] {
    const transformers: DataTransformer[] = [];

    for (const instance of this.plugins.values()) {
      if (instance.status === 'active' && instance.plugin.transformers) {
        transformers.push(...instance.plugin.transformers);
      }
    }

    return transformers;
  }

  async executeHook<T, R>(hook: PluginHook, data: T): Promise<R> {
    const listeners = this.hookListeners.get(hook);
    if (!listeners || listeners.size === 0) {
      return data as unknown as R;
    }

    let result: unknown = data;

    for (const { pluginId, handler } of listeners) {
      const instance = this.plugins.get(pluginId);
      if (!instance || instance.status !== 'active') continue;

      const context: PluginHookContext = {
        pluginId,
        hook,
        timestamp: Date.now(),
      };

      try {
        const hookResult = await handler(result, context);
        // If hook returns a value, use it as input for next hook
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Error in hook ${hook} for plugin ${pluginId}:`, error);
        // Execute error hook
        if (hook !== 'onError') {
          await this.executeHook('onError', { error, hook, pluginId, data: result });
        }
      }
    }

    return result as R;
  }
}

// Singleton instance
let registry: PluginRegistry | null = null;

export function getPluginRegistry(): PluginRegistry {
  if (!registry) {
    registry = new PluginRegistryImpl();
  }
  return registry;
}

export function resetPluginRegistry(): void {
  if (registry) {
    // Unregister all plugins
    for (const instance of registry.getAll()) {
      registry.unregister(instance.plugin.metadata.id);
    }
    registry = null;
  }
}
