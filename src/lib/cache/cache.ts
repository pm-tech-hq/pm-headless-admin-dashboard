// Cache Implementation

import { Cache, CacheConfig, CacheEntry, CacheSetOptions, CacheStats } from './types';

const DEFAULT_CONFIG: Required<CacheConfig> = {
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  maxSize: 1000,
  persistence: 'memory',
  prefix: 'cache:',
  onEvict: () => {},
};

export function createCache(config: CacheConfig = {}): Cache {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const store = new Map<string, CacheEntry<unknown>>();
  const stats: CacheStats = { hits: 0, misses: 0, size: 0, evictions: 0 };

  // Persistence helpers
  const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;

    switch (mergedConfig.persistence) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      default:
        return null;
    }
  };

  const getPrefixedKey = (key: string) => `${mergedConfig.prefix}${key}`;

  const persistEntry = <T>(key: string, entry: CacheEntry<T>) => {
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(getPrefixedKey(key), JSON.stringify(entry));
      } catch (err) {
        // Storage full or unavailable
        console.warn('Cache persistence failed:', err);
      }
    }
  };

  const loadEntry = <T>(key: string): CacheEntry<T> | null => {
    const storage = getStorage();
    if (storage) {
      try {
        const raw = storage.getItem(getPrefixedKey(key));
        if (raw) {
          return JSON.parse(raw) as CacheEntry<T>;
        }
      } catch (err) {
        // Parse error
      }
    }
    return null;
  };

  const removePersistedEntry = (key: string) => {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(getPrefixedKey(key));
    }
  };

  const clearPersistedEntries = () => {
    const storage = getStorage();
    if (storage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(mergedConfig.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    }
  };

  // Eviction
  const evictOldest = () => {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of store.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = store.get(oldestKey);
      store.delete(oldestKey);
      removePersistedEntry(oldestKey);
      stats.evictions++;
      stats.size = store.size;

      if (entry) {
        mergedConfig.onEvict(oldestKey, entry);
      }
    }
  };

  const isExpired = (entry: CacheEntry<unknown>): boolean => {
    return Date.now() > entry.expiresAt;
  };

  // Clean up expired entries periodically
  const cleanup = () => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of store.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      const entry = store.get(key);
      store.delete(key);
      removePersistedEntry(key);
      if (entry) {
        mergedConfig.onEvict(key, entry);
      }
    });

    stats.size = store.size;
  };

  // Run cleanup every minute
  if (typeof window !== 'undefined') {
    setInterval(cleanup, 60000);
  }

  // Initialize from persistence
  const initFromStorage = () => {
    const storage = getStorage();
    if (storage) {
      for (let i = 0; i < storage.length; i++) {
        const fullKey = storage.key(i);
        if (fullKey?.startsWith(mergedConfig.prefix)) {
          const key = fullKey.slice(mergedConfig.prefix.length);
          const entry = loadEntry(key);
          if (entry && !isExpired(entry)) {
            store.set(key, entry);
          } else if (entry) {
            removePersistedEntry(key);
          }
        }
      }
      stats.size = store.size;
    }
  };

  // Initialize
  if (typeof window !== 'undefined') {
    initFromStorage();
  }

  return {
    get<T>(key: string): T | null {
      // Check memory cache first
      let entry = store.get(key) as CacheEntry<T> | undefined;

      // Try loading from persistence if not in memory
      if (!entry && mergedConfig.persistence !== 'memory') {
        entry = loadEntry<T>(key) ?? undefined;
        if (entry && !isExpired(entry)) {
          store.set(key, entry);
          stats.size = store.size;
        }
      }

      if (!entry) {
        stats.misses++;
        return null;
      }

      if (isExpired(entry)) {
        store.delete(key);
        removePersistedEntry(key);
        stats.misses++;
        stats.size = store.size;
        return null;
      }

      stats.hits++;
      return entry.data;
    },

    set<T>(key: string, value: T, options: CacheSetOptions = {}) {
      // Evict if at capacity
      while (store.size >= mergedConfig.maxSize) {
        evictOldest();
      }

      const ttl = options.ttl ?? mergedConfig.defaultTTL;
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: now,
        expiresAt: now + ttl,
        tags: options.tags,
      };

      store.set(key, entry);
      persistEntry(key, entry);
      stats.size = store.size;
    },

    delete(key: string): boolean {
      const existed = store.has(key);
      store.delete(key);
      removePersistedEntry(key);
      stats.size = store.size;
      return existed;
    },

    clear() {
      store.clear();
      clearPersistedEntries();
      stats.size = 0;
    },

    has(key: string): boolean {
      const entry = store.get(key);
      if (!entry) return false;
      if (isExpired(entry)) {
        store.delete(key);
        removePersistedEntry(key);
        stats.size = store.size;
        return false;
      }
      return true;
    },

    invalidateByTag(tag: string): number {
      let count = 0;
      const keysToDelete: string[] = [];

      for (const [key, entry] of store.entries()) {
        if (entry.tags?.includes(tag)) {
          keysToDelete.push(key);
          count++;
        }
      }

      keysToDelete.forEach((key) => {
        store.delete(key);
        removePersistedEntry(key);
      });

      stats.size = store.size;
      return count;
    },

    getStats(): CacheStats {
      return { ...stats };
    },

    keys(): string[] {
      return Array.from(store.keys());
    },
  };
}

// Singleton cache instance
let globalCache: Cache | null = null;

export function getCache(config?: CacheConfig): Cache {
  if (!globalCache) {
    globalCache = createCache(config);
  }
  return globalCache;
}

export function resetCache(): void {
  if (globalCache) {
    globalCache.clear();
    globalCache = null;
  }
}
