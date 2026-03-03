/**
 * Cache Utility
 *
 * In-memory cache with TTL for frequently accessed data.
 * Reduces database load for common queries (course data, user data, etc.)
 *
 * For production with multiple instances, replace with Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;

    // Clean up expired entries every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 120_000);
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data as T;
  }

  /**
   * Set a cached value with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    // Evict if at capacity (LRU-style: remove least-hit entries)
    if (this.store.size >= this.maxSize) {
      this.evict();
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      hits: 0,
    });
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number } {
    return { size: this.store.size, maxSize: this.maxSize };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private evict(): void {
    // Remove 10% of least-hit entries
    const entries = Array.from(this.store.entries()).sort(
      (a, b) => a[1].hits - b[1].hits,
    );

    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.store.delete(entries[i][0]);
    }
  }
}

// ============================================================================
// Cache TTL Presets (in milliseconds)
// ============================================================================

export const CacheTTL = {
  SHORT: 30_000, // 30 seconds - frequently changing data
  MEDIUM: 300_000, // 5 minutes - moderately changing data
  LONG: 1_800_000, // 30 minutes - rarely changing data
  VERY_LONG: 3_600_000, // 1 hour - static data
} as const;

// Singleton instance
export const cache = new MemoryCache();

// ============================================================================
// Helper: Cached database queries
// ============================================================================

export const cachedQueries = {
  /**
   * Get course with caching (used frequently for notification context)
   */
  async getCourse(courseId: string, db: any) {
    return cache.getOrSet(`course:${courseId}`, CacheTTL.MEDIUM, async () => {
      return db.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, userId: true, imageUrl: true },
      });
    });
  },

  /**
   * Get user with caching (used frequently for notification context)
   */
  async getUser(userId: string, db: any) {
    return cache.getOrSet(`user:${userId}`, CacheTTL.MEDIUM, async () => {
      return db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true },
      });
    });
  },

  /**
   * Get enrolled student count (used for analytics)
   */
  async getEnrolledCount(courseId: string, db: any) {
    return cache.getOrSet(
      `enrolled_count:${courseId}`,
      CacheTTL.SHORT,
      async () => {
        return db.purchase.count({
          where: { courseId, paymentStatus: "completed" },
        });
      },
    );
  },

  /**
   * Invalidate course-related caches
   */
  invalidateCourse(courseId: string) {
    cache.deletePattern(`course:${courseId}`);
    cache.deletePattern(`enrolled_count:${courseId}`);
  },

  /**
   * Invalidate user-related caches
   */
  invalidateUser(userId: string) {
    cache.deletePattern(`user:${userId}`);
  },
};
