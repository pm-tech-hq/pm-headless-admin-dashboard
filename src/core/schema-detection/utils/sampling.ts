// Sample extraction and manipulation utilities

import { DATA_PATH_NAMES } from './patterns';

/**
 * Result of sample extraction
 */
export interface SampleExtractionResult {
  samples: unknown[];
  dataPath: string | null;
  isWrapped: boolean;
  originalStructure: 'array' | 'object' | 'primitive';
}

/**
 * Extract data samples from various response structures
 * Handles:
 * - Direct arrays: [{ ... }, { ... }]
 * - Wrapped arrays: { data: [{ ... }] }
 * - Single objects: { id: 1, name: 'test' }
 */
export function extractSamples(
  data: unknown,
  maxSamples: number = 100
): SampleExtractionResult {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return {
      samples: [],
      dataPath: null,
      isWrapped: false,
      originalStructure: 'primitive',
    };
  }

  // Direct array
  if (Array.isArray(data)) {
    const samples = data.slice(0, maxSamples);
    return {
      samples,
      dataPath: null,
      isWrapped: false,
      originalStructure: 'array',
    };
  }

  // Object - check for wrapped data
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Try common data path names
    for (const pathName of DATA_PATH_NAMES) {
      const value = getNestedValue(obj, pathName);
      if (Array.isArray(value) && value.length > 0) {
        return {
          samples: value.slice(0, maxSamples),
          dataPath: pathName,
          isWrapped: true,
          originalStructure: 'object',
        };
      }
    }

    // Check all keys for arrays
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (Array.isArray(value) && value.length > 0) {
        // Verify it looks like data (array of objects)
        if (typeof value[0] === 'object' && value[0] !== null) {
          return {
            samples: value.slice(0, maxSamples),
            dataPath: key,
            isWrapped: true,
            originalStructure: 'object',
          };
        }
      }
    }

    // Single object - treat as single sample
    return {
      samples: [obj],
      dataPath: null,
      isWrapped: false,
      originalStructure: 'object',
    };
  }

  // Primitive value
  return {
    samples: [data],
    dataPath: null,
    isWrapped: false,
    originalStructure: 'primitive',
  };
}

/**
 * Get nested value from object using dot notation path
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Set nested value in object using dot notation path
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Merge two sample arrays, removing duplicates by comparing JSON representation
 * Useful for incremental schema detection
 */
export function mergeSamples(
  existingSamples: unknown[],
  newSamples: unknown[],
  maxSamples: number = 100
): unknown[] {
  const seen = new Set<string>();
  const result: unknown[] = [];

  // Add existing samples first
  for (const sample of existingSamples) {
    const key = JSON.stringify(sample);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(sample);
    }
    if (result.length >= maxSamples) {
      return result;
    }
  }

  // Add new samples
  for (const sample of newSamples) {
    const key = JSON.stringify(sample);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(sample);
    }
    if (result.length >= maxSamples) {
      return result;
    }
  }

  return result;
}

/**
 * Get all field values from an array of objects for a specific field
 */
export function extractFieldValues(
  samples: unknown[],
  fieldName: string
): unknown[] {
  const values: unknown[] = [];

  for (const sample of samples) {
    if (sample && typeof sample === 'object') {
      const obj = sample as Record<string, unknown>;
      if (fieldName in obj) {
        values.push(obj[fieldName]);
      } else {
        // Handle nested fields
        const nestedValue = getNestedValue(obj, fieldName);
        if (nestedValue !== undefined) {
          values.push(nestedValue);
        }
      }
    }
  }

  return values;
}

/**
 * Get all unique field names from an array of objects
 */
export function extractFieldNames(samples: unknown[]): string[] {
  const fieldSet = new Set<string>();

  for (const sample of samples) {
    if (sample && typeof sample === 'object' && !Array.isArray(sample)) {
      const obj = sample as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        fieldSet.add(key);
      }
    }
  }

  return Array.from(fieldSet).sort();
}

/**
 * Count how many samples have a specific field
 */
export function countFieldPresence(
  samples: unknown[],
  fieldName: string
): { present: number; total: number; percentage: number } {
  let present = 0;
  const total = samples.length;

  for (const sample of samples) {
    if (sample && typeof sample === 'object') {
      const obj = sample as Record<string, unknown>;
      if (fieldName in obj && obj[fieldName] !== undefined) {
        present++;
      }
    }
  }

  return {
    present,
    total,
    percentage: total > 0 ? present / total : 0,
  };
}

/**
 * Sample a subset of items evenly distributed across the array
 */
export function evenSample<T>(items: T[], sampleSize: number): T[] {
  if (items.length <= sampleSize) {
    return [...items];
  }

  const result: T[] = [];
  const step = items.length / sampleSize;

  for (let i = 0; i < sampleSize; i++) {
    const index = Math.floor(i * step);
    result.push(items[index]);
  }

  return result;
}

/**
 * Get random samples from an array
 */
export function randomSample<T>(items: T[], sampleSize: number): T[] {
  if (items.length <= sampleSize) {
    return [...items];
  }

  const shuffled = [...items];
  // Fisher-Yates shuffle (partial)
  for (let i = shuffled.length - 1; i > shuffled.length - sampleSize - 1 && i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(-sampleSize);
}
