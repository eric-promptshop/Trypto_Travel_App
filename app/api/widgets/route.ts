import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

// Validation schemas
const createWidgetSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['itinerary_builder', 'tour_showcase', 'lead_capture', 'booking_calendar']).default('itinerary_builder'),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#1E40AF'),
    fontFamily: z.string().default('Inter'),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
    buttonStyle: z.enum(['solid', 'outline', 'ghost']).default('solid'),
    logoUrl: z.string().url().optional(),
    logoPosition: z.enum(['left', 'center', 'right', 'hidden']).default('left'),
    customCSS: z.string().optional(),
  }),
  features: z.array(z.enum([
    'natural_language_input',
    'voice_input',
    'ai_suggestions',
    'tour_recommendations',
    'instant_booking',
    'lead_capture',
    'multi_language',
    'custom_branding',
    'analytics',
    'chat_support'
  ])).default(['natural_language_input', 'ai_suggestions', 'lead_capture']),
  domains: z.array(z.string()).default([]),
  settings: z.object({
    language: z.string().default('en'),
    currency: z.string().default('USD'),
    defaultDestination: z.string().optional(),
    tourCategories: z.array(z.string()).optional(),
    maxTravelers: z.number().default(10),
    dateRangeLimit: z.number().default(365),
    requireEmail: z.boolean().default(true),
    requirePhone: z.boolean().default(false),
    customFields: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'number', 'select', 'checkbox']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
})

const updateWidgetSchema = createWidgetSchema.partial()

// GET /api/widgets - List widgets for operator
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has operator access
    const hasAccess = 
      session.user?.role === 'TOUR_OPERATOR' || 
      session.user?.role === 'AGENT' ||
      session.user?.role === 'ADMIN'
    
    if (!hasAccess || !session.user?.operatorId) {
      return NextResponse.json({ error: 'No operator access' }, { status: 403 })
    }
    
    const operatorId = session.user.operatorId
    
    // Get widgets with analytics
    const widgets = await prisma.widgetConfig.findMany({
      where: { operatorId },
      include: {
        _count: {
          select: {
            // Note: These would be from analytics tables in production
            // For now, we'll add mock data
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Add mock analytics data
    const widgetsWithAnalytics = widgets.map(widget => ({
      ...widget,
      analytics: {
        totalViews: Math.floor(Math.random() * 10000),
        uniqueVisitors: Math.floor(Math.random() * 5000),
        conversions: Math.floor(Math.random() * 100),
        conversionRate: Math.random() * 10,
        avgSessionDuration: Math.floor(Math.random() * 300),
        topReferrers: [
          { domain: 'google.com', visits: Math.floor(Math.random() * 1000) },
          { domain: 'facebook.com', visits: Math.floor(Math.random() * 500) },
        ]
      }
    }))
    
    return NextResponse.json({ widgets: widgetsWithAnalytics })
    
  } catch (error) {
    console.error('Error fetching widgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch widgets' },
      { status: 500 }
    )
  }
}

// POST /api/widgets - Create new widget
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
    const validation = createWidgetSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const data = validation.data
    const operatorId = session.user.operatorId
    
    // Generate unique API key
    const apiKey = `wgt_${randomBytes(32).toString('hex')}`
    
    // Create widget configuration
    const widget = await prisma.widgetConfig.create({
      data: {
        operatorId,
        name: data.name,
        type: data.type,
        theme: data.theme,
        features: data.features,
        domains: data.domains,
        apiKey,
        isActive: true,
        analytics: {
          initialized: true,
          startDate: new Date().toISOString()
        },
        ...data.settings && { settings: data.settings }
      }
    })
    
    // Generate embed code
    const embedCode = generateEmbedCode(widget)
    
    // Log widget creation
    await prisma.auditLog.create({
      data: {
        action: 'create_widget',
        resource: 'widget',
        resourceId: widget.id,
        tenantId: session.user?.tenantId || 'default',
        userId: session.user.id,
        newValues: widget as any,
      }
    })
    
    return NextResponse.json({ 
      widget,
      embedCode
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating widget:', error)
    return NextResponse.json(
      { error: 'Failed to create widget' },
      { status: 500 }
    )
  }
}

// Helper function to generate embed code
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