// Custom error classes for schema detection

/**
 * Base error class for schema detection errors
 */
export class SchemaDetectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SchemaDetectionError';
    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Error when no data is available for detection
 */
export class EmptyDataError extends SchemaDetectionError {
  constructor(message = 'No data available for schema detection') {
    super(message, 'EMPTY_DATA');
    this.name = 'EmptyDataError';
  }
}

/**
 * Error when data format is not supported
 */
export class InvalidDataError extends SchemaDetectionError {
  constructor(message = 'Data format is not supported for schema detection') {
    super(message, 'INVALID_DATA');
    this.name = 'InvalidDataError';
  }
}

/**
 * Error when there are insufficient samples for reliable detection
 */
export class InsufficientSamplesError extends SchemaDetectionError {
  constructor(actual: number, required: number) {
    super(
      `Insufficient samples for reliable detection. Got ${actual}, need at least ${required}`,
      'INSUFFICIENT_SAMPLES',
      { actual, required }
    );
    this.name = 'InsufficientSamplesError';
  }
}

/**
 * Error when schema analysis times out
 */
export class AnalysisTimeoutError extends SchemaDetectionError {
  constructor(timeoutMs: number) {
    super(
      `Schema analysis timed out after ${timeoutMs}ms`,
      'ANALYSIS_TIMEOUT',
      { timeoutMs }
    );
    this.name = 'AnalysisTimeoutError';
  }
}

/**
 * Error when data source connection fails
 */
export class DataSourceConnectionError extends SchemaDetectionError {
  constructor(message: string, dataSourceId?: string) {
    super(message, 'CONNECTION_FAILED', { dataSourceId });
    this.name = 'DataSourceConnectionError';
  }
}

/**
 * Error when schema cannot be saved to database
 */
export class SchemaPersistenceError extends SchemaDetectionError {
  constructor(message: string, schemaId?: string) {
    super(message, 'PERSISTENCE_FAILED', { schemaId });
    this.name = 'SchemaPersistenceError';
  }
}

/**
 * Error when schema is not found
 */
export class SchemaNotFoundError extends SchemaDetectionError {
  constructor(schemaId: string) {
    super(`Schema with ID '${schemaId}' not found`, 'SCHEMA_NOT_FOUND', {
      schemaId,
    });
    this.name = 'SchemaNotFoundError';
  }
}

/**
 * Error codes for schema detection
 */
export const ERROR_CODES = {
  EMPTY_DATA: 'EMPTY_DATA',
  INVALID_DATA: 'INVALID_DATA',
  INSUFFICIENT_SAMPLES: 'INSUFFICIENT_SAMPLES',
  ANALYSIS_TIMEOUT: 'ANALYSIS_TIMEOUT',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
  SCHEMA_NOT_FOUND: 'SCHEMA_NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Check if an error is a schema detection error
 */
export function isSchemaDetectionError(
  error: unknown
): error is SchemaDetectionError {
  return error instanceof SchemaDetectionError;
}

/**
 * Wrap unknown errors in SchemaDetectionError
 */
export function wrapError(error: unknown): SchemaDetectionError {
  if (isSchemaDetectionError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new SchemaDetectionError(
      error.message,
      ERROR_CODES.UNKNOWN_ERROR,
      { originalError: error.name }
    );
  }

  return new SchemaDetectionError(
    String(error),
    ERROR_CODES.UNKNOWN_ERROR
  );
}
