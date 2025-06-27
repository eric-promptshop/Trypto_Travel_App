import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Analytics event schema
const analyticsEventSchema = z.object({
  eventName: z.string(),
  eventData: z.any().optional(),
  widgetId: z.string().optional(),
  domain: z.string(),
  page: z.string(),
  referrer: z.string().optional(),
  userAgent: z.string(),
  timestamp: z.string()
})

// POST /api/widgets/analytics - Track widget analytics events
export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-Widget-API-Key')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = analyticsEventSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Find widget by API key
    const widget = await prisma.widgetConfig.findUnique({
      where: { apiKey },
      select: {
        id: true,
        operatorId: true,
        isActive: true
      }
    })
    
    if (!widget) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    if (!widget.isActive) {
      return NextResponse.json({ error: 'Widget is disabled' }, { status: 403 })
    }
    
    // In production, you would store this in a proper analytics database
    // For now, we'll create an audit log entry
    await prisma.auditLog.create({
      data: {
        action: `widget_event_${data.eventName}`,
        resource: 'widget_analytics',
        resourceId: widget.id,
        tenantId: widget.operatorId,
        userId: 'widget-user',
        metadata: {
          eventName: data.eventName,
          eventData: data.eventData,
          domain: data.domain,
          page: data.page,
          referrer: data.referrer,
          userAgent: data.userAgent,
          timestamp: data.timestamp,
          // Additional context
          clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          country: request.headers.get('x-vercel-ip-country') || 'unknown',
          city: request.headers.get('x-vercel-ip-city') || 'unknown'
        }
      }
    })
    
    // Handle specific events
    switch (data.eventName) {
      case 'lead_captured':
        // In production, create a lead record
        break
        
      case 'booking_created':
        // In production, create a booking record
        break
        
      case 'itinerary_generated':
        // Track popular destinations
        break
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error tracking analytics:', error)
    // Don't return errors for analytics to avoid breaking the widget
    return NextResponse.json({ success: true })
  }
}

// GET /api/widgets/analytics - Get widget analytics (for dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const widgetId = searchParams.get('widgetId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID required' }, { status: 400 })
    }
    
    // In production, this would query a proper analytics database
    // For now, we'll return mock data based on audit logs
    const logs = await prisma.auditLog.findMany({
      where: {
        resourceId: widgetId,
        action: {
          startsWith: 'widget_event_'
        },
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    })
    
    // Aggregate analytics data
    const analytics = {
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      },
      events: {
        total: logs.length,
        byType: logs.reduce((acc, log) => {
          const eventType = log.action.replace('widget_event_', '')
          acc[eventType] = (acc[eventType] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      domains: logs.reduce((acc, log) => {
        const domain = (log.metadata as any)?.domain
        if (domain) {
          acc[domain] = (acc[domain] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      pages: logs.reduce((acc, log) => {
        const page = (log.metadata as any)?.page
        if (page) {
          acc[page] = (acc[page] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      referrers: logs.reduce((acc, log) => {
        const referrer = (log.metadata as any)?.referrer
        if (referrer && referrer !== '') {
          acc[referrer] = (acc[referrer] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      countries: logs.reduce((acc, log) => {
        const country = (log.metadata as any)?.country
        if (country && country !== 'unknown') {
          acc[country] = (acc[country] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({ analytics })
    
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}