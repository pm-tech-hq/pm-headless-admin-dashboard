// Main schema detection orchestrator service

import { prisma } from '@/lib/db';
import {
  Schema,
  SchemaField,
  SchemaDetectionOptions,
  PaginationAnalysis,
  FieldType,
} from '@/types/schema';
import { DataSource } from '@/types/data-source';
import { WidgetSuggestion } from '@/types/widget';

import {
  ExtendedDetectionResult,
  ResponseStructure,
  FieldAnalysisResult,
  MergeOptions,
  SchemaComparison,
} from './types';

import {
  EmptyDataError,
  InvalidDataError,
  SchemaNotFoundError,
  SchemaPersistenceError,
  wrapError,
} from './errors';

// Analyzers
import { PatternAnalyzer } from './analyzers/PatternAnalyzer';
import { TypeAnalyzer } from './analyzers/TypeAnalyzer';
import { EnumAnalyzer } from './analyzers/EnumAnalyzer';
import { ValidationAnalyzer } from './analyzers/ValidationAnalyzer';
import { StructureAnalyzer } from './analyzers/StructureAnalyzer';

// Detectors
import { PrimaryKeyDetector } from './detectors/PrimaryKeyDetector';
import { PaginationDetector } from './detectors/PaginationDetector';
import { RelationshipDetector } from './detectors/RelationshipDetector';

// Suggesters
import { WidgetSuggester } from './suggesters/WidgetSuggester';

// Utils
import {
  extractSamples,
  extractFieldNames,
  extractFieldValues,
  mergeSamples,
} from './utils/sampling';
import { adjustForSampleSize } from './utils/confidence';

/**
 * Schema Detection Service
 *
 * Automatically analyzes API response structures to detect:
 * - Field types with confidence scores
 * - Pagination patterns
 * - Relationships between schemas
 * - Appropriate widgets for visualization
 */
export class SchemaDetectionService {
  private patternAnalyzer: PatternAnalyzer;
  private typeAnalyzer: TypeAnalyzer;
  private enumAnalyzer: EnumAnalyzer;
  private validationAnalyzer: ValidationAnalyzer;
  private structureAnalyzer: StructureAnalyzer;
  private primaryKeyDetector: PrimaryKeyDetector;
  private paginationDetector: PaginationDetector;
  private relationshipDetector: RelationshipDetector;
  private widgetSuggester: WidgetSuggester;

  constructor() {
    this.patternAnalyzer = new PatternAnalyzer();
    this.typeAnalyzer = new TypeAnalyzer(this.patternAnalyzer);
    this.enumAnalyzer = new EnumAnalyzer();
    this.validationAnalyzer = new ValidationAnalyzer();
    this.structureAnalyzer = new StructureAnalyzer();
    this.primaryKeyDetector = new PrimaryKeyDetector();
    this.paginationDetector = new PaginationDetector();
    this.relationshipDetector = new RelationshipDetector();
    this.widgetSuggester = new WidgetSuggester();
  }

  /**
   * Main entry point - detect schema from options
   */
  async detectSchema(
    options: SchemaDetectionOptions
  ): Promise<ExtendedDetectionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Extract samples from data
      const extraction = extractSamples(
        options.sampleData,
        options.maxSampleSize || 100
      );

      if (extraction.samples.length === 0) {
        throw new EmptyDataError();
      }

      // Analyze response structure
      const responseStructure = this.structureAnalyzer.analyze(options.sampleData);

      // Add warning for small sample size
      if (extraction.samples.length < 5) {
        warnings.push(
          `Only ${extraction.samples.length} samples available. Detection confidence may be low.`
        );
        suggestions.push('Fetch more data samples for improved accuracy.');
      }

      // Analyze all fields
      const fieldAnalyses = this.analyzeAllFields(extraction.samples);

      // Detect primary key
      const pkResult = this.primaryKeyDetector.detect(
        fieldAnalyses.map((fa) => ({
          fieldName: fa.name,
          type: fa.type,
          isUnique: fa.isUnique,
          statistics: this.typeAnalyzer.collectStatistics(
            extractFieldValues(extraction.samples, fa.name)
          ),
        }))
      );

      // Mark primary key
      if (pkResult.fieldName) {
        const pkField = fieldAnalyses.find((f) => f.name === pkResult.fieldName);
        if (pkField) {
          pkField.isPrimaryKey = true;
        }
      }

      // Build schema
      const schema = this.buildSchema(
        options,
        fieldAnalyses,
        extraction.samples.length
      );

      // Detect pagination if requested
      let paginationAnalysis: PaginationAnalysis = {
        detected: false,
        type: 'none',
        confidence: 0,
      };

      if (options.detectPagination !== false) {
        paginationAnalysis = this.paginationDetector.detect(options.sampleData);
      }

      // Detect relationships if requested and other schemas available
      if (options.detectRelationships && options.existingSchemas?.length) {
        schema.relationships = this.relationshipDetector.detectRelationships(
          schema,
          options.existingSchemas
        );
      }

      // Get widget suggestions
      const widgetSuggestions = this.widgetSuggester.suggest(schema);

      return {
        schema,
        warnings,
        suggestions,
        responseStructure,
        paginationAnalysis,
        widgetSuggestions,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw wrapError(error);
    }
  }

  /**
   * Detect schema by fetching from endpoint
   */
  async detectFromEndpoint(
    dataSource: DataSource,
    endpoint: string,
    options?: Partial<SchemaDetectionOptions>
  ): Promise<ExtendedDetectionResult> {
    // This would integrate with DataSourceManager to fetch data
    // For now, throw an error indicating this requires data
    throw new InvalidDataError(
      'detectFromEndpoint requires DataSourceManager integration. Use detectSchema with sampleData instead.'
    );
  }

  /**
   * Merge new samples with existing schema (incremental detection)
   */
  async mergeWithExisting(
    existingSchema: Schema,
    newSamples: unknown[],
    options: MergeOptions = {}
  ): Promise<ExtendedDetectionResult> {
    const { preserveManualEdits = true, maxSamples = 100 } = options;

    // Extract existing sample values from schema fields
    const existingSamples: unknown[] = [];
    for (const field of existingSchema.fields) {
      if (field.sampleValues?.length) {
        // Reconstruct sample objects (limited)
        for (let i = 0; i < Math.min(field.sampleValues.length, 10); i++) {
          if (!existingSamples[i]) {
            existingSamples[i] = {};
          }
          (existingSamples[i] as Record<string, unknown>)[field.name] =
            field.sampleValues[i];
        }
      }
    }

    // Merge samples
    const mergedSamples = mergeSamples(existingSamples, newSamples, maxSamples);

    // Re-detect with merged samples
    const result = await this.detectSchema({
      dataSourceId: existingSchema.dataSourceId,
      endpointId: existingSchema.endpointId,
      sampleData: mergedSamples,
      detectRelationships: true,
    });

    // Preserve manual edits if requested
    if (preserveManualEdits) {
      for (const existingField of existingSchema.fields) {
        const newField = result.schema.fields.find(
          (f) => f.name === existingField.name
        );
        if (newField) {
          // Preserve display customizations
          if (existingField.displayName) {
            newField.displayName = existingField.displayName;
          }
          if (existingField.description) {
            newField.description = existingField.description;
          }
          if (existingField.displayFormat) {
            newField.displayFormat = existingField.displayFormat;
          }
        }
      }
    }

    // Preserve schema metadata
    result.schema.id = existingSchema.id;
    result.schema.createdAt = existingSchema.createdAt;
    result.schema.crudEnabled = existingSchema.crudEnabled;
    result.schema.crudEndpoints = existingSchema.crudEndpoints;

    result.suggestions.push(
      `Schema updated with ${mergedSamples.length} total samples`
    );

    return result;
  }

  /**
   * Detect pagination pattern only
   */
  detectPagination(
    response: unknown,
    requestParams?: Record<string, unknown>
  ): PaginationAnalysis {
    return this.paginationDetector.detect(response, requestParams);
  }

  /**
   * Detect relationships for a schema
   */
  detectRelationships(schema: Schema, allSchemas: Schema[]): Schema {
    const relationships = this.relationshipDetector.detectRelationships(
      schema,
      allSchemas
    );

    return {
      ...schema,
      relationships,
    };
  }

  /**
   * Get widget suggestions for a schema
   */
  getWidgetSuggestions(schema: Schema): WidgetSuggestion[] {
    return this.widgetSuggester.suggest(schema);
  }

  /**
   * Save detected schema to database
   */
  async saveSchema(schema: Schema): Promise<Schema> {
    try {
      const dbSchema = await prisma.schema.create({
        data: {
          id: schema.id,
          name: schema.name,
          description: schema.description,
          dataSourceId: schema.dataSourceId,
          endpointId: schema.endpointId,
          fields: JSON.stringify(schema.fields),
          detectedAt: schema.detectedAt,
          sampleSize: schema.sampleSize,
          autoDetected: schema.autoDetected,
          crudEnabled: schema.crudEnabled,
          crudEndpoints: schema.crudEndpoints
            ? JSON.stringify(schema.crudEndpoints)
            : null,
        },
      });

      // Save relationships
      if (schema.relationships.length > 0) {
        await prisma.schemaRelationship.createMany({
          data: schema.relationships.map((r) => ({
            id: r.id,
            name: r.name,
            sourceSchemaId: r.sourceSchemaId,
            sourceField: r.sourceField,
            targetSchemaId: r.targetSchemaId,
            targetField: r.targetField,
            type: r.type,
          })),
        });
      }

      return schema;
    } catch (error) {
      throw new SchemaPersistenceError(
        `Failed to save schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        schema.id
      );
    }
  }

  /**
   * Update existing schema
   */
  async updateSchema(
    schemaId: string,
    updates: Partial<Schema>
  ): Promise<Schema> {
    try {
      const existing = await prisma.schema.findUnique({
        where: { id: schemaId },
      });

      if (!existing) {
        throw new SchemaNotFoundError(schemaId);
      }

      const updated = await prisma.schema.update({
        where: { id: schemaId },
        data: {
          name: updates.name,
          description: updates.description,
          fields: updates.fields ? JSON.stringify(updates.fields) : undefined,
          crudEnabled: updates.crudEnabled,
          crudEndpoints: updates.crudEndpoints
            ? JSON.stringify(updates.crudEndpoints)
            : undefined,
        },
      });

      return {
        ...updates,
        id: updated.id,
        name: updated.name,
        description: updated.description || undefined,
        dataSourceId: updated.dataSourceId,
        endpointId: updated.endpointId || undefined,
        fields: JSON.parse(updated.fields),
        detectedAt: updated.detectedAt,
        sampleSize: updated.sampleSize,
        autoDetected: updated.autoDetected,
        relationships: [],
        crudEnabled: updated.crudEnabled,
        crudEndpoints: updated.crudEndpoints
          ? JSON.parse(updated.crudEndpoints)
          : undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      } as Schema;
    } catch (error) {
      if (error instanceof SchemaNotFoundError) {
        throw error;
      }
      throw new SchemaPersistenceError(
        `Failed to update schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        schemaId
      );
    }
  }

  /**
   * Compare two schemas
   */
  compareSchemas(oldSchema: Schema, newSchema: Schema): SchemaComparison {
    const oldFieldNames = new Set(oldSchema.fields.map((f) => f.name));
    const newFieldNames = new Set(newSchema.fields.map((f) => f.name));

    const addedFields = newSchema.fields
      .filter((f) => !oldFieldNames.has(f.name))
      .map((f) => f.name);

    const removedFields = oldSchema.fields
      .filter((f) => !newFieldNames.has(f.name))
      .map((f) => f.name);

    const changedFields: Array<{
      name: string;
      oldType: FieldType;
      newType: FieldType;
    }> = [];

    for (const oldField of oldSchema.fields) {
      const newField = newSchema.fields.find((f) => f.name === oldField.name);
      if (newField && newField.type !== oldField.type) {
        changedFields.push({
          name: oldField.name,
          oldType: oldField.type,
          newType: newField.type,
        });
      }
    }

    // Calculate similarity
    const totalFields = Math.max(oldFieldNames.size, newFieldNames.size);
    const unchangedCount =
      oldSchema.fields.filter((f) => {
        const newField = newSchema.fields.find((nf) => nf.name === f.name);
        return newField && newField.type === f.type;
      }).length;

    const similarity = totalFields > 0 ? unchangedCount / totalFields : 1;

    return {
      compatible: changedFields.length === 0 && removedFields.length === 0,
      addedFields,
      removedFields,
      changedFields,
      similarity,
    };
  }

  // Private helper methods

  /**
   * Analyze all fields in the samples
   */
  private analyzeAllFields(samples: unknown[]): FieldAnalysisResult[] {
    if (samples.length === 0) {
      return [];
    }

    // Get all field names
    const fieldNames = extractFieldNames(samples);
    const results: FieldAnalysisResult[] = [];

    for (const fieldName of fieldNames) {
      const values = extractFieldValues(samples, fieldName);
      const analysis = this.analyzeField(fieldName, values);
      results.push(analysis);
    }

    return results;
  }

  /**
   * Analyze a single field
   */
  private analyzeField(fieldName: string, values: unknown[]): FieldAnalysisResult {
    // Collect statistics
    const stats = this.typeAnalyzer.collectStatistics(values);

    // Aggregate types
    const typeResult = this.typeAnalyzer.aggregateTypes(stats);

    // Check for enum
    let enumValues: string[] | undefined;
    if (typeResult.type === 'string') {
      const enumAnalysis = this.enumAnalyzer.analyzeForEnum(values);
      if (enumAnalysis.isEnum) {
        enumValues = enumAnalysis.values;
      }
    }

    // Infer validation constraints
    const validation = this.validationAnalyzer.inferConstraints(fieldName, stats);

    // Check for array item type
    let arrayItemType: FieldType | undefined;
    if (typeResult.type === 'array') {
      const arrays = values.filter(Array.isArray) as unknown[][];
      if (arrays.length > 0) {
        arrayItemType = this.typeAnalyzer.detectArrayItemType(arrays);
      }
    }

    // Detect if this looks like an ID field
    const idAnalysis = this.typeAnalyzer.isLikelyIdField(fieldName, stats);

    // Adjust confidence for sample size
    const confidence = adjustForSampleSize(typeResult.confidence, values.length);

    return {
      name: fieldName,
      type: enumValues ? 'enum' : typeResult.type,
      confidence,
      isRequired: validation.isRequired,
      isNullable: validation.isNullable,
      isUnique: validation.isUnique,
      isPrimaryKey: false, // Set later by PrimaryKeyDetector
      isForeignKey: this.relationshipDetector.isPotentialForeignKey({
        name: fieldName,
        type: typeResult.type,
        isRequired: validation.isRequired,
        isNullable: validation.isNullable,
        isUnique: validation.isUnique,
        isPrimaryKey: false,
        isForeignKey: false,
        confidence,
      }),
      enumValues,
      arrayItemType,
      validation: {
        minLength: validation.minLength,
        maxLength: validation.maxLength,
        min: validation.min,
        max: validation.max,
        pattern: validation.pattern,
      },
      sampleValues: stats.sampleValues.slice(0, 5),
      inferredFromCount: values.length,
    };
  }

  /**
   * Build schema from field analyses
   */
  private buildSchema(
    options: SchemaDetectionOptions,
    fieldAnalyses: FieldAnalysisResult[],
    sampleSize: number
  ): Schema {
    const now = new Date();

    const fields: SchemaField[] = fieldAnalyses.map((fa) => ({
      name: fa.name,
      type: fa.type,
      confidence: fa.confidence,
      isRequired: fa.isRequired,
      isNullable: fa.isNullable,
      isUnique: fa.isUnique,
      isPrimaryKey: fa.isPrimaryKey,
      isForeignKey: fa.isForeignKey,
      enumValues: fa.enumValues,
      arrayItemType: fa.arrayItemType,
      minLength: fa.validation.minLength,
      maxLength: fa.validation.maxLength,
      min: fa.validation.min,
      max: fa.validation.max,
      pattern: fa.validation.pattern,
      sampleValues: fa.sampleValues,
      inferredFromCount: fa.inferredFromCount,
    }));

    return {
      id: this.generateSchemaId(),
      name: this.inferSchemaName(options),
      description: undefined,
      dataSourceId: options.dataSourceId,
      endpointId: options.endpointId,
      fields,
      detectedAt: now,
      sampleSize,
      autoDetected: true,
      relationships: [],
      crudEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Generate unique schema ID
   */
  private generateSchemaId(): string {
    return `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Infer schema name from options
   */
  private inferSchemaName(options: SchemaDetectionOptions): string {
    if (options.endpointId) {
      // Extract name from endpoint path
      const parts = options.endpointId.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1] || 'data';
      return this.toTitleCase(lastPart);
    }
    return 'DetectedSchema';
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }
}

// Export singleton instance
export const schemaDetectionService = new SchemaDetectionService();
