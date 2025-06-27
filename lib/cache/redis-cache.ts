import { Redis } from '@upstash/redis';

// Initialize Redis client (works in both edge and Node.js environments)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache configuration
const CACHE_PREFIX = 'itinerary:';
const DEFAULT_TTL = 3600; // 1 hour
const MAX_CACHE_SIZE = 1000; // Maximum number of cached itineraries

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

// Generate cache key from trip data
export function generateCacheKey(tripData: any): string {
  const parts = [
    tripData.destination?.toLowerCase().replace(/\s+/g, '_'),
    tripData.dates?.from,
    tripData.dates?.to,
    tripData.travelers || 2,
    tripData.budget?.[1] || 5000,
    (tripData.interests || []).sort().join('-')
  ].filter(Boolean);
  
  return `${CACHE_PREFIX}${parts.join(':')}`;
}

// Get cached itinerary
export async function getCachedItinerary(tripData: any): Promise<any | null> {
  if (!redis) return null;
  
  try {
    const key = generateCacheKey(tripData);
    const cached = await redis.get(key);
    
    if (cached) {
      // Update access time for LRU
      await redis.expire(key, DEFAULT_TTL);
      return cached;
    }
    
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null; // Fail gracefully
  }
}

// Cache itinerary
export async function cacheItinerary(
  tripData: any, 
  itinerary: any, 
  options: CacheOptions = {}
): Promise<void> {
  if (!redis) return;
  
  try {
    const key = generateCacheKey(tripData);
    const ttl = options.ttl || DEFAULT_TTL;
    
    // Store with expiration
    await redis.setex(key, ttl, JSON.stringify(itinerary));
    
    // Store metadata for analytics
    await redis.zadd('cache:access', {
      score: Date.now(),
      member: key
    });
    
    // Maintain cache size limit (LRU eviction)
    const cacheSize = await redis.zcard('cache:access');
    if (cacheSize > MAX_CACHE_SIZE) {
      const toRemove = await redis.zrange('cache:access', 0, cacheSize - MAX_CACHE_SIZE - 1);
      if (toRemove.length > 0) {
        await redis.del(...toRemove);
        await redis.zrem('cache:access', ...toRemove);
      }
    }
    
  } catch (error) {
    console.error('Redis set error:', error);
    // Fail gracefully - caching is not critical
  }
}

// Invalidate cache by pattern
export async function invalidateCache(pattern: string): Promise<number> {
  if (!redis) return 0;
  
  try {
    // Note: SCAN is not available in Upstash free tier
    // For production, consider upgrading or implementing tag-based invalidation
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.zrem('cache:access', ...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('Redis invalidate error:', error);
    return 0;
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<any> {
  if (!redis) {
    return { enabled: false, message: 'Redis not configured' };
  }
  
  try {
    const cacheSize = await redis.zcard('cache:access');
    const recentKeys = await redis.zrevrange('cache:access', 0, 9, { withScores: true });
    
    return {
      enabled: true,
      size: cacheSize,
      maxSize: MAX_CACHE_SIZE,
      ttl: DEFAULT_TTL,
      recentAccess: recentKeys.map(({ member, score }) => ({
        key: member,
        accessTime: new Date(score).toISOString()
      }))
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return { enabled: true, error: 'Failed to get stats' };
  }
}

// Clear all cache
export async function clearAllCache(): Promise<void> {
  if (!redis) return;
  
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del('cache:access');
  } catch (error) {
    console.error('Redis clear error:', error);
  }
}

// Warm up cache with popular destinations
export async function warmUpCache(): Promise<void> {
  if (!redis) return;
  
  const popularDestinations = [
    { destination: 'Paris, France', duration: 4 },
    { destination: 'Tokyo, Japan', duration: 5 },
    { destination: 'Rome, Italy', duration: 3 },
    { destination: 'Lima, Peru', duration: 5 },
    { destination: 'London, UK', duration: 4 },
    { destination: 'New York, USA', duration: 5 }
  ];
  
  
  // This would be called during app initialization
  // Actual implementation would generate itineraries for these
}