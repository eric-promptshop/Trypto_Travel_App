import { 
  DefaultPricingCalculationService, 
  createPricingCalculationService,
  PricingServiceConfig 
} from './pricing-calculation-service'
import {
  GeneratedItinerary,
  Activity,
  Accommodation,
  Transportation,
  Money,
  ItineraryDay
} from '@/lib/types/itinerary'
import { PricingContext } from '../types'

/**
 * Test data factory for pricing calculations
 */
export class PricingTestDataFactory {
  /**
   * Create sample activities for testing
   */
  static createSampleActivities(): Activity[] {
    return [
      {
        id: 'activity_1',
        title: 'Eiffel Tower Visit',
        description: 'Visit the iconic Eiffel Tower with skip-the-line access',
        category: 'sightseeing',
        location: 'Paris, France',
        coordinates: { latitude: 48.8584, longitude: 2.2945 },
        timeSlot: { startTime: '09:00:00', endTime: '11:00:00', duration: 120 },
        difficulty: 'easy',
        indoorOutdoor: 'outdoor',
        accessibility: {
          wheelchairAccessible: true,
          hearingImpaired: false,
          visuallyImpaired: false,
          mobilityAssistance: true
        },
        seasonality: ['year-round'],
        bookingRequired: true,
        images: ['eiffel-tower.jpg'],
        tags: ['landmark', 'photography', 'architecture'],
        estimatedCost: { amount: 25, currency: 'EUR' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'activity_2',
        title: 'Seine River Cruise',
        description: 'Relaxing cruise along the Seine River with audio guide',
        category: 'sightseeing',
        location: 'Paris, France',
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        timeSlot: { startTime: '14:00:00', endTime: '15:30:00', duration: 90 },
        difficulty: 'easy',
        indoorOutdoor: 'outdoor',
        accessibility: {
          wheelchairAccessible: true,
          hearingImpaired: false,
          visuallyImpaired: false,
          mobilityAssistance: false
        },
        seasonality: ['spring', 'summer', 'fall'],
        bookingRequired: false,
        images: ['seine-cruise.jpg'],
        tags: ['river', 'relaxation', 'sightseeing'],
        estimatedCost: { amount: 15, currency: 'EUR' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'activity_3',
        title: 'French Cooking Class',
        description: 'Learn to cook traditional French dishes with a professional chef',
        category: 'culinary',
        location: 'Paris, France',
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        timeSlot: { startTime: '18:00:00', endTime: '21:00:00', duration: 180 },
        difficulty: 'moderate',
        indoorOutdoor: 'indoor',
        accessibility: {
          wheelchairAccessible: false,
          hearingImpaired: false,
          visuallyImpaired: false,
          mobilityAssistance: false
        },
        seasonality: ['year-round'],
        bookingRequired: true,
        images: ['cooking-class.jpg'],
        tags: ['cooking', 'food', 'cultural'],
        estimatedCost: { amount: 120, currency: 'EUR' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  /**
   * Create sample accommodations for testing
   */
  static createSampleAccommodations(): Accommodation[] {
    return [
      {
        id: 'hotel_1',
        title: 'Hotel Le Marais',
        description: 'Boutique hotel in the heart of Paris',
        type: 'hotel',
        location: 'Paris, France',
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        starRating: 4,
        amenities: ['wifi', 'breakfast', 'concierge', 'gym'],
        roomTypes: [
          {
            name: 'Standard Double',
            capacity: 2,
            bedConfiguration: '1 Queen Bed',
            amenities: ['wifi', 'tv', 'minibar'],
            pricePerNight: { amount: 180, currency: 'EUR' }
          },
          {
            name: 'Deluxe Suite',
            capacity: 4,
            bedConfiguration: '1 King Bed + Sofa Bed',
            amenities: ['wifi', 'tv', 'minibar', 'balcony'],
            pricePerNight: { amount: 280, currency: 'EUR' }
          }
        ],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
        contactInfo: {
          phone: '+33 1 42 72 34 12',
          email: 'info@hotelemarais.fr',
          website: 'https://hotelemarais.fr',
          address: '12 Rue des Rosiers, 75004 Paris, France'
        },
        images: ['hotel-marais.jpg'],
        tags: ['boutique', 'central', 'historic'],
        estimatedCost: { amount: 180, currency: 'EUR' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  /**
   * Create sample transportation for testing
   */
  static createSampleTransportation(): Transportation[] {
    return [
      {
        id: 'flight_1',
        title: 'Flight to Paris',
        description: 'Direct flight from New York to Paris',
        type: 'flight',
        from: 'New York, NY, USA',
        to: 'Paris, France',
        fromCoordinates: { latitude: 40.7128, longitude: -74.0060 },
        toCoordinates: { latitude: 48.8566, longitude: 2.3522 },
        departureTime: '22:00:00',
        arrivalTime: '11:00:00',
        duration: 480, // 8 hours
        carrier: 'Air France',
        vehicleInfo: {
          seatClass: 'Economy',
          amenities: ['meals', 'entertainment', 'wifi']
        },
        images: ['air-france.jpg'],
        tags: ['direct', 'international'],
        estimatedCost: { amount: 650, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'train_1',
        title: 'High-Speed Train to London',
        description: 'Eurostar train from Paris to London',
        type: 'train',
        from: 'Paris, France',
        to: 'London, UK',
        fromCoordinates: { latitude: 48.8566, longitude: 2.3522 },
        toCoordinates: { latitude: 51.5074, longitude: -0.1278 },
        departureTime: '09:30:00',
        arrivalTime: '10:57:00',
        duration: 147, // 2h 27min
        carrier: 'Eurostar',
        vehicleInfo: {
          seatClass: 'Standard',
          amenities: ['wifi', 'power_outlets', 'cafe']
        },
        images: ['eurostar.jpg'],
        tags: ['high-speed', 'cross-border'],
        estimatedCost: { amount: 89, currency: 'EUR' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  /**
   * Create a sample itinerary for testing
   */
  static createSampleItinerary(): GeneratedItinerary {
    const activities = this.createSampleActivities()
    const accommodations = this.createSampleAccommodations()
    const transportation = this.createSampleTransportation()

    if (activities.length < 3) throw new Error('Need at least 3 activities for test')
    if (accommodations.length < 1) throw new Error('Need at least 1 accommodation for test')
    if (transportation.length < 1) throw new Error('Need at least 1 transportation for test')

    const day1: ItineraryDay = {
      id: 'day_1',
      dayNumber: 1,
      date: '2024-07-15',
      title: 'Arrival in Paris',
      location: 'Paris, France',
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      accommodation: accommodations[0],
      activities: activities.slice(0, 2),
      transportation: transportation.slice(0, 1),
      meals: [
        {
          type: 'dinner',
          time: '19:00',
          venue: 'Le Comptoir du 6ème',
          location: 'Paris, France',
          estimatedCost: { amount: 45, currency: 'EUR' },
          dietaryOptions: ['vegetarian']
        }
      ],
      totalEstimatedCost: { amount: 0, currency: 'EUR' }, // Will be calculated
      pacing: 'relaxed',
      notes: 'First day in Paris - take it easy after the flight'
    }

    const day2: ItineraryDay = {
      id: 'day_2',
      dayNumber: 2,
      date: '2024-07-16',
      title: 'Exploring Paris',
      location: 'Paris, France',
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      accommodation: accommodations[0],
      activities: activities.slice(2, 3),
      transportation: [],
      meals: [
        {
          type: 'breakfast',
          time: '08:00',
          venue: 'Hotel Restaurant',
          estimatedCost: { amount: 25, currency: 'EUR' },
          dietaryOptions: ['continental']
        },
        {
          type: 'lunch',
          time: '12:30',
          venue: 'Café de Flore',
          estimatedCost: { amount: 35, currency: 'EUR' },
          dietaryOptions: ['vegetarian', 'gluten-free']
        }
      ],
      totalEstimatedCost: { amount: 0, currency: 'EUR' }, // Will be calculated
      pacing: 'moderate',
      notes: 'Full day of activities and cultural experiences'
    }

    return {
      id: 'itinerary_test_1',
      title: 'Paris Weekend Getaway',
      description: 'A relaxing 2-day trip to Paris with cultural activities',
      destinations: [
        {
          id: 'dest_paris',
          title: 'Paris',
          description: 'The City of Light',
          location: 'Paris, France',
          coordinates: { latitude: 48.8566, longitude: 2.3522 },
          countryCode: 'FR',
          timezone: 'Europe/Paris',
          localCurrency: 'EUR',
          languages: ['French'],
          safetyRating: 8,
          touristSeason: 'peak',
          images: ['paris.jpg'],
          tags: ['romantic', 'cultural', 'historic'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ],
      days: [day1, day2],
      totalDuration: 2,
      totalEstimatedCost: { amount: 0, currency: 'EUR' }, // Will be calculated
      summary: {
        highlights: ['Eiffel Tower', 'Seine Cruise', 'French Cooking'],
        totalActivities: 3,
        uniqueDestinations: 1,
        avgDailyCost: { amount: 0, currency: 'EUR' },
        recommendedBudget: { amount: 0, currency: 'EUR' },
        physicalDemand: 'low',
        culturalImmersion: 'moderate'
      },
      metadata: {
        generationTime: 1500,
        aiModel: 'test-model',
        confidenceScore: 0.85,
        optimizationFlags: ['budget-optimized']
      },
      preferences: {
        adults: 2,
        children: 0,
        infants: 0,
        startDate: '2024-07-15',
        endDate: '2024-07-16',
        budgetMin: 500,
        budgetMax: 1500,
        primaryDestination: 'Paris, France',
        interests: ['cultural', 'culinary', 'sightseeing'],
        accommodationType: 'hotel',
        transportationPreference: 'flight',
        tripDuration: 2,
        travelerProfiles: [
          { type: 'adult', count: 2 }
        ],
        budgetCategory: 'mid-range',
        pacePreference: 'moderate'
      },
      generatedAt: new Date('2024-01-01'),
      version: '1.0.0'
    }
  }

  /**
   * Create pricing context for testing
   */
  static createPricingContext(overrides: Partial<PricingContext> = {}): PricingContext {
    return {
      dates: { start: '2024-07-15', end: '2024-07-16' },
      travelers: 2,
      seasonality: 'peak',
      advanceBooking: 45, // 45 days in advance
      currency: 'EUR',
      ...overrides
    }
  }
}

/**
 * Comprehensive test suite for pricing calculation service
 */
export class PricingCalculationTester {
  private service: DefaultPricingCalculationService

  constructor(config?: Partial<PricingServiceConfig>) {
    this.service = createPricingCalculationService(config) as DefaultPricingCalculationService
  }

  /**
   * Test individual component pricing
   */
  async testComponentPricing(): Promise<void> {
    console.log('🧪 Testing Individual Component Pricing...\n')

    const context = PricingTestDataFactory.createPricingContext()
    const activities = PricingTestDataFactory.createSampleActivities()
    const accommodations = PricingTestDataFactory.createSampleAccommodations()
    const transportation = PricingTestDataFactory.createSampleTransportation()

    // Test activity pricing
    for (const activity of activities) {
      const cost = await this.service.estimateComponentCost(activity, context)
      console.log(`🎯 ${activity.title}:`)
      console.log(`   Category: ${activity.category}`)
      console.log(`   Estimated Cost: ${cost.amount} ${cost.currency}`)
      console.log(`   Base Cost: ${activity.estimatedCost?.amount} ${activity.estimatedCost?.currency}`)
      console.log('')
    }

    // Test accommodation pricing
    for (const accommodation of accommodations) {
      const cost = await this.service.estimateComponentCost(accommodation, context)
      console.log(`🏨 ${accommodation.title}:`)
      console.log(`   Type: ${accommodation.type} (${accommodation.starRating} stars)`)
      console.log(`   Estimated Cost: ${cost.amount} ${cost.currency}`)
      console.log(`   Base Cost: ${accommodation.estimatedCost?.amount} ${accommodation.estimatedCost?.currency}`)
      console.log('')
    }

    // Test transportation pricing
    for (const transport of transportation) {
      const cost = await this.service.estimateComponentCost(transport, context)
      console.log(`✈️ ${transport.title}:`)
      console.log(`   Type: ${transport.type}`)
      console.log(`   Route: ${transport.from} → ${transport.to}`)
      console.log(`   Estimated Cost: ${cost.amount} ${cost.currency}`)
      console.log(`   Base Cost: ${transport.estimatedCost?.amount} ${transport.estimatedCost?.currency}`)
      console.log('')
    }
  }

  /**
   * Test seasonal pricing adjustments
   */
  async testSeasonalPricing(): Promise<void> {
    console.log('🌤️ Testing Seasonal Pricing Adjustments...\n')

    const activities = PricingTestDataFactory.createSampleActivities()
    if (activities.length === 0) throw new Error('No test activities available')
    const activity = activities[0]
    const seasons: Array<'peak' | 'shoulder' | 'off'> = ['peak', 'shoulder', 'off']

    for (const season of seasons) {
      const context = PricingTestDataFactory.createPricingContext({ seasonality: season })
      const cost = await this.service.estimateComponentCost(activity, context)
      console.log(`🗓️ ${season.toUpperCase()} Season:`)
      console.log(`   ${activity.title}: ${cost.amount} ${cost.currency}`)
      console.log('')
    }
  }

  /**
   * Test currency conversion
   */
  async testCurrencyConversion(): Promise<void> {
    console.log('💱 Testing Currency Conversion...\n')

    const activities = PricingTestDataFactory.createSampleActivities()
    if (activities.length === 0) throw new Error('No test activities available')
    const activity = activities[0]
    const currencies = ['USD', 'EUR', 'GBP', 'JPY']

    for (const currency of currencies) {
      const context = PricingTestDataFactory.createPricingContext({ currency })
      const cost = await this.service.estimateComponentCost(activity, context)
      console.log(`💰 ${currency}: ${cost.amount} ${cost.currency}`)
    }
    console.log('')
  }

  /**
   * Test complete itinerary cost calculation
   */
  async testItineraryCostCalculation(): Promise<void> {
    console.log('📊 Testing Complete Itinerary Cost Calculation...\n')

    const itinerary = PricingTestDataFactory.createSampleItinerary()
    const costBreakdown = await this.service.calculateItineraryCost(itinerary)

    console.log('💰 COST BREAKDOWN:')
    console.log(`   Total: ${costBreakdown.total.amount} ${costBreakdown.total.currency}`)
    console.log(`   Confidence: ${(costBreakdown.confidence * 100).toFixed(1)}%`)
    console.log('')

    console.log('📋 BY CATEGORY:')
    Object.entries(costBreakdown.byCategory).forEach(([category, cost]) => {
      console.log(`   ${category}: ${cost.amount} ${cost.currency}`)
    })
    console.log('')

    console.log('📅 BY DAY:')
    costBreakdown.byDay.forEach((day, index) => {
      console.log(`   Day ${index + 1} (${day.date}): ${day.total.amount} ${day.total.currency}`)
    })
    console.log('')

    console.log(`🛡️ Contingency Buffer: ${costBreakdown.contingency.amount} ${costBreakdown.contingency.currency}`)
    console.log('')
  }

  /**
   * Test budget optimization
   */
  async testBudgetOptimization(): Promise<void> {
    console.log('⚖️ Testing Budget Optimization...\n')

    const itinerary = PricingTestDataFactory.createSampleItinerary()
    const maxBudget: Money = { amount: 800, currency: 'EUR' }

    // Get current cost
    const currentCost = await this.service.calculateItineraryCost(itinerary)
    console.log(`💸 Current Total: ${currentCost.total.amount} ${currentCost.total.currency}`)
    console.log(`🎯 Target Budget: ${maxBudget.amount} ${maxBudget.currency}`)

    // Optimize for budget
    const optimization = await this.service.optimizeForBudget(itinerary, maxBudget)
    console.log(`💰 Cost Reduction: ${optimization.costReduction.amount} ${optimization.costReduction.currency}`)
    console.log(`🔧 Changes Applied: ${optimization.changesApplied.length}`)
    console.log(`⚠️ Tradeoffs: ${optimization.tradeoffs.length}`)
    console.log('')
  }

  /**
   * Test service performance
   */
  async testPerformance(): Promise<void> {
    console.log('⚡ Testing Performance...\n')

    const startTime = performance.now()
    const activities = PricingTestDataFactory.createSampleActivities()
    if (activities.length === 0) throw new Error('No test activities available')
    const activity = activities[0]
    const context = PricingTestDataFactory.createPricingContext()

    // Test multiple pricing calculations
    const iterations = 100
    for (let i = 0; i < iterations; i++) {
      await this.service.estimateComponentCost(activity, context)
    }

    const endTime = performance.now()
    const avgTime = (endTime - startTime) / iterations

    console.log(`⏱️ Performance Results (${iterations} iterations):`)
    console.log(`   Average time per calculation: ${avgTime.toFixed(2)}ms`)
    console.log(`   Total time: ${(endTime - startTime).toFixed(2)}ms`)
    console.log('')

    // Test service stats
    const stats = this.service.getServiceStats()
    console.log('📈 Service Statistics:')
    console.log(`   Cache size: ${stats.cacheSize}`)
    console.log(`   Supported currencies: ${stats.supportedCurrencies.join(', ')}`)
    console.log(`   Pricing models: ${stats.pricingModels.length}`)
    console.log('')
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Pricing Service Tests\n')
    console.log('='.repeat(60) + '\n')

    try {
      await this.testComponentPricing()
      await this.testSeasonalPricing()
      await this.testCurrencyConversion()
      await this.testItineraryCostCalculation()
      await this.testBudgetOptimization()
      await this.testPerformance()

      console.log('✅ All tests completed successfully!')
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }
}

/**
 * Run pricing service tests
 */
export async function runPricingTests(): Promise<void> {
  const tester = new PricingCalculationTester()
  await tester.runAllTests()
} 