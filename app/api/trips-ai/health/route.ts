import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/ai/enhanced-itinerary-generator-optimized'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Collect health metrics
  const metrics = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      openai: { status: 'unknown', responseTime: null as number | null },
      database: { status: 'unknown', responseTime: null as number | null },
      cache: { status: 'unknown', stats: {} as any }
    },
    performance: {
      averageGenerationTime: null as number | null,
      recentErrors: 0,
      successRate: null as number | null
    }
  }

  // Check OpenAI API health
  try {
    const openaiStart = Date.now()
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`
      },
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      metrics.services.openai.status = 'healthy'
      metrics.services.openai.responseTime = Date.now() - openaiStart
    } else {
      metrics.services.openai.status = 'degraded'
    }
  } catch (error) {
    metrics.services.openai.status = 'unhealthy'
    metrics.status = 'degraded'
  }

  // Check database health
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    metrics.services.database.status = 'healthy'
    metrics.services.database.responseTime = Date.now() - dbStart
  } catch (error) {
    metrics.services.database.status = 'unhealthy'
    metrics.status = 'degraded'
  }

  // Get cache stats
  try {
    const cacheStats = getCacheStats()
    metrics.services.cache.status = 'healthy'
    metrics.services.cache.stats = cacheStats
  } catch (error) {
    metrics.services.cache.status = 'unknown'
  }

  // Calculate performance metrics (last 24 hours)
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const itineraries = await prisma.itinerary.findMany({
      where: {
        createdAt: { gte: yesterday }
      },
      select: {
        metadata: true
      }
    })

    if (itineraries.length > 0) {
      const generationTimes = itineraries
        .map(it => {
          try {
            const meta = JSON.parse(it.metadata || '{}')
            return meta.generationTime || null
          } catch {
            return null
          }
        })
        .filter(t => t !== null) as number[]

      if (generationTimes.length > 0) {
        metrics.performance.averageGenerationTime = 
          Math.round(generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length)
      }

      // Calculate success rate
      const leads = await prisma.lead.count({
        where: {
          createdAt: { gte: yesterday },
          itinerary: { not: null }
        }
      })

      const totalLeads = await prisma.lead.count({
        where: {
          createdAt: { gte: yesterday }
        }
      })

      if (totalLeads > 0) {
        metrics.performance.successRate = Math.round((leads / totalLeads) * 100)
      }
    }
  } catch (error) {
    console.error('Failed to calculate performance metrics:', error)
  }

  // Determine overall health
  const unhealthyServices = Object.values(metrics.services)
    .filter(s => s.status === 'unhealthy').length
  
  if (unhealthyServices > 0) {
    metrics.status = 'unhealthy'
  } else if (Object.values(metrics.services).some(s => s.status === 'degraded')) {
    metrics.status = 'degraded'
  }

  const responseTime = Date.now() - startTime

  return NextResponse.json({
    ...metrics,
    responseTime
  }, {
    status: metrics.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}