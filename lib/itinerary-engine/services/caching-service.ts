import { CachingService, GenerationResult, CacheStats } from '../types'
import { UserPreferences } from '@/lib/types/itinerary'
import { createHash } from 'crypto'

/**
 * In-memory caching service for itinerary generation results
 * Supports TTL (time-to-live) and automatic cleanup
 */
export class MemoryCachingService implements CachingService {
  private cache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0,
    cacheSize: 0,
    lastClearTime: new Date()
  }
  private readonly maxCacheSize: number
  private readonly defaultTtl: number // seconds
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(maxCacheSize: number = 1000, defaultTtl: number = 3600) {
    this.maxCacheSize = maxCacheSize
    this.defaultTtl = defaultTtl
    
    // Start cleanup interval (every 5 minutes)
    this.startCleanupInterval()
  }

  /**
   * Generate a consistent cache key from user preferences
   */
  generateCacheKey(preferences: UserPreferences): string {
    // Create a normalized version of preferences for consistent hashing
    const normalized = this.normalizePreferences(preferences)
    const data = JSON.stringify(normalized)
    return createHash('sha256').update(data).digest('hex').substring(0, 16)
  }

  /**
   * Store generation result in cache
   */
  async set(key: string, result: GenerationResult, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.defaultTtl
    const expiresAt = new Date(Date.now() + ttl * 1000)
    
    // Check if we need to evict items
    if (this.cache.size >= this.maxCacheSize) {
      await this.evictOldestEntries()
    }
    
    this.cache.set(key, {
      data: result,
      expiresAt,
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date()
    })
    
    this.updateStats()
  }

  /**
   * Retrieve cached result
   */
  async get(key: string): Promise<GenerationResult | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.totalMisses++
      this.updateHitRate()
      return null
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.totalMisses++
      this.updateHitRate()
      return null
    }
    
    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = new Date()
    
    this.stats.totalHits++
    this.updateHitRate()
    
    return entry.data
  }

  /**
   * Check if cached result exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Clear expired cache entries
   */
  async cleanup(): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    this.updateStats()
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.stats.lastClearTime = new Date()
    this.updateStats()
  }

  /**
   * Get cache size information
   */
  getCacheInfo(): { size: number; maxSize: number; memoryUsage: string } {
    const size = this.cache.size
    const memoryUsage = this.estimateMemoryUsage()
    
    return {
      size,
      maxSize: this.maxCacheSize,
      memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)} MB`
    }
  }

  /**
   * Shutdown the caching service
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }

  // Private methods

  private normalizePreferences(preferences: UserPreferences): any {
    // Create a consistent, sorted representation of preferences for hashing
    return {
      startDate: preferences.startDate?.toISOString(),
      endDate: preferences.endDate?.toISOString(),
      adults: preferences.adults,
      children: preferences.children,
      infants: preferences.infants,
      budgetMin: preferences.budgetMin,
      budgetMax: preferences.budgetMax,
      currency: preferences.currency,
      primaryDestination: preferences.primaryDestination,
      additionalDestinations: (preferences.additionalDestinations || []).sort(),
      interests: (preferences.interests || []).sort(),
      accommodationType: preferences.accommodationType,
      transportationPreference: preferences.transportationPreference,
      specialRequests: preferences.specialRequests,
      dietaryRestrictions: (preferences.dietaryRestrictions || []).sort(),
      mobilityRequirements: preferences.mobilityRequirements
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt
  }

  private updateStats(): void {
    this.stats.cacheSize = this.cache.size
  }

  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0
  }

  private async evictOldestEntries(): Promise<void> {
    // Convert to array and sort by last accessed time
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime())
    
    // Remove the oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1))
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(console.error)
    }, 5 * 60 * 1000)
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0
    
    for (const [key, entry] of this.cache.entries()) {
      // Estimate size of key
      totalSize += key.length * 2 // UTF-16 encoding
      
      // Estimate size of cached data (rough approximation)
      totalSize += JSON.stringify(entry.data).length * 2
      
      // Add overhead for entry metadata
      totalSize += 200 // rough estimate for dates, numbers, etc.
    }
    
    return totalSize
  }
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: GenerationResult
  expiresAt: Date
  createdAt: Date
  accessCount: number
  lastAccessed: Date
}

/**
 * Redis-based caching service for production use
 * (Implementation placeholder - would require Redis client)
 */
export class RedisCachingService implements CachingService {
  private redisClient: any // Would be Redis client instance
  private stats: CacheStats = {
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0,
    cacheSize: 0,
    lastClearTime: new Date()
  }

  constructor(redisConfig?: any) {
    // Initialize Redis client in production
    console.log('Redis caching service initialized (placeholder)')
  }

  generateCacheKey(preferences: UserPreferences): string {
    const memoryCacheService = new MemoryCachingService()
    return memoryCacheService.generateCacheKey(preferences)
  }

  async set(key: string, result: GenerationResult, ttlSeconds?: number): Promise<void> {
    // Redis implementation would go here
    console.log(`Redis SET: ${key} (TTL: ${ttlSeconds || 3600}s)`)
  }

  async get(key: string): Promise<GenerationResult | null> {
    // Redis implementation would go here
    console.log(`Redis GET: ${key}`)
    return null
  }

  async has(key: string): Promise<boolean> {
    // Redis implementation would go here
    console.log(`Redis EXISTS: ${key}`)
    return false
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically
    console.log('Redis cleanup (automatic)')
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }
}

/**
 * Cache factory for creating appropriate cache service based on environment
 */
export class CacheServiceFactory {
  static create(type: 'memory' | 'redis' = 'memory', options?: any): CachingService {
    switch (type) {
      case 'redis':
        return new RedisCachingService(options)
      case 'memory':
      default:
        return new MemoryCachingService(
          options?.maxSize || 1000,
          options?.defaultTtl || 3600
        )
    }
  }
}

/**
 * Default cache instance for easy import
 */
export const defaultCacheService = CacheServiceFactory.create('memory', {
  maxSize: 500,
  defaultTtl: 1800 // 30 minutes
}) 