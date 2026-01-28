// Schema Detection Type Definitions
// Automatic data structure and type inference

/**
 * Supported field types for schema detection
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'uuid'
  | 'json'
  | 'array'
  | 'object'
  | 'enum'
  | 'reference'
  | 'unknown';

/**
 * Relationship types between schemas
 */
export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many';

/**
 * Individual field definition within a schema
 */
export interface SchemaField {
  name: string;
  type: FieldType;
  isRequired: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;

  // Display
  displayName?: string;
  description?: string;
  displayFormat?: string;     // e.g., 'currency', 'percentage', 'date:short'

  // Type-specific properties
  enumValues?: string[];      // For enum type
  arrayItemType?: FieldType;  // For array type
  nestedSchema?: Schema;      // For object type

  // Reference/Relationship
  referenceTo?: string;       // Schema ID
  referenceField?: string;    // Field name in referenced schema
  relationshipType?: RelationshipType;

  // Validation constraints
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;           // Regex pattern

  // Detection metadata
  confidence: number;         // 0-1, how confident the detection was
  sampleValues?: unknown[];   // Sample values used for inference
  inferredFromCount?: number; // Number of samples analyzed
}

/**
 * Relationship between two schemas
 */
export interface SchemaRelationship {
  id: string;
  name: string;
  sourceSchemaId: string;
  sourceField: string;
  targetSchemaId: string;
  targetField: string;
  type: RelationshipType;
}

/**
 * CRUD endpoint configuration for a schema
 */
export interface CrudEndpointConfig {
  list: string;               // GET endpoint for listing
  get: string;                // GET endpoint for single item
  create: string;             // POST endpoint for creating
  update: string;             // PUT/PATCH endpoint for updating
  delete: string;             // DELETE endpoint for deleting
}

/**
 * Detected schema definition
 */
export interface Schema {
  id: string;
  name: string;
  description?: string;
  dataSourceId: string;
  endpointId?: string;

  fields: SchemaField[];

  // Detection metadata
  detectedAt: Date;
  sampleSize: number;
  autoDetected: boolean;

  // Relationships with other schemas
  relationships: SchemaRelationship[];

  // CRUD configuration
  crudEnabled: boolean;
  crudEndpoints?: CrudEndpointConfig;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Options for schema detection
 */
export interface SchemaDetectionOptions {
  dataSourceId: string;
  endpointId?: string;
  sampleData?: unknown;
  existingSchemas?: Schema[];
  maxSampleSize?: number;
  detectRelationships?: boolean;
  detectPagination?: boolean;
}

/**
 * Result of schema detection
 */
export interface SchemaDetectionResult {
  schema: Schema;
  warnings: string[];
  suggestions: string[];
}

/**
 * Field update request for manual schema editing
 */
export interface FieldUpdateRequest {
  name?: string;
  type?: FieldType;
  displayName?: string;
  description?: string;
  isRequired?: boolean;
  enumValues?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Statistics about detected field types
 */
export interface FieldTypeStats {
  type: FieldType;
  count: number;
  percentage: number;
  sampleValues: unknown[];
}

/**
 * Detection analysis for a field
 */
export interface FieldAnalysis {
  name: string;
  typeStats: FieldTypeStats[];
  recommendedType: FieldType;
  confidence: number;
  isNullable: boolean;
  uniqueValueCount: number;
  totalValueCount: number;
}

/**
 * Pagination detection result
 */
export interface PaginationAnalysis {
  detected: boolean;
  type: 'offset' | 'cursor' | 'page' | 'none';
  config?: {
    dataPath?: string;
    totalPath?: string;
    nextCursorPath?: string;
    hasMorePath?: string;
  };
  confidence: number;
}
