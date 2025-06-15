import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats as getInMemoryStats, clearCache as clearInMemory } from '@/lib/ai/enhanced-itinerary-generator-optimized'
import { getCacheStats as getRedisStats, clearAllCache, invalidateCache } from '@/lib/cache/redis-cache'
import { getPerformanceStats } from '@/lib/ai/ultra-fast-generator'

export async function GET(request: NextRequest) {
  try {
    // Get stats from all cache layers
    const [inMemoryStats, redisStats, ultraFastStats] = await Promise.all([
      getInMemoryStats(),
      getRedisStats(),
      getPerformanceStats()
    ])
    
    return NextResponse.json({
      success: true,
      caches: {
        inMemory: inMemoryStats,
        redis: redisStats,
        ultraFast: ultraFastStats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache stats'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for specific cache target
    const { searchParams } = new URL(request.url)
    const target = searchParams.get('target')
    const pattern = searchParams.get('pattern')
    
    if (pattern) {
      // Invalidate by pattern
      const count = await invalidateCache(pattern)
      return NextResponse.json({
        success: true,
        message: `Invalidated ${count} cache entries matching pattern: ${pattern}`,
        timestamp: new Date().toISOString()
      })
    }
    
    // Clear specific cache or all
    switch (target) {
      case 'redis':
        await clearAllCache()
        break
      case 'memory':
        clearInMemory()
        break
      default:
        // Clear all caches
        await Promise.all([
          clearAllCache(),
          clearInMemory()
        ])
    }
    
    return NextResponse.json({
      success: true,
      message: `Cache${target ? ` (${target})` : 's'} cleared successfully`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}