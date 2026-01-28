// Pagination pattern detection

import { PaginationAnalysis } from '@/types/schema';
import {
  PAGINATION_PARAMS,
  DATA_PATH_NAMES,
  TOTAL_PATH_NAMES,
  HAS_MORE_PATH_NAMES,
  CURSOR_PATH_NAMES,
} from '../utils/patterns';
import { getNestedValue } from '../utils/sampling';
import { calculatePaginationConfidence } from '../utils/confidence';

/**
 * Hints gathered during pagination detection
 */
export interface PaginationHints {
  hasOffsetParams: boolean;
  hasPageParams: boolean;
  hasLimitParams: boolean;
  hasCursorInResponse: boolean;
  hasNextLink: boolean;
  hasTotalCount: boolean;
  hasMoreIndicator: boolean;
  potentialDataPaths: string[];
  potentialTotalPaths: string[];
  potentialCursorPaths: string[];
  potentialHasMorePaths: string[];
}

/**
 * Detector for pagination patterns in API responses
 */
export class PaginationDetector {
  /**
   * Detect pagination pattern from response data
   */
  detect(
    response: unknown,
    requestParams?: Record<string, unknown>,
    responseHeaders?: Record<string, string>
  ): PaginationAnalysis {
    // Gather hints from various sources
    const hints = this.gatherHints(response, requestParams, responseHeaders);

    // No indicators at all
    const totalIndicators =
      (hints.hasOffsetParams ? 1 : 0) +
      (hints.hasPageParams ? 1 : 0) +
      (hints.hasCursorInResponse ? 1 : 0) +
      (hints.hasNextLink ? 1 : 0) +
      (hints.hasTotalCount ? 1 : 0) +
      (hints.hasMoreIndicator ? 1 : 0);

    if (totalIndicators === 0 && hints.potentialDataPaths.length === 0) {
      return {
        detected: false,
        type: 'none',
        confidence: 0.9,
      };
    }

    // Determine pagination type based on hints
    if (hints.hasCursorInResponse || this.hasCursorParam(requestParams)) {
      return this.buildCursorPagination(hints);
    }

    if (hints.hasPageParams) {
      return this.buildPagePagination(hints);
    }

    if (hints.hasOffsetParams) {
      return this.buildOffsetPagination(hints);
    }

    // Check if response looks paginated even without explicit params
    if (this.looksLikePaginatedResponse(response, hints)) {
      return this.inferPaginationType(hints);
    }

    return {
      detected: false,
      type: 'none',
      confidence: 0.7,
    };
  }

  /**
   * Gather all hints about pagination from available sources
   */
  private gatherHints(
    response: unknown,
    requestParams?: Record<string, unknown>,
    headers?: Record<string, string>
  ): PaginationHints {
    return {
      hasOffsetParams: this.hasParamsMatching(requestParams, PAGINATION_PARAMS.offset),
      hasPageParams: this.hasParamsMatching(requestParams, PAGINATION_PARAMS.page),
      hasLimitParams: this.hasParamsMatching(requestParams, PAGINATION_PARAMS.limit),
      hasCursorInResponse: this.hasPathsInResponse(response, CURSOR_PATH_NAMES as unknown as string[]),
      hasNextLink: this.hasLinkHeader(headers) || this.hasNextInResponse(response),
      hasTotalCount: this.hasPathsInResponse(response, TOTAL_PATH_NAMES as unknown as string[]),
      hasMoreIndicator: this.hasPathsInResponse(response, HAS_MORE_PATH_NAMES as unknown as string[]),
      potentialDataPaths: this.findDataPaths(response),
      potentialTotalPaths: this.findMatchingPaths(response, TOTAL_PATH_NAMES as unknown as string[]),
      potentialCursorPaths: this.findMatchingPaths(response, CURSOR_PATH_NAMES as unknown as string[]),
      potentialHasMorePaths: this.findMatchingPaths(response, HAS_MORE_PATH_NAMES as unknown as string[]),
    };
  }

  /**
   * Check if request params contain cursor-related parameters
   */
  private hasCursorParam(params?: Record<string, unknown>): boolean {
    if (!params) return false;
    return PAGINATION_PARAMS.cursor.some(
      (name) => name in params || name.toLowerCase() in params
    );
  }

  /**
   * Check if params contain any of the specified parameter names
   */
  private hasParamsMatching(
    params: Record<string, unknown> | undefined,
    names: readonly string[]
  ): boolean {
    if (!params) return false;
    const paramKeys = Object.keys(params).map((k) => k.toLowerCase());
    return names.some((name) => paramKeys.includes(name.toLowerCase()));
  }

  /**
   * Check if response contains any of the specified paths
   */
  private hasPathsInResponse(
    response: unknown,
    paths: string[]
  ): boolean {
    if (!response || typeof response !== 'object') return false;

    for (const path of paths) {
      const value = getNestedValue(response, path);
      if (value !== undefined) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for Link header (RFC 5988)
   */
  private hasLinkHeader(headers?: Record<string, string>): boolean {
    if (!headers) return false;
    const linkHeader = headers['link'] || headers['Link'];
    return !!linkHeader && linkHeader.includes('rel=');
  }

  /**
   * Check for 'next' link in response body
   */
  private hasNextInResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') return false;

    const obj = response as Record<string, unknown>;

    // Check common locations
    const nextPaths = ['links.next', 'next', 'nextPage', 'next_page', '_links.next'];
    for (const path of nextPaths) {
      const value = getNestedValue(obj, path);
      if (value !== undefined && value !== null) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find paths that contain array data (likely the main data array)
   */
  private findDataPaths(response: unknown, prefix: string = ''): string[] {
    const paths: string[] = [];

    if (Array.isArray(response)) {
      if (prefix === '') return ['']; // Root is array
      return [prefix];
    }

    if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;

      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const newPath = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value) && value.length > 0) {
          // Check if this is a data array (contains objects)
          if (typeof value[0] === 'object' && value[0] !== null) {
            paths.push(newPath);
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recurse into nested objects (limit depth)
          if (newPath.split('.').length < 3) {
            paths.push(...this.findDataPaths(value, newPath));
          }
        }
      }
    }

    // Prioritize common data path names
    return paths.sort((a, b) => {
      const aIsCommon = DATA_PATH_NAMES.includes(a as (typeof DATA_PATH_NAMES)[number]);
      const bIsCommon = DATA_PATH_NAMES.includes(b as (typeof DATA_PATH_NAMES)[number]);
      if (aIsCommon && !bIsCommon) return -1;
      if (!aIsCommon && bIsCommon) return 1;
      return 0;
    });
  }

  /**
   * Find paths in response that match any of the given names
   */
  private findMatchingPaths(
    response: unknown,
    names: string[],
    prefix: string = ''
  ): string[] {
    const paths: string[] = [];

    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return paths;
    }

    const obj = response as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const fullPath = path.toLowerCase();
      const keyLower = key.toLowerCase();

      // Check if this key matches any target name
      const matches = names.some((name) => {
        const nameLower = name.toLowerCase();
        return keyLower === nameLower || fullPath === nameLower;
      });

      if (matches && value !== undefined && value !== null) {
        paths.push(path);
      }

      // Recurse into nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (path.split('.').length < 3) {
          paths.push(...this.findMatchingPaths(value, names, path));
        }
      }
    }

    return paths;
  }

  /**
   * Check if response structure suggests pagination
   */
  private looksLikePaginatedResponse(
    response: unknown,
    hints: PaginationHints
  ): boolean {
    // Has a data path and some metadata
    if (hints.potentialDataPaths.length > 0) {
      return (
        hints.hasTotalCount ||
        hints.hasMoreIndicator ||
        hints.potentialTotalPaths.length > 0
      );
    }
    return false;
  }

  /**
   * Infer pagination type when we have a paginated response but no clear params
   */
  private inferPaginationType(hints: PaginationHints): PaginationAnalysis {
    const indicators =
      (hints.hasTotalCount ? 1 : 0) +
      (hints.hasMoreIndicator ? 1 : 0) +
      (hints.potentialDataPaths.length > 0 ? 1 : 0);

    // Default to offset-based when we can't determine type
    return {
      detected: true,
      type: 'offset',
      config: {
        dataPath: hints.potentialDataPaths[0] || undefined,
        totalPath: hints.potentialTotalPaths[0] || undefined,
        hasMorePath: hints.potentialHasMorePaths[0] || undefined,
      },
      confidence: calculatePaginationConfidence(indicators, 4),
    };
  }

  /**
   * Build offset-based pagination analysis
   */
  private buildOffsetPagination(hints: PaginationHints): PaginationAnalysis {
    const indicators =
      (hints.hasOffsetParams ? 1 : 0) +
      (hints.hasLimitParams ? 1 : 0) +
      (hints.hasTotalCount ? 1 : 0) +
      (hints.potentialDataPaths.length > 0 ? 1 : 0);

    return {
      detected: true,
      type: 'offset',
      config: {
        dataPath: hints.potentialDataPaths[0] || undefined,
        totalPath: hints.potentialTotalPaths[0] || undefined,
        hasMorePath: hints.potentialHasMorePaths[0] || undefined,
      },
      confidence: calculatePaginationConfidence(indicators, 4),
    };
  }

  /**
   * Build page-based pagination analysis
   */
  private buildPagePagination(hints: PaginationHints): PaginationAnalysis {
    const indicators =
      (hints.hasPageParams ? 1 : 0) +
      (hints.hasLimitParams ? 1 : 0) +
      (hints.hasTotalCount ? 1 : 0) +
      (hints.potentialDataPaths.length > 0 ? 1 : 0);

    return {
      detected: true,
      type: 'page',
      config: {
        dataPath: hints.potentialDataPaths[0] || undefined,
        totalPath: hints.potentialTotalPaths[0] || undefined,
        hasMorePath: hints.potentialHasMorePaths[0] || undefined,
      },
      confidence: calculatePaginationConfidence(indicators, 4),
    };
  }

  /**
   * Build cursor-based pagination analysis
   */
  private buildCursorPagination(hints: PaginationHints): PaginationAnalysis {
    const indicators =
      (hints.hasCursorInResponse ? 1 : 0) +
      (hints.hasMoreIndicator ? 1 : 0) +
      (hints.potentialDataPaths.length > 0 ? 1 : 0) +
      (hints.hasNextLink ? 1 : 0);

    return {
      detected: true,
      type: 'cursor',
      config: {
        dataPath: hints.potentialDataPaths[0] || undefined,
        nextCursorPath: hints.potentialCursorPaths[0] || undefined,
        hasMorePath: hints.potentialHasMorePaths[0] || undefined,
      },
      confidence: calculatePaginationConfidence(indicators, 4),
    };
  }
}
