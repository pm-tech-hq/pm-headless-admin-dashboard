// Cache Types

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  tags?: string[];
}

export interface CacheConfig {
  defaultTTL?: number;          // Default TTL in milliseconds
  maxSize?: number;             // Maximum number of entries
  persistence?: 'memory' | 'localStorage' | 'sessionStorage';
  prefix?: string;              // Key prefix for storage
  onEvict?: (key: string, entry: CacheEntry<unknown>) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

export interface Cache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, options?: CacheSetOptions): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  invalidateByTag(tag: string): number;
  getStats(): CacheStats;
  keys(): string[];
}

export interface CacheSetOptions {
  ttl?: number;           // TTL in milliseconds
  tags?: string[];        // Tags for group invalidation
}

export interface QueryCacheConfig {
  staleTime?: number;     // Time until data is considered stale
  cacheTime?: number;     // Time to keep data in cache after becoming stale
  refetchOnStale?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}
