// REST API Connector
// Handles connections to REST APIs with various authentication methods

import { DataSource, AuthConfig, DataSourceConnection } from '@/types/data-source';
import { BaseConnector, FetchOptions, FetchResponse } from './BaseConnector';

export class RestConnector extends BaseConnector {
  constructor(dataSource: DataSource, auth: AuthConfig) {
    super(dataSource, auth);
  }

  /**
   * Test the connection to the REST API
   */
  async testConnection(): Promise<DataSourceConnection> {
    const startTime = Date.now();

    try {
      // Use health check endpoint if available, otherwise try base URL
      const testEndpoint = this.dataSource.healthCheckEndpoint || '';
      const url = this.buildUrl(this.dataSource.baseUrl || '', testEndpoint);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          dataSourceId: this.dataSource.id,
          isConnected: true,
          latency,
          lastChecked: new Date(),
        };
      } else {
        return {
          dataSourceId: this.dataSource.id,
          isConnected: false,
          lastError: `HTTP ${response.status}: ${response.statusText}`,
          latency,
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Connection timed out';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        dataSourceId: this.dataSource.id,
        isConnected: false,
        lastError: errorMessage,
        latency,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Fetch data from the REST API
   */
  async fetch<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      params,
      body,
      timeout = 30000,
    } = options;

    const startTime = Date.now();
    const url = this.buildUrl(this.dataSource.baseUrl || '', endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestHeaders: Record<string, string> = {
        ...this.getAuthHeaders(),
        'Accept': 'application/json',
        ...headers,
      };

      // Add Content-Type for requests with body
      if (body && !requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses, return as text wrapped in an object
        const text = await response.text();
        data = { text, _raw: true } as T;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data,
        status: response.status,
        headers: responseHeaders,
        latency,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Perform a GET request
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<FetchResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'GET', params });
  }

  /**
   * Perform a POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>
  ): Promise<FetchResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'POST', body, params });
  }

  /**
   * Perform a PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>
  ): Promise<FetchResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'PUT', body, params });
  }

  /**
   * Perform a PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>
  ): Promise<FetchResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'PATCH', body, params });
  }

  /**
   * Perform a DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<FetchResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'DELETE', params });
  }
}
