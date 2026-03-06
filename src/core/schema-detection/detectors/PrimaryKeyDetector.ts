// Primary key field detection

import { FieldType } from '@/types/schema';
import { PRIMARY_KEY_NAME_PATTERN } from '../utils/patterns';
import { TypeStatistics } from '../analyzers/TypeAnalyzer';

/**
 * Primary key detection result
 */
export interface PrimaryKeyDetectionResult {
  fieldName: string | null;
  confidence: number;
  reason: string;
}

/**
 * Field analysis for primary key detection
 */
export interface FieldPkAnalysis {
  fieldName: string;
  type: FieldType;
  isUnique: boolean;
  statistics: TypeStatistics;
}

/**
 * Detector for identifying primary key fields
 */
export class PrimaryKeyDetector {
  // Field name patterns that suggest primary key
  private readonly pkNamePatterns = [
    /^id$/i,
    /^_id$/i,
    /^pk$/i,
    /^primary_key$/i,
    /^uuid$/i,
    /^guid$/i,
    /^key$/i,
  ];

  // Types that are commonly used for primary keys
  private readonly pkTypes: FieldType[] = ['integer', 'uuid', 'string'];

  /**
   * Detect the primary key field from a set of field analyses
   */
  detect(fields: FieldPkAnalysis[]): PrimaryKeyDetectionResult {
    if (fields.length === 0) {
      return {
        fieldName: null,
        confidence: 0,
        reason: 'No fields to analyze',
      };
    }

    // Score each field
    const scores: Array<{ field: FieldPkAnalysis; score: number; reasons: string[] }> = [];

    for (const field of fields) {
      const { score, reasons } = this.scoreField(field);
      scores.push({ field, score, reasons });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Best candidate
    const best = scores[0];

    if (best.score < 0.3) {
      return {
        fieldName: null,
        confidence: 0,
        reason: 'No field with sufficient primary key characteristics',
      };
    }

    return {
      fieldName: best.field.fieldName,
      confidence: Math.min(best.score, 0.95),
      reason: best.reasons.join('; '),
    };
  }

  /**
   * Score a field for primary key likelihood
   */
  private scoreField(field: FieldPkAnalysis): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Check field name
    const nameScore = this.scoreFieldName(field.fieldName);
    if (nameScore > 0) {
      score += nameScore;
      reasons.push(`Field name '${field.fieldName}' matches PK pattern`);
    }

    // Check if field is unique
    if (field.isUnique) {
      score += 0.3;
      reasons.push('All values are unique');
    }

    // Check type
    if (this.pkTypes.includes(field.type)) {
      score += 0.2;
      reasons.push(`Type '${field.type}' is suitable for PK`);
    }

    // UUID type is strong indicator
    if (field.type === 'uuid') {
      score += 0.2;
      reasons.push('UUID type strongly suggests PK');
    }

    // Check if it's the first field (often PKs are first)
    // This would need to be passed in from caller

    // Integer IDs are often sequential (would need value analysis)
    if (field.type === 'integer' && this.looksSequential(field.statistics)) {
      score += 0.1;
      reasons.push('Integer values appear sequential');
    }

    // Required field (no nulls)
    const nullRatio =
      (field.statistics.nullCount + field.statistics.undefinedCount) /
      field.statistics.totalCount;
    if (nullRatio === 0) {
      score += 0.1;
      reasons.push('Field is never null');
    }

    return { score, reasons };
  }

  /**
   * Score field name for primary key likelihood
   */
  private scoreFieldName(fieldName: string): number {
    // Exact match with common PK names
    if (PRIMARY_KEY_NAME_PATTERN.test(fieldName)) {
      return 0.5;
    }

    // Check specific patterns
    for (const pattern of this.pkNamePatterns) {
      if (pattern.test(fieldName)) {
        return 0.5;
      }
    }

    // Ends with 'id' or 'Id' but is the entity's own id
    // (e.g., 'userId' on a User entity is the PK)
    // This requires context we don't have, so lower score
    if (/^[a-z]+Id$/i.test(fieldName) && fieldName.length <= 10) {
      return 0.2;
    }

    return 0;
  }

  /**
   * Check if integer values look sequential (auto-increment)
   */
  private looksSequential(stats: TypeStatistics): boolean {
    if (stats.numericValues.length < 3) {
      return false;
    }

    const sorted = [...stats.numericValues].sort((a, b) => a - b);

    // Check if values are roughly sequential
    let sequentialCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i] - sorted[i - 1];
      // Allow gaps up to 10 (some IDs might be missing)
      if (diff >= 1 && diff <= 10) {
        sequentialCount++;
      }
    }

    const sequentialRatio = sequentialCount / (sorted.length - 1);
    return sequentialRatio > 0.7;
  }

  /**
   * Check if a specific field is the primary key
   */
  isPrimaryKey(
    fieldName: string,
    type: FieldType,
    isUnique: boolean
  ): { isPk: boolean; confidence: number } {
    let confidence = 0;

    // Strong name match
    if (PRIMARY_KEY_NAME_PATTERN.test(fieldName)) {
      confidence += 0.5;
    }

    // Unique values
    if (isUnique) {
      confidence += 0.3;
    }

    // Appropriate type
    if (this.pkTypes.includes(type)) {
      confidence += 0.2;
    }

    return {
      isPk: confidence >= 0.5,
      confidence: Math.min(confidence, 0.95),
    };
  }
}
