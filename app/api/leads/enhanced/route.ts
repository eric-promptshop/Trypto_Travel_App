import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const leadFilterSchema = z.object({
  operatorId: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  scoreMin: z.number().optional(),
  scoreMax: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
  sortBy: z.enum(['createdAt', 'score', 'lastEngagedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const createLeadSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  source: z.string(),
  sourceDetails: z.any().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  flexibleDates: z.boolean().default(false),
  travelers: z.number().default(1),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD'),
  }).optional(),
  interests: z.array(z.string()).default([]),
  specialRequests: z.string().optional(),
  tourIds: z.array(z.string()).default([]),
  optInMarketing: z.boolean().default(true),
})

// GET /api/leads/enhanced - List leads with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const filters = leadFilterSchema.parse({
      ...searchParams,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
      scoreMin: searchParams.scoreMin ? parseInt(searchParams.scoreMin) : undefined,
      scoreMax: searchParams.scoreMax ? parseInt(searchParams.scoreMax) : undefined,
      tags: searchParams.tags ? searchParams.tags.split(',') : undefined,
    })
    
    // Build where clause
    const where: any = {}
    
    // Apply operator filter based on user role
    if (session.user?.role === 'TOUR_OPERATOR' || session.user?.role === 'AGENT') {
      where.operatorId = session.user.operatorId
    } else if (filters.operatorId) {
      where.operatorId = filters.operatorId
    }
    
    // Apply other filters
    if (filters.status) where.status = filters.status
    if (filters.source) where.source = filters.source
    if (filters.destination) {
      where.destination = { contains: filters.destination, mode: 'insensitive' }
    }
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      where.score = {}
      if (filters.scoreMin !== undefined) where.score.gte = filters.scoreMin
      if (filters.scoreMax !== undefined) where.score.lte = filters.scoreMax
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { destination: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit
    
    // Get leads with pagination
    const [leads, total] = await Promise.all([
      prisma.leadEnhanced.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        include: {
          activities: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              activities: true,
              bookings: true,
            }
          }
        }
      }),
      prisma.leadEnhanced.count({ where })
    ])
    
    // Calculate aggregate stats
    const stats = await prisma.leadEnhanced.aggregate({
      where,
      _avg: { score: true },
      _count: { _all: true }
    })
    
    const statusCounts = await prisma.leadEnhanced.groupBy({
      by: ['status'],
      where: where.operatorId ? { operatorId: where.operatorId } : {},
      _count: { _all: true }
    })
    
    return NextResponse.json({
      leads,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      },
      stats: {
        total,
        averageScore: Math.round(stats._avg.score || 0),
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = curr._count._all
          return acc
        }, {} as Record<string, number>)
      }
    })
    
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST /api/leads/enhanced - Create new lead
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await request.json()
    const validation = createLeadSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Determine operator ID
    let operatorId: string | null = null
    if (session?.user?.operatorId) {
      operatorId = session.user.operatorId
    } else if (body.operatorId) {
      operatorId = body.operatorId
    }
    
    // Check for duplicate lead
    const existingLead = await prisma.leadEnhanced.findFirst({
      where: {
        email: data.email,
        operatorId: operatorId || undefined
      }
    })
    
    if (existingLead) {
      // Update existing lead instead of creating duplicate
      const updatedLead = await prisma.leadEnhanced.update({
        where: { id: existingLead.id },
        data: {
          lastEngagedAt: new Date(),
          context: {
            ...existingLead.context as any,
            latestInquiry: {
              destination: data.destination,
              dates: { start: data.startDate, end: data.endDate },
              travelers: data.travelers,
              budget: data.budget,
              interests: data.interests,
              timestamp: new Date()
            }
          }
        }
      })
      
      // Log activity
      await prisma.leadActivity.create({
        data: {
          leadId: existingLead.id,
          type: 'inquiry_updated',
          description: `Lead submitted new inquiry for ${data.destination || 'travel'}`,
          metadata: data
        }
      })
      
      return NextResponse.json({ lead: updatedLead, updated: true })
    }
    
    // Create new lead
    const lead = await prisma.leadEnhanced.create({
      data: {
        ...data,
        operatorId,
        tenantId: session?.user?.tenantId || 'default',
        score: 50, // Base score
        status: 'new',
        tags: generateInitialTags(data),
        context: {
          source: data.source,
          sourceDetails: data.sourceDetails,
          initialInquiry: {
            destination: data.destination,
            dates: { start: data.startDate, end: data.endDate },
            travelers: data.travelers,
            budget: data.budget,
            interests: data.interests,
            timestamp: new Date()
          }
        },
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        referrer: request.headers.get('referer') || undefined,
        optInTimestamp: data.optInMarketing ? new Date() : undefined,
      }
    })
    
    // Create initial activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'lead_created',
        description: `New lead created from ${data.source}`,
        metadata: { source: data.source }
      }
    })
    
    // Trigger AI enrichment if available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      triggerLeadEnrichment(lead.id, lead)
    }
    
    return NextResponse.json({ lead }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateInitialTags(data: z.infer<typeof createLeadSchema>): string[] {
  const tags: string[] = []
  
  // Source tag
  tags.push(`source:${data.source}`)
  
  // Marketing preference
  tags.push(data.optInMarketing ? 'marketing:yes' : 'marketing:no')
  
  // Budget tier
  if (data.budget) {
    const avgBudget = ((data.budget.min || 0) + (data.budget.max || 0)) / 2
    if (avgBudget > 5000) tags.push('budget:luxury')
    else if (avgBudget > 2000) tags.push('budget:mid-range')
    else tags.push('budget:budget')
  }
  
  // Travel type
  if (data.travelers === 1) tags.push('type:solo')
  else if (data.travelers === 2) tags.push('type:couple')
  else if (data.travelers > 4) tags.push('type:group')
  else tags.push('type:family')
  
  // Interests
  data.interests.forEach(interest => {
    tags.push(`interest:${interest.toLowerCase()}`)
  })
  
  return tags
}

async function triggerLeadEnrichment(leadId: string, leadData: any) {
  try {
    // Call Supabase Edge Function for lead enrichment
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-lead-enrichment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadId, leadData })
      }
    )
    
    if (!response.ok) {
      console.error('Lead enrichment failed:', await response.text())
    }
  } catch (error) {
    console.error('Error triggering lead enrichment:', error)
  }
}