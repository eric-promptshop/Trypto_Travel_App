import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

const createWidgetSchema = z.object({
  name: z.string(),
  type: z.enum(['itinerary_builder', 'tour_discovery']),
  domains: z.array(z.string()),
  theme: z.object({
    primaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    borderRadius: z.string().optional()
  }).optional(),
  features: z.array(z.string()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get operator info
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator) {
      return NextResponse.json({ message: 'Operator not found' }, { status: 404 })
    }

    // Fetch widgets
    const widgets = await prisma.widgetConfig.findMany({
      where: {
        operatorId: operator.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ widgets })

  } catch (error) {
    console.error('[Widgets API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch widgets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createWidgetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, type, domains, theme, features } = validation.data

    // Get operator info
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator) {
      return NextResponse.json({ message: 'Operator not found' }, { status: 404 })
    }

    // Generate unique API key
    const apiKey = `tn_${crypto.randomBytes(32).toString('hex')}`

    // Create widget
    const widget = await prisma.widgetConfig.create({
      data: {
        operatorId: operator.id,
        name,
        type,
        domains,
        theme: theme || {
          primaryColor: '#FF6B35',
          fontFamily: 'Inter',
          borderRadius: '8px'
        },
        features: features || ['tour_discovery', 'lead_capture'],
        apiKey,
        isActive: true
      }
    })

    return NextResponse.json({ 
      success: true,
      widget: {
        id: widget.id,
        name: widget.name,
        apiKey: widget.apiKey
      }
    })

  } catch (error) {
    console.error('[Create Widget API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to create widget' },
      { status: 500 }
    )
  }
}