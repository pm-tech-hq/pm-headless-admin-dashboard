// Schema Detection Module - Public API

// Main service
export {
  SchemaDetectionService,
  schemaDetectionService,
} from './SchemaDetectionService';

// Types
export type {
  ExtendedDetectionResult,
  ResponseStructure,
  FieldAnalysisResult,
  MergeOptions,
  SchemaComparison,
  AnalysisContext,
  DetectionProgressCallback,
} from './types';

// Errors
export {
  SchemaDetectionError,
  EmptyDataError,
  InvalidDataError,
  InsufficientSamplesError,
  AnalysisTimeoutError,
  DataSourceConnectionError,
  SchemaPersistenceError,
  SchemaNotFoundError,
  ERROR_CODES,
  isSchemaDetectionError,
  wrapError,
} from './errors';

// Analyzers (for advanced usage)
export { PatternAnalyzer } from './analyzers/PatternAnalyzer';
export { TypeAnalyzer } from './analyzers/TypeAnalyzer';
export { EnumAnalyzer } from './analyzers/EnumAnalyzer';
export { ValidationAnalyzer } from './analyzers/ValidationAnalyzer';
export { StructureAnalyzer } from './analyzers/StructureAnalyzer';

// Detectors (for advanced usage)
export { PrimaryKeyDetector } from './detectors/PrimaryKeyDetector';
export { PaginationDetector } from './detectors/PaginationDetector';
export { RelationshipDetector } from './detectors/RelationshipDetector';

// Suggesters (for advanced usage)
export { WidgetSuggester } from './suggesters/WidgetSuggester';

// Utilities (for advanced usage)
export {
  extractSamples,
  extractFieldNames,
  extractFieldValues,
  mergeSamples,
  getNestedValue,
} from './utils/sampling';

export {
  calculateTypeConfidence,
  calculateEnumConfidence,
  calculateRelationshipConfidence,
  calculatePaginationConfidence,
  adjustForSampleSize,
  getConfidenceLevel,
  formatConfidence,
} from './utils/confidence';

export { PATTERNS } from './utils/patterns';
