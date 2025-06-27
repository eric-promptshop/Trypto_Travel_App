import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updates
const updateOperatorSchema = z.object({
  businessName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  currencies: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    expiryDate: z.string().optional(),
    verificationUrl: z.string().url().optional(),
  })).optional(),
  settings: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      webhook: z.boolean(),
    }).optional(),
    features: z.object({
      aiTourScraping: z.boolean(),
      leadEnrichment: z.boolean(),
      widgetBuilder: z.boolean(),
      integrationHub: z.boolean(),
    }).optional(),
    branding: z.object({
      primaryColor: z.string(),
      secondaryColor: z.string(),
      fontFamily: z.string(),
      logoPosition: z.enum(['left', 'center', 'right']),
    }).optional(),
  }).optional(),
})

interface RouteParams {
  params: {
    operatorId: string
  }
}

// GET /api/operators/[operatorId] - Get operator details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { operatorId } = params
    
    // Check permissions
    const isAdmin = session.user?.role === 'ADMIN'
    const isOperatorUser = session.user?.operatorId === operatorId
    
    if (!isAdmin && !isOperatorUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      include: {
        _count: {
          select: {
            users: true,
            tours: true,
            leads: true,
            bookings: true,
            widgetConfigs: true,
            integrations: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            isActive: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        tours: {
          where: { status: 'active' },
          select: {
            id: true,
            name: true,
            destination: true,
            price: true,
            currency: true,
            rating: true,
            bookingCount: true,
          },
          take: 5,
          orderBy: { bookingCount: 'desc' }
        }
      }
    })
    
    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }
    
    // Calculate additional metrics
    const metrics = {
      totalRevenue: await calculateTotalRevenue(operatorId),
      conversionRate: await calculateConversionRate(operatorId),
      averageRating: await calculateAverageRating(operatorId),
      activeToursCount: operator._count.tours,
      totalBookings: operator._count.bookings,
      totalLeads: operator._count.leads,
    }
    
    return NextResponse.json({
      operator,
      metrics
    })
    
  } catch (error) {
    console.error('Error fetching operator:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operator' },
      { status: 500 }
    )
  }
}

// PATCH /api/operators/[operatorId] - Update operator
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { operatorId } = params
    
    // Check permissions
    const isAdmin = session.user?.role === 'ADMIN'
    const isOperatorAdmin = session.user?.operatorId === operatorId && 
                           (session.user?.role === 'TOUR_OPERATOR' || session.user?.role === 'AGENT')
    
    if (!isAdmin && !isOperatorAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const validation = updateOperatorSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Get current operator for audit log
    const currentOperator = await prisma.operator.findUnique({
      where: { id: operatorId }
    })
    
    if (!currentOperator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }
    
    // Update operator
    const updatedOperator = await prisma.operator.update({
      where: { id: operatorId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'update',
        resource: 'operator',
        resourceId: operatorId,
        tenantId: currentOperator.tenantId,
        userId: session.user.id,
        oldValues: currentOperator as any,
        newValues: updatedOperator as any,
      }
    })
    
    return NextResponse.json({ operator: updatedOperator })
    
  } catch (error) {
    console.error('Error updating operator:', error)
    return NextResponse.json(
      { error: 'Failed to update operator' },
      { status: 500 }
    )
  }
}

// DELETE /api/operators/[operatorId] - Delete operator (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can delete operators
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { operatorId } = params
    
    // Check if operator exists
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      include: {
        _count: {
          select: {
            tours: true,
            bookings: true,
            users: true,
          }
        }
      }
    })
    
    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }
    
    // Prevent deletion if operator has active data
    if (operator._count.bookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete operator with existing bookings' },
        { status: 400 }
      )
    }
    
    // Soft delete by setting status to 'deleted'
    const deletedOperator = await prisma.operator.update({
      where: { id: operatorId },
      data: {
        status: 'deleted',
        updatedAt: new Date()
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'delete',
        resource: 'operator',
        resourceId: operatorId,
        tenantId: operator.tenantId,
        userId: session.user.id,
        oldValues: operator as any,
      }
    })
    
    return NextResponse.json({ message: 'Operator deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting operator:', error)
    return NextResponse.json(
      { error: 'Failed to delete operator' },
      { status: 500 }
    )
  }
}

// Helper functions
async function calculateTotalRevenue(operatorId: string): Promise<number> {
  const bookings = await prisma.booking.findMany({
    where: {
      operatorId,
      status: 'confirmed',
      paymentStatus: 'paid'
    },
    select: {
      totalPrice: true
    }
  })
  
  return bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
}

async function calculateConversionRate(operatorId: string): Promise<number> {
  const [totalLeads, convertedLeads] = await Promise.all([
    prisma.leadEnhanced.count({ where: { operatorId } }),
    prisma.leadEnhanced.count({
      where: {
        operatorId,
        bookings: { some: {} }
      }
    })
  ])
  
  return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
}

async function calculateAverageRating(operatorId: string): Promise<number> {
  const reviews = await prisma.review.findMany({
    where: {
      tour: { operatorId },
      status: 'published'
    },
    select: { rating: true }
  })
  
  if (reviews.length === 0) return 0
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  return Math.round((totalRating / reviews.length) * 10) / 10
}