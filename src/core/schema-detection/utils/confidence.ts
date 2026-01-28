// Confidence score calculation utilities

/**
 * Calculate confidence score based on type consistency across samples
 * @param matchCount - Number of samples matching the dominant type
 * @param totalCount - Total number of non-null samples
 * @returns Confidence score between 0 and 1
 */
export function calculateTypeConfidence(
  matchCount: number,
  totalCount: number
): number {
  if (totalCount === 0) {
    return 0;
  }

  // Base confidence is the ratio of matches
  const baseConfidence = matchCount / totalCount;

  // Apply sample size factor - more samples = more confident
  const sampleFactor = Math.min(1, Math.log10(totalCount + 1) / 2);

  // Combine base confidence with sample factor
  // Weight: 80% base confidence, 20% sample size bonus
  return Math.min(0.99, baseConfidence * 0.8 + baseConfidence * sampleFactor * 0.2);
}

/**
 * Calculate weighted average of multiple confidence scores
 */
export function weightedAverage(
  values: Array<{ value: number; weight: number }>
): number {
  if (values.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const { value, weight } of values) {
    weightedSum += value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Combine multiple confidence scores using geometric mean
 * Useful when all factors must be reasonably confident
 */
export function geometricMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  // Filter out zeros to avoid zero product
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length === 0) {
    return 0;
  }

  const product = nonZero.reduce((acc, val) => acc * val, 1);
  return Math.pow(product, 1 / nonZero.length);
}

/**
 * Calculate confidence for enum detection based on value distribution
 * @param uniqueCount - Number of unique values
 * @param totalCount - Total number of samples
 * @param maxEnumValues - Maximum allowed unique values for enum
 * @param repeatRatio - Ratio of values that appear more than once
 */
export function calculateEnumConfidence(
  uniqueCount: number,
  totalCount: number,
  maxEnumValues: number = 20,
  repeatRatio: number = 0
): number {
  if (uniqueCount === 0 || totalCount === 0) {
    return 0;
  }

  // Uniqueness score: fewer unique values = higher confidence
  const uniquenessScore = 1 - uniqueCount / maxEnumValues;

  // Repeat score: more repeats = higher confidence
  const repeatScore = repeatRatio;

  // Sample size confidence: more samples = more reliable
  const sampleConfidence = Math.min(1, totalCount / 10);

  // Combined score with weights
  const combined =
    uniquenessScore * 0.3 +
    repeatScore * 0.5 +
    sampleConfidence * 0.2;

  return Math.min(0.95, Math.max(0, combined));
}

/**
 * Calculate confidence for relationship detection
 * @param nameMatchScore - How well field name matches target schema (0-1)
 * @param typeMatchScore - How well field type matches expected FK type (0-1)
 * @param valueMatchScore - How many values exist in target schema (0-1)
 */
export function calculateRelationshipConfidence(
  nameMatchScore: number,
  typeMatchScore: number,
  valueMatchScore: number = 0
): number {
  // Name match is most important
  const weights = {
    name: 0.5,
    type: 0.3,
    value: 0.2,
  };

  const score =
    nameMatchScore * weights.name +
    typeMatchScore * weights.type +
    valueMatchScore * weights.value;

  return Math.min(0.95, score);
}

/**
 * Calculate confidence for pagination detection
 * @param indicators - Number of positive indicators found
 * @param maxIndicators - Maximum possible indicators
 */
export function calculatePaginationConfidence(
  indicators: number,
  maxIndicators: number
): number {
  if (maxIndicators === 0) {
    return 0;
  }

  const ratio = indicators / maxIndicators;

  // Apply threshold: need at least 2 indicators for reasonable confidence
  if (indicators < 2) {
    return ratio * 0.5;
  }

  return Math.min(0.95, 0.5 + ratio * 0.45);
}

/**
 * Adjust confidence based on sample size
 * Small samples should reduce confidence
 */
export function adjustForSampleSize(
  confidence: number,
  sampleSize: number,
  minSamplesForFullConfidence: number = 20
): number {
  if (sampleSize >= minSamplesForFullConfidence) {
    return confidence;
  }

  // Linear reduction for small samples
  const factor = sampleSize / minSamplesForFullConfidence;
  return confidence * (0.5 + factor * 0.5);
}

/**
 * Confidence level categories
 */
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

/**
 * Get human-readable confidence level
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) return 'very_high';
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'medium';
  if (confidence >= 0.25) return 'low';
  return 'very_low';
}

/**
 * Format confidence as percentage string
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
