'use client';

import { useErrorHandler } from './error-boundary';

export interface StorageOptions {
  prefix?: string;
  fallbackToMemory?: boolean;
  compress?: boolean;
  maxAge?: number; // milliseconds
}

export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expires?: number;
}

class SafeStorage {
  private memoryStorage = new Map<string, StorageItem>();
  private isLocalStorageAvailable: boolean | null = null;
  private prefix: string;
  private fallbackToMemory: boolean;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'tripnav_';
    this.fallbackToMemory = options.fallbackToMemory ?? true;
  }

  private checkLocalStorageAvailability(): boolean {
    if (this.isLocalStorageAvailable !== null) {
      return this.isLocalStorageAvailable;
    }

    try {
      if (typeof window === 'undefined') {
        this.isLocalStorageAvailable = false;
        return false;
      }

      const testKey = '__tripnav_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
      return true;
    } catch (error) {
      this.isLocalStorageAvailable = false;
      return false;
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isExpired(item: StorageItem): boolean {
    if (!item.expires) return false;
    return Date.now() > item.expires;
  }

  private compress(value: string): string {
    // Simple compression for large strings (could be enhanced with actual compression)
    return value.length > 1000 ? JSON.stringify({ compressed: true, data: value }) : value;
  }

  private decompress(value: string): string {
    try {
      const parsed = JSON.parse(value);
      if (parsed.compressed) {
        return parsed.data;
      }
      return value;
    } catch {
      return value;
    }
  }

  set<T>(key: string, value: T, options: { maxAge?: number } = {}): boolean {
    const storageKey = this.getKey(key);
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      ...(options.maxAge && { expires: Date.now() + options.maxAge }),
    };

    try {
      const serialized = JSON.stringify(item);
      
      if (this.checkLocalStorageAvailability()) {
        try {
          localStorage.setItem(storageKey, this.compress(serialized));
          return true;
        } catch (error) {
          // Handle quota exceeded or other localStorage errors
          if ((error as Error).name === 'QuotaExceededError' || 
              (error as Error).name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            this.clearExpiredItems();
            
            // Try again after cleanup
            try {
              localStorage.setItem(storageKey, this.compress(serialized));
              return true;
            } catch {
              // Still failed, fall back to memory
              if (this.fallbackToMemory) {
                this.memoryStorage.set(storageKey, item);
                return true;
              }
              return false;
            }
          }
          
          // Other localStorage errors
          if (this.fallbackToMemory) {
            this.memoryStorage.set(storageKey, item);
            return true;
          }
          return false;
        }
      } else if (this.fallbackToMemory) {
        this.memoryStorage.set(storageKey, item);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    const storageKey = this.getKey(key);

    try {
      // Try localStorage first
      if (this.checkLocalStorageAvailability()) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const decompressed = this.decompress(stored);
          const item: StorageItem<T> = JSON.parse(decompressed);
          
          if (this.isExpired(item)) {
            this.remove(key);
            return defaultValue;
          }
          
          return item.value;
        }
      }

      // Try memory storage
      const memoryItem = this.memoryStorage.get(storageKey);
      if (memoryItem) {
        if (this.isExpired(memoryItem)) {
          this.memoryStorage.delete(storageKey);
          return defaultValue;
        }
        return memoryItem.value as T;
      }

      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  remove(key: string): boolean {
    const storageKey = this.getKey(key);

    try {
      if (this.checkLocalStorageAvailability()) {
        localStorage.removeItem(storageKey);
      }
      this.memoryStorage.delete(storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  clear(): boolean {
    try {
      if (this.checkLocalStorageAvailability()) {
        // Remove only prefixed keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Clear memory storage
      this.memoryStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  clearExpiredItems(): number {
    let clearedCount = 0;

    try {
      // Clear expired localStorage items
      if (this.checkLocalStorageAvailability()) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            try {
              const stored = localStorage.getItem(key);
              if (stored) {
                const decompressed = this.decompress(stored);
                const item: StorageItem = JSON.parse(decompressed);
                if (this.isExpired(item)) {
                  keysToRemove.push(key);
                }
              }
            } catch {
              // Invalid item, remove it
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          clearedCount++;
        });
      }

      // Clear expired memory items
      for (const [key, item] of this.memoryStorage.entries()) {
        if (this.isExpired(item)) {
          this.memoryStorage.delete(key);
          clearedCount++;
        }
      }

      return clearedCount;
    } catch (error) {
      return clearedCount;
    }
  }

  getStorageInfo(): {
    localStorage: boolean;
    memoryStorage: boolean;
    itemCount: number;
    estimatedSize: string;
  } {
    const memoryCount = this.memoryStorage.size;
    let localStorageCount = 0;
    let estimatedBytes = 0;

    if (this.checkLocalStorageAvailability()) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          localStorageCount++;
          const value = localStorage.getItem(key);
          if (value) {
            estimatedBytes += new Blob([key + value]).size;
          }
        }
      }
    }

    // Estimate memory storage size
    for (const [key, item] of this.memoryStorage.entries()) {
      estimatedBytes += new Blob([key + JSON.stringify(item)]).size;
    }

    return {
      localStorage: this.checkLocalStorageAvailability(),
      memoryStorage: memoryCount > 0,
      itemCount: localStorageCount + memoryCount,
      estimatedSize: this.formatBytes(estimatedBytes),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Default instance
export const safeStorage = new SafeStorage();

// React hook for safe storage
export function useSafeStorage<T>(
  key: string,
  defaultValue: T,
  options: { maxAge?: number } = {}
): [T, (value: T) => boolean, () => boolean] {
  const { reportError } = useErrorHandler();

  const getValue = (): T => {
    try {
      return safeStorage.get(key, defaultValue) ?? defaultValue;
    } catch (error) {
      reportError(error as Error, `useSafeStorage.getValue(${key})`);
      return defaultValue;
    }
  };

  const setValue = (value: T): boolean => {
    try {
      return safeStorage.set(key, value, options);
    } catch (error) {
      reportError(error as Error, `useSafeStorage.setValue(${key})`);
      return false;
    }
  };

  const removeValue = (): boolean => {
    try {
      return safeStorage.remove(key);
    } catch (error) {
      reportError(error as Error, `useSafeStorage.removeValue(${key})`);
      return false;
    }
  };

  return [getValue(), setValue, removeValue];
}

// Hook for storage info monitoring
export function useStorageMonitor() {
  const getStorageInfo = () => safeStorage.getStorageInfo();
  const clearExpired = () => safeStorage.clearExpiredItems();
  const clearAll = () => safeStorage.clear();

  return {
    getStorageInfo,
    clearExpired,
    clearAll,
  };
}

export default safeStorage; 