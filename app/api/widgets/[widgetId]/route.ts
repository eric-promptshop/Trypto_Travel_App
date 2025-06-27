import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Update schema
const updateWidgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['itinerary_builder', 'tour_showcase', 'lead_capture', 'booking_calendar']).optional(),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    fontFamily: z.string().optional(),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
    buttonStyle: z.enum(['solid', 'outline', 'ghost']).optional(),
    logoUrl: z.string().url().optional().nullable(),
    logoPosition: z.enum(['left', 'center', 'right', 'hidden']).optional(),
    customCSS: z.string().optional(),
  }).optional(),
  features: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  settings: z.any().optional(),
})

interface RouteParams {
  params: {
    widgetId: string
  }
}

// GET /api/widgets/[widgetId] - Get widget details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { widgetId } = params
    
    // Get widget
    const widget = await prisma.widgetConfig.findUnique({
      where: { id: widgetId },
      include: {
        operator: {
          select: {
            id: true,
            businessName: true,
            logo: true,
          }
        }
      }
    })
    
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === widget.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get analytics data (mock for now)
    const analytics = await getWidgetAnalytics(widgetId)
    
    // Generate embed code
    const embedCode = generateEmbedCode(widget)
    
    return NextResponse.json({
      widget,
      analytics,
      embedCode
    })
    
  } catch (error) {
    console.error('Error fetching widget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch widget' },
      { status: 500 }
    )
  }
}

// PATCH /api/widgets/[widgetId] - Update widget
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { widgetId } = params
    const body = await request.json()
    const validation = updateWidgetSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    // Get current widget
    const currentWidget = await prisma.widgetConfig.findUnique({
      where: { id: widgetId }
    })
    
    if (!currentWidget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === currentWidget.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = validation.data
    
    // Update widget
    const updatedWidget = await prisma.widgetConfig.update({
      where: { id: widgetId },
      data: {
        ...data,
        // Merge theme updates
        ...(data.theme && {
          theme: {
            ...currentWidget.theme as any,
            ...data.theme
          }
        }),
        updatedAt: new Date()
      }
    })
    
    // Log update
    await prisma.auditLog.create({
      data: {
        action: 'update_widget',
        resource: 'widget',
        resourceId: widgetId,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        oldValues: currentWidget as any,
        newValues: updatedWidget as any,
      }
    })
    
    // Notify connected widgets to refresh (in production, use WebSocket)
    notifyWidgetUpdate(widgetId)
    
    return NextResponse.json({ widget: updatedWidget })
    
  } catch (error) {
    console.error('Error updating widget:', error)
    return NextResponse.json(
      { error: 'Failed to update widget' },
      { status: 500 }
    )
  }
}

// DELETE /api/widgets/[widgetId] - Delete widget
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { widgetId } = params
    
    // Get widget
    const widget = await prisma.widgetConfig.findUnique({
      where: { id: widgetId }
    })
    
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === widget.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Soft delete by deactivating
    await prisma.widgetConfig.update({
      where: { id: widgetId },
      data: { isActive: false }
    })
    
    // Log deletion
    await prisma.auditLog.create({
      data: {
        action: 'delete_widget',
        resource: 'widget',
        resourceId: widgetId,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        oldValues: widget as any,
      }
    })
    
    return NextResponse.json({ message: 'Widget deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting widget:', error)
    return NextResponse.json(
      { error: 'Failed to delete widget' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getWidgetAnalytics(widgetId: string) {
  // In production, this would query real analytics data
  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  return {
    period: {
      start: last30Days.toISOString(),
      end: now.toISOString()
    },
    metrics: {
      totalLoads: Math.floor(Math.random() * 10000),
      uniqueUsers: Math.floor(Math.random() * 5000),
      interactions: Math.floor(Math.random() * 3000),
      completedItineraries: Math.floor(Math.random() * 200),
      leadsGenerated: Math.floor(Math.random() * 150),
      avgSessionDuration: Math.floor(Math.random() * 300) + 60,
      bounceRate: Math.random() * 50,
      conversionRate: Math.random() * 10,
    },
    topDestinations: [
      { destination: 'Paris, France', count: Math.floor(Math.random() * 100) },
      { destination: 'Rome, Italy', count: Math.floor(Math.random() * 80) },
      { destination: 'Bali, Indonesia', count: Math.floor(Math.random() * 60) },
    ],
    deviceBreakdown: {
      desktop: 45,
      mobile: 40,
      tablet: 15
    },
    browserBreakdown: {
      chrome: 60,
      safari: 20,
      firefox: 10,
      other: 10
    },
    performanceMetrics: {
      avgLoadTime: (Math.random() * 2 + 0.5).toFixed(2),
      errorRate: (Math.random() * 2).toFixed(2),
      apiResponseTime: (Math.random() * 500 + 100).toFixed(0),
    }
  }
}

function generateEmbedCode(widget: any): string {
  const scriptUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.yourdomain.com'
  
  return `<!-- AI Travel Planner Widget - ${widget.name} -->
<div id="tripnav-widget-${widget.id}"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${scriptUrl}/widget.js';
    script.async = true;
    script.onload = function() {
      TripNavWidget.init({
        apiKey: '${widget.apiKey}',
        containerId: 'tripnav-widget-${widget.id}',
        type: '${widget.type}',
        theme: ${JSON.stringify(widget.theme, null, 2)},
        features: ${JSON.stringify(widget.features)},
        settings: ${JSON.stringify(widget.settings || {})}
      });
    };
    document.head.appendChild(script);
  })();
</script>
<!-- End AI Travel Planner Widget -->`
}

function notifyWidgetUpdate(widgetId: string) {
  // In production, this would notify connected widgets via WebSocket
}