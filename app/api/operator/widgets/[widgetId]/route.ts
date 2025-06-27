import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateWidgetSchema = z.object({
  name: z.string().optional(),
  domains: z.array(z.string()).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    borderRadius: z.string().optional()
  }).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { widgetId } = params

    // Get widget with analytics
    const widget = await prisma.widgetConfig.findUnique({
      where: { id: widgetId },
      include: {
        operator: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    })

    if (!widget) {
      return NextResponse.json({ message: 'Widget not found' }, { status: 404 })
    }

    // Verify ownership
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator || operator.id !== widget.operatorId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ widget })

  } catch (error) {
    console.error('[Get Widget API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch widget' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { widgetId } = params
    const body = await request.json()
    const validation = updateWidgetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Verify widget exists and user has access
    const widget = await prisma.widgetConfig.findUnique({
      where: { id: widgetId }
    })

    if (!widget) {
      return NextResponse.json({ message: 'Widget not found' }, { status: 404 })
    }

    // Verify ownership
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator || operator.id !== widget.operatorId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Update widget
    const updatedWidget = await prisma.widgetConfig.update({
      where: { id: widgetId },
      data: validation.data
    })

    return NextResponse.json({ widget: updatedWidget })

  } catch (error) {
    console.error('[Update Widget API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to update widget' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { widgetId } = params

    // Verify widget exists and user has access
    const widget = await prisma.widgetConfig.findUnique({
      where: { id: widgetId }
    })

    if (!widget) {
      return NextResponse.json({ message: 'Widget not found' }, { status: 404 })
    }

    // Verify ownership
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator || operator.id !== widget.operatorId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Delete widget
    await prisma.widgetConfig.delete({
      where: { id: widgetId }
    })

    return NextResponse.json({ message: 'Widget deleted successfully' })

  } catch (error) {
    console.error('[Delete Widget API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to delete widget' },
      { status: 500 }
    )
  }
}