import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const discoverRequestSchema = z.object({
  destination: z.string().min(1),
  interests: z.array(z.string()).optional(),
  duration: z.number().optional(),
  travelers: z.number().optional(),
  budget: z.number().optional(),
  category: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = discoverRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const { destination, interests = [], duration, travelers, budget, category } = validation.data
    
    // Find relevant tours from database
    const tours = await discoverTours({
      destination,
      interests,
      duration,
      travelers,
      budget,
      category
    })
    
    return NextResponse.json({ tours })
    
  } catch (error) {
    console.error('Error discovering tours:', error)
    return NextResponse.json(
      { error: 'Failed to discover tours' },
      { status: 500 }
    )
  }
}

async function discoverTours(criteria: {
  destination: string
  interests: string[]
  duration?: number
  travelers?: number
  budget?: number
  category?: string
}) {
  try {
    // Build where clause for Tour table query
    const whereClause: any = {
      status: 'published',
      OR: [
        {
          destination: {
            contains: criteria.destination,
            mode: 'insensitive'
          }
        },
        {
          city: {
            contains: criteria.destination,
            mode: 'insensitive'
          }
        },
        {
          country: {
            contains: criteria.destination,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Add price filter if budget provided
    if (criteria.budget) {
      const maxPricePerDay = criteria.budget / (criteria.duration || 7)
      whereClause.price = {
        lte: maxPricePerDay * 1.5 // Allow some flexibility
      }
    }

    // Add category filter if provided
    if (criteria.category && criteria.category !== 'all') {
      const mappedCategory = mapCategoryToTourCategory(criteria.category)
      whereClause.categories = {
        has: mappedCategory
      }
    }

    // Add interests filter if provided
    if (criteria.interests && criteria.interests.length > 0) {
      whereClause.OR.push(
        ...criteria.interests.map(interest => ({
          OR: [
            { name: { contains: interest, mode: 'insensitive' } },
            { description: { contains: interest, mode: 'insensitive' } },
            { categories: { has: interest } }
          ]
        }))
      )
    }

    // Query tours from Tour table with operator info
    const dbTours = await prisma.tour.findMany({
      where: whereClause,
      include: {
        operator: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            verifiedAt: true
          }
        }
      },
      take: 30, // Get more tours for better filtering
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { bookingCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`[Tour Discovery] Found ${dbTours.length} tours for destination: ${criteria.destination}`)

    // Transform database tours to API format
    const tours = dbTours.map(tour => {
      // Calculate availability (in real implementation, check actual availability)
      const today = new Date()
      const availability = []
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        availability.push(date.toISOString().split('T')[0])
      }

      // Ensure images array is properly formatted
      let images = tour.images as any[]
      if (!Array.isArray(images)) {
        images = []
      }
      if (images.length === 0) {
        // Generate placeholder image based on category
        const primaryCategory = tour.categories[0] || 'tour'
        images = [`https://source.unsplash.com/400x300/?${primaryCategory},${tour.destination}`]
      }

      return {
        id: tour.id,
        name: tour.name,
        description: tour.shortDescription || tour.description.substring(0, 200) + '...',
        fullDescription: tour.description,
        location: tour.destination,
        city: tour.city || tour.destination,
        country: tour.country || 'Local',
        coordinates: tour.coordinates,
        googlePlaceId: tour.googlePlaceId,
        price: tour.price,
        currency: tour.currency,
        priceType: tour.priceType,
        duration: tour.durationType === 'days' ? tour.duration * 8 : 
                 tour.durationType === 'hours' ? tour.duration : 
                 tour.duration / 60, // Convert to hours for consistency
        durationDisplay: `${tour.duration} ${tour.durationType}`,
        images,
        included: tour.included,
        excluded: tour.excluded,
        highlights: tour.highlights,
        maxParticipants: tour.groupSize ? (tour.groupSize as any).max : 20,
        minParticipants: tour.groupSize ? (tour.groupSize as any).min : 1,
        operatorName: tour.operator.businessName,
        operatorId: tour.operator.id,
        operatorLogo: tour.operator.logo,
        verified: !!tour.operator.verifiedAt,
        rating: tour.rating || 4.5,
        reviews: tour.reviewCount || 0,
        availability,
        categories: tour.categories,
        category: tour.categories[0] || 'general',
        difficulty: tour.difficulty,
        languages: tour.languages,
        matchScore: calculateMatchScore(tour, criteria),
        featured: tour.featured,
        instantBooking: tour.metadata ? (tour.metadata as any).instantBooking : false,
        cancellationPolicy: tour.cancellationPolicy || 'Flexible cancellation',
        startingPoint: tour.startingPoint,
        endingPoint: tour.endingPoint,
        isTemplate: tour.metadata ? (tour.metadata as any).isTemplate : false,
        tourType: tour.metadata && (tour.metadata as any).isTemplate ? 'template' : 'tour'
      }
    })

    // Sort by match score and featured status
    tours.sort((a, b) => {
      // Featured tours first
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      
      // Then by verification status
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      
      // Finally by match score
      return b.matchScore - a.matchScore
    })

    // If we have fewer than 5 tours, try to fetch from Content table as fallback
    if (tours.length < 5) {
      console.log('[Tour Discovery] Insufficient tours, checking Content table for legacy data')
      const legacyTours = await fetchLegacyTours(criteria)
      tours.push(...legacyTours)
    }

    return tours.slice(0, 20) // Return top 20 results
    
  } catch (dbError) {
    console.error('Database error in tour discovery:', dbError)
    // Don't fall back to demo tours - return empty array instead
    return []
  }
}

// Fallback to Content table for legacy tours
async function fetchLegacyTours(criteria: any) {
  try {
    const whereClause: any = {
      type: 'activity',
      active: true,
      OR: [
        {
          location: {
            contains: criteria.destination,
            mode: 'insensitive'
          }
        },
        {
          city: {
            contains: criteria.destination,
            mode: 'insensitive'
          }
        }
      ]
    }

    const legacyTours = await prisma.content.findMany({
      where: whereClause,
      take: 10
    })

    return legacyTours.map(tour => {
      const metadata = parseJSON(tour.metadata) || {}
      const images = parseJSON(tour.images) || []
      
      return {
        id: `legacy-${tour.id}`,
        name: tour.name,
        description: tour.description.substring(0, 200) + '...',
        fullDescription: tour.description,
        location: tour.location,
        city: tour.city || tour.location,
        country: tour.country || 'Local',
        coordinates: tour.coordinates,
        googlePlaceId: tour.googlePlaceId,
        price: tour.price || 0,
        currency: tour.currency || 'USD',
        priceType: 'per_person',
        duration: tour.duration ? Math.floor(tour.duration / 60) : 4,
        durationDisplay: tour.duration ? `${Math.floor(tour.duration / 60)} hours` : '4 hours',
        images: images.length > 0 ? images : [`https://source.unsplash.com/400x300/?tour,${criteria.destination}`],
        included: parseJSON(tour.included) || ['Professional guide'],
        excluded: parseJSON(tour.excluded) || ['Personal expenses'],
        highlights: parseJSON(tour.highlights) || [],
        maxParticipants: 20,
        minParticipants: 1,
        operatorName: metadata.operatorName || 'Local Operator',
        operatorId: metadata.operatorId || 'legacy',
        operatorLogo: null,
        verified: false,
        rating: 4.0,
        reviews: 0,
        availability: [],
        categories: metadata.categories || ['general'],
        category: 'general',
        difficulty: 'Easy',
        languages: ['English'],
        matchScore: 50,
        featured: tour.featured,
        instantBooking: false,
        cancellationPolicy: 'Standard cancellation policy',
        startingPoint: null,
        endingPoint: null,
        isTemplate: false,
        tourType: 'legacy'
      }
    })
  } catch (error) {
    console.error('Error fetching legacy tours:', error)
    return []
  }
}

function parseJSON(jsonString: string | null): any {
  if (!jsonString) return null
  try {
    return JSON.parse(jsonString)
  } catch {
    return null
  }
}

function mapCategoryToTourCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'restaurants': 'Food & Wine',
    'cafe-bakery': 'Food & Wine',
    'bars-nightlife': 'Nightlife',
    'art-museums': 'Cultural',
    'attractions': 'Sightseeing',
    'hotels': 'Accommodation',
    'shopping': 'Shopping',
    'beauty-fashion': 'Shopping',
    'transport': 'Transportation',
    'food': 'Food & Wine',
    'culture': 'Cultural',
    'adventure': 'Adventure',
    'city': 'City Tours',
    'nature': 'Nature',
    'water': 'Water Activities',
    'general': 'Sightseeing'
  }
  
  return categoryMap[category] || 'Sightseeing'
}

function calculateMatchScore(tour: any, criteria: any): number {
  let score = 0
  
  // Location match (highest priority)
  const destination = criteria.destination.toLowerCase()
  if (tour.destination?.toLowerCase().includes(destination) ||
      tour.city?.toLowerCase().includes(destination) ||
      tour.country?.toLowerCase().includes(destination)) {
    score += 50
  }
  
  // Interest matching
  if (criteria.interests && criteria.interests.length > 0) {
    const tourText = `${tour.name} ${tour.description} ${tour.categories.join(' ')}`.toLowerCase()
    const matchingInterests = criteria.interests.filter((interest: string) => 
      tourText.includes(interest.toLowerCase())
    )
    score += matchingInterests.length * 15
  }
  
  // Category match
  if (criteria.category && tour.categories.includes(mapCategoryToTourCategory(criteria.category))) {
    score += 20
  }
  
  // Duration preference
  if (criteria.duration && tour.duration) {
    const tourDurationDays = tour.durationType === 'days' ? tour.duration : tour.duration / 8
    const durationDiff = Math.abs(tourDurationDays - criteria.duration)
    score += Math.max(0, 15 - durationDiff * 3)
  }
  
  // Budget consideration
  if (criteria.budget && tour.price) {
    const budgetPerDay = criteria.budget / (criteria.duration || 7)
    if (tour.price <= budgetPerDay) {
      score += 20
    } else if (tour.price <= budgetPerDay * 1.5) {
      score += 10
    }
  }
  
  // Boost for featured and highly rated tours
  if (tour.featured) score += 10
  if (tour.rating >= 4.5) score += 10
  if (tour.reviewCount > 50) score += 5
  
  // Slight randomization for variety
  score += Math.random() * 5
  
  return Math.round(score)
}