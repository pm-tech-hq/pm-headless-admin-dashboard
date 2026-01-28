// Sample Plugin
// Demonstrates how to create a plugin

import { Plugin } from '../types';

export const samplePlugin: Plugin = {
  metadata: {
    id: 'sample-plugin',
    name: 'Sample Plugin',
    version: '1.0.0',
    description: 'A sample plugin demonstrating the plugin system',
    author: 'Admin Dashboard',
  },

  initialize(config) {
    console.log('Sample plugin initialized with config:', config);
  },

  destroy() {
    console.log('Sample plugin destroyed');
  },

  // Custom widget definitions
  widgets: [
    {
      type: 'sample-counter',
      name: 'Counter Widget',
      description: 'A simple counter widget',
      icon: '🔢',
      defaultSize: { w: 2, h: 2 },
      minSize: { w: 1, h: 1 },
      defaultConfig: {
        initialValue: 0,
        step: 1,
      },
      render: ({ data, config }) => {
        // This would be a React component in practice
        return null;
      },
    },
  ],

  // Data transformers
  transformers: [
    {
      id: 'uppercase',
      name: 'Uppercase',
      description: 'Converts string values to uppercase',
      transform: (data, options) => {
        if (typeof data === 'string') {
          return data.toUpperCase();
        }
        if (Array.isArray(data)) {
          return data.map((item) =>
            typeof item === 'string' ? item.toUpperCase() : item
          );
        }
        return data;
      },
    },
    {
      id: 'sum',
      name: 'Sum',
      description: 'Sums numeric values in an array',
      transform: (data) => {
        if (Array.isArray(data)) {
          return data.reduce((sum, val) => {
            if (typeof val === 'number') {
              return sum + val;
            }
            return sum;
          }, 0);
        }
        return data;
      },
    },
  ],

  // Hook handlers
  hooks: {
    beforeDataFetch: async (data, context) => {
      console.log(`[${context.pluginId}] Before data fetch`, data);
      return data;
    },

    afterDataFetch: async (data, context) => {
      console.log(`[${context.pluginId}] After data fetch`, data);
      return data;
    },

    onError: async (errorData, context) => {
      console.error(`[${context.pluginId}] Error occurred:`, errorData);
    },
  },
};

export default samplePlugin;
