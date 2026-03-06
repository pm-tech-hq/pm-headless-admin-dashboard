// Response structure analysis

import { extractSamples, getNestedValue } from '../utils/sampling';

/**
 * Analysis of response structure
 */
export interface ResponseStructure {
  /** Whether the root is an array */
  isArray: boolean;
  /** Whether data is wrapped in an object */
  isWrapped: boolean;
  /** JSON path to the actual data array */
  dataPath: string | null;
  /** JSON path to metadata (pagination, etc.) */
  metaPaths: string[];
  /** Number of items in the data array */
  itemCount: number;
  /** Structure complexity */
  structure: 'flat' | 'nested' | 'deeply_nested';
  /** Maximum nesting depth */
  maxDepth: number;
}

/**
 * Nested field analysis
 */
export interface NestedFieldAnalysis {
  fieldName: string;
  path: string;
  type: 'object' | 'array';
  childFields: string[];
  depth: number;
}

/**
 * Analyzer for understanding response structure
 */
export class StructureAnalyzer {
  /**
   * Analyze the structure of response data
   */
  analyze(data: unknown): ResponseStructure {
    const extraction = extractSamples(data);

    // Calculate max depth
    const maxDepth = this.calculateMaxDepth(data);

    // Determine structure complexity
    let structure: 'flat' | 'nested' | 'deeply_nested';
    if (maxDepth <= 2) {
      structure = 'flat';
    } else if (maxDepth <= 4) {
      structure = 'nested';
    } else {
      structure = 'deeply_nested';
    }

    // Find meta paths (pagination, counts, etc.)
    const metaPaths = extraction.isWrapped
      ? this.findMetaPaths(data as Record<string, unknown>, extraction.dataPath)
      : [];

    return {
      isArray: extraction.originalStructure === 'array',
      isWrapped: extraction.isWrapped,
      dataPath: extraction.dataPath,
      metaPaths,
      itemCount: extraction.samples.length,
      structure,
      maxDepth,
    };
  }

  /**
   * Calculate maximum nesting depth of data
   */
  private calculateMaxDepth(data: unknown, currentDepth: number = 0): number {
    if (data === null || data === undefined) {
      return currentDepth;
    }

    if (typeof data !== 'object') {
      return currentDepth;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return currentDepth + 1;
      }
      // Check first item only for performance
      return this.calculateMaxDepth(data[0], currentDepth + 1);
    }

    // Object
    const obj = data as Record<string, unknown>;
    let maxChildDepth = currentDepth + 1;

    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        const childDepth = this.calculateMaxDepth(value, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    }

    return maxChildDepth;
  }

  /**
   * Find paths to metadata fields (pagination, totals, etc.)
   */
  private findMetaPaths(
    obj: Record<string, unknown>,
    dataPath: string | null,
    prefix: string = ''
  ): string[] {
    const metaPaths: string[] = [];
    const metaKeywords = [
      'total',
      'count',
      'page',
      'limit',
      'offset',
      'cursor',
      'next',
      'prev',
      'hasMore',
      'has_more',
      'meta',
      'pagination',
      'links',
    ];

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      // Skip the data path itself
      if (path === dataPath) {
        continue;
      }

      // Check if this is a meta-related key
      const isMetaKey = metaKeywords.some(
        (keyword) =>
          key.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(key.toLowerCase())
      );

      if (isMetaKey) {
        metaPaths.push(path);
      }

      // Recurse into nested objects (but not arrays)
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value as object).length < 20
      ) {
        metaPaths.push(
          ...this.findMetaPaths(value as Record<string, unknown>, dataPath, path)
        );
      }
    }

    return metaPaths;
  }

  /**
   * Analyze nested fields in a sample object
   */
  analyzeNestedFields(
    sample: Record<string, unknown>,
    parentPath: string = ''
  ): NestedFieldAnalysis[] {
    const nested: NestedFieldAnalysis[] = [];

    for (const [key, value] of Object.entries(sample)) {
      const path = parentPath ? `${parentPath}.${key}` : key;

      if (Array.isArray(value)) {
        // Get child fields from first array item
        const childFields: string[] = [];
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          childFields.push(...Object.keys(value[0] as object));
        }

        nested.push({
          fieldName: key,
          path,
          type: 'array',
          childFields,
          depth: parentPath.split('.').filter(Boolean).length + 1,
        });

        // Recurse into array item structure
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          nested.push(
            ...this.analyzeNestedFields(value[0] as Record<string, unknown>, path)
          );
        }
      } else if (value && typeof value === 'object') {
        const childFields = Object.keys(value as object);

        nested.push({
          fieldName: key,
          path,
          type: 'object',
          childFields,
          depth: parentPath.split('.').filter(Boolean).length + 1,
        });

        // Recurse into nested object
        nested.push(
          ...this.analyzeNestedFields(value as Record<string, unknown>, path)
        );
      }
    }

    return nested;
  }

  /**
   * Flatten nested object to dot-notation paths
   */
  flattenToPaths(
    obj: Record<string, unknown>,
    prefix: string = ''
  ): Map<string, unknown> {
    const paths = new Map<string, unknown>();

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        paths.set(path, value);
      } else if (Array.isArray(value)) {
        paths.set(path, value);
      } else if (typeof value === 'object') {
        // Add the object itself
        paths.set(path, value);
        // Also add flattened children
        const nested = this.flattenToPaths(value as Record<string, unknown>, path);
        for (const [nestedPath, nestedValue] of nested) {
          paths.set(nestedPath, nestedValue);
        }
      } else {
        paths.set(path, value);
      }
    }

    return paths;
  }

  /**
   * Get all leaf field paths (non-object, non-array fields)
   */
  getLeafPaths(obj: Record<string, unknown>, prefix: string = ''): string[] {
    const paths: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        paths.push(path);
      } else if (Array.isArray(value)) {
        // Arrays are treated as leaf nodes for field purposes
        paths.push(path);
      } else if (typeof value === 'object') {
        // Recurse into objects
        paths.push(...this.getLeafPaths(value as Record<string, unknown>, path));
      } else {
        paths.push(path);
      }
    }

    return paths;
  }

  /**
   * Determine if structure looks like a list response vs single item
   */
  isListResponse(data: unknown): {
    isList: boolean;
    confidence: number;
    reason: string;
  } {
    // Direct array
    if (Array.isArray(data)) {
      return {
        isList: true,
        confidence: 0.95,
        reason: 'Root is an array',
      };
    }

    if (typeof data !== 'object' || data === null) {
      return {
        isList: false,
        confidence: 0.95,
        reason: 'Not an object or array',
      };
    }

    const obj = data as Record<string, unknown>;

    // Check for wrapped array
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        // Check if the array contains objects (data items)
        if (typeof value[0] === 'object' && value[0] !== null) {
          return {
            isList: true,
            confidence: 0.9,
            reason: `Array found at '${key}'`,
          };
        }
      }
    }

    // Check for pagination indicators
    const hasPaginationKeys = Object.keys(obj).some((key) =>
      ['page', 'total', 'count', 'offset', 'limit', 'pagination'].includes(
        key.toLowerCase()
      )
    );

    if (hasPaginationKeys) {
      return {
        isList: true,
        confidence: 0.7,
        reason: 'Contains pagination metadata',
      };
    }

    // Likely a single item
    return {
      isList: false,
      confidence: 0.8,
      reason: 'No array or pagination indicators found',
    };
  }

  /**
   * Compare two response structures for compatibility
   */
  areStructuresCompatible(
    structure1: ResponseStructure,
    structure2: ResponseStructure
  ): { compatible: boolean; reason: string } {
    // Both should be arrays or both wrapped
    if (structure1.isArray !== structure2.isArray) {
      return {
        compatible: false,
        reason: 'Array/non-array mismatch',
      };
    }

    // Data paths should match
    if (structure1.dataPath !== structure2.dataPath) {
      return {
        compatible: false,
        reason: `Data path mismatch: '${structure1.dataPath}' vs '${structure2.dataPath}'`,
      };
    }

    return {
      compatible: true,
      reason: 'Structures match',
    };
  }
}
