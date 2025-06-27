import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateLeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = params

    // Get lead with full details
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      include: {
        operator: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // Check if user has access to this lead
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator || operator.id !== lead.operatorId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Enrich with tour information
    let tours = []
    if (lead.tourIds && lead.tourIds.length > 0) {
      tours = await prisma.tour.findMany({
        where: {
          id: { in: lead.tourIds }
        },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          destination: true,
          duration: true,
          durationType: true
        }
      })
    }

    return NextResponse.json({ 
      lead: {
        ...lead,
        tours
      }
    })

  } catch (error) {
    console.error('[Get Lead API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = params
    const body = await request.json()
    const validation = updateLeadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Verify the lead belongs to the operator
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // Check if user has access to this lead
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator || operator.id !== lead.operatorId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Update lead
    const updatedLead = await prisma.leadEnhanced.update({
      where: { id: leadId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    // Create activity for status change
    if (updates.status && updates.status !== lead.status) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          type: 'status_changed',
          description: `Status changed from ${lead.status} to ${updates.status}`,
          metadata: {
            oldStatus: lead.status,
            newStatus: updates.status
          },
          performedBy: session.user.email
        }
      })
    }

    // Create activity for notes
    if (updates.notes) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          type: 'note_added',
          description: 'Note added',
          metadata: {
            note: updates.notes
          },
          performedBy: session.user.email
        }
      })
    }

    return NextResponse.json({ lead: updatedLead })

  } catch (error) {
    console.error('[Update Lead API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = params

    // Verify the lead exists
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // Delete lead (activities will cascade)
    await prisma.leadEnhanced.delete({
      where: { id: leadId }
    })

    return NextResponse.json({ message: 'Lead deleted successfully' })

  } catch (error) {
    console.error('[Delete Lead API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}