import { NextRequest, NextResponse } from 'next/server'
import { 
  UserPreferences, 
  GeneratedItinerary,
  Activity,
  Accommodation,
  Transportation,
  Destination,
  MatchingCriteria,
  ItineraryDay,
  Meal
} from '@/lib/types/itinerary'

import { DefaultPreferenceMatchingService } from '@/lib/itinerary-engine/services/preference-matching-service'
import { DefaultDestinationSequencingService } from '@/lib/itinerary-engine/services/destination-sequencing-service'
import { DefaultDayPlanningService } from '@/lib/itinerary-engine/services/day-planning-service'
import { DefaultPricingCalculationService } from '@/lib/itinerary-engine/services/pricing-calculation-service'
import { MemoryCachingService } from '@/lib/itinerary-engine/services/caching-service'
import { SequencingConstraints, GenerationResult } from '@/lib/itinerary-engine/types'

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

const cachingService = new MemoryCachingService(1000, 1800) // 1000 items max, 30 minutes TTL

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
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      timeSlot: { startTime: '09:00', endTime: '17:00', duration: 480 },
      difficulty: 'easy',
      indoorOutdoor: 'both',
      accessibility: {
        wheelchairAccessible: true,
        hearingImpaired: true,
        visuallyImpaired: true,
        mobilityAssistance: false
      },
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      bookingRequired: true,
      estimatedCost: { amount: 45, currency: 'USD' },
      tags: ['guided', 'history', 'culture'],
      images: [`https://images.unsplash.com/photo-city-tour`],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'act_2',
      title: `${destination} Food Market Experience`,
      description: `Explore local food markets and taste regional specialties`,
      category: 'culinary',
      location: destination,
      coordinates: { latitude: 48.8606, longitude: 2.3376 },
      timeSlot: { startTime: '10:00', endTime: '13:00', duration: 180 },
      difficulty: 'easy',
      indoorOutdoor: 'both',
      accessibility: {
        wheelchairAccessible: true,
        hearingImpaired: true,
        visuallyImpaired: false,
        mobilityAssistance: true
      },
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      bookingRequired: false,
      estimatedCost: { amount: 25, currency: 'USD' },
      tags: ['food', 'local', 'market'],
      images: [`https://images.unsplash.com/photo-food-market`],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'act_3',
      title: `${destination} Museum Visit`,
      description: `Visit world-renowned museums and art galleries`,
      category: 'cultural',
      location: destination,
      coordinates: { latitude: 48.8606, longitude: 2.3376 },
      timeSlot: { startTime: '14:00', endTime: '17:00', duration: 180 },
      difficulty: 'easy',
      indoorOutdoor: 'indoor',
      accessibility: {
        wheelchairAccessible: true,
        hearingImpaired: true,
        visuallyImpaired: true,
        mobilityAssistance: false
      },
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      bookingRequired: true,
      estimatedCost: { amount: 15, currency: 'USD' },
      tags: ['museum', 'art', 'culture', 'indoor'],
      images: [`https://images.unsplash.com/photo-museum`],
      createdAt: new Date(),
      updatedAt: new Date()
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
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      starRating: 5,
      amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'concierge'],
      roomTypes: [
        {
          name: 'Standard Room',
          capacity: 2,
          bedConfiguration: 'King Bed',
          amenities: ['king_bed', 'city_view', 'minibar'],
          pricePerNight: { amount: 300, currency: 'USD' }
        }
      ],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: '24 hours before arrival',
      contactInfo: {
        phone: '+33 1 23 45 67 89',
        email: 'reservations@luxuryhotel.com',
        website: 'https://luxuryhotel.com',
        address: `123 Main Street, ${destination}`
      },
      estimatedCost: { amount: 300, currency: 'USD' },
      tags: ['luxury', 'central', '5-star'],
      images: [`https://images.unsplash.com/photo-luxury-hotel`],
      createdAt: new Date(),
      updatedAt: new Date()
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
      fromCoordinates: { latitude: 49.0097, longitude: 2.5479 },
      toCoordinates: { latitude: 48.8566, longitude: 2.3522 },
      departureTime: '10:00',
      arrivalTime: '11:00',
      duration: 60,
      estimatedCost: { amount: 55, currency: 'USD' },
      tags: ['private', 'comfortable', 'direct'],
      images: [`https://images.unsplash.com/photo-car-rental`],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  // Sample destinations
  const destinations: Destination[] = [
    {
      id: 'dest_1',
      title: destination,
      description: `Beautiful city of ${destination} with rich history and culture`,
      location: destination,
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      countryCode: 'FR',
      timezone: 'Europe/Paris',
      weatherInfo: {
        averageTemperature: 15,
        humidity: 70,
        precipitation: 50,
        season: 'spring'
      },
      localCurrency: 'EUR',
      languages: ['French', 'English'],
      safetyRating: 9,
      touristSeason: 'shoulder',
      images: [`https://images.unsplash.com/photo-${destination.toLowerCase()}`],
      tags: ['historic', 'romantic', 'cultural', 'gastronomy'],
      createdAt: new Date(),
      updatedAt: new Date()
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
  
  // Create MatchingCriteria from UserPreferences
  const criteria: MatchingCriteria = {
    userPreferences: preferences,
    destinationConstraints: [],
    timeConstraints: [],
    budgetConstraints: []
  }
  
  const [activityScores, accommodationScores, transportationScores, destinationScores] = await Promise.all([
    preferenceService.scoreContent(availableContent.activities, criteria),
    preferenceService.scoreContent(availableContent.accommodations, criteria),
    preferenceService.scoreContent(availableContent.transportation, criteria),
    preferenceService.scoreContent(availableContent.destinations, criteria)
  ])

  // Map contentId back to actual content
  const matchedContent = {
    activities: activityScores
      .map((score): Activity | null => availableContent.activities.find(a => a.id === score.contentId) || null)
      .filter((a): a is Activity => a !== null),
    accommodations: accommodationScores
      .map((score): Accommodation | null => availableContent.accommodations.find(a => a.id === score.contentId) || null)
      .filter((a): a is Accommodation => a !== null),
    transportation: transportationScores
      .map((score): Transportation | null => availableContent.transportation.find(t => t.id === score.contentId) || null)
      .filter((t): t is Transportation => t !== null),
    destinations: destinationScores
      .map((score): Destination | null => availableContent.destinations.find(d => d.id === score.contentId) || null)
      .filter((d): d is Destination => d !== null)
  }

  performanceTracker.end(matchingTimer)

  // Step 3: Destination sequencing
  const sequencingTimer = performanceTracker.start('destinationSequencing')
  
  const sequencingConstraints: SequencingConstraints = {
    maxTravelTimePerDay: 480, // 8 hours
    preferredTransportation: ['car', 'train', 'bus'],
    startLocation: preferences.primaryDestination,
    endLocation: preferences.primaryDestination
  }

  const sequencedDestinations = await sequencingService.optimizeSequence(
    matchedContent.destinations,
    preferences,
    sequencingConstraints
  )

  performanceTracker.end(sequencingTimer)

  // Step 4: Day planning
  const dayPlanningTimer = performanceTracker.start('dayPlanning')
  
  const tripDuration = Math.ceil(
    (new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const days: ItineraryDay[] = []
  // Handle case where no destinations are available
  if (sequencedDestinations.length === 0) {
    throw new Error('No destinations available for itinerary generation')
  }

  for (let dayNumber = 1; dayNumber <= tripDuration; dayNumber++) {
    const dayDate = new Date(preferences.startDate)
    dayDate.setDate(dayDate.getDate() + dayNumber - 1)
    
    const destinationIndex = Math.min(dayNumber - 1, sequencedDestinations.length - 1)
    const currentDestination = sequencedDestinations[destinationIndex]!
    
    const relevantActivities = matchedContent.activities.filter(activity =>
      activity.location.toLowerCase().includes(currentDestination.location.toLowerCase())
    )

    const dayPlanningPreferences = {
      pacing: (preferences.pacePreference === 'slow' ? 'relaxed' : 
               preferences.pacePreference === 'fast' ? 'packed' : 'moderate') as 'relaxed' | 'moderate' | 'packed',
      startTime: '09:00:00',
      endTime: '18:00:00',
      mealPreferences: [
        { type: 'breakfast' as const, timing: '08:00', style: 'casual' as const, budget: { amount: 25, currency: 'USD' } },
        { type: 'lunch' as const, timing: '12:30', style: 'casual' as const, budget: { amount: 35, currency: 'USD' } },
        { type: 'dinner' as const, timing: '19:00', style: 'fine_dining' as const, budget: { amount: 50, currency: 'USD' } }
      ],
      activityTypes: preferences.interests || [],
      maxActivities: preferences.pacePreference === 'slow' ? 2 : preferences.pacePreference === 'fast' ? 4 : 3,
      budgetForDay: { amount: 200, currency: 'USD' },
      accessibility: false
    }

    const dayDateString = dayDate.toISOString().split('T')[0]!
    
    const dayPlan = await dayPlanningService.planDay(
      currentDestination,
      dayDateString,
      relevantActivities,
      dayPlanningPreferences
    )

    const accommodation = matchedContent.accommodations.find(acc =>
      acc.location.toLowerCase().includes(currentDestination.location.toLowerCase())
    )

    const dayData: ItineraryDay = {
      id: `day_${dayNumber}`,
      dayNumber,
      date: dayDateString,
      title: `Day ${dayNumber}: ${currentDestination.title}`,
      location: currentDestination.location,
      coordinates: currentDestination.coordinates,
      activities: dayPlan.activities,
      transportation: [],
      meals: dayPlan.meals.map(meal => {
        const mealItem: Meal = {
          type: meal.type,
          time: meal.time,
          location: currentDestination.location,
          estimatedCost: meal.cost,
          dietaryOptions: []
        }
        if (meal.venue) {
          mealItem.venue = meal.venue
        }
        return mealItem
      }),
      totalEstimatedCost: { amount: 0, currency: 'USD' },
      pacing: dayPlan.pacing as 'relaxed' | 'moderate' | 'packed',
      notes: `Exploring ${currentDestination.title}`
    }
    
    if (accommodation) {
      dayData.accommodation = accommodation
    }
    
    days.push(dayData)
  }

  performanceTracker.end(dayPlanningTimer)

  // Step 5: Pricing calculation
  const pricingTimer = performanceTracker.start('pricingCalculation')
  
  const preliminaryItinerary: GeneratedItinerary = {
    id: `itin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
      culturalImmersion: 'deep' as const
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
    
    if (cached && cached.itinerary) {
      return NextResponse.json({
        success: true,
        itinerary: cached.itinerary,
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
    const generationResult: GenerationResult = {
      itinerary,
      success: true,
      metadata: {
        generationTimeMs: totalTime,
        componentsUsed: {
          destinationsProcessed: itinerary.destinations.length,
          activitiesEvaluated: itinerary.days.reduce((sum, day) => sum + day.activities.length, 0),
          accommodationsConsidered: itinerary.days.filter(day => day.accommodation).length,
          transportationOptions: itinerary.days.reduce((sum, day) => sum + day.transportation.length, 0),
          totalContentItems: 0
        },
        performanceMetrics: {
          contentLoadingMs: performanceTracker.getResults()['contentLoading'] || 0,
          preferencesAnalysisMs: 0,
          matchingAlgorithmMs: performanceTracker.getResults()['contentMatching'] || 0,
          sequencingMs: performanceTracker.getResults()['destinationSequencing'] || 0,
          optimizationMs: performanceTracker.getResults()['dayPlanning'] || 0
        },
        optimizationApplied: ['parallel-processing', 'content-filtering', 'smart-sequencing']
      }
    }
    await cachingService.set(cacheKey, generationResult)

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