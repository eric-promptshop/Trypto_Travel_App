// Simple in-memory cache for search results
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SearchCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number = 100
  private defaultTTL: number = 15 * 60 * 1000 // 15 minutes

  // Generate cache key from search parameters
  private generateKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key]
        }
        return acc
      }, {} as Record<string, any>)
    
    return JSON.stringify(sortedParams)
  }

  // Set cache entry
  set<T>(params: Record<string, any>, data: T, ttl?: number): void {
    const key = this.generateKey(params)
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestEntry()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  // Get cache entry
  get<T>(params: Record<string, any>): T | null {
    const key = this.generateKey(params)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Clear cache
  clear(): void {
    this.cache.clear()
  }

  // Find oldest entry for LRU eviction
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    }
  }
}

// Create singleton instance
export const searchCache = new SearchCache()

// Helper function to cache API calls
export async function withCache<T>(
  params: Record<string, any>,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = searchCache.get<T>(params)
  if (cached !== null) {
    console.log('Cache hit for:', params)
    return cached
  }

  // Fetch data
  console.log('Cache miss for:', params)
  const data = await fetcher()
  
  // Store in cache
  searchCache.set(params, data, ttl)
  
  return data
}