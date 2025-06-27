import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Verification schema
const verifySchema = z.object({
  domain: z.string()
})

// POST /api/widgets/verify - Verify widget API key and domain
export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-Widget-API-Key')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = verifySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { domain } = validation.data
    
    // Find widget by API key
    const widget = await prisma.widgetConfig.findUnique({
      where: { apiKey },
      include: {
        operator: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            isVerified: true
          }
        }
      }
    })
    
    if (!widget) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    // Check if widget is active
    if (!widget.isActive) {
      return NextResponse.json({ error: 'Widget is disabled' }, { status: 403 })
    }
    
    // Check domain restrictions
    if (widget.domains.length > 0 && !widget.domains.includes(domain)) {
      // Check for wildcard domains
      const isAllowed = widget.domains.some(allowedDomain => {
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.slice(2)
          return domain.endsWith(baseDomain)
        }
        return domain === allowedDomain
      })
      
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not authorized' },
          { status: 403 }
        )
      }
    }
    
    // Log widget access
    await prisma.auditLog.create({
      data: {
        action: 'widget_verified',
        resource: 'widget',
        resourceId: widget.id,
        tenantId: widget.operator?.id || 'default',
        userId: 'widget-api',
        metadata: {
          domain,
          apiKey: apiKey.substring(0, 8) + '...',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })
    
    // Return widget configuration
    return NextResponse.json({
      widget: {
        id: widget.id,
        type: widget.type,
        theme: widget.theme,
        features: widget.features,
        settings: widget.settings,
        operator: {
          name: widget.operator.businessName,
          logo: widget.operator.logo,
          verified: widget.operator.isVerified
        }
      }
    })
    
  } catch (error) {
    console.error('Error verifying widget:', error)
    return NextResponse.json(
      { error: 'Failed to verify widget' },
      { status: 500 }
    )
  }
}