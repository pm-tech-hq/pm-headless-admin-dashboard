// Enum field detection

import { calculateEnumConfidence } from '../utils/confidence';

/**
 * Result of enum analysis
 */
export interface EnumAnalysisResult {
  isEnum: boolean;
  values: string[];
  confidence: number;
  reason: string;
}

/**
 * Configuration for enum detection
 */
export interface EnumAnalyzerConfig {
  /** Maximum number of unique values to consider as enum */
  maxEnumValues: number;
  /** Minimum number of samples required for detection */
  minSampleSize: number;
  /** Minimum ratio of repeating values (0-1) */
  minRepeatRatio: number;
  /** Maximum average string length for enum values */
  maxAverageLength: number;
}

const DEFAULT_CONFIG: EnumAnalyzerConfig = {
  maxEnumValues: 20,
  minSampleSize: 5,
  minRepeatRatio: 0.3,
  maxAverageLength: 50,
};

/**
 * Analyzer for detecting if a string field should be treated as an enum
 */
export class EnumAnalyzer {
  private config: EnumAnalyzerConfig;

  constructor(config: Partial<EnumAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze if a field should be treated as an enum
   */
  analyzeForEnum(values: unknown[]): EnumAnalysisResult {
    // Filter to non-null string values
    const stringValues = values.filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    );

    // Not enough samples
    if (stringValues.length < this.config.minSampleSize) {
      return {
        isEnum: false,
        values: [],
        confidence: 0,
        reason: `Insufficient samples: ${stringValues.length} < ${this.config.minSampleSize}`,
      };
    }

    // Count unique values
    const valueCounts = new Map<string, number>();
    let totalLength = 0;

    for (const value of stringValues) {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      totalLength += value.length;
    }

    const uniqueCount = valueCounts.size;
    const averageLength = totalLength / stringValues.length;

    // Too many unique values - not an enum
    if (uniqueCount > this.config.maxEnumValues) {
      return {
        isEnum: false,
        values: [],
        confidence: 0,
        reason: `Too many unique values: ${uniqueCount} > ${this.config.maxEnumValues}`,
      };
    }

    // All values are unique - likely IDs or names, not enum
    if (uniqueCount === stringValues.length && uniqueCount > 3) {
      return {
        isEnum: false,
        values: [],
        confidence: 0,
        reason: 'All values are unique - likely identifiers, not enum',
      };
    }

    // Average string length too long - likely descriptions, not enum
    if (averageLength > this.config.maxAverageLength) {
      return {
        isEnum: false,
        values: [],
        confidence: 0,
        reason: `Average string length too long: ${averageLength.toFixed(1)} > ${this.config.maxAverageLength}`,
      };
    }

    // Calculate repeat ratio (values that appear more than once)
    const repeatedCount = Array.from(valueCounts.values()).filter(
      (count) => count > 1
    ).length;
    const repeatRatio = repeatedCount / uniqueCount;

    // Not enough repeating values
    if (repeatRatio < this.config.minRepeatRatio && uniqueCount > 5) {
      return {
        isEnum: false,
        values: [],
        confidence: 0.3,
        reason: `Low repeat ratio: ${(repeatRatio * 100).toFixed(1)}% < ${this.config.minRepeatRatio * 100}%`,
      };
    }

    // Calculate confidence
    const confidence = calculateEnumConfidence(
      uniqueCount,
      stringValues.length,
      this.config.maxEnumValues,
      repeatRatio
    );

    // Sort enum values alphabetically
    const enumValues = Array.from(valueCounts.keys()).sort();

    // Determine if it's an enum based on confidence threshold
    const isEnum = confidence > 0.5;

    return {
      isEnum,
      values: isEnum ? enumValues : [],
      confidence,
      reason: isEnum
        ? `Detected ${uniqueCount} unique values with ${(repeatRatio * 100).toFixed(1)}% repeat ratio`
        : `Confidence too low: ${(confidence * 100).toFixed(1)}%`,
    };
  }

  /**
   * Check if values look like a boolean represented as strings
   */
  isBooleanLike(values: unknown[]): {
    isBooleanLike: boolean;
    trueValue?: string;
    falseValue?: string;
  } {
    const stringValues = values.filter(
      (v): v is string => typeof v === 'string'
    );

    const uniqueValues = new Set(stringValues.map((v) => v.toLowerCase()));

    // Check for common boolean string patterns
    const booleanPairs: Array<[string, string]> = [
      ['true', 'false'],
      ['yes', 'no'],
      ['y', 'n'],
      ['1', '0'],
      ['on', 'off'],
      ['active', 'inactive'],
      ['enabled', 'disabled'],
    ];

    for (const [trueVal, falseVal] of booleanPairs) {
      if (
        uniqueValues.size <= 2 &&
        (uniqueValues.has(trueVal) || uniqueValues.has(falseVal))
      ) {
        // Find the actual case used in data
        const actualTrue = stringValues.find(
          (v) => v.toLowerCase() === trueVal
        );
        const actualFalse = stringValues.find(
          (v) => v.toLowerCase() === falseVal
        );

        return {
          isBooleanLike: true,
          trueValue: actualTrue,
          falseValue: actualFalse,
        };
      }
    }

    return { isBooleanLike: false };
  }

  /**
   * Suggest enum values based on partial data
   * Useful for suggesting possible missing values
   */
  suggestPossibleValues(
    detectedValues: string[]
  ): string[] {
    const suggestions: string[] = [];
    const lowercaseValues = detectedValues.map((v) => v.toLowerCase());

    // Status-like patterns
    const statusPatterns = [
      ['pending', 'active', 'completed', 'cancelled', 'archived'],
      ['draft', 'published', 'archived'],
      ['open', 'in_progress', 'closed'],
      ['new', 'processing', 'shipped', 'delivered'],
    ];

    for (const pattern of statusPatterns) {
      const matches = pattern.filter((p) =>
        lowercaseValues.some(
          (v) => v.includes(p) || p.includes(v)
        )
      );

      if (matches.length >= 2) {
        // Suggest missing values from this pattern
        for (const p of pattern) {
          if (!lowercaseValues.some((v) => v.includes(p))) {
            suggestions.push(p);
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Get statistics about enum value distribution
   */
  getValueDistribution(values: unknown[]): Map<string, { count: number; percentage: number }> {
    const stringValues = values.filter(
      (v): v is string => typeof v === 'string'
    );

    const counts = new Map<string, number>();
    for (const value of stringValues) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    const total = stringValues.length;
    const distribution = new Map<string, { count: number; percentage: number }>();

    for (const [value, count] of counts) {
      distribution.set(value, {
        count,
        percentage: total > 0 ? count / total : 0,
      });
    }

    return distribution;
  }
}
