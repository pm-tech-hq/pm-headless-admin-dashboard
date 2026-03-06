// Base Connector Abstract Class
// Defines the interface for all data source connectors

import { DataSource, AuthConfig, DataSourceConnection } from '@/types/data-source';

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  timeout?: number;
}

export interface FetchResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  latency: number;
}

export abstract class BaseConnector {
  protected dataSource: DataSource;
  protected auth: AuthConfig;

  constructor(dataSource: DataSource, auth: AuthConfig) {
    this.dataSource = dataSource;
    this.auth = auth;
  }

  /**
   * Test the connection to the data source
   */
  abstract testConnection(): Promise<DataSourceConnection>;

  /**
   * Fetch data from the data source
   */
  abstract fetch<T = unknown>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<FetchResponse<T>>;

  /**
   * Get authentication headers based on auth config
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.auth.type) {
      case 'api_key':
        if (this.auth.apiKey) {
          const headerName = this.auth.apiKeyHeader || 'X-API-Key';
          const prefix = this.auth.apiKeyPrefix || '';
          headers[headerName] = `${prefix}${this.auth.apiKey}`;
        }
        break;

      case 'basic':
        if (this.auth.username && this.auth.password) {
          const credentials = Buffer.from(
            `${this.auth.username}:${this.auth.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'bearer':
        if (this.auth.token) {
          headers['Authorization'] = `Bearer ${this.auth.token}`;
        }
        break;

      case 'custom_header':
        if (this.auth.customHeaders) {
          Object.assign(headers, this.auth.customHeaders);
        }
        break;

      case 'none':
      default:
        // No authentication headers
        break;
    }

    return headers;
  }

  /**
   * Build URL with query parameters
   */
  protected buildUrl(
    baseUrl: string,
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    // Ensure baseUrl doesn't end with slash and endpoint starts correctly
    const base = baseUrl.replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${base}${path}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return url;
  }

  /**
   * Get the data source ID
   */
  getId(): string {
    return this.dataSource.id;
  }

  /**
   * Get the data source type
   */
  getType(): string {
    return this.dataSource.type;
  }
}
