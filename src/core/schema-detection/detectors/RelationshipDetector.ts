// Foreign key and relationship detection

import { Schema, SchemaField, SchemaRelationship, RelationshipType } from '@/types/schema';
import {
  FOREIGN_KEY_SUFFIX_PATTERN,
  FOREIGN_KEY_PREFIX_PATTERN,
  PRIMARY_KEY_NAME_PATTERN,
} from '../utils/patterns';
import { calculateRelationshipConfidence } from '../utils/confidence';

/**
 * Relationship candidate with scoring
 */
export interface RelationshipCandidate {
  sourceField: string;
  targetSchemaId: string;
  targetSchemaName: string;
  targetField: string;
  confidence: number;
  reasons: string[];
}

/**
 * Detector for foreign key relationships between schemas
 */
export class RelationshipDetector {
  /**
   * Detect relationships between a source schema and other schemas
   */
  detectRelationships(
    sourceSchema: Schema,
    allSchemas: Schema[]
  ): SchemaRelationship[] {
    const relationships: SchemaRelationship[] = [];
    const otherSchemas = allSchemas.filter((s) => s.id !== sourceSchema.id);

    // Find candidates for each field
    for (const field of sourceSchema.fields) {
      if (!this.isPotentialForeignKey(field)) {
        continue;
      }

      const candidates = this.findCandidates(field, otherSchemas);

      // Add relationship for best candidate if confidence is high enough
      const bestCandidate = candidates[0];
      if (bestCandidate && bestCandidate.confidence >= 0.5) {
        relationships.push({
          id: this.generateRelationshipId(
            sourceSchema.id,
            bestCandidate.targetSchemaId,
            field.name
          ),
          name: this.generateRelationshipName(
            sourceSchema.name,
            field.name,
            bestCandidate.targetSchemaName
          ),
          sourceSchemaId: sourceSchema.id,
          sourceField: field.name,
          targetSchemaId: bestCandidate.targetSchemaId,
          targetField: bestCandidate.targetField,
          type: this.inferRelationshipType(field, bestCandidate),
        });
      }
    }

    return relationships;
  }

  /**
   * Check if a field looks like a foreign key
   */
  isPotentialForeignKey(field: SchemaField): boolean {
    // Already marked as FK
    if (field.isForeignKey) {
      return true;
    }

    // Skip primary keys
    if (field.isPrimaryKey) {
      return false;
    }

    // Check naming patterns
    if (FOREIGN_KEY_SUFFIX_PATTERN.test(field.name)) {
      return true;
    }
    if (FOREIGN_KEY_PREFIX_PATTERN.test(field.name)) {
      return true;
    }

    // Check type - UUIDs and integers are common FK types
    if (field.type === 'uuid' || field.type === 'integer') {
      // Only if name contains 'id' somewhere
      if (/id/i.test(field.name)) {
        return true;
      }
    }

    // Reference type is definitely FK
    if (field.type === 'reference') {
      return true;
    }

    return false;
  }

  /**
   * Find potential target schemas for a foreign key field
   */
  private findCandidates(
    field: SchemaField,
    targetSchemas: Schema[]
  ): RelationshipCandidate[] {
    const candidates: RelationshipCandidate[] = [];
    const entityName = this.extractEntityName(field.name);

    for (const targetSchema of targetSchemas) {
      const match = this.scoreMatch(field, entityName, targetSchema);
      if (match.confidence > 0) {
        candidates.push({
          sourceField: field.name,
          targetSchemaId: targetSchema.id,
          targetSchemaName: targetSchema.name,
          targetField: match.targetField,
          confidence: match.confidence,
          reasons: match.reasons,
        });
      }
    }

    // Sort by confidence descending
    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Score how well a field matches a target schema
   */
  private scoreMatch(
    field: SchemaField,
    entityName: string,
    targetSchema: Schema
  ): { targetField: string; confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let nameScore = 0;
    let typeScore = 0;

    // Compare entity name with schema name
    const schemaNameNorm = this.normalizeForComparison(targetSchema.name);
    const entityNameNorm = this.normalizeForComparison(entityName);

    if (schemaNameNorm === entityNameNorm) {
      nameScore = 1.0;
      reasons.push(`Entity name '${entityName}' exactly matches schema '${targetSchema.name}'`);
    } else if (schemaNameNorm.includes(entityNameNorm)) {
      nameScore = 0.8;
      reasons.push(`Entity name '${entityName}' is contained in schema '${targetSchema.name}'`);
    } else if (entityNameNorm.includes(schemaNameNorm)) {
      nameScore = 0.7;
      reasons.push(`Schema name '${targetSchema.name}' is contained in entity name '${entityName}'`);
    } else {
      // No name match
      return { targetField: '', confidence: 0, reasons: [] };
    }

    // Find primary key in target schema
    const primaryKey = this.findPrimaryKey(targetSchema);
    if (!primaryKey) {
      // No PK found, reduce confidence
      return {
        targetField: 'id',
        confidence: nameScore * 0.5,
        reasons: [...reasons, 'No primary key found in target schema'],
      };
    }

    // Check type compatibility
    if (field.type === primaryKey.type) {
      typeScore = 1.0;
      reasons.push(`Types match: ${field.type}`);
    } else if (
      (field.type === 'integer' && primaryKey.type === 'number') ||
      (field.type === 'number' && primaryKey.type === 'integer')
    ) {
      typeScore = 0.9;
      reasons.push('Compatible numeric types');
    } else if (field.type === 'string' || primaryKey.type === 'string') {
      typeScore = 0.7;
      reasons.push('String type compatibility assumed');
    } else {
      typeScore = 0.3;
      reasons.push(`Type mismatch: ${field.type} vs ${primaryKey.type}`);
    }

    const confidence = calculateRelationshipConfidence(nameScore, typeScore, 0);

    return {
      targetField: primaryKey.name,
      confidence,
      reasons,
    };
  }

  /**
   * Extract entity name from foreign key field name
   * e.g., "user_id" -> "user", "userId" -> "user", "authorId" -> "author"
   */
  private extractEntityName(fieldName: string): string {
    return fieldName
      // Remove common suffixes
      .replace(/(_id|Id|ID|_ID|_ref|Ref)$/, '')
      // Remove common prefixes
      .replace(/^(id_|fk_|ref_)/i, '')
      .toLowerCase();
  }

  /**
   * Normalize name for comparison
   */
  private normalizeForComparison(name: string): string {
    return name
      .toLowerCase()
      // Remove underscores and hyphens
      .replace(/[_-]/g, '')
      // Remove trailing 's' (simple pluralization)
      .replace(/s$/, '');
  }

  /**
   * Find primary key field in a schema
   */
  private findPrimaryKey(schema: Schema): SchemaField | null {
    // First look for explicitly marked PK
    const markedPk = schema.fields.find((f) => f.isPrimaryKey);
    if (markedPk) {
      return markedPk;
    }

    // Look for common PK field names
    const commonPkNames = ['id', '_id', 'ID', 'pk', 'uuid', 'guid'];
    for (const name of commonPkNames) {
      const field = schema.fields.find(
        (f) => f.name === name || f.name.toLowerCase() === name.toLowerCase()
      );
      if (field) {
        return field;
      }
    }

    // Look by pattern
    const byPattern = schema.fields.find((f) =>
      PRIMARY_KEY_NAME_PATTERN.test(f.name)
    );
    if (byPattern) {
      return byPattern;
    }

    return null;
  }

  /**
   * Infer the relationship type (one-to-one, one-to-many, many-to-many)
   */
  private inferRelationshipType(
    field: SchemaField,
    candidate: RelationshipCandidate
  ): RelationshipType {
    // If the field is unique, it's likely one-to-one
    if (field.isUnique) {
      return 'one-to-one';
    }

    // Default to many-to-one (most common in APIs)
    // Note: from the source schema's perspective, multiple records
    // can reference the same target, making it "many-to-one"
    // We store it as "one-to-many" from target's perspective
    return 'one-to-many';
  }

  /**
   * Generate a unique relationship ID
   */
  private generateRelationshipId(
    sourceSchemaId: string,
    targetSchemaId: string,
    sourceField: string
  ): string {
    return `rel_${sourceSchemaId}_${targetSchemaId}_${sourceField}`;
  }

  /**
   * Generate a human-readable relationship name
   */
  private generateRelationshipName(
    sourceSchemaName: string,
    sourceField: string,
    targetSchemaName: string
  ): string {
    return `${sourceSchemaName}.${sourceField} -> ${targetSchemaName}`;
  }

  /**
   * Analyze all potential foreign keys in a schema
   */
  analyzeForeignKeys(schema: Schema): Array<{
    field: SchemaField;
    isPotentialFk: boolean;
    extractedEntityName: string;
  }> {
    return schema.fields.map((field) => ({
      field,
      isPotentialFk: this.isPotentialForeignKey(field),
      extractedEntityName: this.extractEntityName(field.name),
    }));
  }

  /**
   * Suggest possible target schemas based on field naming
   */
  suggestTargetSchemas(
    field: SchemaField,
    availableSchemas: Schema[]
  ): Array<{ schema: Schema; confidence: number }> {
    const entityName = this.extractEntityName(field.name);
    const suggestions: Array<{ schema: Schema; confidence: number }> = [];

    for (const schema of availableSchemas) {
      const schemaNameNorm = this.normalizeForComparison(schema.name);
      const entityNameNorm = this.normalizeForComparison(entityName);

      let confidence = 0;
      if (schemaNameNorm === entityNameNorm) {
        confidence = 0.9;
      } else if (schemaNameNorm.includes(entityNameNorm)) {
        confidence = 0.7;
      } else if (entityNameNorm.includes(schemaNameNorm)) {
        confidence = 0.5;
      }

      if (confidence > 0) {
        suggestions.push({ schema, confidence });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
