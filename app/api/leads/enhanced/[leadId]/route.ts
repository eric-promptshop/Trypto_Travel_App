import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updates
const updateLeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  flexibleDates: z.boolean().optional(),
  travelers: z.number().optional(),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  interests: z.array(z.string()).optional(),
  specialRequests: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

interface RouteParams {
  params: {
    leadId: string
  }
}

// GET /api/leads/enhanced/[leadId] - Get lead details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { leadId } = params
    
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      include: {
        operator: {
          select: {
            id: true,
            businessName: true,
            email: true,
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        bookings: {
          include: {
            tour: {
              select: {
                id: true,
                name: true,
                destination: true,
                price: true,
                currency: true,
              }
            }
          }
        },
        _count: {
          select: {
            activities: true,
            bookings: true,
          }
        }
      }
    })
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === lead.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Calculate engagement metrics
    const engagementMetrics = calculateEngagementMetrics(lead)
    
    // Get similar leads for context
    const similarLeads = await getSimilarLeads(leadId, lead)
    
    return NextResponse.json({
      lead,
      metrics: engagementMetrics,
      similarLeads
    })
    
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PATCH /api/leads/enhanced/[leadId] - Update lead
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { leadId } = params
    const body = await request.json()
    const validation = updateLeadSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    // Get current lead
    const currentLead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId }
    })
    
    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === currentLead.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = validation.data
    
    // Track status changes
    const statusChanged = data.status && data.status !== currentLead.status
    
    // Update lead
    const updatedLead = await prisma.leadEnhanced.update({
      where: { id: leadId },
      data: {
        ...data,
        lastEngagedAt: new Date(),
        engagementHistory: {
          ...currentLead.engagementHistory as any,
          lastUpdate: {
            timestamp: new Date(),
            updatedBy: session.user.id,
            changes: Object.keys(data)
          }
        }
      }
    })
    
    // Log activity
    const activities: any[] = []
    
    if (statusChanged) {
      activities.push({
        leadId,
        type: 'status_changed',
        description: `Status changed from ${currentLead.status} to ${data.status}`,
        metadata: {
          oldStatus: currentLead.status,
          newStatus: data.status
        },
        performedBy: session.user.id
      })
    }
    
    if (data.score !== undefined && data.score !== currentLead.score) {
      activities.push({
        leadId,
        type: 'score_updated',
        description: `Lead score updated from ${currentLead.score} to ${data.score}`,
        metadata: {
          oldScore: currentLead.score,
          newScore: data.score
        },
        performedBy: session.user.id
      })
    }
    
    if (data.assignedTo && data.assignedTo !== currentLead.assignedTo) {
      activities.push({
        leadId,
        type: 'assigned',
        description: `Lead assigned to ${data.assignedTo}`,
        metadata: { assignedTo: data.assignedTo },
        performedBy: session.user.id
      })
    }
    
    if (data.notes && data.notes !== currentLead.notes) {
      activities.push({
        leadId,
        type: 'note_added',
        description: 'Note added to lead',
        metadata: { note: data.notes },
        performedBy: session.user.id
      })
    }
    
    if (activities.length > 0) {
      await prisma.leadActivity.createMany({ data: activities })
    }
    
    return NextResponse.json({ lead: updatedLead })
    
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/enhanced/[leadId] - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { leadId } = params
    
    // Get lead to check permissions
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    
    // Check permissions
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === lead.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Prevent deletion if lead has bookings
    if (lead._count.bookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete lead with existing bookings' },
        { status: 400 }
      )
    }
    
    // Delete lead (cascade will delete activities)
    await prisma.leadEnhanced.delete({
      where: { id: leadId }
    })
    
    return NextResponse.json({ message: 'Lead deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateEngagementMetrics(lead: any) {
  const now = new Date()
  const createdAt = new Date(lead.createdAt)
  const lastEngaged = lead.lastEngagedAt ? new Date(lead.lastEngagedAt) : createdAt
  
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const daysSinceLastEngagement = Math.floor((now.getTime() - lastEngaged.getTime()) / (1000 * 60 * 60 * 24))
  
  const engagementRate = lead._count.activities > 0 ? 
    Math.min(100, (lead._count.activities / daysSinceCreation) * 10) : 0
  
  return {
    daysSinceCreation,
    daysSinceLastEngagement,
    totalActivities: lead._count.activities,
    totalBookings: lead._count.bookings,
    engagementRate: Math.round(engagementRate),
    lifetimeValue: lead.bookings.reduce((sum: number, booking: any) => 
      sum + (booking.totalPrice || 0), 0
    )
  }
}

async function getSimilarLeads(excludeId: string, lead: any) {
  const similarLeads = await prisma.leadEnhanced.findMany({
    where: {
      id: { not: excludeId },
      operatorId: lead.operatorId,
      OR: [
        { destination: lead.destination },
        { interests: { hasSome: lead.interests } },
        {
          AND: [
            { budget: { path: ['min'], gte: lead.budget?.min || 0 } },
            { budget: { path: ['max'], lte: lead.budget?.max || 999999 } }
          ]
        }
      ]
    },
    select: {
      id: true,
      email: true,
      destination: true,
      score: true,
      status: true,
      createdAt: true,
    },
    take: 5,
    orderBy: { score: 'desc' }
  })
  
  return similarLeads
}