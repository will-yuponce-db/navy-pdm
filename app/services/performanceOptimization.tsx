import { CacheConfig } from "../types";

// Cache strategies
export enum CacheStrategy {
  LRU = "lru",
  FIFO = "fifo",
  TTL = "ttl",
}

// Cache entry interface
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Generic cache implementation
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  set(key: string, value: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private evict(): void {
    switch (this.config.strategy) {
      case CacheStrategy.LRU:
        this.evictLRU();
        break;
      case CacheStrategy.FIFO:
        this.evictFIFO();
        break;
      case CacheStrategy.TTL:
        this.evictTTL();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictFIFO(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictTTL(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        return; // Only evict one entry at a time
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalAccesses = 0;
    let oldestTime = Date.now();
    let newestTime = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      oldestTime = Math.min(oldestTime, entry.timestamp);
      newestTime = Math.max(newestTime, entry.timestamp);
    }

    return {
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? totalAccesses / this.cache.size : 0,
      oldestEntry: oldestTime,
      newestEntry: newestTime,
    };
  }
}

// Memory cache manager
class MemoryCacheManager {
  private caches = new Map<string, Cache<unknown>>();

  createCache<T>(name: string, config: CacheConfig): Cache<T> {
    const cache = new Cache<T>(config);
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): Cache<T> | undefined {
    return this.caches.get(name);
  }

  deleteCache(name: string): boolean {
    return this.caches.delete(name);
  }

  clearAll(): void {
    this.caches.forEach((cache) => cache.clear());
  }

  getAllStats(): Record<string, unknown> {
    const stats: Record<string, unknown> = {};
    this.caches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    return stats;
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string, endMark?: string): number {
    const start = startMark ? this.marks.get(startMark) : 0;
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined) {
      throw new Error(`Start mark "${startMark}" not found`);
    }

    const duration = end - start;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }

    this.measures.get(name)!.push(duration);
    return duration;
  }

  getAverageMeasure(name: string): number {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) {
      return 0;
    }

    return (
      measures.reduce((sum, measure) => sum + measure, 0) / measures.length
    );
  }

  getMeasureStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  } {
    const measures = this.measures.get(name) || [];

    if (measures.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, total: 0 };
    }

    const total = measures.reduce((sum, measure) => sum + measure, 0);
    const average = total / measures.length;
    const min = Math.min(...measures);
    const max = Math.max(...measures);

    return { count: measures.length, average, min, max, total };
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Lazy loading utility
export class LazyLoader<T> {
  private cache = new Map<string, Promise<T>>();
  private loader: (key: string) => Promise<T>;

  constructor(loader: (key: string) => Promise<T>) {
    this.loader = loader;
  }

  async load(key: string): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = this.loader(key);
    this.cache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } catch (error) {
      this.cache.delete(key);
      throw error;
    }
  }

  preload(key: string): Promise<T> {
    return this.load(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Image lazy loading hook
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setImageSrc(src);
        observer.disconnect();
      }
    }, options);

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, options]);

  React.useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsError(true);
    img.src = imageSrc;
  }, [imageSrc]);

  return { imgRef, imageSrc, isLoaded, isError };
}

// Virtual scrolling hook
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5,
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Bundle size analyzer
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private chunks = new Map<string, number>();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  analyze(): {
    totalSize: number;
    chunkSizes: Record<string, number>;
    recommendations: string[];
  } {
    const totalSize = Array.from(this.chunks.values()).reduce(
      (sum, size) => sum + size,
      0,
    );
    const chunkSizes = Object.fromEntries(this.chunks);
    const recommendations: string[] = [];

    // Analyze chunk sizes
    for (const [chunk, size] of this.chunks.entries()) {
      if (size > 500000) {
        // 500KB
        recommendations.push(
          `Consider code splitting for chunk "${chunk}" (${(size / 1024).toFixed(2)}KB)`,
        );
      }
    }

    if (totalSize > 2000000) {
      // 2MB
      recommendations.push(
        "Total bundle size is large. Consider implementing lazy loading.",
      );
    }

    return { totalSize, chunkSizes, recommendations };
  }

  addChunk(name: string, size: number): void {
    this.chunks.set(name, size);
  }
}

// Create singleton instances
export const memoryCacheManager = new MemoryCacheManager();
export const performanceMonitor = new PerformanceMonitor();
export const bundleAnalyzer = BundleAnalyzer.getInstance();

// Default cache configurations
export const CACHE_CONFIGS = {
  API_RESPONSES: {
    ttl: 300, // 5 minutes
    maxSize: 100,
    strategy: CacheStrategy.TTL,
  },
  USER_DATA: {
    ttl: 1800, // 30 minutes
    maxSize: 50,
    strategy: CacheStrategy.LRU,
  },
  STATIC_DATA: {
    ttl: 3600, // 1 hour
    maxSize: 200,
    strategy: CacheStrategy.LRU,
  },
  SEARCH_RESULTS: {
    ttl: 600, // 10 minutes
    maxSize: 50,
    strategy: CacheStrategy.LRU,
  },
} as const;

// React import for hooks
import React from "react";
