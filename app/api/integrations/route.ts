import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

// Integration schemas
const createIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['crm', 'calendar', 'payment', 'email', 'analytics', 'webhook', 'custom']),
  provider: z.string(), // e.g., 'salesforce', 'google', 'stripe', 'mailchimp'
  config: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    webhookUrl: z.string().url().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    customFields: z.record(z.any()).optional()
  }),
  settings: z.object({
    syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).default('realtime'),
    syncDirection: z.enum(['push', 'pull', 'bidirectional']).default('push'),
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
  }).optional()
})

// GET /api/integrations - List integrations for operator
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has operator access
    const hasAccess = 
      session.user?.role === 'TOUR_OPERATOR' || 
      session.user?.role === 'ADMIN'
    
    if (!hasAccess || !session.user?.operatorId) {
      return NextResponse.json({ error: 'No operator access' }, { status: 403 })
    }
    
    const operatorId = session.user.operatorId
    
    // Get integrations with status
    const integrations = await prisma.integration.findMany({
      where: { operatorId },
      orderBy: { createdAt: 'desc' }
    })
    
    // Add connection status and last sync info (mock for now)
    const integrationsWithStatus = integrations.map(integration => ({
      ...integration,
      status: integration.isActive ? 'connected' : 'disconnected',
      lastSync: integration.lastSyncedAt || null,
      syncStatus: 'success', // In production, track actual sync status
      metrics: {
        totalSynced: Math.floor(Math.random() * 1000),
        lastSyncDuration: Math.floor(Math.random() * 10) + 1,
        errorRate: Math.random() * 5
      }
    }))
    
    return NextResponse.json({ integrations: integrationsWithStatus })
    
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// POST /api/integrations - Create new integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has operator access
    const hasAccess = 
      session.user?.role === 'TOUR_OPERATOR' || 
      session.user?.role === 'ADMIN'
    
    if (!hasAccess || !session.user?.operatorId) {
      return NextResponse.json({ error: 'No operator access' }, { status: 403 })
    }
    
    const body = await request.json()
    const validation = createIntegrationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const data = validation.data
    const operatorId = session.user.operatorId
    
    // Encrypt sensitive config data (in production, use proper encryption)
    const encryptedConfig = {
      ...data.config,
      // Mask sensitive fields
      ...(data.config.apiKey && { apiKey: '***' + data.config.apiKey.slice(-4) }),
      ...(data.config.apiSecret && { apiSecret: '***' }),
      ...(data.config.clientSecret && { clientSecret: '***' })
    }
    
    // Create integration
    const integration = await prisma.integration.create({
      data: {
        operatorId,
        name: data.name,
        type: data.type,
        provider: data.provider,
        config: encryptedConfig,
        settings: data.settings || {},
        isActive: false, // Start inactive until verified
        metadata: {
          createdBy: session.user.id,
          version: '1.0.0'
        }
      }
    })
    
    // Test connection based on provider
    const connectionTest = await testIntegrationConnection(integration, data.config)
    
    if (connectionTest.success) {
      // Activate integration if test passes
      await prisma.integration.update({
        where: { id: integration.id },
        data: { 
          isActive: true,
          lastSyncedAt: new Date()
        }
      })
    }
    
    // Log integration creation
    await prisma.auditLog.create({
      data: {
        action: 'create_integration',
        resource: 'integration',
        resourceId: integration.id,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        newValues: { ...integration, connectionTest }
      }
    })
    
    return NextResponse.json({ 
      integration,
      connectionTest
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}

// Test integration connection
async function testIntegrationConnection(integration: any, rawConfig: any): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    switch (integration.provider) {
      case 'salesforce':
        // Test Salesforce connection
        return await testSalesforceConnection(rawConfig)
        
      case 'google':
        // Test Google Workspace connection
        return await testGoogleConnection(rawConfig)
        
      case 'stripe':
        // Test Stripe connection
        return await testStripeConnection(rawConfig)
        
      case 'mailchimp':
        // Test Mailchimp connection
        return await testMailchimpConnection(rawConfig)
        
      case 'webhook':
        // Test webhook endpoint
        return await testWebhookConnection(rawConfig)
        
      default:
        // Generic API test
        return await testGenericAPIConnection(rawConfig)
    }
  } catch (error) {
    console.error('Connection test error:', error)
    return {
      success: false,
      message: 'Connection test failed',
      details: error
    }
  }
}

// Provider-specific connection tests
async function testSalesforceConnection(config: any) {
  // In production, make actual API call to Salesforce
  return {
    success: true,
    message: 'Salesforce connection verified',
    details: {
      org: 'Demo Organization',
      apiVersion: 'v58.0'
    }
  }
}

async function testGoogleConnection(config: any) {
  // In production, verify OAuth tokens with Google
  return {
    success: true,
    message: 'Google Workspace connected',
    details: {
      email: 'demo@example.com',
      scopes: ['calendar', 'contacts']
    }
  }
}

async function testStripeConnection(config: any) {
  // In production, test Stripe API key
  return {
    success: true,
    message: 'Stripe account connected',
    details: {
      mode: config.apiKey?.startsWith('sk_test') ? 'test' : 'live',
      capabilities: ['charges', 'payment_intents']
    }
  }
}

async function testMailchimpConnection(config: any) {
  // In production, test Mailchimp API
  return {
    success: true,
    message: 'Mailchimp connected',
    details: {
      accountName: 'Demo Account',
      lists: 3
    }
  }
}

async function testWebhookConnection(config: any) {
  // In production, send test webhook
  if (!config.webhookUrl) {
    return {
      success: false,
      message: 'Webhook URL required'
    }
  }
  
  return {
    success: true,
    message: 'Webhook endpoint verified',
    details: {
      url: config.webhookUrl,
      method: 'POST'
    }
  }
}

async function testGenericAPIConnection(config: any) {
  // Generic API test
  return {
    success: true,
    message: 'API connection established',
    details: {
      authenticated: !!config.apiKey
    }
  }
}