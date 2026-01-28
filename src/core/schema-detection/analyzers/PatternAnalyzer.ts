// Pattern-based string type detection

import { FieldType } from '@/types/schema';
import {
  EMAIL_PATTERN,
  URL_PATTERN,
  UUID_PATTERN,
  ISO_DATETIME_PATTERN,
  ISO_DATE_PATTERN,
  TIME_PATTERN,
  DATE_FORMAT_PATTERNS,
  OBJECT_ID_PATTERN,
} from '../utils/patterns';

/**
 * Result of pattern-based type detection
 */
export interface PatternDetectionResult {
  type: FieldType;
  confidence: number;
  pattern?: string;
  semanticHint?: string;
}

/**
 * Pattern analyzer for detecting semantic types from string values
 */
export class PatternAnalyzer {
  /**
   * Detect semantic type from a string value
   */
  detectStringType(value: string): PatternDetectionResult {
    // Empty string
    if (value.length === 0) {
      return { type: 'string', confidence: 0.8 };
    }

    // UUID - check first (most specific pattern)
    if (UUID_PATTERN.test(value)) {
      return {
        type: 'uuid',
        confidence: 0.95,
        pattern: 'uuid',
        semanticHint: 'Universally Unique Identifier',
      };
    }

    // MongoDB ObjectId
    if (OBJECT_ID_PATTERN.test(value) && value.length === 24) {
      return {
        type: 'uuid',
        confidence: 0.9,
        pattern: 'objectid',
        semanticHint: 'MongoDB ObjectId',
      };
    }

    // Email
    if (EMAIL_PATTERN.test(value)) {
      return {
        type: 'email',
        confidence: 0.95,
        pattern: 'email',
        semanticHint: 'Email address',
      };
    }

    // URL
    if (URL_PATTERN.test(value)) {
      return {
        type: 'url',
        confidence: 0.95,
        pattern: 'url',
        semanticHint: 'Web URL',
      };
    }

    // ISO DateTime (check before date)
    if (ISO_DATETIME_PATTERN.test(value)) {
      return {
        type: 'datetime',
        confidence: 0.95,
        pattern: 'iso-datetime',
        semanticHint: 'ISO 8601 DateTime',
      };
    }

    // ISO Date
    if (ISO_DATE_PATTERN.test(value)) {
      return {
        type: 'date',
        confidence: 0.95,
        pattern: 'iso-date',
        semanticHint: 'ISO 8601 Date',
      };
    }

    // Time (HH:MM:SS format)
    if (TIME_PATTERN.test(value)) {
      return {
        type: 'time',
        confidence: 0.85,
        pattern: 'time',
        semanticHint: 'Time value',
      };
    }

    // Common date formats
    for (const [formatName, pattern] of Object.entries(DATE_FORMAT_PATTERNS)) {
      if (pattern.test(value)) {
        return {
          type: 'date',
          confidence: 0.8,
          pattern: formatName,
          semanticHint: `Date (${formatName} format)`,
        };
      }
    }

    // Try to parse as JSON (object or array stored as string)
    if (this.looksLikeJson(value)) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            type: 'json',
            confidence: 0.9,
            pattern: 'json',
            semanticHint: 'JSON string',
          };
        }
      } catch {
        // Not valid JSON, continue
      }
    }

    // Default to string
    return { type: 'string', confidence: 1.0 };
  }

  /**
   * Quick check if string might be JSON (to avoid expensive parse)
   */
  private looksLikeJson(value: string): boolean {
    const trimmed = value.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }

  /**
   * Detect multiple patterns in a set of values
   * Returns the most common pattern found
   */
  analyzePatterns(values: string[]): {
    dominantPattern: string | null;
    patternCounts: Map<string, number>;
    confidence: number;
  } {
    const patternCounts = new Map<string, number>();
    let total = 0;

    for (const value of values) {
      if (typeof value === 'string' && value.length > 0) {
        const result = this.detectStringType(value);
        if (result.pattern) {
          patternCounts.set(
            result.pattern,
            (patternCounts.get(result.pattern) || 0) + 1
          );
        }
        total++;
      }
    }

    // Find dominant pattern
    let dominantPattern: string | null = null;
    let maxCount = 0;

    for (const [pattern, count] of patternCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantPattern = pattern;
      }
    }

    const confidence = total > 0 ? maxCount / total : 0;

    return {
      dominantPattern,
      patternCounts,
      confidence,
    };
  }

  /**
   * Check if a string value matches a specific pattern
   */
  matchesPattern(value: string, patternName: string): boolean {
    switch (patternName) {
      case 'email':
        return EMAIL_PATTERN.test(value);
      case 'url':
        return URL_PATTERN.test(value);
      case 'uuid':
        return UUID_PATTERN.test(value);
      case 'objectid':
        return OBJECT_ID_PATTERN.test(value);
      case 'iso-datetime':
        return ISO_DATETIME_PATTERN.test(value);
      case 'iso-date':
        return ISO_DATE_PATTERN.test(value);
      case 'time':
        return TIME_PATTERN.test(value);
      default:
        // Check date formats
        if (patternName in DATE_FORMAT_PATTERNS) {
          return DATE_FORMAT_PATTERNS[patternName as keyof typeof DATE_FORMAT_PATTERNS].test(value);
        }
        return false;
    }
  }
}
