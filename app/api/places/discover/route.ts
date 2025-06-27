import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { googlePlacesService } from '@/lib/services/google-places'
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'

const discoverRequestSchema = z.object({
  location: z.string().min(1),
  interests: z.array(z.string()).optional(),
  category: z.enum(['attractions', 'restaurants', 'accommodation', 'all']).optional(),
  radius: z.number().min(100).max(50000).optional(),
  limit: z.number().min(1).max(50).optional()
})

async function handlePlacesDiscover(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = discoverRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.')
        }))
      )
    }
    
    const { location, interests = [], category = 'all', radius = 5000, limit = 20 } = validation.data
    
    let places
    
    switch (category) {
      case 'attractions':
        places = await googlePlacesService.findAttractions(location, limit)
        break
      case 'restaurants':
        places = await googlePlacesService.findRestaurants(location, limit)
        break
      case 'accommodation':
        places = await googlePlacesService.findAccommodation(location, limit)
        break
      default:
        places = await googlePlacesService.searchPlaces({
          location,
          category: 'all',
          radius,
          limit
        })
    }
    
    // Limit results and add relevance scoring
    const limitedPlaces = places
      .slice(0, limit)
      .map(place => ({
        ...place,
        relevanceScore: calculateRelevanceScore(place, interests),
        addedBy: 'google-places',
        verified: true
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    return createSuccessResponse({
      places: limitedPlaces,
      total: limitedPlaces.length,
      location,
      source: 'google-places'
    })
    
  } catch (error) {
    console.error('Error discovering places:', error)
    return createErrorResponse(
      'Failed to discover places',
      error instanceof Error ? { message: error.message } : undefined,
      500
    )
  }
}

// Apply rate limiting to POST endpoint
export const POST = withRateLimit({
  ...rateLimitConfigs.expensive,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes
  message: 'Too many place discovery requests. Please wait before trying again.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }
})(handlePlacesDiscover)

// GET endpoint for compatibility
async function handlePlacesDiscoverGet(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const location = searchParams.get('location')
  const category = searchParams.get('category') as any
  const limit = parseInt(searchParams.get('limit') || '20')
  
  if (!location) {
    return createErrorResponse(
      'Location parameter required',
      { field: 'location' },
      400
    )
  }
  
  try {
    const places = await googlePlacesService.searchPlaces({
      location,
      category: category || 'all',
      limit
    })
    
    return createSuccessResponse({
      places: places.map(place => ({
        ...place,
        addedBy: 'google-places',
        verified: true,
        relevanceScore: 4.0
      })),
      total: places.length,
      location,
      source: 'google-places'
    })
  } catch (error) {
    console.error('Error discovering places:', error)
    return createErrorResponse(
      'Failed to discover places',
      error instanceof Error ? { message: error.message } : undefined,
      500
    )
  }
}

// Apply rate limiting to GET endpoint
export const GET = withRateLimit({
  ...rateLimitConfigs.api, // Less strict for GET requests
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests. Please slow down.',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }
})(handlePlacesDiscoverGet)

function calculateRelevanceScore(place: any, interests: string[]): number {
  let score = 0
  
  // Base score from rating
  if (place.rating) {
    score += place.rating * 0.8
  }
  
  // Interest matching
  if (interests.length > 0) {
    const placeCategories = place.categories || []
    const matchingInterests = interests.filter(interest => 
      placeCategories.some((cat: string) => 
        cat.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(cat.toLowerCase())
      )
    )
    score += matchingInterests.length * 0.5
  }
  
  // Review count bonus
  if (place.reviewCount) {
    score += Math.min(place.reviewCount / 100, 1) * 0.3
  }
  
  // Ensure score is within reasonable range
  return Math.min(Math.max(score, 1), 5)
}