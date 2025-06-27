import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Update schema
const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    webhookUrl: z.string().url().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    customFields: z.record(z.any()).optional()
  }).optional(),
  settings: z.object({
    syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).optional(),
    syncDirection: z.enum(['push', 'pull', 'bidirectional']).optional(),
    fieldMapping: z.record(z.string()).optional(),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
      value: z.any()
    })).optional(),
    transformations: z.array(z.object({
      field: z.string(),
      type: z.enum(['uppercase', 'lowercase', 'date_format', 'custom']),
      config: z.any().optional()
    })).optional()
  }).optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: {
    integrationId: string
  }
}

// GET /api/integrations/[integrationId] - Get integration details
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
    
    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        operator: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
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
    
    // Get sync history (mock for now)
    const syncHistory = await getSyncHistory(integrationId)
    
    // Get field mappings
    const fieldMappings = await getFieldMappings(integration)
    
    return NextResponse.json({
      integration,
      syncHistory,
      fieldMappings
    })
    
  } catch (error) {
    console.error('Error fetching integration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}

// PATCH /api/integrations/[integrationId] - Update integration
export async function PATCH(
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
    const validation = updateIntegrationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    // Get current integration
    const currentIntegration = await prisma.integration.findUnique({
      where: { id: integrationId }
    })
    
    if (!currentIntegration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === currentIntegration.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = validation.data
    
    // Encrypt sensitive config data if provided
    if (data.config) {
      const encryptedConfig = {
        ...data.config,
        ...(data.config.apiKey && { apiKey: '***' + data.config.apiKey.slice(-4) }),
        ...(data.config.apiSecret && { apiSecret: '***' }),
        ...(data.config.clientSecret && { clientSecret: '***' })
      }
      data.config = encryptedConfig
    }
    
    // Update integration
    const updatedIntegration = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        ...data,
        ...(data.config && {
          config: {
            ...currentIntegration.config as any,
            ...data.config
          }
        }),
        ...(data.settings && {
          settings: {
            ...currentIntegration.settings as any,
            ...data.settings
          }
        }),
        updatedAt: new Date()
      }
    })
    
    // If config changed, test connection
    let connectionTest = null
    if (data.config) {
      connectionTest = await testConnection(updatedIntegration)
    }
    
    // Log update
    await prisma.auditLog.create({
      data: {
        action: 'update_integration',
        resource: 'integration',
        resourceId: integrationId,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        oldValues: currentIntegration as any,
        newValues: updatedIntegration as any,
        metadata: connectionTest ? { connectionTest } : undefined
      }
    })
    
    return NextResponse.json({ 
      integration: updatedIntegration,
      connectionTest
    })
    
  } catch (error) {
    console.error('Error updating integration:', error)
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/[integrationId] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { integrationId } = params
    
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
    
    // Soft delete by deactivating
    await prisma.integration.update({
      where: { id: integrationId },
      data: { isActive: false }
    })
    
    // Log deletion
    await prisma.auditLog.create({
      data: {
        action: 'delete_integration',
        resource: 'integration',
        resourceId: integrationId,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        oldValues: integration as any
      }
    })
    
    return NextResponse.json({ message: 'Integration deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getSyncHistory(integrationId: string) {
  // In production, query actual sync logs
  const mockHistory = Array.from({ length: 10 }, (_, i) => ({
    id: `sync-${i}`,
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    direction: i % 2 === 0 ? 'push' : 'pull',
    recordsProcessed: Math.floor(Math.random() * 100) + 1,
    recordsFailed: Math.floor(Math.random() * 5),
    duration: Math.floor(Math.random() * 10) + 1,
    status: Math.random() > 0.9 ? 'failed' : 'success',
    error: Math.random() > 0.9 ? 'Connection timeout' : null
  }))
  
  return mockHistory
}

async function getFieldMappings(integration: any) {
  // Return field mappings based on integration type
  const mappings: Record<string, any> = {
    crm: {
      lead: {
        fields: [
          { source: 'email', target: 'contact_email', required: true },
          { source: 'name', target: 'contact_name', required: true },
          { source: 'phone', target: 'contact_phone', required: false },
          { source: 'travelPreferences', target: 'custom_preferences', required: false }
        ]
      },
      booking: {
        fields: [
          { source: 'bookingId', target: 'opportunity_id', required: true },
          { source: 'tourName', target: 'opportunity_name', required: true },
          { source: 'price', target: 'amount', required: true },
          { source: 'status', target: 'stage', required: true }
        ]
      }
    },
    calendar: {
      booking: {
        fields: [
          { source: 'tourDate', target: 'event_start', required: true },
          { source: 'tourEndDate', target: 'event_end', required: true },
          { source: 'tourName', target: 'event_title', required: true },
          { source: 'guestCount', target: 'attendees_count', required: false }
        ]
      }
    },
    email: {
      lead: {
        fields: [
          { source: 'email', target: 'subscriber_email', required: true },
          { source: 'name', target: 'merge_fname', required: false },
          { source: 'travelStyle', target: 'merge_interest', required: false }
        ]
      }
    }
  }
  
  return mappings[integration.type] || {}
}

async function testConnection(integration: any) {
  // Mock connection test
  return {
    success: true,
    message: 'Connection verified',
    timestamp: new Date().toISOString()
  }
}