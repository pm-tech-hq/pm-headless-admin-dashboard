// Internal types for schema detection

import {
  FieldType,
  Schema,
  SchemaField,
  SchemaDetectionOptions,
  SchemaDetectionResult,
  PaginationAnalysis,
} from '@/types/schema';
import { WidgetSuggestion } from '@/types/widget';

/**
 * Analysis context passed between analyzers
 */
export interface AnalysisContext {
  dataSourceId: string;
  endpointId?: string;
  samples: unknown[];
  sampleSize: number;
  existingSchemas: Schema[];
  options: SchemaDetectionOptions;
}

/**
 * Response structure analysis result
 */
export interface ResponseStructure {
  /** Whether the root is an array */
  isArray: boolean;
  /** Whether data is wrapped in an object */
  isWrapped: boolean;
  /** JSON path to the actual data array */
  dataPath: string | null;
  /** JSON paths to metadata (pagination, etc.) */
  metaPaths: string[];
  /** Number of items in the data array */
  itemCount: number;
  /** Structure complexity level */
  structure: 'flat' | 'nested' | 'deeply_nested';
  /** Maximum nesting depth */
  maxDepth: number;
}

/**
 * Extended detection result with additional details
 */
export interface ExtendedDetectionResult extends SchemaDetectionResult {
  /** Response structure analysis */
  responseStructure: ResponseStructure;
  /** Pagination detection result */
  paginationAnalysis: PaginationAnalysis;
  /** Suggested widgets for this schema */
  widgetSuggestions: WidgetSuggestion[];
  /** Time taken for detection in milliseconds */
  processingTime: number;
  /** Debug information (only in development) */
  debugInfo?: Record<string, unknown>;
}

/**
 * Field analysis result with all detection details
 */
export interface FieldAnalysisResult {
  name: string;
  type: FieldType;
  confidence: number;
  isRequired: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  enumValues?: string[];
  arrayItemType?: FieldType;
  nestedSchema?: Schema;
  validation: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  referenceTo?: string;
  referenceField?: string;
  sampleValues: unknown[];
  inferredFromCount: number;
}

/**
 * Options for incremental schema merging
 */
export interface MergeOptions {
  /** Keep manually edited field properties */
  preserveManualEdits?: boolean;
  /** Maximum samples to retain */
  maxSamples?: number;
  /** Fields to exclude from re-detection */
  excludeFields?: string[];
}

/**
 * Progress callback for long-running detections
 */
export type DetectionProgressCallback = (progress: {
  phase: 'extracting' | 'analyzing' | 'detecting' | 'suggesting' | 'complete';
  percentage: number;
  message: string;
}) => void;

/**
 * Schema comparison result
 */
export interface SchemaComparison {
  /** Whether schemas are compatible */
  compatible: boolean;
  /** Fields added in new schema */
  addedFields: string[];
  /** Fields removed from old schema */
  removedFields: string[];
  /** Fields with changed types */
  changedFields: Array<{
    name: string;
    oldType: FieldType;
    newType: FieldType;
  }>;
  /** Overall similarity score (0-1) */
  similarity: number;
}
