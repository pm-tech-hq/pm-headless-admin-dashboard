// Validation constraint inference

import { TypeStatistics } from './TypeAnalyzer';

/**
 * Inferred validation constraints for a field
 */
export interface ValidationConstraints {
  isRequired: boolean;
  isNullable: boolean;
  isUnique: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

/**
 * Configuration for validation inference
 */
export interface ValidationAnalyzerConfig {
  /** Minimum samples needed to infer min/max constraints */
  minSamplesForRange: number;
  /** Whether to infer regex patterns */
  inferPatterns: boolean;
  /** Threshold for considering a field unique (percentage) */
  uniquenessThreshold: number;
}

const DEFAULT_CONFIG: ValidationAnalyzerConfig = {
  minSamplesForRange: 5,
  inferPatterns: true,
  uniquenessThreshold: 0.99,
};

/**
 * Analyzer for inferring validation constraints from sample data
 */
export class ValidationAnalyzer {
  private config: ValidationAnalyzerConfig;

  constructor(config: Partial<ValidationAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Infer validation constraints from field statistics
   */
  inferConstraints(
    fieldName: string,
    stats: TypeStatistics
  ): ValidationConstraints {
    const constraints: ValidationConstraints = {
      isRequired: this.inferRequired(stats),
      isNullable: this.inferNullable(stats),
      isUnique: this.inferUnique(stats),
    };

    // Infer string length constraints
    if (stats.stringLengths.length > 0) {
      const lengthConstraints = this.inferStringLengthConstraints(
        stats.stringLengths
      );
      if (lengthConstraints.minLength !== undefined) {
        constraints.minLength = lengthConstraints.minLength;
      }
      if (lengthConstraints.maxLength !== undefined) {
        constraints.maxLength = lengthConstraints.maxLength;
      }
    }

    // Infer numeric range constraints
    if (stats.numericValues.length > 0) {
      const rangeConstraints = this.inferNumericRangeConstraints(
        stats.numericValues
      );
      if (rangeConstraints.min !== undefined) {
        constraints.min = rangeConstraints.min;
      }
      if (rangeConstraints.max !== undefined) {
        constraints.max = rangeConstraints.max;
      }
    }

    // Infer pattern if enabled and we have a dominant pattern
    if (this.config.inferPatterns && stats.patterns.size > 0) {
      constraints.pattern = this.inferPattern(stats);
    }

    return constraints;
  }

  /**
   * Field is required if never null/undefined in samples
   */
  private inferRequired(stats: TypeStatistics): boolean {
    const missingCount = stats.nullCount + stats.undefinedCount;
    return missingCount === 0 && stats.totalCount > 0;
  }

  /**
   * Field is nullable if at least one null value present
   */
  private inferNullable(stats: TypeStatistics): boolean {
    return stats.nullCount > 0;
  }

  /**
   * Field is unique if all non-null values are distinct
   */
  private inferUnique(stats: TypeStatistics): boolean {
    const nonNullCount =
      stats.totalCount - stats.nullCount - stats.undefinedCount;

    // Can't determine uniqueness with < 2 values
    if (nonNullCount < 2) {
      return false;
    }

    const uniqueRatio = stats.uniqueValues.size / nonNullCount;
    return uniqueRatio >= this.config.uniquenessThreshold;
  }

  /**
   * Infer string length constraints from observed lengths
   */
  private inferStringLengthConstraints(lengths: number[]): {
    minLength?: number;
    maxLength?: number;
  } {
    if (lengths.length < this.config.minSamplesForRange) {
      return {};
    }

    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);

    const result: { minLength?: number; maxLength?: number } = {};

    // Only set minLength if it's consistently > 0
    if (minLength > 0) {
      result.minLength = minLength;
    }

    // Set maxLength if there's meaningful variance
    // (don't set if all strings are same length)
    if (maxLength > 0) {
      result.maxLength = maxLength;
    }

    return result;
  }

  /**
   * Infer numeric range constraints from observed values
   */
  private inferNumericRangeConstraints(values: number[]): {
    min?: number;
    max?: number;
  } {
    if (values.length < this.config.minSamplesForRange) {
      return {};
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    const result: { min?: number; max?: number } = {};

    // Set min if it looks like a meaningful constraint
    // (e.g., non-negative numbers)
    if (min >= 0) {
      result.min = min;
    }

    // Set max if there's a clear upper bound
    // Skip if max is very large (might just be current data, not a constraint)
    if (max < 1_000_000_000) {
      result.max = max;
    }

    return result;
  }

  /**
   * Infer regex pattern if consistent pattern detected
   */
  private inferPattern(stats: TypeStatistics): string | undefined {
    if (stats.patterns.size === 0) {
      return undefined;
    }

    // Find most common pattern
    let maxPattern = '';
    let maxCount = 0;

    for (const [pattern, count] of stats.patterns) {
      if (count > maxCount) {
        maxCount = count;
        maxPattern = pattern;
      }
    }

    // Only return pattern if it matches most values
    const totalWithPatterns = Array.from(stats.patterns.values()).reduce(
      (a, b) => a + b,
      0
    );
    const patternRatio = maxCount / totalWithPatterns;

    // Return the pattern name (not the actual regex)
    // The consumer can map this to the actual regex
    return patternRatio >= 0.8 ? maxPattern : undefined;
  }

  /**
   * Get validation suggestions based on field characteristics
   */
  getSuggestions(
    fieldName: string,
    stats: TypeStatistics,
    constraints: ValidationConstraints
  ): string[] {
    const suggestions: string[] = [];

    // Suggest required if mostly present but not 100%
    const presenceRatio =
      (stats.totalCount - stats.nullCount - stats.undefinedCount) /
      stats.totalCount;
    if (presenceRatio > 0.9 && presenceRatio < 1) {
      suggestions.push(
        `Consider marking '${fieldName}' as required (${(presenceRatio * 100).toFixed(1)}% present)`
      );
    }

    // Suggest uniqueness constraint if appears unique
    if (constraints.isUnique && !this.looksLikePrimaryKey(fieldName)) {
      suggestions.push(
        `'${fieldName}' appears to have unique values - consider adding unique constraint`
      );
    }

    // Suggest length constraint if consistent
    if (
      stats.stringLengths.length > 0 &&
      constraints.minLength === constraints.maxLength &&
      constraints.minLength !== undefined
    ) {
      suggestions.push(
        `'${fieldName}' has consistent length of ${constraints.minLength} - consider fixed-length validation`
      );
    }

    return suggestions;
  }

  /**
   * Check if field name suggests it's a primary key
   */
  private looksLikePrimaryKey(fieldName: string): boolean {
    return /^(id|_id|ID|pk|primary_key|uuid|guid)$/i.test(fieldName);
  }

  /**
   * Analyze a field completely and return constraints with confidence
   */
  analyzeField(
    fieldName: string,
    stats: TypeStatistics
  ): {
    constraints: ValidationConstraints;
    confidence: number;
    suggestions: string[];
  } {
    const constraints = this.inferConstraints(fieldName, stats);
    const suggestions = this.getSuggestions(fieldName, stats, constraints);

    // Calculate confidence based on sample size
    const sampleSizeConfidence = Math.min(
      1,
      stats.totalCount / this.config.minSamplesForRange
    );

    // Higher confidence if constraints are consistent
    const consistencyScore = this.calculateConsistencyScore(stats, constraints);

    const confidence = (sampleSizeConfidence + consistencyScore) / 2;

    return {
      constraints,
      confidence,
      suggestions,
    };
  }

  /**
   * Calculate how consistent the data is with inferred constraints
   */
  private calculateConsistencyScore(
    stats: TypeStatistics,
    constraints: ValidationConstraints
  ): number {
    let score = 1;
    let factors = 0;

    // Check string length consistency
    if (stats.stringLengths.length > 0) {
      const lengths = stats.stringLengths;
      const range = Math.max(...lengths) - Math.min(...lengths);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = range / (avg || 1);
      score += 1 - Math.min(1, variance);
      factors++;
    }

    // Check numeric value consistency
    if (stats.numericValues.length > 0) {
      const values = stats.numericValues;
      const range = Math.max(...values) - Math.min(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = range / (Math.abs(avg) || 1);
      score += 1 - Math.min(1, variance / 10); // More lenient for numbers
      factors++;
    }

    // Bonus for pattern consistency
    if (constraints.pattern && stats.patterns.size === 1) {
      score += 1;
      factors++;
    }

    return factors > 0 ? score / (factors + 1) : 0.5;
  }
}
