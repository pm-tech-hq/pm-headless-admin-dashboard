'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCache } from './cache';
import { QueryCacheConfig, QueryResult, CacheSetOptions } from './types';

const DEFAULT_QUERY_CONFIG: Required<QueryCacheConfig> = {
  staleTime: 5 * 60 * 1000,       // 5 minutes
  cacheTime: 30 * 60 * 1000,      // 30 minutes
  refetchOnStale: true,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
};

/**
 * Hook for caching API query results
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: QueryCacheConfig = {}
): QueryResult<T> {
  const mergedConfig = { ...DEFAULT_QUERY_CONFIG, ...config };
  const cache = getCache();

  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isStale: boolean;
  }>({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
    isStale: false,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const lastFetchTime = useRef<number>(0);
  const isMounted = useRef(true);

  const checkStale = useCallback(() => {
    const elapsed = Date.now() - lastFetchTime.current;
    return elapsed > mergedConfig.staleTime;
  }, [mergedConfig.staleTime]);

  const fetch = useCallback(async (force = false) => {
    // Check cache first
    const cached = cache.get<{ data: T; fetchedAt: number }>(key);

    if (cached && !force) {
      const isStale = Date.now() - cached.fetchedAt > mergedConfig.staleTime;

      if (isMounted.current) {
        setState({
          data: cached.data,
          isLoading: false,
          isError: false,
          error: null,
          isStale,
        });
      }

      // If stale, refetch in background
      if (isStale && mergedConfig.refetchOnStale) {
        // Continue to fetch below
      } else {
        return;
      }
    }

    // Fetch fresh data
    if (isMounted.current && !cached) {
      setState((prev) => ({ ...prev, isLoading: true }));
    }

    try {
      const data = await fetcherRef.current();
      lastFetchTime.current = Date.now();

      // Cache the result
      cache.set(key, { data, fetchedAt: lastFetchTime.current }, {
        ttl: mergedConfig.cacheTime,
        tags: [key.split(':')[0]], // Use first part of key as tag
      });

      if (isMounted.current) {
        setState({
          data,
          isLoading: false,
          isError: false,
          error: null,
          isStale: false,
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: err instanceof Error ? err : new Error('Fetch failed'),
        }));
      }
    }
  }, [key, cache, mergedConfig.staleTime, mergedConfig.cacheTime, mergedConfig.refetchOnStale]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;

    if (mergedConfig.refetchOnMount) {
      fetch();
    } else {
      // Just check cache
      const cached = cache.get<{ data: T; fetchedAt: number }>(key);
      if (cached) {
        setState({
          data: cached.data,
          isLoading: false,
          isError: false,
          error: null,
          isStale: checkStale(),
        });
      } else {
        fetch();
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [key, fetch, cache, checkStale, mergedConfig.refetchOnMount]);

  // Refetch on window focus
  useEffect(() => {
    if (!mergedConfig.refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (checkStale()) {
        fetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetch, checkStale, mergedConfig.refetchOnWindowFocus]);

  const refetch = useCallback(async () => {
    await fetch(true);
  }, [fetch]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    fetch(true);
  }, [cache, key, fetch]);

  return {
    ...state,
    refetch,
    invalidate,
  };
}

/**
 * Hook for caching mutable data with optimistic updates
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateKeys?: string[];
  }
) {
  const cache = getCache();
  const [state, setState] = useState({
    isLoading: false,
    isError: false,
    error: null as Error | null,
    data: null as TData | null,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ isLoading: true, isError: false, error: null, data: null });

      try {
        const data = await mutationFn(variables);

        setState({ isLoading: false, isError: false, error: null, data });

        // Invalidate related cache keys
        if (options?.invalidateKeys) {
          options.invalidateKeys.forEach((key) => cache.delete(key));
        }

        options?.onSuccess?.(data, variables);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed');
        setState({ isLoading: false, isError: true, error, data: null });
        options?.onError?.(error, variables);
        throw error;
      }
    },
    [mutationFn, options, cache]
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, isError: false, error: null, data: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

/**
 * Hook for manual cache operations
 */
export function useCache() {
  const cache = getCache();

  const get = useCallback(<T>(key: string): T | null => {
    return cache.get<T>(key);
  }, [cache]);

  const set = useCallback(<T>(key: string, value: T, options?: CacheSetOptions) => {
    cache.set(key, value, options);
  }, [cache]);

  const remove = useCallback((key: string) => {
    return cache.delete(key);
  }, [cache]);

  const invalidateTag = useCallback((tag: string) => {
    return cache.invalidateByTag(tag);
  }, [cache]);

  const clear = useCallback(() => {
    cache.clear();
  }, [cache]);

  const getStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return {
    get,
    set,
    remove,
    invalidateTag,
    clear,
    getStats,
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const cache = getCache();

  const prefetch = useCallback(
    async <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
      // Check if already cached
      if (cache.has(key)) {
        return;
      }

      try {
        const data = await fetcher();
        cache.set(key, { data, fetchedAt: Date.now() }, { ttl });
      } catch (err) {
        // Silently fail on prefetch
        console.warn('Prefetch failed for key:', key);
      }
    },
    [cache]
  );

  return prefetch;
}

/**
 * Hook for infinite scroll / pagination caching
 */
export function useInfiniteQuery<T>(
  baseKey: string,
  fetcher: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  config: QueryCacheConfig = {}
) {
  const [pages, setPages] = useState<T[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = getCache();
  const pageRef = useRef(0);

  const fetchPage = useCallback(
    async (page: number, isMore = false) => {
      const key = `${baseKey}:page:${page}`;
      const cached = cache.get<{ data: T[]; hasMore: boolean }>(key);

      if (cached) {
        setPages((prev) => {
          const updated = [...prev];
          updated[page] = cached.data;
          return updated;
        });
        setHasMore(cached.hasMore);
        return;
      }

      if (isMore) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await fetcher(page);

        cache.set(key, result, { ttl: config.cacheTime });

        setPages((prev) => {
          const updated = [...prev];
          updated[page] = result.data;
          return updated;
        });
        setHasMore(result.hasMore);
        pageRef.current = page;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Fetch failed'));
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [baseKey, cache, fetcher, config.cacheTime]
  );

  // Initial fetch
  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const fetchMore = useCallback(() => {
    if (!hasMore || isFetchingMore) return;
    fetchPage(pageRef.current + 1, true);
  }, [hasMore, isFetchingMore, fetchPage]);

  const refetch = useCallback(() => {
    setPages([]);
    pageRef.current = 0;
    // Invalidate all pages
    let page = 0;
    while (cache.has(`${baseKey}:page:${page}`)) {
      cache.delete(`${baseKey}:page:${page}`);
      page++;
    }
    fetchPage(0);
  }, [baseKey, cache, fetchPage]);

  return {
    data: pages.flat(),
    pages,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    fetchMore,
    refetch,
  };
}
