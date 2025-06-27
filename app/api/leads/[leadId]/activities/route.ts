import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

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

    // Verify the lead belongs to the operator
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      include: {
        operator: true
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

    // Fetch activities
    const activities = await prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('[Lead Activities API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { type, description, metadata } = body

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

    // Create activity
    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type,
        description,
        metadata: metadata || {},
        performedBy: session.user.email
      }
    })

    // Update lead's lastEngagedAt
    await prisma.leadEnhanced.update({
      where: { id: leadId },
      data: { lastEngagedAt: new Date() }
    })

    return NextResponse.json({ activity })

  } catch (error) {
    console.error('[Create Lead Activity API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to create activity' },
      { status: 500 }
    )
  }
}