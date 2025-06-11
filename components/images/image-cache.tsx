'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CachedImage {
  id: string;
  url: string;
  blob: Blob;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  quality: 'low' | 'medium' | 'high' | 'original';
  sizeBytes: number;
  expiresAt?: number;
}

export interface CacheMetrics {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  lastCleanup: number;
}

export interface CacheConfig {
  maxSizeBytes: number; // Maximum cache size in bytes
  maxAge: number; // Maximum age in milliseconds
  maxItems: number; // Maximum number of cached items
  cleanupThreshold: number; // Cleanup when cache exceeds this percentage
  enableCompression: boolean;
  enableServiceWorker: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxItems: 500,
  cleanupThreshold: 0.8, // 80%
  enableCompression: true,
  enableServiceWorker: true,
};

const DB_NAME = 'tripnav-image-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export class ImageCacheManager {
  private config: CacheConfig;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private metrics: CacheMetrics = {
    totalSize: 0,
    itemCount: 0,
    hitRate: 0,
    lastCleanup: 0,
  };
  private accessLog: Map<string, number> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    try {
      this.db = await this.openDatabase();
      await this.loadMetrics();
      await this.scheduleCleanup();
      
      if (this.config.enableServiceWorker) {
        await this.registerServiceWorker();
      }
    } catch (error) {
      console.warn('Failed to initialize image cache:', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('lastAccessed', 'lastAccessed');
          store.createIndex('quality', 'quality');
        }
      };
    });
  }

  private async loadMetrics(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const getAllRequest = store.getAll();

    return new Promise((resolve) => {
      getAllRequest.onsuccess = () => {
        const items: CachedImage[] = getAllRequest.result;
        
        this.metrics.itemCount = items.length;
        this.metrics.totalSize = items.reduce((sum, item) => sum + item.sizeBytes, 0);
        
        const totalAccesses = items.reduce((sum, item) => sum + item.accessCount, 0);
        this.metrics.hitRate = totalAccesses > 0 ? this.accessLog.size / totalAccesses : 0;
        
        resolve();
      };

      getAllRequest.onerror = () => resolve();
    });
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw-image-cache.js');
      console.log('Image cache service worker registered:', registration);
    } catch (error) {
      console.warn('Failed to register image cache service worker:', error);
    }
  }

  // Cache an image
  async cacheImage(url: string, quality: string = 'medium'): Promise<string | null> {
    await this.initPromise;
    if (!this.db) return null;

    try {
      const id = this.generateCacheId(url, quality);
      
      // Check if already cached
      const existing = await this.getCachedImage(id);
      if (existing && !this.isExpired(existing)) {
        await this.updateAccessInfo(id);
        return this.createObjectURL(existing.blob);
      }

      // Fetch and cache the image
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

      const blob = await response.blob();
      const sizeBytes = blob.size;

      // Check cache size limits before storing
      if (await this.needsCleanup(sizeBytes)) {
        await this.performCleanup();
      }

      const cachedImage: CachedImage = {
        id,
        url,
        blob,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        quality: quality as any,
        sizeBytes,
        expiresAt: Date.now() + this.config.maxAge,
      };

      await this.storeCachedImage(cachedImage);
      this.updateMetrics(sizeBytes, 1);

      return this.createObjectURL(blob);
    } catch (error) {
      console.warn('Failed to cache image:', error);
      return url; // Fallback to original URL
    }
  }

  // Get cached image URL
  async getCachedImageUrl(url: string, quality: string = 'medium'): Promise<string | null> {
    await this.initPromise;
    if (!this.db) return null;

    const id = this.generateCacheId(url, quality);
    const cached = await this.getCachedImage(id);

    if (!cached || this.isExpired(cached)) {
      return null;
    }

    await this.updateAccessInfo(id);
    return this.createObjectURL(cached.blob);
  }

  // Preload images for caching
  async preloadImages(urls: string[], quality: string = 'medium'): Promise<void> {
    const batchSize = 3; // Limit concurrent downloads
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const promises = batch.map(url => this.cacheImage(url, quality));
      await Promise.allSettled(promises);
    }
  }

  // Get cache metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Clear expired items
  async clearExpired(): Promise<number> {
    await this.initPromise;
    if (!this.db) return 0;

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getAllRequest = store.getAll();

    return new Promise((resolve) => {
      getAllRequest.onsuccess = async () => {
        const items: CachedImage[] = getAllRequest.result;
        const expired = items.filter(item => this.isExpired(item));
        
        for (const item of expired) {
          await this.deleteCachedImage(item.id);
        }

        resolve(expired.length);
      };

      getAllRequest.onerror = () => resolve(0);
    });
  }

  // Clear all cached images
  async clearAll(): Promise<void> {
    await this.initPromise;
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.clear();

    this.metrics = {
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      lastCleanup: Date.now(),
    };
  }

  // Private helper methods
  private generateCacheId(url: string, quality: string): string {
    return `${btoa(url)}-${quality}`;
  }

  private async getCachedImage(id: string): Promise<CachedImage | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async storeCachedImage(image: CachedImage): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(image);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteCachedImage(id: string): Promise<void> {
    if (!this.db) return;

    const cached = await this.getCachedImage(id);
    if (cached) {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve) => {
        const request = store.delete(id);
        request.onsuccess = () => {
          this.updateMetrics(-cached.sizeBytes, -1);
          resolve();
        };
        request.onerror = () => resolve();
      });
    }
  }

  private async updateAccessInfo(id: string): Promise<void> {
    const cached = await this.getCachedImage(id);
    if (!cached) return;

    cached.accessCount++;
    cached.lastAccessed = Date.now();
    
    await this.storeCachedImage(cached);
    this.accessLog.set(id, Date.now());
  }

  private isExpired(image: CachedImage): boolean {
    return image.expiresAt ? Date.now() > image.expiresAt : false;
  }

  private createObjectURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  private updateMetrics(sizeChange: number, itemChange: number): void {
    this.metrics.totalSize += sizeChange;
    this.metrics.itemCount += itemChange;
  }

  private async needsCleanup(newItemSize: number): Promise<boolean> {
    const projectedSize = this.metrics.totalSize + newItemSize;
    const sizeThreshold = this.config.maxSizeBytes * this.config.cleanupThreshold;
    
    return (
      projectedSize > sizeThreshold ||
      this.metrics.itemCount >= this.config.maxItems
    );
  }

  private async performCleanup(): Promise<void> {
    await this.initPromise;
    if (!this.db) return;

    // Get all items sorted by last access time (oldest first)
    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('lastAccessed');
    const getAllRequest = index.getAll();

    return new Promise((resolve) => {
      getAllRequest.onsuccess = async () => {
        const items: CachedImage[] = getAllRequest.result;
        
        // Remove expired items first
        const expiredCount = await this.clearExpired();
        
        // If still over threshold, remove least recently used items
        const targetSize = this.config.maxSizeBytes * 0.7; // Clean to 70% capacity
        let currentSize = this.metrics.totalSize;
        
        for (const item of items) {
          if (currentSize <= targetSize) break;
          
          if (!this.isExpired(item)) {
            await this.deleteCachedImage(item.id);
            currentSize -= item.sizeBytes;
          }
        }

        this.metrics.lastCleanup = Date.now();
        resolve();
      };

      getAllRequest.onerror = () => resolve();
    });
  }

  private async scheduleCleanup(): Promise<void> {
    // Schedule periodic cleanup every hour
    setInterval(async () => {
      const hoursSinceLastCleanup = (Date.now() - this.metrics.lastCleanup) / (1000 * 60 * 60);
      
      if (hoursSinceLastCleanup >= 1) {
        await this.clearExpired();
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}

// React hook for image caching
export function useImageCache(config?: Partial<CacheConfig>) {
  const [manager] = useState(() => new ImageCacheManager(config));
  const [metrics, setMetrics] = useState<CacheMetrics>({
    totalSize: 0,
    itemCount: 0,
    hitRate: 0,
    lastCleanup: 0,
  });

  const updateMetrics = useCallback(async () => {
    const newMetrics = manager.getMetrics();
    setMetrics(newMetrics);
  }, [manager]);

  useEffect(() => {
    updateMetrics();
    
    // Update metrics periodically
    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [updateMetrics]);

  const cacheImage = useCallback(async (url: string, quality?: string) => {
    const result = await manager.cacheImage(url, quality);
    updateMetrics();
    return result;
  }, [manager, updateMetrics]);

  const getCachedImageUrl = useCallback(async (url: string, quality?: string) => {
    return manager.getCachedImageUrl(url, quality);
  }, [manager]);

  const preloadImages = useCallback(async (urls: string[], quality?: string) => {
    await manager.preloadImages(urls, quality);
    updateMetrics();
  }, [manager, updateMetrics]);

  const clearExpired = useCallback(async () => {
    const count = await manager.clearExpired();
    updateMetrics();
    return count;
  }, [manager, updateMetrics]);

  const clearAll = useCallback(async () => {
    await manager.clearAll();
    updateMetrics();
  }, [manager, updateMetrics]);

  return {
    cacheImage,
    getCachedImageUrl,
    preloadImages,
    clearExpired,
    clearAll,
    metrics,
  };
}

// Hook for using cached image with fallback
export function useCachedImage(url: string, quality: string = 'medium') {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { cacheImage, getCachedImageUrl } = useImageCache();

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, try to get from cache
        const cached = await getCachedImageUrl(url, quality);
        
        if (cached && mounted) {
          setCachedUrl(cached);
          setIsLoading(false);
          return;
        }

        // If not in cache, cache it now
        const result = await cacheImage(url, quality);
        
        if (mounted) {
          setCachedUrl(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
          setCachedUrl(url); // Fallback to original URL
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [url, quality, cacheImage, getCachedImageUrl]);

  return {
    url: cachedUrl || url,
    isLoading,
    error,
    isCached: !!cachedUrl,
  };
}

export default ImageCacheManager; 