// Simple in-memory cache for frequently accessed data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Cleanup expired items every 10 minutes
if (typeof window === 'undefined') {
  // Only run on server side
  setInterval(
    () => {
      cache.cleanup();
    },
    10 * 60 * 1000
  );
}

// Cache key generators
export const cacheKeys = {
  publicJournals: (categoryId?: string, page?: number) =>
    `public_journals_${categoryId || 'all'}_${page || 1}`,
  journalDetail: (journalId: string) => `journal_detail_${journalId}`,
  journalComments: (journalId: string) => `journal_comments_${journalId}`,
  journalEncouragements: (journalId: string) =>
    `journal_encouragements_${journalId}`,
  categories: () => 'categories',
  userEncouragements: (userId: string, journalId: string) =>
    `user_encouragements_${userId}_${journalId}`,
};

// Cache invalidation helpers
export const invalidateCache = {
  journalDetail: (journalId: string) => {
    cache.delete(cacheKeys.journalDetail(journalId));
    cache.delete(cacheKeys.journalComments(journalId));
    cache.delete(cacheKeys.journalEncouragements(journalId));
  },
  publicJournals: () => {
    // Clear all public journals cache entries
    const stats = cache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('public_journals_')) {
        cache.delete(key);
      }
    });
  },
  userEncouragements: (userId: string) => {
    const stats = cache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(`user_encouragements_${userId}_`)) {
        cache.delete(key);
      }
    });
  },
};
