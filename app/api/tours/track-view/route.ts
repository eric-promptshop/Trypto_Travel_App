import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'

const tourViewSchema = z.object({
  tourId: z.string().min(1),
  tourName: z.string().min(1),
  operatorName: z.string().min(1),
  category: z.string().optional(),
  price: z.number().optional(),
  duration: z.number().optional(),
  location: z.object({
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  viewContext: z.object({
    source: z.enum(['discovery_panel', 'search_results', 'recommendations', 'direct_link']),
    searchQuery: z.string().optional(),
    filters: z.record(z.any()).optional(),
    position: z.number().optional(), // Position in list (for CTR analysis)
    sessionId: z.string().optional()
  }),
  userContext: z.object({
    isAuthenticated: z.boolean(),
    userId: z.string().optional(),
    destination: z.string().optional(),
    travelDates: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }).optional(),
    interests: z.array(z.string()).optional()
  })
})

async function handleTourView(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = tourViewSchema.safeParse(body)
    
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.')
        }))
      )
    }
    
    const data = validation.data
    const session = await getServerSession(authOptions)
    
    // Create tour view record
    const tourView = await createTourView({
      ...data,
      userId: session?.user?.id || data.userContext.userId,
      sessionId: data.viewContext.sessionId || generateSessionId()
    })
    
    // Check if this should trigger lead generation
    const shouldGenerateLead = await checkLeadGenerationCriteria(tourView)
    
    if (shouldGenerateLead) {
      // Generate a passive lead (lower scoring than active leads)
      await generatePassiveLead(tourView)
    }
    
    // Track analytics
    await trackTourViewAnalytics(tourView)
    
    return createSuccessResponse({
      tracked: true,
      viewId: tourView.id,
      leadGenerated: shouldGenerateLead
    })
    
  } catch (error) {
    console.error('Error tracking tour view:', error)
    return createErrorResponse(
      'Failed to track tour view',
      error instanceof Error ? { message: error.message } : undefined,
      500
    )
  }
}

async function createTourView(data: any) {
  // In production, this would create a record in the database
  // For now, we'll store in memory/logs
  const tourView = {
    id: `view-${Date.now()}`,
    tourId: data.tourId,
    tourName: data.tourName,
    operatorName: data.operatorName,
    userId: data.userId,
    sessionId: data.sessionId,
    viewedAt: new Date(),
    source: data.viewContext.source,
    searchQuery: data.viewContext.searchQuery,
    position: data.viewContext.position,
    category: data.category,
    price: data.price,
    duration: data.duration,
    location: data.location,
    userDestination: data.userContext.destination,
    userInterests: data.userContext.interests
  }
  
  
  return tourView
}

async function checkLeadGenerationCriteria(tourView: any): Promise<boolean> {
  // Lead generation criteria based on user behavior
  const criteria = {
    // Must view tour for minimum time (handled client-side)
    minViewDuration: 3000, // 3 seconds
    
    // High-intent signals
    hasSearchQuery: !!tourView.searchQuery,
    hasDestinationMatch: tourView.userDestination === tourView.location.city,
    hasInterestMatch: tourView.userInterests?.some((interest: string) => 
      tourView.category?.toLowerCase().includes(interest.toLowerCase())
    ),
    isAuthenticated: !!tourView.userId,
    
    // Engagement signals (would be tracked over time)
    viewCount: 1, // In production, count views per session
    returnVisit: false // In production, check if user returned
  }
  
  // Calculate engagement score
  let score = 0
  if (criteria.hasSearchQuery) score += 20
  if (criteria.hasDestinationMatch) score += 30
  if (criteria.hasInterestMatch) score += 25
  if (criteria.isAuthenticated) score += 15
  if (criteria.viewCount >= 3) score += 20
  if (criteria.returnVisit) score += 10
  
  // Generate lead if score is high enough
  return score >= 40
}

async function generatePassiveLead(tourView: any) {
  try {
    // Create a passive lead (from viewing behavior)
    const leadData = {
      tourId: tourView.tourId,
      tourName: tourView.tourName,
      operatorName: tourView.operatorName,
      leadType: 'passive',
      leadSource: 'tour_view',
      viewContext: {
        source: tourView.source,
        searchQuery: tourView.searchQuery,
        position: tourView.position
      },
      userInfo: {
        userId: tourView.userId,
        sessionId: tourView.sessionId,
        destination: tourView.userDestination,
        interests: tourView.userInterests
      },
      tourInfo: {
        category: tourView.category,
        price: tourView.price,
        duration: tourView.duration,
        location: tourView.location
      },
      leadScore: calculatePassiveLeadScore(tourView),
      status: 'passive',
      createdAt: new Date()
    }
    
    
    // In production, store in database and notify operator
    // For high-score passive leads, could trigger remarketing
    
    return leadData
  } catch (error) {
    console.error('Failed to generate passive lead:', error)
  }
}

function calculatePassiveLeadScore(tourView: any): number {
  let score = 0
  
  // Base score for viewing
  score += 10
  
  // Search intent
  if (tourView.searchQuery) score += 15
  
  // Destination match
  if (tourView.userDestination === tourView.location.city) score += 20
  
  // Interest match
  if (tourView.userInterests?.length > 0) score += 10
  
  // Position in results (higher positions = more deliberate)
  if (tourView.position <= 3) score += 10
  else if (tourView.position <= 10) score += 5
  
  // Authenticated user
  if (tourView.userId) score += 15
  
  // Price consideration (mid-range tours often convert better)
  if (tourView.price >= 50 && tourView.price <= 200) score += 10
  
  return Math.min(score, 100)
}

async function trackTourViewAnalytics(tourView: any) {
  // Track analytics for tour operator insights
  const analytics = {
    tourId: tourView.tourId,
    operatorName: tourView.operatorName,
    timestamp: new Date(),
    metrics: {
      source: tourView.source,
      hasSearch: !!tourView.searchQuery,
      position: tourView.position,
      authenticated: !!tourView.userId,
      destinationMatch: tourView.userDestination === tourView.location.city
    }
  }
  
  
  // In production, send to analytics service
  // This data helps operators understand:
  // - Which tours get the most views
  // - What search terms lead to views
  // - Conversion funnel metrics
  // - A/B testing results
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Apply rate limiting to prevent abuse
export const POST = withRateLimit({
  ...rateLimitConfigs.standard,
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 views per minute
  message: 'Too many tour views tracked. Please slow down.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }
})(handleTourView)

// GET endpoint for analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tourId = searchParams.get('tourId')
    const operatorName = searchParams.get('operator')
    const days = parseInt(searchParams.get('days') || '7')
    
    // Demo analytics data
    const analytics = {
      tourId,
      operatorName,
      period: `${days} days`,
      metrics: {
        totalViews: 156,
        uniqueViewers: 89,
        averageViewDuration: '45 seconds',
        conversionRate: '3.2%',
        topSources: [
          { source: 'discovery_panel', views: 67, percentage: 43 },
          { source: 'search_results', views: 45, percentage: 29 },
          { source: 'recommendations', views: 34, percentage: 22 },
          { source: 'direct_link', views: 10, percentage: 6 }
        ],
        viewsByDay: Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 30) + 10
        })),
        topSearchTerms: [
          { term: 'paris tours', count: 23 },
          { term: 'city tour', count: 18 },
          { term: 'guided tour', count: 15 },
          { term: 'local experience', count: 12 }
        ]
      }
    }
    
    return NextResponse.json(analytics)
    
  } catch (error) {
    console.error('Error fetching tour analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}