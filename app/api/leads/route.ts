import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email/email-service'
import { z } from 'zod'
import { leadService } from '@/lib/services/lead-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const createLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  operatorId: z.string(),
  source: z.enum(['widget', 'website', 'manual', 'import', 'api']).default('widget'),
  data: z.object({
    destination: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    travelDates: z.string().optional(),
    travelers: z.number().optional(),
    interests: z.array(z.string()).optional(),
    message: z.string().optional(),
    budget: z.string().optional(),
    referrer: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
  }).optional()
})

// GET /api/leads - List leads for an operator
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get operator info for the logged-in user
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

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { operatorId: operator.id }
    if (status) {
      where.status = status
    }

    // Get leads with pagination
    const [leads, total] = await Promise.all([
      prisma.leadEnhanced.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leadEnhanced.count({ where })
    ])

    // Enrich leads with tour information
    const enrichedLeads = await Promise.all(leads.map(async (lead) => {
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
            currency: true
          }
        })
      }

      return {
        ...lead,
        tours,
        name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email
      }
    }))

    return NextResponse.json({
      leads: enrichedLeads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createLeadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if operator exists
    const operator = await prisma.operator.findUnique({
      where: { id: data.operatorId },
      include: {
        users: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Calculate lead score
    const leadScore = await leadService.calculateLeadScore({
      hasMessage: !!data.data?.message,
      hasBudget: !!data.data?.budget,
      hasPhone: !!data.phone,
      travelDatesProvided: !!(data.data?.startDate || data.data?.travelDates),
      groupSize: data.data?.travelers || 1,
      interests: data.data?.interests || []
    })

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        operatorId: data.operatorId,
        tenantId: operator.tenantId,
        source: data.source,
        status: 'new',
        score: leadScore,
        data: data.data || {}
      }
    })

    // Send email notification if enabled
    const operatorSettings = operator.settings as any
    if (operatorSettings?.notifications?.email !== false) {
      try {
        const operatorUser = operator.users[0]
        const baseUrl = process.env.NEXTAUTH_URL || 'https://tripnav.ai'
        const dashboardUrl = `${baseUrl}/operator/leads/${lead.id}`

        await emailService.sendLeadNotification({
          operatorEmail: operator.email,
          operatorName: operatorUser?.profile?.firstName || operator.businessName,
          leadName: lead.name,
          leadEmail: lead.email,
          leadPhone: lead.phone || undefined,
          destination: data.data?.destination || 'Unknown destination',
          travelDates: data.data?.travelDates,
          travelers: data.data?.travelers,
          interests: data.data?.interests,
          message: data.data?.message,
          leadScore: lead.score || undefined,
          dashboardUrl
        })

        // Update lead to mark notification as sent
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            data: {
              ...lead.data,
              notificationSent: true,
              notificationSentAt: new Date().toISOString()
            }
          }
        })
      } catch (emailError) {
        console.error('Failed to send lead notification:', emailError)
        // Don't fail the lead creation if email fails
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'lead',
        resourceId: lead.id,
        tenantId: lead.tenantId,
        userId: 'system',
        newValues: lead as any
      }
    })

    // Track analytics event
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead_created',
            properties: {
              leadId: lead.id,
              operatorId: lead.operatorId,
              source: lead.source,
              score: lead.score,
              hasPhone: !!lead.phone,
              hasMessage: !!data.data?.message
            }
          })
        })
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError)
      }
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