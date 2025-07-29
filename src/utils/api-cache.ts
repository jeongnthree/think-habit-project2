/**
 * API caching utilities for journal system
 */

import { JournalWithDetails } from '@/types/database';
import { apiCache, invalidateCache, withCache } from './cache-manager';

interface JournalListParams {
  categoryId?: string;
  studentId?: string;
  isPublic?: boolean;
  dateFrom?: string;
  dateTo?: string;
  journalType?: string;
  search?: string;
  deleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface JournalListResponse {
  success: boolean;
  data: JournalWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Generate cache key for journal list requests
 */
function generateJournalListCacheKey(params: JournalListParams): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        const value = params[key as keyof JournalListParams];
        if (value !== undefined && value !== null) {
          result[key] = value;
        }
        return result;
      },
      {} as Record<string, any>
    );

  return `journals_list_${JSON.stringify(sortedParams)}`;
}

/**
 * Cached journal list fetcher
 */
export const fetchJournalList = withCache(
  async (params: JournalListParams = {}): Promise<JournalListResponse> => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const response = await fetch(`/api/training/journals?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch journals: ${response.statusText}`);
    }

    return response.json();
  },
  apiCache,
  generateJournalListCacheKey
);

/**
 * Cached individual journal fetcher
 */
export const fetchJournal = withCache(
  async (
    journalId: string
  ): Promise<{ success: boolean; data: JournalWithDetails }> => {
    const response = await fetch(`/api/training/journals/${journalId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch journal: ${response.statusText}`);
    }

    return response.json();
  },
  apiCache,
  (journalId: string) => `journal_${journalId}`
);

/**
 * Cached category list fetcher
 */
export const fetchCategories = withCache(
  async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await fetch('/api/categories');

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  },
  apiCache,
  () => 'categories_list'
);

/**
 * Cached user assignments fetcher
 */
export const fetchUserAssignments = withCache(
  async (userId?: string): Promise<{ success: boolean; data: any[] }> => {
    const url = userId
      ? `/api/training/assignments?userId=${userId}`
      : '/api/training/assignments';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch assignments: ${response.statusText}`);
    }

    return response.json();
  },
  apiCache,
  (userId?: string) => `assignments_${userId || 'current'}`
);

/**
 * Cached progress data fetcher
 */
export const fetchProgressData = withCache(
  async (categoryId?: string): Promise<{ success: boolean; data: any }> => {
    const url = categoryId
      ? `/api/training/progress?categoryId=${categoryId}`
      : '/api/training/progress';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`);
    }

    return response.json();
  },
  apiCache,
  (categoryId?: string) => `progress_${categoryId || 'all'}`
);

/**
 * Invalidate journal-related caches
 */
export function invalidateJournalCaches(
  journalId?: string,
  categoryId?: string,
  studentId?: string
): void {
  // Invalidate specific journal cache
  if (journalId) {
    invalidateCache(`journal_${journalId}`, apiCache);
  }

  // Invalidate journal lists that might contain this journal
  invalidateCache(/^journals_list_/, apiCache);

  // Invalidate progress caches
  if (categoryId) {
    invalidateCache(`progress_${categoryId}`, apiCache);
  }
  invalidateCache('progress_all', apiCache);

  // Invalidate assignments if needed
  if (studentId) {
    invalidateCache(`assignments_${studentId}`, apiCache);
  }
  invalidateCache('assignments_current', apiCache);
}

/**
 * Preload journal data for better performance
 */
export async function preloadJournalData(params: {
  categoryIds?: string[];
  studentId?: string;
  preloadCount?: number;
}): Promise<void> {
  const { categoryIds = [], studentId, preloadCount = 10 } = params;

  const preloadPromises: Promise<any>[] = [];

  // Preload categories
  preloadPromises.push(fetchCategories());

  // Preload assignments
  preloadPromises.push(fetchUserAssignments(studentId));

  // Preload journal lists for each category
  for (const categoryId of categoryIds) {
    preloadPromises.push(
      fetchJournalList({
        categoryId,
        studentId,
        page: 1,
        limit: preloadCount,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
    );

    // Preload progress data
    preloadPromises.push(fetchProgressData(categoryId));
  }

  // Preload overall progress
  preloadPromises.push(fetchProgressData());

  // Execute all preloads concurrently but don't wait for them
  Promise.allSettled(preloadPromises).catch(error => {
    console.warn('Some preload operations failed:', error);
  });
}

/**
 * Cache warming for critical data
 */
export async function warmCache(): Promise<void> {
  try {
    // Warm up categories cache
    await fetchCategories();

    // Warm up current user assignments
    await fetchUserAssignments();

    // Warm up recent journals
    await fetchJournalList({
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    console.log('Cache warmed successfully');
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

/**
 * Clean up expired cache entries periodically
 */
export function startCacheCleanup(
  intervalMs: number = 5 * 60 * 1000
): () => void {
  const interval = setInterval(() => {
    const removedCount = apiCache.cleanup();
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired cache entries`);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}
