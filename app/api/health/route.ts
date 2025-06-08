import { NextResponse } from 'next/server'
import { healthMonitor } from '@/lib/monitoring/health-monitor'
import { createSuccessResponse, createInternalServerErrorResponse, withErrorHandling } from '@/lib/api/response'

export const GET = withErrorHandling(async () => {
  const health = await healthMonitor.checkSystemHealth()
  
  // Log metrics for historical tracking
  await healthMonitor.logHealthMetrics(health)
  
  // Return appropriate status code based on health
  const statusCode = health.overall === 'healthy' ? 200 : 
                    health.overall === 'degraded' ? 206 : 503

  return createSuccessResponse(health, undefined, statusCode)
}) 