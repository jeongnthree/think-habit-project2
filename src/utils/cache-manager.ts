/**
 * Client-side cache management for performance optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      storage: options.storage || 'memory',
    };

    // Load from persistent storage if specified
    if (this.options.storage !== 'memory') {
      this.loadFromStorage();
    }
  }

  /**
   * Set a cache entry
   */
  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Get a cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToStorage();
    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      entries,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.saveToStorage();
    }

    return removedCount;
  }

  /**
   * Load cache from persistent storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.getStorage();
      const cached = storage?.getItem(`cache_${this.constructor.name}`);

      if (cached) {
        const entries = JSON.parse(cached);
        this.cache = new Map(entries);
        this.cleanup(); // Remove expired entries on load
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to persistent storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || this.options.storage === 'memory') {
      return;
    }

    try {
      const storage = this.getStorage();
      const entries = Array.from(this.cache.entries());
      storage?.setItem(
        `cache_${this.constructor.name}`,
        JSON.stringify(entries)
      );
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Get the appropriate storage object
   */
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    switch (this.options.storage) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      default:
        return null;
    }
  }
}

// Pre-configured cache instances for common use cases
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  storage: 'sessionStorage',
});

export const imageCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  storage: 'localStorage',
});

export const userDataCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 20,
  storage: 'sessionStorage',
});

/**
 * Cache decorator for API functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheManager: CacheManager = apiCache,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Try to get from cache first
    const cached = cacheManager.get(key);
    if (cached) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      cacheManager.set(key, result);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }) as T;
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(
  pattern: string | RegExp,
  cacheManager: CacheManager = apiCache
): number {
  const stats = cacheManager.getStats();
  let removedCount = 0;

  for (const entry of stats.entries) {
    const matches =
      typeof pattern === 'string'
        ? entry.key.includes(pattern)
        : pattern.test(entry.key);

    if (matches) {
      cacheManager.delete(entry.key);
      removedCount++;
    }
  }

  return removedCount;
}

/**
 * Preload and cache data
 */
export async function preloadAndCache<T>(
  key: string,
  dataLoader: () => Promise<T>,
  cacheManager: CacheManager = apiCache
): Promise<T> {
  const cached = cacheManager.get(key);
  if (cached) {
    return cached;
  }

  const data = await dataLoader();
  cacheManager.set(key, data);
  return data;
}

export { CacheManager };
