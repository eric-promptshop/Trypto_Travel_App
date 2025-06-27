import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createActivitySchema = z.object({
  type: z.string(),
  description: z.string(),
  metadata: z.any().optional(),
})

interface RouteParams {
  params: {
    leadId: string
  }
}

// GET /api/leads/enhanced/[leadId]/activities - Get lead activities
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
    
    // Check if lead exists and user has access
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      select: { operatorId: true }
    })
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === lead.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get activities with pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') || undefined
    
    const skip = (page - 1) * limit
    
    const where: any = { leadId }
    if (type) where.type = type
    
    const [activities, total] = await Promise.all([
      prisma.leadActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      }),
      prisma.leadActivity.count({ where })
    ])
    
    // Get activity type distribution
    const typeDistribution = await prisma.leadActivity.groupBy({
      by: ['type'],
      where: { leadId },
      _count: { _all: true }
    })
    
    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        byType: typeDistribution.reduce((acc, curr) => {
          acc[curr.type] = curr._count._all
          return acc
        }, {} as Record<string, number>)
      }
    })
    
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST /api/leads/enhanced/[leadId]/activities - Create activity
export async function POST(
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
    const validation = createActivitySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    // Check if lead exists and user has access
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      select: { operatorId: true }
    })
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    
    const hasAccess = 
      session.user?.role === 'ADMIN' ||
      (session.user?.operatorId && session.user.operatorId === lead.operatorId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { type, description, metadata } = validation.data
    
    // Create activity
    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type,
        description,
        metadata,
        performedBy: session.user.id
      }
    })
    
    // Update lead's last engaged timestamp
    await prisma.leadEnhanced.update({
      where: { id: leadId },
      data: { lastEngagedAt: new Date() }
    })
    
    // Handle specific activity types
    if (type === 'email_sent' || type === 'call_made') {
      await updateLeadEngagementScore(leadId)
    }
    
    return NextResponse.json({ activity }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

// Helper function to update engagement score
async function updateLeadEngagementScore(leadId: string) {
  const activities = await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  // Calculate engagement score based on recent activities
  let score = 50 // Base score
  
  activities.forEach(activity => {
    const ageInDays = (Date.now() - activity.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const recencyMultiplier = Math.max(0.1, 1 - (ageInDays / 30))
    
    switch (activity.type) {
      case 'email_sent':
        score += 5 * recencyMultiplier
        break
      case 'call_made':
        score += 10 * recencyMultiplier
        break
      case 'meeting_scheduled':
        score += 15 * recencyMultiplier
        break
      case 'proposal_sent':
        score += 20 * recencyMultiplier
        break
      case 'email_opened':
        score += 3 * recencyMultiplier
        break
      case 'link_clicked':
        score += 4 * recencyMultiplier
        break
    }
  })
  
  // Cap score at 100
  score = Math.min(100, Math.round(score))
  
  await prisma.leadEnhanced.update({
    where: { id: leadId },
    data: { score }
  })
}