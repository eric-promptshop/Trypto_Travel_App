import { NextRequest, NextResponse } from 'next/server'
import { 
  UserPreferences, 
  GeneratedItinerary,
  Activity,
  Accommodation,
  Transportation,
  Destination 
} from '@/lib/types/itinerary'

import { DefaultPreferenceMatchingService } from '@/lib/itinerary-engine/services/preference-matching-service'
import { DefaultDestinationSequencingService } from '@/lib/itinerary-engine/services/destination-sequencing-service'
import { DefaultDayPlanningService } from '@/lib/itinerary-engine/services/day-planning-service'
import { DefaultPricingCalculationService } from '@/lib/itinerary-engine/services/pricing-calculation-service'
import { MemoryCachingService } from '@/lib/itinerary-engine/services/caching-service'

/**
 * Complete Itinerary Generation Pipeline API
 * Integrates all services with performance optimization for <3 second requirement
 */

// Initialize services (in production, these would be singletons)
const preferenceService = new DefaultPreferenceMatchingService({
  interests: 35,
  budget: 25,
  location: 20,
  timing: 10,
  difficulty: 5,
  accessibility: 5
})

const sequencingService = new DefaultDestinationSequencingService()
const dayPlanningService = new DefaultDayPlanningService()
const pricingService = new DefaultPricingCalculationService({
  baseCurrency: 'USD',
  cacheTTLMinutes: 30,
  contingencyPercentage: 15
})

const cachingService = new MemoryCachingService({
  maxSize: 1000,
  ttlMinutes: 30
})

// Performance monitoring
interface PerformanceTimer {
  operation: string
  startTime: number
}

class PerformanceTracker {
  private timers: Map<string, PerformanceTimer> = new Map()
  private results: Map<string, number> = new Map()

  start(operation: string): string {
    const id = `${operation}_${Date.now()}_${Math.random()}`
    this.timers.set(id, { operation, startTime: performance.now() })
    return id
  }

  end(id: string): number {
    const timer = this.timers.get(id)
    if (!timer) return 0

    const duration = performance.now() - timer.startTime
    this.results.set(timer.operation, duration)
    this.timers.delete(id)
    return duration
  }

  getResults(): Record<string, number> {
    return Object.fromEntries(this.results.entries())
  }

  getTotalTime(): number {
    return Array.from(this.results.values()).reduce((sum, time) => sum + time, 0)
  }
}

/**
 * Generate cache key from user preferences
 */
function generateCacheKey(preferences: UserPreferences): string {
  const key = {
    destination: preferences.primaryDestination,
    dates: `${preferences.startDate}_${preferences.endDate}`,
    travelers: `${preferences.adults}_${preferences.children}_${preferences.infants}`,
    budget: `${preferences.budgetMin}_${preferences.budgetMax}`,
    interests: preferences.interests?.sort().join(',') || '',
    accommodation: preferences.accommodationType,
    transport: preferences.transportationPreference
  }
  
  return Buffer.from(JSON.stringify(key)).toString('base64')
}

/**
 * Create sample content for demonstration
 * In production, this would come from the content processing system
 */
function createSampleContent(destination: string): {
  activities: Activity[]
  accommodations: Accommodation[]
  transportation: Transportation[]
  destinations: Destination[]
} {
  // Sample activities
  const activities: Activity[] = [
    {
      id: 'act_1',
      title: `${destination} City Tour`,
      description: `Comprehensive guided tour of ${destination}'s main attractions`,
      category: 'sightseeing',
      location: destination,
      coordinates: { lat: 48.8566, lng: 2.3522 },
      timeSlot: { startTime: '09:00', endTime: '17:00', duration: 480 },
      difficulty: 'easy',
      indoorOutdoor: 'both',
      accessibility: {
        wheelchairAccessible: true,
        mobilityRequirements: 'none',
        visuallyImpairedSupport: true,
        hearingImpairedSupport: true
      },
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      bookingRequired: true,
      cost: { amount: 45, currency: 'USD' },
      tags: ['guided', 'history', 'culture']
    },
    {
      id: 'act_2',
      title: `${destination} Food Market Experience`,
      description: `Explore local food markets and taste regional specialties`,
      category: 'culinary',
      location: destination,
      coordinates: { lat: 48.8606, lng: 2.3376 },
      timeSlot: { startTime: '10:00', endTime: '13:00', duration: 180 },
      difficulty: 'easy',
      indoorOutdoor: 'both',
      accessibility: {
        wheelchairAccessible: true,
        mobilityRequirements: 'walking',
        visuallyImpairedSupport: false,
        hearingImpairedSupport: true
      },
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      bookingRequired: false,
      cost: { amount: 25, currency: 'USD' },
      tags: ['food', 'local', 'market']
    },
    {
      id: 'act_3',
      title: `${destination} Museum Visit`,
      description: `Visit world-renowned museums and art galleries`,
      category: 'cultural',
      location: destination,
      coordinates: { lat: 48.8606, lng: 2.3376 },
      timeSlot: { startTime: '14:00', endTime: '17:00', duration: 180 },
      difficulty: 'easy',
      indoorOutdoor: 'indoor',
      accessibility: {
        wheelchairAccessible: true,
        mobilityRequirements: 'none',
        visuallyImpairedSupport: true,
        hearingImpairedSupport: true
      },
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      bookingRequired: true,
      cost: { amount: 15, currency: 'USD' },
      tags: ['museum', 'art', 'culture', 'indoor']
    }
  ]

  // Sample accommodations
  const accommodations: Accommodation[] = [
    {
      id: 'acc_1',
      title: `Luxury Hotel ${destination}`,
      description: `5-star luxury hotel in the heart of ${destination}`,
      type: 'hotel',
      location: destination,
      coordinates: { lat: 48.8566, lng: 2.3522 },
      starRating: 5,
      amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'concierge'],
      roomTypes: [
        {
          type: 'standard',
          capacity: 2,
          priceRange: { min: 250, max: 350 },
          amenities: ['king_bed', 'city_view', 'minibar']
        }
      ],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: '24 hours before arrival',
      contactInfo: {
        phone: '+33 1 23 45 67 89',
        email: 'reservations@luxuryhotel.com',
        website: 'https://luxuryhotel.com'
      },
      cost: { amount: 300, currency: 'USD' },
      tags: ['luxury', 'central', '5-star']
    }
  ]

  // Sample transportation
  const transportation: Transportation[] = [
    {
      id: 'trans_1',
      title: 'Airport Transfer',
      description: 'Private transfer from airport to city center',
      type: 'car',
      from: `${destination} Airport`,
      to: destination,
      fromCoordinates: { lat: 49.0097, lng: 2.5479 },
      toCoordinates: { lat: 48.8566, lng: 2.3522 },
      departureTime: '10:00',
      arrivalTime: '11:00',
      duration: 60,
      cost: { amount: 55, currency: 'USD' },
      tags: ['private', 'comfortable', 'direct']
    }
  ]

  // Sample destinations
  const destinations: Destination[] = [
    {
      id: 'dest_1',
      title: destination,
      description: `Beautiful city of ${destination} with rich history and culture`,
      location: destination,
      coordinates: { lat: 48.8566, lng: 2.3522 },
      countryCode: 'FR',
      region: 'Europe',
      timeZone: 'Europe/Paris',
      averageTemperature: { celsius: 15, fahrenheit: 59 },
      bestVisitingMonths: ['May', 'June', 'September', 'October'],
      languagesSpoken: ['French', 'English'],
      currency: 'EUR',
      safetyRating: 9,
      touristRating: 10,
      costLevel: 'moderate',
      tags: ['historic', 'romantic', 'cultural', 'gastronomy']
    }
  ]

  return { activities, accommodations, transportation, destinations }
}

/**
 * Main itinerary generation function with parallel processing
 */
async function generateCompleteItinerary(
  preferences: UserPreferences,
  performanceTracker: PerformanceTracker
): Promise<GeneratedItinerary> {
  // Step 1: Load content (normally from content processing system)
  const contentTimer = performanceTracker.start('contentLoading')
  const availableContent = createSampleContent(preferences.primaryDestination || 'Paris')
  performanceTracker.end(contentTimer)

  // Step 2: Parallel content matching by type
  const matchingTimer = performanceTracker.start('contentMatching')
  
  const [activityScores, accommodationScores, transportationScores, destinationScores] = await Promise.all([
    preferenceService.scoreAndRankContent(availableContent.activities, preferences),
    preferenceService.scoreAndRankContent(availableContent.accommodations, preferences),
    preferenceService.scoreAndRankContent(availableContent.transportation, preferences),
    preferenceService.scoreAndRankContent(availableContent.destinations, preferences)
  ])

  const matchedContent = {
    activities: activityScores.map(s => s.content as Activity),
    accommodations: accommodationScores.map(s => s.content as Accommodation),
    transportation: transportationScores.map(s => s.content as Transportation),
    destinations: destinationScores.map(s => s.content as Destination)
  }

  performanceTracker.end(matchingTimer)

  // Step 3: Destination sequencing
  const sequencingTimer = performanceTracker.start('destinationSequencing')
  
  const sequencingConstraints = {
    maxTravelTime: 8,
    startLocation: preferences.primaryDestination,
    endLocation: preferences.primaryDestination,
    avoidBacktracking: true,
    preferDirectRoutes: true
  }

  const sequencedDestinations = await sequencingService.optimizeDestinationSequence(
    matchedContent.destinations,
    sequencingConstraints
  )

  performanceTracker.end(sequencingTimer)

  // Step 4: Day planning
  const dayPlanningTimer = performanceTracker.start('dayPlanning')
  
  const tripDuration = Math.ceil(
    (new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const days = []
  for (let dayNumber = 1; dayNumber <= tripDuration; dayNumber++) {
    const dayDate = new Date(preferences.startDate)
    dayDate.setDate(dayDate.getDate() + dayNumber - 1)
    
    const currentDestination = sequencedDestinations[Math.min(dayNumber - 1, sequencedDestinations.length - 1)]
    
    const relevantActivities = matchedContent.activities.filter(activity =>
      activity.location.toLowerCase().includes(currentDestination.location.toLowerCase())
    )

    const dayPlanningPreferences = {
      pacing: preferences.pacePreference || 'moderate' as const,
      startTime: '09:00:00',
      endTime: '18:00:00',
      mealPreferences: [
        { type: 'breakfast' as const, timing: '08:00', style: 'casual' as const, budget: { amount: 25, currency: 'USD' } },
        { type: 'lunch' as const, timing: '12:30', style: 'casual' as const, budget: { amount: 35, currency: 'USD' } },
        { type: 'dinner' as const, timing: '19:00', style: 'moderate' as const, budget: { amount: 50, currency: 'USD' } }
      ],
      includeDowntime: preferences.pacePreference === 'relaxed'
    }

    const dayPlan = await dayPlanningService.planDay(
      currentDestination,
      relevantActivities,
      dayPlanningPreferences
    )

    const accommodation = matchedContent.accommodations.find(acc =>
      acc.location.toLowerCase().includes(currentDestination.location.toLowerCase())
    )

    days.push({
      id: `day_${dayNumber}`,
      dayNumber,
      date: dayDate.toISOString().split('T')[0],
      title: `Day ${dayNumber}: ${currentDestination.title}`,
      location: currentDestination.location,
      coordinates: currentDestination.coordinates,
      accommodation,
      activities: dayPlan.activities,
      transportation: [],
      meals: dayPlan.meals,
      totalEstimatedCost: { amount: 0, currency: 'USD' },
      pacing: dayPlan.pacing,
      notes: `Exploring ${currentDestination.title}`
    })
  }

  performanceTracker.end(dayPlanningTimer)

  // Step 5: Pricing calculation
  const pricingTimer = performanceTracker.start('pricingCalculation')
  
  const preliminaryItinerary: GeneratedItinerary = {
    id: `itin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `${tripDuration}-Day ${sequencedDestinations[0]?.title || 'Adventure'} Trip`,
    description: `A ${tripDuration}-day travel itinerary exploring ${sequencedDestinations.map(d => d.title).join(', ')}`,
    destinations: sequencedDestinations,
    days,
    totalDuration: tripDuration,
    totalEstimatedCost: { amount: 0, currency: 'USD' },
    summary: {
      highlights: [],
      totalActivities: days.reduce((sum, day) => sum + day.activities.length, 0),
      uniqueDestinations: sequencedDestinations.length,
      avgDailyCost: { amount: 0, currency: 'USD' },
      recommendedBudget: { amount: 0, currency: 'USD' },
      physicalDemand: 'moderate' as const,
      culturalImmersion: 'high' as const
    },
    metadata: {
      generationTime: 0,
      aiModel: 'integrated-engine',
      confidenceScore: 0.85,
      optimizationFlags: ['parallel_processing', 'content_matching', 'price_optimization']
    },
    preferences,
    generatedAt: new Date(),
    version: '1.0.0'
  }

  const costBreakdown = await pricingService.calculateItineraryCost(preliminaryItinerary)
  
  // Update with pricing
  preliminaryItinerary.totalEstimatedCost = costBreakdown.total
  preliminaryItinerary.summary.avgDailyCost = {
    amount: costBreakdown.total.amount / tripDuration,
    currency: costBreakdown.total.currency
  }
  preliminaryItinerary.summary.recommendedBudget = {
    amount: costBreakdown.total.amount + costBreakdown.contingency.amount,
    currency: costBreakdown.total.currency
  }

  // Update daily costs
  days.forEach((day, index) => {
    if (costBreakdown.byDay[index]) {
      day.totalEstimatedCost = costBreakdown.byDay[index].total
    }
  })

  // Generate highlights
  const highlights: string[] = []
  days.forEach(day => {
    const topActivities = day.activities
      .filter(activity => activity.title && activity.title.length > 0)
      .slice(0, 2)
      .map(activity => activity.title)
    highlights.push(...topActivities)
  })
  preliminaryItinerary.summary.highlights = [...new Set(highlights)].slice(0, 10)

  performanceTracker.end(pricingTimer)

  return preliminaryItinerary
}

/**
 * POST endpoint for generating itineraries
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now()
  const performanceTracker = new PerformanceTracker()

  try {
    // Parse request body
    const body = await request.json()
    const preferences: UserPreferences = body.preferences

    // Validate required fields
    if (!preferences) {
      return NextResponse.json({ 
        success: false, 
        error: 'User preferences are required' 
      }, { status: 400 })
    }

    if (!preferences.startDate || !preferences.endDate || !preferences.primaryDestination) {
      return NextResponse.json({ 
        success: false, 
        error: 'Start date, end date, and primary destination are required' 
      }, { status: 400 })
    }

    // Check cache first
    const cacheKey = generateCacheKey(preferences)
    const cached = await cachingService.get(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        success: true,
        itinerary: cached,
        fromCache: true,
        generationTime: performance.now() - startTime,
        cacheKey
      })
    }

    // Generate new itinerary
    const itinerary = await generateCompleteItinerary(preferences, performanceTracker)
    
    const totalTime = performance.now() - startTime
    itinerary.metadata.generationTime = totalTime

    // Cache the result
    await cachingService.set(cacheKey, itinerary)

    // Check performance target (3 seconds)
    const metPerformanceTarget = totalTime <= 3000

    return NextResponse.json({
      success: true,
      itinerary,
      fromCache: false,
      generationTime: totalTime,
      metPerformanceTarget,
      performanceBreakdown: performanceTracker.getResults(),
      cacheKey
    })

  } catch (error) {
    console.error('Itinerary generation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      generationTime: performance.now() - startTime
    }, { status: 500 })
  }
}

/**
 * GET endpoint for retrieving cached itineraries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cacheKey = searchParams.get('cacheKey')

    if (!cacheKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cache key is required' 
      }, { status: 400 })
    }

    const cached = await cachingService.get(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        success: true,
        itinerary: cached,
        fromCache: true
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Cached itinerary not found'
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Cache retrieval failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve cached itinerary'
    }, { status: 500 })
  }
} 