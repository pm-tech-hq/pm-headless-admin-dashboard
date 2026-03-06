// Data Source Manager
// Orchestrates data source connections, caching, and health monitoring

import { DataSource, AuthConfig, DataSourceConnection, TestConnectionResponse } from '@/types/data-source';
import { BaseConnector, FetchOptions, FetchResponse } from './connectors/BaseConnector';
import { RestConnector } from './connectors/RestConnector';
import { decrypt } from '@/lib/encryption';

// Cache for active connectors
const connectorCache = new Map<string, BaseConnector>();

// Cache for connection health status
const healthCache = new Map<string, DataSourceConnection>();

export class DataSourceManager {
  /**
   * Create a connector for a data source
   */
  static createConnector(dataSource: DataSource, decryptCredentials = true): BaseConnector {
    // Decrypt credentials if needed
    const auth = decryptCredentials
      ? this.decryptAuthConfig(dataSource.auth)
      : dataSource.auth;

    switch (dataSource.type) {
      case 'rest':
        return new RestConnector(dataSource, auth);
      case 'graphql':
        // For now, use REST connector for GraphQL (can be enhanced later)
        return new RestConnector(dataSource, auth);
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  /**
   * Get or create a cached connector
   */
  static getConnector(dataSource: DataSource): BaseConnector {
    const cached = connectorCache.get(dataSource.id);

    if (cached) {
      return cached;
    }

    const connector = this.createConnector(dataSource);
    connectorCache.set(dataSource.id, connector);
    return connector;
  }

  /**
   * Remove a connector from cache
   */
  static removeConnector(dataSourceId: string): void {
    connectorCache.delete(dataSourceId);
    healthCache.delete(dataSourceId);
  }

  /**
   * Test connection to a data source
   */
  static async testConnection(
    dataSource: DataSource | Partial<DataSource> & { baseUrl: string; auth: AuthConfig }
  ): Promise<TestConnectionResponse> {
    const startTime = Date.now();

    try {
      // Create a temporary data source object for testing
      const testDataSource: DataSource = {
        id: 'test-connection',
        name: 'Test Connection',
        type: (dataSource as DataSource).type || 'rest',
        baseUrl: dataSource.baseUrl,
        auth: dataSource.auth,
        healthStatus: 'unknown',
        healthCheckEndpoint: (dataSource as DataSource).healthCheckEndpoint,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'system',
        credentialsEncrypted: false,
      };

      const connector = this.createConnector(testDataSource, false);
      const result = await connector.testConnection();

      if (result.isConnected) {
        // Try to fetch some sample data
        try {
          const sampleResponse = await connector.fetch('', { timeout: 5000 });
          return {
            success: true,
            latency: result.latency,
            sampleData: sampleResponse.data,
          };
        } catch {
          // Connection works but couldn't fetch sample data
          return {
            success: true,
            latency: result.latency,
          };
        }
      } else {
        return {
          success: false,
          latency: result.latency,
          error: result.lastError,
        };
      }
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch data from a data source
   */
  static async fetch<T = unknown>(
    dataSource: DataSource,
    endpoint: string,
    options?: FetchOptions
  ): Promise<FetchResponse<T>> {
    const connector = this.getConnector(dataSource);
    return connector.fetch<T>(endpoint, options);
  }

  /**
   * Get cached health status for a data source
   */
  static getHealthStatus(dataSourceId: string): DataSourceConnection | undefined {
    return healthCache.get(dataSourceId);
  }

  /**
   * Update health status for a data source
   */
  static async checkHealth(dataSource: DataSource): Promise<DataSourceConnection> {
    const connector = this.getConnector(dataSource);
    const health = await connector.testConnection();
    healthCache.set(dataSource.id, health);
    return health;
  }

  /**
   * Decrypt sensitive fields in auth config
   */
  private static decryptAuthConfig(auth: AuthConfig): AuthConfig {
    const decrypted = { ...auth };

    try {
      if (auth.apiKey) {
        decrypted.apiKey = decrypt(auth.apiKey);
      }
      if (auth.password) {
        decrypted.password = decrypt(auth.password);
      }
      if (auth.token) {
        decrypted.token = decrypt(auth.token);
      }
      if (auth.clientSecret) {
        decrypted.clientSecret = decrypt(auth.clientSecret);
      }
    } catch {
      // If decryption fails, credentials might not be encrypted
      // Return original values
      return auth;
    }

    return decrypted;
  }

  /**
   * Clear all caches
   */
  static clearCaches(): void {
    connectorCache.clear();
    healthCache.clear();
  }
}

export default DataSourceManager;
