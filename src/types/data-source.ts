// Data Source Type Definitions
// Supports REST, GraphQL, and database connections

export type DataSourceType = 'rest' | 'graphql' | 'postgres' | 'mysql' | 'sqlite' | 'mongodb';

export type AuthenticationType =
  | 'none'
  | 'api_key'
  | 'basic'
  | 'bearer'
  | 'oauth2'
  | 'custom_header';

export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/**
 * Authentication configuration for data sources
 */
export interface AuthConfig {
  type: AuthenticationType;

  // API Key authentication
  apiKey?: string;
  apiKeyHeader?: string;      // Default: 'X-API-Key'
  apiKeyPrefix?: string;      // e.g., 'Bearer ', 'Api-Key '

  // Basic authentication
  username?: string;
  password?: string;

  // Bearer/OAuth authentication
  token?: string;
  tokenUrl?: string;          // OAuth token endpoint
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];

  // Custom headers
  customHeaders?: Record<string, string>;
}

/**
 * Data source connection configuration
 */
export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;

  // REST/GraphQL connection
  baseUrl?: string;

  // Database connection
  connectionString?: string;  // Encrypted
  host?: string;
  port?: number;
  database?: string;

  // Authentication
  auth: AuthConfig;

  // Health monitoring
  healthCheckEndpoint?: string;
  healthCheckInterval?: number; // milliseconds
  lastHealthCheck?: Date;
  healthStatus: HealthStatus;

  // Rate limiting
  rateLimitRequests?: number;
  rateLimitWindow?: number;   // milliseconds

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdById: string;

  // Flag indicating credentials are encrypted
  credentialsEncrypted: boolean;
}

/**
 * Data source connection status
 */
export interface DataSourceConnection {
  dataSourceId: string;
  isConnected: boolean;
  lastError?: string;
  latency?: number;           // milliseconds
  lastChecked?: Date;
}

/**
 * Pagination configuration for endpoints
 */
export interface PaginationConfig {
  type: 'offset' | 'cursor' | 'page' | 'none';

  // Offset-based pagination
  limitParam?: string;        // e.g., 'limit', 'per_page'
  offsetParam?: string;       // e.g., 'offset', 'skip'

  // Page-based pagination
  pageParam?: string;         // e.g., 'page'
  pageSizeParam?: string;     // e.g., 'page_size'

  // Cursor-based pagination
  cursorParam?: string;       // e.g., 'cursor', 'after'
  nextCursorPath?: string;    // JSON path to next cursor in response

  // Response parsing
  dataPath?: string;          // JSON path to data array
  totalPath?: string;         // JSON path to total count
  hasMorePath?: string;       // JSON path to hasMore flag
}

/**
 * Data source endpoint configuration
 */
export interface DataSourceEndpoint {
  id: string;
  dataSourceId: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;

  // Request configuration
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyTemplate?: string;

  // Response configuration
  responseSchemaId?: string;

  // Pagination
  pagination?: PaginationConfig;

  // Caching
  cacheEnabled?: boolean;
  cacheTTL?: number;          // seconds

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for creating/updating a data source
 */
export interface DataSourceFormData {
  name: string;
  description?: string;
  type: DataSourceType;
  baseUrl?: string;
  host?: string;
  port?: number;
  database?: string;
  auth: AuthConfig;
  healthCheckEndpoint?: string;
  healthCheckInterval?: number;
}

/**
 * Test connection request
 */
export interface TestConnectionRequest {
  dataSource: DataSourceFormData;
  endpoint?: string;
}

/**
 * Test connection response
 */
export interface TestConnectionResponse {
  success: boolean;
  latency?: number;
  error?: string;
  sampleData?: unknown;
}
