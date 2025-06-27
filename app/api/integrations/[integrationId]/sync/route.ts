import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Sync request schema
const syncRequestSchema = z.object({
  direction: z.enum(['push', 'pull', 'bidirectional']).optional(),
  entityTypes: z.array(z.enum(['leads', 'bookings', 'tours', 'customers'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  fullSync: z.boolean().default(false)
})

interface RouteParams {
  params: {
    integrationId: string
  }
}

// POST /api/integrations/[integrationId]/sync - Trigger manual sync
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { integrationId } = params
    const body = await request.json()
    const validation = syncRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    })
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === integration.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check if integration is active
    if (!integration.isActive) {
      return NextResponse.json({ error: 'Integration is not active' }, { status: 400 })
    }
    
    const syncOptions = validation.data
    
    // Create sync job
    const syncJob = await createSyncJob(integration, syncOptions, session.user.id)
    
    // Execute sync based on provider
    const syncResult = await executeSyncJob(integration, syncJob, syncOptions)
    
    // Update integration last sync time
    await prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncedAt: new Date() }
    })
    
    // Log sync operation
    await prisma.auditLog.create({
      data: {
        action: 'sync_integration',
        resource: 'integration_sync',
        resourceId: integrationId,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        metadata: {
          syncJobId: syncJob.id,
          options: syncOptions,
          result: syncResult
        }
      }
    })
    
    return NextResponse.json({
      syncJob,
      result: syncResult
    })
    
  } catch (error) {
    console.error('Error syncing integration:', error)
    return NextResponse.json(
      { error: 'Failed to sync integration' },
      { status: 500 }
    )
  }
}

// GET /api/integrations/[integrationId]/sync - Get sync status
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { integrationId } = params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    // Get integration to check permissions
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { operatorId: true }
    })
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === integration.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    if (jobId) {
      // Get specific sync job status
      const syncJob = await getSyncJobStatus(jobId)
      return NextResponse.json({ syncJob })
    } else {
      // Get recent sync jobs
      const recentJobs = await getRecentSyncJobs(integrationId)
      return NextResponse.json({ syncJobs: recentJobs })
    }
    
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}

// Helper functions
async function createSyncJob(integration: any, options: any, userId: string) {
  // In production, create actual job in queue
  return {
    id: `sync-${Date.now()}`,
    integrationId: integration.id,
    status: 'pending',
    direction: options.direction || integration.settings?.syncDirection || 'push',
    entityTypes: options.entityTypes || ['leads', 'bookings'],
    options,
    createdAt: new Date().toISOString(),
    createdBy: userId
  }
}

async function executeSyncJob(integration: any, syncJob: any, options: any) {
  // Simulate sync execution based on provider
  const startTime = Date.now()
  
  try {
    let result
    
    switch (integration.provider) {
      case 'salesforce':
        result = await syncWithSalesforce(integration, options)
        break
      case 'google':
        result = await syncWithGoogle(integration, options)
        break
      case 'mailchimp':
        result = await syncWithMailchimp(integration, options)
        break
      case 'webhook':
        result = await syncWithWebhook(integration, options)
        break
      default:
        result = await syncGeneric(integration, options)
    }
    
    const duration = Date.now() - startTime
    
    return {
      status: 'completed',
      duration,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      ...result
    }
  } catch (error) {
    return {
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      startedAt: new Date(startTime).toISOString(),
      failedAt: new Date().toISOString()
    }
  }
}

async function syncWithSalesforce(integration: any, options: any) {
  // Mock Salesforce sync
  const entities = options.entityTypes || ['leads', 'bookings']
  const results: Record<string, any> = {}
  
  for (const entity of entities) {
    if (entity === 'leads') {
      // Sync leads to Salesforce
      results.leads = {
        pushed: Math.floor(Math.random() * 50),
        updated: Math.floor(Math.random() * 20),
        failed: Math.floor(Math.random() * 5),
        skipped: Math.floor(Math.random() * 10)
      }
    }
    if (entity === 'bookings') {
      // Sync bookings as opportunities
      results.bookings = {
        pushed: Math.floor(Math.random() * 30),
        updated: Math.floor(Math.random() * 10),
        failed: Math.floor(Math.random() * 2),
        skipped: Math.floor(Math.random() * 5)
      }
    }
  }
  
  return {
    provider: 'salesforce',
    entities: results,
    summary: {
      totalProcessed: Object.values(results).reduce((sum, r: any) => sum + r.pushed + r.updated, 0),
      totalFailed: Object.values(results).reduce((sum, r: any) => sum + r.failed, 0)
    }
  }
}

async function syncWithGoogle(integration: any, options: any) {
  // Mock Google Calendar sync
  return {
    provider: 'google',
    entities: {
      calendar_events: {
        created: Math.floor(Math.random() * 20),
        updated: Math.floor(Math.random() * 10),
        deleted: Math.floor(Math.random() * 5),
        failed: 0
      }
    },
    summary: {
      totalProcessed: 35,
      totalFailed: 0
    }
  }
}

async function syncWithMailchimp(integration: any, options: any) {
  // Mock Mailchimp sync
  return {
    provider: 'mailchimp',
    entities: {
      subscribers: {
        added: Math.floor(Math.random() * 100),
        updated: Math.floor(Math.random() * 50),
        unsubscribed: Math.floor(Math.random() * 10),
        failed: Math.floor(Math.random() * 5)
      }
    },
    lists: ['Newsletter', 'Travel Tips', 'Promotions'],
    summary: {
      totalProcessed: 150,
      totalFailed: 5
    }
  }
}

async function syncWithWebhook(integration: any, options: any) {
  // Mock webhook sync
  const webhookUrl = integration.config?.webhookUrl
  
  return {
    provider: 'webhook',
    endpoint: webhookUrl,
    requests: {
      sent: Math.floor(Math.random() * 100),
      successful: Math.floor(Math.random() * 95),
      failed: Math.floor(Math.random() * 5)
      
    },
    avgResponseTime: Math.floor(Math.random() * 500) + 100,
    summary: {
      totalProcessed: 100,
      totalFailed: 5
    }
  }
}

async function syncGeneric(integration: any, options: any) {
  // Generic sync mock
  return {
    provider: integration.provider,
    status: 'completed',
    records: {
      processed: Math.floor(Math.random() * 100),
      failed: Math.floor(Math.random() * 10)
    },
    summary: {
      totalProcessed: 100,
      totalFailed: 10
    }
  }
}

async function getSyncJobStatus(jobId: string) {
  // Mock job status
  return {
    id: jobId,
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    completedAt: new Date().toISOString(),
    results: {
      totalProcessed: 150,
      totalFailed: 5,
      duration: 300
    }
  }
}

async function getRecentSyncJobs(integrationId: string) {
  // Mock recent sync jobs
  return Array.from({ length: 5 }, (_, i) => ({
    id: `sync-${Date.now() - i * 1000000}`,
    integrationId,
    status: i === 0 ? 'running' : 'completed',
    direction: i % 2 === 0 ? 'push' : 'pull',
    startedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    completedAt: i === 0 ? null : new Date(Date.now() - i * 60 * 60 * 1000 + 300000).toISOString(),
    results: i === 0 ? null : {
      totalProcessed: Math.floor(Math.random() * 200),
      totalFailed: Math.floor(Math.random() * 10),
      duration: Math.floor(Math.random() * 600) + 60
    }
  }))
}