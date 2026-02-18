import { logger } from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class DataCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupInterval = setInterval(() => this.evictExpired(), cleanupIntervalMs);
  }

  /**
   * Store a value with a TTL in milliseconds.
   * Key convention: `ltp:{symbol}`, `ohlcv:{symbol}:{date}`, etc.
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Retrieve a cached value. Returns undefined if missing or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Remove a specific key from the cache.
   */
  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Remove all entries from the cache.
   */
  clear(): void {
    const size = this.store.size;
    this.store.clear();
    logger.debug({ cleared: size }, 'Cache cleared');
  }

  /**
   * Number of entries currently in the cache (including potentially expired).
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Evict all expired entries. Called automatically on the cleanup interval.
   */
  private evictExpired(): void {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        evicted++;
      }
    }

    if (evicted > 0) {
      logger.debug({ evicted, remaining: this.store.size }, 'Cache eviction sweep');
    }
  }

  /**
   * Stop the automatic cleanup interval. Call on shutdown.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/** Singleton cache instance for the data layer */
export const dataCache = new DataCache();
