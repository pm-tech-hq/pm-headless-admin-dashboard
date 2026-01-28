// Type detection and aggregation

import { FieldType } from '@/types/schema';
import { PatternAnalyzer, PatternDetectionResult } from './PatternAnalyzer';
import { calculateTypeConfidence } from '../utils/confidence';

/**
 * Type detection result for a single value
 */
export interface TypeDetection {
  type: FieldType;
  confidence: number;
  pattern?: string;
  semanticHint?: string;
}

/**
 * Statistics collected for a field across samples
 */
export interface TypeStatistics {
  typeCounts: Map<FieldType, number>;
  nullCount: number;
  undefinedCount: number;
  totalCount: number;
  uniqueValues: Set<unknown>;
  stringLengths: number[];
  numericValues: number[];
  patterns: Map<string, number>;
  sampleValues: unknown[];
}

/**
 * Aggregated type analysis result
 */
export interface AggregatedTypeResult {
  type: FieldType;
  confidence: number;
  isNullable: boolean;
  isRequired: boolean;
  statistics: TypeStatistics;
}

/**
 * Type analyzer for detecting and aggregating field types
 */
export class TypeAnalyzer {
  private patternAnalyzer: PatternAnalyzer;

  constructor(patternAnalyzer?: PatternAnalyzer) {
    this.patternAnalyzer = patternAnalyzer || new PatternAnalyzer();
  }

  /**
   * Detect the type of a single value
   */
  detectValueType(value: unknown): TypeDetection {
    // Handle null
    if (value === null) {
      return { type: 'unknown', confidence: 1.0, semanticHint: 'null value' };
    }

    // Handle undefined
    if (value === undefined) {
      return { type: 'unknown', confidence: 1.0, semanticHint: 'undefined value' };
    }

    // Boolean - exact check
    if (typeof value === 'boolean') {
      return { type: 'boolean', confidence: 1.0 };
    }

    // Number - distinguish integer from float
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return { type: 'number', confidence: 0.8, semanticHint: 'non-finite number' };
      }
      if (Number.isInteger(value)) {
        return { type: 'integer', confidence: 1.0 };
      }
      return { type: 'number', confidence: 1.0 };
    }

    // BigInt
    if (typeof value === 'bigint') {
      return { type: 'integer', confidence: 1.0, semanticHint: 'bigint' };
    }

    // String - delegate to PatternAnalyzer for semantic detection
    if (typeof value === 'string') {
      return this.patternAnalyzer.detectStringType(value);
    }

    // Array
    if (Array.isArray(value)) {
      return { type: 'array', confidence: 1.0 };
    }

    // Object (but not null or array)
    if (typeof value === 'object') {
      // Check for Date object
      if (value instanceof Date) {
        return { type: 'datetime', confidence: 1.0, semanticHint: 'Date object' };
      }
      return { type: 'object', confidence: 1.0 };
    }

    // Function or Symbol - unusual in data
    return { type: 'unknown', confidence: 0.5 };
  }

  /**
   * Collect statistics from an array of values
   */
  collectStatistics(values: unknown[], maxSamples: number = 50): TypeStatistics {
    const stats: TypeStatistics = {
      typeCounts: new Map(),
      nullCount: 0,
      undefinedCount: 0,
      totalCount: values.length,
      uniqueValues: new Set(),
      stringLengths: [],
      numericValues: [],
      patterns: new Map(),
      sampleValues: [],
    };

    for (const value of values) {
      // Track null/undefined separately
      if (value === null) {
        stats.nullCount++;
        continue;
      }
      if (value === undefined) {
        stats.undefinedCount++;
        continue;
      }

      // Detect type
      const detection = this.detectValueType(value);
      stats.typeCounts.set(
        detection.type,
        (stats.typeCounts.get(detection.type) || 0) + 1
      );

      // Track pattern if present
      if (detection.pattern) {
        stats.patterns.set(
          detection.pattern,
          (stats.patterns.get(detection.pattern) || 0) + 1
        );
      }

      // Track unique values (for primitive types only)
      if (typeof value !== 'object' || value === null) {
        stats.uniqueValues.add(value);
      } else {
        // For objects, use JSON string as key (limited to small objects)
        try {
          const json = JSON.stringify(value);
          if (json.length < 500) {
            stats.uniqueValues.add(json);
          }
        } catch {
          // Circular reference or other issue - skip uniqueness tracking
        }
      }

      // Track string lengths
      if (typeof value === 'string') {
        stats.stringLengths.push(value.length);
      }

      // Track numeric values
      if (typeof value === 'number' && Number.isFinite(value)) {
        stats.numericValues.push(value);
      }

      // Collect sample values
      if (stats.sampleValues.length < maxSamples) {
        stats.sampleValues.push(value);
      }
    }

    return stats;
  }

  /**
   * Aggregate type detections to find the dominant type
   */
  aggregateTypes(stats: TypeStatistics): AggregatedTypeResult {
    const nonNullCount = stats.totalCount - stats.nullCount - stats.undefinedCount;

    // Handle all null/undefined case
    if (nonNullCount === 0) {
      return {
        type: 'unknown',
        confidence: 0,
        isNullable: stats.nullCount > 0,
        isRequired: false,
        statistics: stats,
      };
    }

    // Find dominant type
    let dominantType: FieldType = 'unknown';
    let maxCount = 0;

    for (const [type, count] of stats.typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }

    // Handle integer/number ambiguity
    // If we have both integers and floats, use 'number'
    if (dominantType === 'integer' && stats.typeCounts.has('number')) {
      const numberCount = stats.typeCounts.get('number') || 0;
      if (numberCount > 0) {
        dominantType = 'number';
        maxCount = (stats.typeCounts.get('integer') || 0) + numberCount;
      }
    }

    // Calculate confidence
    const confidence = calculateTypeConfidence(maxCount, nonNullCount);

    return {
      type: dominantType,
      confidence,
      isNullable: stats.nullCount > 0,
      isRequired: stats.nullCount === 0 && stats.undefinedCount === 0,
      statistics: stats,
    };
  }

  /**
   * Analyze a field's values and return the detected type with statistics
   */
  analyzeField(
    fieldName: string,
    values: unknown[]
  ): AggregatedTypeResult & { fieldName: string } {
    const stats = this.collectStatistics(values);
    const result = this.aggregateTypes(stats);
    return {
      ...result,
      fieldName,
    };
  }

  /**
   * Detect the item type for an array field
   */
  detectArrayItemType(arrays: unknown[][]): FieldType {
    const itemTypes = new Map<FieldType, number>();

    for (const arr of arrays) {
      for (const item of arr) {
        const detection = this.detectValueType(item);
        itemTypes.set(detection.type, (itemTypes.get(detection.type) || 0) + 1);
      }
    }

    // Find dominant type
    let dominantType: FieldType = 'unknown';
    let maxCount = 0;

    for (const [type, count] of itemTypes) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }

    return dominantType;
  }

  /**
   * Check if values suggest this is an ID field
   */
  isLikelyIdField(
    fieldName: string,
    stats: TypeStatistics
  ): { isId: boolean; confidence: number } {
    // Check field name
    const nameLooksLikeId = /^(id|_id|ID|pk|uuid|guid|key)$/i.test(fieldName);
    const nameEndsWithId = /(_id|Id|ID)$/.test(fieldName);

    // Check if all values are unique
    const nonNullCount = stats.totalCount - stats.nullCount - stats.undefinedCount;
    const isUnique = stats.uniqueValues.size === nonNullCount && nonNullCount > 1;

    // Check if type is appropriate for ID
    const appropriateType =
      stats.typeCounts.has('integer') ||
      stats.typeCounts.has('uuid') ||
      stats.typeCounts.has('string');

    let confidence = 0;

    if (nameLooksLikeId) {
      confidence += 0.5;
    } else if (nameEndsWithId) {
      confidence += 0.3;
    }

    if (isUnique) {
      confidence += 0.3;
    }

    if (appropriateType) {
      confidence += 0.2;
    }

    return {
      isId: confidence >= 0.5,
      confidence: Math.min(confidence, 0.95),
    };
  }
}
