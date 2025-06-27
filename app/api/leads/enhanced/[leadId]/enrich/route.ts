import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: {
    leadId: string
  }
}

// POST /api/leads/enhanced/[leadId]/enrich - Trigger AI enrichment
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
    
    // Get lead with full details
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        bookings: {
          include: {
            tour: {
              select: {
                name: true,
                destination: true,
                categories: true,
              }
            }
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
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'AI enrichment service not configured' },
        { status: 503 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Prepare enrichment data
    const enrichmentData = {
      email: lead.email,
      destination: lead.destination,
      startDate: lead.startDate,
      endDate: lead.endDate,
      travelers: lead.travelers,
      budget: lead.budget,
      interests: lead.interests,
      specialRequests: lead.specialRequests,
      itinerary: lead.itinerary,
      context: {
        ...lead.context as any,
        recentActivities: lead.activities.map(a => ({
          type: a.type,
          timestamp: a.createdAt,
          metadata: a.metadata
        })),
        bookingHistory: lead.bookings.map(b => ({
          tourName: b.tour.name,
          destination: b.tour.destination,
          categories: b.tour.categories,
          date: b.travelDate,
          value: b.totalPrice
        })),
        engagementLevel: calculateEngagementLevel(lead),
        daysSinceCreation: Math.floor(
          (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    }
    
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-lead-enrichment', {
      body: { leadId, leadData: enrichmentData }
    })
    
    if (error) {
      console.error('Enrichment error:', error)
      return NextResponse.json(
        { error: 'Failed to enrich lead' },
        { status: 500 }
      )
    }
    
    // Log enrichment activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'ai_enrichment',
        description: 'Lead enriched with AI insights',
        metadata: {
          enrichmentId: data.enrichmentId,
          performedBy: session.user.id
        }
      }
    })
    
    // Fetch updated lead
    const enrichedLead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId }
    })
    
    return NextResponse.json({
      success: true,
      lead: enrichedLead,
      enrichment: data.enrichment
    })
    
  } catch (error) {
    console.error('Error enriching lead:', error)
    return NextResponse.json(
      { error: 'Failed to enrich lead' },
      { status: 500 }
    )
  }
}

// GET /api/leads/enhanced/[leadId]/enrich - Get enrichment status
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
    
    // Get lead to check permissions and enrichment data
    const lead = await prisma.leadEnhanced.findUnique({
      where: { id: leadId },
      select: {
        operatorId: true,
        context: true,
        score: true,
        tags: true,
      }
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
    
    // Check if lead has enrichment data
    const enrichmentData = (lead.context as any)?.enrichment
    
    if (!enrichmentData) {
      return NextResponse.json({
        enriched: false,
        message: 'Lead has not been enriched yet'
      })
    }
    
    return NextResponse.json({
      enriched: true,
      enrichedAt: (lead.context as any)?.enrichedAt,
      enrichment: enrichmentData,
      currentScore: lead.score,
      currentTags: lead.tags
    })
    
  } catch (error) {
    console.error('Error fetching enrichment status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrichment status' },
      { status: 500 }
    )
  }
}

// Helper function to calculate engagement level
function calculateEngagementLevel(lead: any): string {
  const activityCount = lead.activities.length
  const daysSinceCreation = Math.floor(
    (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  const hasBookings = lead.bookings.length > 0
  
  if (hasBookings) return 'customer'
  if (activityCount > 10) return 'highly_engaged'
  if (activityCount > 5) return 'engaged'
  if (activityCount > 2) return 'interested'
  if (daysSinceCreation > 30) return 'cold'
  return 'new'
}