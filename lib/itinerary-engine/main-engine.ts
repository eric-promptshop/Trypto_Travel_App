import {
  ItineraryGenerationEngine,
  PreferenceMatchingService,
  DestinationSequencingService,
  DayPlanningService,
  PricingCalculationService,
  CachingService,
  GenerationRequest,
  GenerationResult,
  GenerationMetrics,
  ExternalDataProvider,
  GenerationEngineOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EngineStatus,
  SequencingConstraints
} from './types'
import {
  GeneratedItinerary,
  UserPreferences,
  Activity,
  Accommodation,
  Transportation,
  Destination,
  ItineraryDay,
  Money
} from '@/lib/types/itinerary'

import { DefaultPreferenceMatchingService } from './services/preference-matching-service'
import { DefaultDestinationSequencingService } from './services/destination-sequencing-service'
import { DefaultDayPlanningService } from './services/day-planning-service'
import { DefaultPricingCalculationService } from './services/pricing-calculation-service'
import { MemoryCachingService } from './services/caching-service'

/**
 * Configuration for the itinerary generation engine
 */
export interface EngineConfig {
  performanceTarget: number // Maximum generation time in milliseconds (default: 3000)
  enableParallelProcessing: boolean
  cacheEnabled: boolean
  maxContentItems: number
  fallbackStrategies: boolean
  debugMode: boolean
  externalDataProviders?: Map<string, ExternalDataProvider>
}

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private activeOperations: Map<string, number> = new Map()

  startOperation(operationName: string): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random()}`
    this.activeOperations.set(operationId, performance.now())
    return operationId
  }

  endOperation(operationId: string): number {
    const startTime = this.activeOperations.get(operationId)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.activeOperations.delete(operationId)

    // Extract operation name from ID
    const operationName = operationId.split('_')[0]
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, [])
    }
    this.metrics.get(operationName)!.push(duration)

    return duration
  }

  getMetrics(): GenerationMetrics {
    const stats: { [key: string]: any } = {}

    for (const [operation, durations] of this.metrics) {
      if (durations.length > 0) {
        const sorted = durations.sort((a, b) => a - b)
        stats[operation] = {
          count: durations.length,
          average: durations.reduce((a, b) => a + b, 0) / durations.length,
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          min: Math.min(...durations),
          max: Math.max(...durations)
        }
      }
    }

    return {
      operationStats: stats,
      totalActiveOperations: this.activeOperations.size,
      memoryUsage: this.getMemoryUsage()
    }
  }

  private getMemoryUsage(): any {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage()
    }
    return { heapUsed: 0, heapTotal: 0, external: 0 }
  }

  reset(): void {
    this.metrics.clear()
    this.activeOperations.clear()
  }
}

/**
 * Main itinerary generation engine implementation
 */
export class DefaultItineraryGenerationEngine implements ItineraryGenerationEngine {
  private config: EngineConfig
  private preferenceService!: PreferenceMatchingService
  private sequencingService!: DestinationSequencingService
  private dayPlanningService!: DayPlanningService
  private pricingService!: PricingCalculationService
  private cachingService!: CachingService
  private performanceMonitor: PerformanceMonitor
  private isInitialized: boolean = false

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      performanceTarget: 3000, // 3 seconds
      enableParallelProcessing: true,
      cacheEnabled: true,
      maxContentItems: 10000,
      fallbackStrategies: true,
      debugMode: false,
      ...config
    }

    this.performanceMonitor = new PerformanceMonitor()
    this.initializeServices()
  }

  private initializeServices(): void {
    // Initialize caching service
    this.cachingService = new MemoryCachingService(1000, 1800) // 1000 items, 30 minutes TTL

    // Initialize core services with optimized configurations
    this.preferenceService = new DefaultPreferenceMatchingService({
      interests: 35,
      budget: 25,
      location: 20,
      timing: 10,
      difficulty: 5,
      accessibility: 5
    })
    this.sequencingService = new DefaultDestinationSequencingService()
    this.dayPlanningService = new DefaultDayPlanningService()
    this.pricingService = new DefaultPricingCalculationService({
      baseCurrency: 'USD',
      cacheTTLMinutes: 30,
      contingencyPercentage: 15
    })

    this.isInitialized = true
  }

  /**
   * Interface implementation: Generate itinerary from user preferences
   */
  async generateItinerary(
    userPreferences: UserPreferences,
    options?: GenerationEngineOptions
  ): Promise<GenerationResult> {
    // Create a GenerationRequest object for internal processing
    const request: GenerationRequest = {
      preferences: userPreferences,
      availableContent: [], // This would normally be loaded from content processing system
      options
    }

    return this.generateItineraryFromRequest(request)
  }

  /**
   * Interface implementation: Get cached result
   */
  async getCachedResult(cacheKey: string): Promise<GenerationResult | null> {
    if (!this.config.cacheEnabled) return null
    
    try {
      const cached = await this.cachingService.get(cacheKey)
      if (cached) {
        return cached
      }
    } catch (error) {
      console.warn('Cache retrieval failed:', error)
    }
    
    return null
  }

  /**
   * Interface implementation: Validate user preferences
   */
  validatePreferences(preferences: UserPreferences): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields validation
    if (!preferences.startDate) {
      errors.push({
        field: 'startDate',
        message: 'Start date is required',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!preferences.endDate) {
      errors.push({
        field: 'endDate',
        message: 'End date is required',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!preferences.primaryDestination) {
      errors.push({
        field: 'primaryDestination',
        message: 'Primary destination is required',
        code: 'REQUIRED_FIELD'
      })
    }

    // Date validation
    if (preferences.startDate && preferences.endDate) {
      const startDate = new Date(preferences.startDate)
      const endDate = new Date(preferences.endDate)
      
      if (startDate >= endDate) {
        errors.push({
          field: 'endDate',
          message: 'End date must be after start date',
          code: 'INVALID_DATE_RANGE'
        })
      }

      const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (tripDuration > 30) {
        errors.push({
          field: 'endDate',
          message: 'Trip duration cannot exceed 30 days',
          code: 'EXCESSIVE_DURATION'
        })
      }

      if (tripDuration < 1) {
        errors.push({
          field: 'endDate',
          message: 'Trip must be at least 1 day',
          code: 'INSUFFICIENT_DURATION'
        })
      }
    }

    // Budget validation
    if (preferences.budgetMin !== undefined && preferences.budgetMax !== undefined) {
      if (preferences.budgetMin > preferences.budgetMax) {
        errors.push({
          field: 'budgetMax',
          message: 'Maximum budget must be greater than minimum budget',
          code: 'INVALID_BUDGET_RANGE'
        })
      }
    }

    // Traveler count validation
    const totalTravelers = (preferences.adults || 0) + (preferences.children || 0) + (preferences.infants || 0)
    if (totalTravelers === 0) {
      errors.push({
        field: 'adults',
        message: 'At least one traveler is required',
        code: 'NO_TRAVELERS'
      })
    }

    if (totalTravelers > 20) {
      warnings.push({
        field: 'travelers',
        message: 'Large group travel may have limited options',
        suggestion: 'Consider splitting into smaller groups'
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Interface implementation: Get engine status
   */
  getEngineStatus(): EngineStatus {
    return {
      version: '1.0.0',
      uptime: Date.now(), // Simplified uptime
      totalGenerations: 0, // Would be tracked in production
      successRate: 0.95, // Would be calculated from actual metrics
      averageGenerationTime: 2500, // milliseconds
      cacheStats: this.cachingService.getStats(),
      healthChecks: [
        {
          component: 'PreferenceMatchingService',
          status: 'healthy',
          lastChecked: new Date()
        },
        {
          component: 'DestinationSequencingService', 
          status: 'healthy',
          lastChecked: new Date()
        },
        {
          component: 'DayPlanningService',
          status: 'healthy',
          lastChecked: new Date()
        },
        {
          component: 'PricingCalculationService',
          status: 'healthy',
          lastChecked: new Date()
        }
      ]
    }
  }

  /**
   * Internal method to generate itinerary from request
   */
  private async generateItineraryFromRequest(request: GenerationRequest): Promise<GenerationResult> {
    const overallTimer = this.performanceMonitor.startOperation('generateItinerary')
    const startTime = performance.now()

    try {
      // Validate input
      const validation = this.validatePreferences(request.preferences)
      if (!validation.valid) {
        return {
          itinerary: null,
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validation.errors.map(e => e.message).join(', '),
            details: validation.errors,
            timestamp: new Date()
          },
          metadata: {
            generationTimeMs: performance.now() - startTime,
            componentsUsed: {
              destinationsProcessed: 0,
              activitiesEvaluated: 0,
              accommodationsConsidered: 0,
              transportationOptions: 0,
              totalContentItems: 0
            },
            performanceMetrics: {
              contentLoadingMs: 0,
              preferencesAnalysisMs: 0,
              matchingAlgorithmMs: 0,
              sequencingMs: 0,
              optimizationMs: 0
            },
            optimizationApplied: []
          }
        }
      }

      // Check cache first
      if (this.config.cacheEnabled) {
        const cacheKey = this.generateCacheKey(request)
        const cached = await this.getCachedResult(cacheKey)
        if (cached && cached.success) {
          this.performanceMonitor.endOperation(overallTimer)
          return {
            ...cached,
            cacheKey
          }
        }
      }

      // Execute generation pipeline
      const itinerary = await this.executeGenerationPipeline(request)

      // Calculate final metrics
      const totalTime = this.performanceMonitor.endOperation(overallTimer)
      const metrics = this.performanceMonitor.getMetrics()

      // Cache result if successful
      if (this.config.cacheEnabled && itinerary) {
        await this.cacheResult(request, itinerary)
      }

      // Check if we met performance target
      const metPerformanceTarget = totalTime <= this.config.performanceTarget

      if (this.config.debugMode) {
        console.log(`Itinerary generation completed in ${totalTime}ms (target: ${this.config.performanceTarget}ms)`)
        console.log('Performance metrics:', metrics)
      }

      return {
        itinerary,
        success: true,
        metadata: {
          generationTimeMs: totalTime,
          componentsUsed: {
            destinationsProcessed: itinerary.destinations.length,
            activitiesEvaluated: itinerary.days.reduce((sum, day) => sum + day.activities.length, 0),
            accommodationsConsidered: itinerary.days.filter(day => day.accommodation).length,
            transportationOptions: itinerary.days.reduce((sum, day) => sum + day.transportation.length, 0),
            totalContentItems: request.availableContent.length
          },
          performanceMetrics: {
            contentLoadingMs: 0,
            preferencesAnalysisMs: 0,
            matchingAlgorithmMs: 0,
            sequencingMs: 0,
            optimizationMs: 0
          },
          optimizationApplied: []
        }
      }

    } catch (error) {
      this.performanceMonitor.endOperation(overallTimer)
      
      if (this.config.debugMode) {
        console.error('Itinerary generation failed:', error)
      }

      // Try fallback strategy if enabled
      if (this.config.fallbackStrategies) {
        const fallbackResult = await this.executeFallbackStrategy(request, error as Error)
        if (fallbackResult) {
          return fallbackResult
        }
      }

      return {
        itinerary: null,
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
          timestamp: new Date()
        },
        metadata: {
          generationTimeMs: performance.now() - startTime,
          componentsUsed: {
            destinationsProcessed: 0,
            activitiesEvaluated: 0,
            accommodationsConsidered: 0,
            transportationOptions: 0,
            totalContentItems: 0
          },
          performanceMetrics: {
            contentLoadingMs: 0,
            preferencesAnalysisMs: 0,
            matchingAlgorithmMs: 0,
            sequencingMs: 0,
            optimizationMs: 0
          },
          optimizationApplied: []
        }
      }
    }
  }

  /**
   * Main method to generate a complete itinerary
   */
  private async generateItineraryInternal(request: GenerationRequest): Promise<GenerationResult> {
    const overallTimer = this.performanceMonitor.startOperation('generateItinerary')
    const startTime = performance.now()

    try {
      // Validate input
      this.validateRequest(request)

      // Check cache first
      if (this.config.cacheEnabled) {
        const cacheKey = this.generateCacheKey(request)
        const cached = await this.checkCache(request)
        if (cached) {
          this.performanceMonitor.endOperation(overallTimer)
          return {
            success: true,
            itinerary: cached,
            metadata: {
              generationTimeMs: performance.now() - startTime,
              componentsUsed: {
                destinationsProcessed: cached.destinations.length,
                activitiesEvaluated: cached.days.reduce((sum, day) => sum + day.activities.length, 0),
                accommodationsConsidered: cached.days.filter(day => day.accommodation).length,
                transportationOptions: cached.days.reduce((sum, day) => sum + day.transportation.length, 0),
                totalContentItems: request.availableContent.length
              },
              performanceMetrics: {
                contentLoadingMs: 0,
                preferencesAnalysisMs: 0,
                matchingAlgorithmMs: 0,
                sequencingMs: 0,
                optimizationMs: 0
              },
              optimizationApplied: ['cache']
            },
            cacheKey: cacheKey
          }
        }
      }

      // Execute generation pipeline
      const itinerary = await this.executeGenerationPipeline(request)

      // Calculate final metrics
      const totalTime = this.performanceMonitor.endOperation(overallTimer)
      const metrics = this.performanceMonitor.getMetrics()

      // Cache result if successful
      if (this.config.cacheEnabled && itinerary) {
        await this.cacheResult(request, itinerary)
      }

      // Check if we met performance target
      const metPerformanceTarget = totalTime <= this.config.performanceTarget

      if (this.config.debugMode) {
        console.log(`Itinerary generation completed in ${totalTime}ms (target: ${this.config.performanceTarget}ms)`)
        console.log('Performance metrics:', metrics)
      }

      return {
        success: true,
        itinerary,
        metadata: {
          generationTimeMs: totalTime,
          componentsUsed: {
            destinationsProcessed: itinerary.destinations.length,
            activitiesEvaluated: itinerary.days.reduce((sum, day) => sum + day.activities.length, 0),
            accommodationsConsidered: itinerary.days.filter(day => day.accommodation).length,
            transportationOptions: itinerary.days.reduce((sum, day) => sum + day.transportation.length, 0),
            totalContentItems: request.availableContent.length
          },
          performanceMetrics: {
            contentLoadingMs: 0,
            preferencesAnalysisMs: 0,
            matchingAlgorithmMs: 0,
            sequencingMs: 0,
            optimizationMs: 0
          },
          optimizationApplied: []
        }
      }

    } catch (error) {
      this.performanceMonitor.endOperation(overallTimer)
      
      if (this.config.debugMode) {
        console.error('Itinerary generation failed:', error)
      }

      // Try fallback strategy if enabled
      if (this.config.fallbackStrategies) {
        const fallbackResult = await this.executeFallbackStrategy(request, error as Error)
        if (fallbackResult) {
          return fallbackResult
        }
      }

      return {
        success: false,
        itinerary: null,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date()
        },
        metadata: {
          generationTimeMs: performance.now() - startTime,
          componentsUsed: {
            destinationsProcessed: 0,
            activitiesEvaluated: 0,
            accommodationsConsidered: 0,
            transportationOptions: 0,
            totalContentItems: request.availableContent.length
          },
          performanceMetrics: {
            contentLoadingMs: 0,
            preferencesAnalysisMs: 0,
            matchingAlgorithmMs: 0,
            sequencingMs: 0,
            optimizationMs: 0
          },
          optimizationApplied: []
        }
      }
    }
  }

  /**
   * Execute the main generation pipeline with parallel processing
   */
  private async executeGenerationPipeline(request: GenerationRequest): Promise<GeneratedItinerary> {
    const { preferences, availableContent } = request

    // Step 1: Content Matching (can be parallelized by content type)
    const contentMatchingTimer = this.performanceMonitor.startOperation('contentMatching')
    
    let matchedContent: {
      activities: Activity[]
      accommodations: Accommodation[]
      transportation: Transportation[]
      destinations: Destination[]
    }

    if (this.config.enableParallelProcessing) {
      // Parallel content matching by type
      const criteria = this.preferenceService.analyzePreferences(preferences)
      const [activities, accommodations, transportation, destinations] = await Promise.all([
        this.preferenceService.scoreContent(
          availableContent.filter(c => 'category' in c) as Activity[],
          criteria
        ),
        this.preferenceService.scoreContent(
          availableContent.filter(c => 'type' in c && 'roomTypes' in c) as Accommodation[],
          criteria
        ),
        this.preferenceService.scoreContent(
          availableContent.filter(c => 'type' in c && 'from' in c) as Transportation[],
          criteria
        ),
        this.preferenceService.scoreContent(
          availableContent.filter(c => 'countryCode' in c) as Destination[],
          criteria
        )
      ])

      // Map scores back to content
      const activityMap = new Map((availableContent.filter(c => 'category' in c) as Activity[]).map(a => [a.id, a]))
      const accommodationMap = new Map((availableContent.filter(c => 'type' in c && 'roomTypes' in c) as Accommodation[]).map(a => [a.id, a]))
      const transportMap = new Map((availableContent.filter(c => 'type' in c && 'from' in c) as Transportation[]).map(t => [t.id, t]))
      const destinationMap = new Map((availableContent.filter(c => 'countryCode' in c) as Destination[]).map(d => [d.id, d]))

      matchedContent = {
        activities: activities
          .filter(score => score.score > 0.5)
          .map(score => activityMap.get(score.contentId))
          .filter(Boolean) as Activity[],
        accommodations: accommodations
          .filter(score => score.score > 0.5)
          .map(score => accommodationMap.get(score.contentId))
          .filter(Boolean) as Accommodation[],
        transportation: transportation
          .filter(score => score.score > 0.5)
          .map(score => transportMap.get(score.contentId))
          .filter(Boolean) as Transportation[],
        destinations: destinations
          .filter(score => score.score > 0.5)
          .map(score => destinationMap.get(score.contentId))
          .filter(Boolean) as Destination[]
      }
    } else {
      // Sequential content matching
      const criteria = this.preferenceService.analyzePreferences(preferences)
      const allResults = await this.preferenceService.scoreContent(availableContent, criteria)
      
      // Create content map for lookup
      const contentMap = new Map(availableContent.map(c => [c.id, c]))
      
      // Filter by score and map back to content
      const filteredResults = allResults.filter(r => r.score > 0.5)
      
      matchedContent = {
        activities: filteredResults
          .map(r => contentMap.get(r.contentId))
          .filter(c => c && 'category' in c) as Activity[],
        accommodations: filteredResults
          .map(r => contentMap.get(r.contentId))
          .filter(c => c && 'type' in c && 'roomTypes' in c) as Accommodation[],
        transportation: filteredResults
          .map(r => contentMap.get(r.contentId))
          .filter(c => c && 'type' in c && 'from' in c) as Transportation[],
        destinations: filteredResults
          .map(r => contentMap.get(r.contentId))
          .filter(c => c && 'countryCode' in c) as Destination[]
      }
    }

    this.performanceMonitor.endOperation(contentMatchingTimer)

    // Step 2: Destination Sequencing
    const sequencingTimer = this.performanceMonitor.startOperation('destinationSequencing')
    
    const sequencingConstraints: SequencingConstraints = {
      maxTravelTimePerDay: 480, // 8 hours in minutes
      preferredTransportation: preferences.transportationPreference ? [preferences.transportationPreference] : ['car', 'train', 'flight'],
      startLocation: preferences.primaryDestination,
      endLocation: preferences.primaryDestination
    }

    const sequencedDestinations = await this.sequencingService.optimizeSequence(
      matchedContent.destinations,
      preferences,
      sequencingConstraints
    )

    this.performanceMonitor.endOperation(sequencingTimer)

    // Step 3: Day Planning (can be parallelized by day)
    const dayPlanningTimer = this.performanceMonitor.startOperation('dayPlanning')
    
    const tripDuration = this.calculateTripDuration(preferences)
    const dailyPlans: ItineraryDay[] = []

    if (this.config.enableParallelProcessing && tripDuration <= 14) {
      // Parallel day planning for shorter trips
      const dayPromises = Array.from({ length: tripDuration }, (_, index) => 
        this.planSingleDay(
          index + 1,
          sequencedDestinations,
          matchedContent,
          preferences,
          this.addDays(new Date(preferences.startDate), index)
        )
      )

      const days = await Promise.all(dayPromises)
      dailyPlans.push(...days.filter(day => day !== null) as ItineraryDay[])
    } else {
      // Sequential day planning for longer trips
      for (let dayNumber = 1; dayNumber <= tripDuration; dayNumber++) {
        const dayDate = this.addDays(new Date(preferences.startDate), dayNumber - 1)
        const dayPlan = await this.planSingleDay(
          dayNumber,
          sequencedDestinations,
          matchedContent,
          preferences,
          dayDate
        )
        if (dayPlan) {
          dailyPlans.push(dayPlan)
        }
      }
    }

    this.performanceMonitor.endOperation(dayPlanningTimer)

    // Step 4: Pricing Calculation
    const pricingTimer = this.performanceMonitor.startOperation('pricingCalculation')
    
    // Create preliminary itinerary for pricing
    const preliminaryItinerary: GeneratedItinerary = {
      id: this.generateItineraryId(),
      title: this.generateItineraryTitle(preferences, sequencedDestinations),
      description: this.generateItineraryDescription(preferences, sequencedDestinations),
      destinations: sequencedDestinations,
      days: dailyPlans,
      totalDuration: tripDuration,
      totalEstimatedCost: { amount: 0, currency: 'USD' },
      summary: {
        highlights: [],
        totalActivities: dailyPlans.reduce((sum, day) => sum + day.activities.length, 0),
        uniqueDestinations: sequencedDestinations.length,
        avgDailyCost: { amount: 0, currency: 'USD' },
        recommendedBudget: { amount: 0, currency: 'USD' },
        physicalDemand: this.assessPhysicalDemand(dailyPlans),
        culturalImmersion: this.assessCulturalImmersion(dailyPlans)
      },
      metadata: {
        generationTime: 0,
        aiModel: 'default-engine',
        confidenceScore: 0.85,
        optimizationFlags: []
      },
      preferences,
      generatedAt: new Date(),
      version: '1.0.0'
    }

    // Calculate pricing
    const costBreakdown = await this.pricingService.calculateItineraryCost(preliminaryItinerary)
    
    // Update itinerary with pricing information
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
    dailyPlans.forEach((day, index) => {
      if (costBreakdown.byDay[index]) {
        day.totalEstimatedCost = costBreakdown.byDay[index].total
      }
    })

    this.performanceMonitor.endOperation(pricingTimer)

    // Step 5: Final Assembly and Optimization
    const assemblyTimer = this.performanceMonitor.startOperation('finalAssembly')
    
    const finalItinerary = await this.assembleAndOptimizeItinerary(preliminaryItinerary, costBreakdown)
    
    this.performanceMonitor.endOperation(assemblyTimer)

    return finalItinerary
  }

  /**
   * Plan activities for a single day
   */
  private async planSingleDay(
    dayNumber: number,
    destinations: Destination[],
    content: {
      activities: Activity[]
      accommodations: Accommodation[]
      transportation: Transportation[]
    },
    preferences: UserPreferences,
    date: Date
  ): Promise<ItineraryDay | null> {
    try {
      // Determine destination for this day
      const destinationIndex = Math.min(dayNumber - 1, destinations.length - 1)
      const currentDestination = destinations[destinationIndex]

      if (!currentDestination) return null

      // Filter activities for this destination
      const relevantActivities = content.activities.filter(activity =>
        activity.location.toLowerCase().includes(currentDestination.location.toLowerCase())
      )

      // Plan the day using the day planning service
      const dayPlanningPreferences = {
        pacing: preferences.pacePreference || 'moderate',
        startTime: '09:00:00',
        endTime: '18:00:00',
        mealPreferences: [
          { type: 'breakfast' as const, timing: '08:00', style: 'casual' as const, budget: { amount: 25, currency: 'USD' } },
          { type: 'lunch' as const, timing: '12:30', style: 'casual' as const, budget: { amount: 35, currency: 'USD' } },
          { type: 'dinner' as const, timing: '19:00', style: 'moderate' as const, budget: { amount: 50, currency: 'USD' } }
        ],
        includeDowntime: preferences.pacePreference === 'slow'
      }

      const dayPlan = await this.dayPlanningService.planDay(
        currentDestination,
        relevantActivities,
        dayPlanningPreferences
      )

      // Find accommodation for this day
      const accommodation = content.accommodations.find(acc =>
        acc.location.toLowerCase().includes(currentDestination.location.toLowerCase())
      )

      // Find transportation if moving between destinations
      let transportation: Transportation[] = []
      if (dayNumber > 1 && destinationIndex > 0) {
        const prevDestination = destinations[destinationIndex - 1]
        const transport = content.transportation.find(t =>
          t.from.toLowerCase().includes(prevDestination.location.toLowerCase()) &&
          t.to.toLowerCase().includes(currentDestination.location.toLowerCase())
        )
        if (transport) {
          transportation.push(transport)
        }
      }

      return {
        id: `day_${dayNumber}`,
        dayNumber,
        date: date.toISOString().split('T')[0],
        title: `Day ${dayNumber}: ${currentDestination.title}`,
        location: currentDestination.location,
        coordinates: currentDestination.coordinates,
        accommodation,
        activities: dayPlan.activities,
        transportation,
        meals: dayPlan.meals,
        totalEstimatedCost: { amount: 0, currency: 'USD' }, // Will be calculated by pricing service
        pacing: dayPlan.pacing,
        notes: dayPlan.notes || `Exploring ${currentDestination.title}`
      }

    } catch (error) {
      console.warn(`Failed to plan day ${dayNumber}:`, error)
      return null
    }
  }

  /**
   * Final assembly and optimization of the itinerary
   */
  private async assembleAndOptimizeItinerary(
    itinerary: GeneratedItinerary,
    costBreakdown: any
  ): Promise<GeneratedItinerary> {
    // Generate highlights from activities
    const highlights = this.generateHighlights(itinerary.days)
    
    // Update summary information
    itinerary.summary.highlights = highlights
    itinerary.metadata.generationTime = performance.now()

    // Apply any final optimizations
    if (itinerary.days.length > 1) {
      // Optimize activity distribution across days
      this.optimizeActivityDistribution(itinerary.days)
    }

    return itinerary
  }

  /**
   * Cache management methods
   */
  private async checkCache(request: GenerationRequest): Promise<GeneratedItinerary | null> {
    const cacheKey = this.generateCacheKey(request)
    return await this.cachingService.get(cacheKey)
  }

  private async cacheResult(request: GenerationRequest, itinerary: GeneratedItinerary): Promise<void> {
    const cacheKey = this.generateCacheKey(request)
    await this.cachingService.set(cacheKey, itinerary)
  }

  private generateCacheKey(request: GenerationRequest): string {
    // Create a stable cache key from user preferences
    const key = {
      destination: request.preferences.primaryDestination,
      dates: `${request.preferences.startDate}_${request.preferences.endDate}`,
      travelers: `${request.preferences.adults}_${request.preferences.children}_${request.preferences.infants}`,
      budget: `${request.preferences.budgetMin}_${request.preferences.budgetMax}`,
      interests: request.preferences.interests?.sort().join(',') || '',
      accommodation: request.preferences.accommodationType,
      transport: request.preferences.transportationPreference
    }
    
    return Buffer.from(JSON.stringify(key)).toString('base64')
  }

  /**
   * Fallback strategies for performance degradation
   */
  private async executeFallbackStrategy(
    request: GenerationRequest,
    error: Error
  ): Promise<GenerationResult | null> {
    try {
      // Strategy 1: Reduce content set and simplify generation
      const simplifiedRequest = {
        ...request,
        availableContent: request.availableContent.slice(0, 1000) // Limit content
      }

      // Disable parallel processing for fallback
      const originalParallelProcessing = this.config.enableParallelProcessing
      this.config.enableParallelProcessing = false

      const result = await this.generateItineraryInternal(simplifiedRequest)
      
      // Restore original setting
      this.config.enableParallelProcessing = originalParallelProcessing

      if (result.success) {
        return {
          ...result,
          fallbackUsed: true,
          originalError: error.message
        }
      }

    } catch (fallbackError) {
      console.warn('Fallback strategy also failed:', fallbackError)
    }

    return null
  }

  /**
   * Validation and utility methods
   */
  private validateRequest(request: GenerationRequest): void {
    if (!request.preferences) {
      throw new Error('User preferences are required')
    }

    if (!request.preferences.startDate || !request.preferences.endDate) {
      throw new Error('Start and end dates are required')
    }

    if (!request.preferences.primaryDestination) {
      throw new Error('Primary destination is required')
    }

    if (!request.availableContent || request.availableContent.length === 0) {
      throw new Error('Available content is required')
    }

    const startDate = new Date(request.preferences.startDate)
    const endDate = new Date(request.preferences.endDate)
    
    if (startDate >= endDate) {
      throw new Error('End date must be after start date')
    }

    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (tripDuration > 30) {
      throw new Error('Trip duration cannot exceed 30 days')
    }
  }

  private calculateTripDuration(preferences: UserPreferences): number {
    const startDate = new Date(preferences.startDate)
    const endDate = new Date(preferences.endDate)
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  private generateItineraryId(): string {
    return `itin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateItineraryTitle(preferences: UserPreferences, destinations: Destination[]): string {
    const duration = this.calculateTripDuration(preferences)
    const destNames = destinations.slice(0, 2).map(d => d.title).join(' & ')
    return `${duration}-Day ${destNames} Adventure`
  }

  private generateItineraryDescription(preferences: UserPreferences, destinations: Destination[]): string {
    const duration = this.calculateTripDuration(preferences)
    const destNames = destinations.map(d => d.title).join(', ')
    return `A ${duration}-day travel itinerary exploring ${destNames}, customized for your interests and preferences.`
  }

  private assessPhysicalDemand(days: ItineraryDay[]): 'low' | 'moderate' | 'high' {
    let totalActivities = 0
    let activeActivities = 0

    days.forEach(day => {
      totalActivities += day.activities.length
      activeActivities += day.activities.filter(activity => 
        activity.category === 'adventure' || 
        activity.difficulty === 'challenging'
      ).length
    })

    const ratio = totalActivities > 0 ? activeActivities / totalActivities : 0
    
    if (ratio > 0.6) return 'high'
    if (ratio > 0.3) return 'moderate'
    return 'low'
  }

  private assessCulturalImmersion(days: ItineraryDay[]): 'light' | 'moderate' | 'deep' {
    let totalActivities = 0
    let culturalActivities = 0

    days.forEach(day => {
      totalActivities += day.activities.length
      culturalActivities += day.activities.filter(activity => 
        activity.category === 'cultural' || 
        activity.category === 'culinary'
      ).length
    })

    const ratio = totalActivities > 0 ? culturalActivities / totalActivities : 0
    
    if (ratio > 0.5) return 'deep'
    if (ratio > 0.25) return 'moderate'
    return 'light'
  }

  private generateHighlights(days: ItineraryDay[]): string[] {
    const highlights: string[] = []
    
    days.forEach(day => {
      // Add top-rated activities as highlights
      const topActivities = day.activities
        .filter(activity => activity.title && activity.title.length > 0)
        .slice(0, 2) // Top 2 activities per day
        .map(activity => activity.title)
      
      highlights.push(...topActivities)
    })

    // Remove duplicates and limit to 10 highlights
    return [...new Set(highlights)].slice(0, 10)
  }

  private optimizeActivityDistribution(days: ItineraryDay[]): void {
    // Ensure no day is overloaded with activities
    days.forEach(day => {
      if (day.activities.length > 5) {
        // Move some activities to days with fewer activities
        const excess = day.activities.splice(5)
        
        // Find days with fewer activities
        const lighterDays = days.filter(d => d.activities.length < 3)
        if (lighterDays.length > 0) {
          lighterDays[0].activities.push(...excess.slice(0, 2))
        }
      }
    })
  }

  /**
   * Public utility methods
   */
  getMetrics(): GenerationMetrics {
    return this.performanceMonitor.getMetrics()
  }

  resetMetrics(): void {
    this.performanceMonitor.reset()
  }

  updateConfig(newConfig: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

/**
 * Factory function for creating engine instances
 */
export function createItineraryGenerationEngine(config?: Partial<EngineConfig>): ItineraryGenerationEngine {
  return new DefaultItineraryGenerationEngine(config)
}

/**
 * Export default engine instance
 */
export const defaultEngine = createItineraryGenerationEngine({
  performanceTarget: 3000,
  enableParallelProcessing: true,
  cacheEnabled: true,
  maxContentItems: 10000,
  fallbackStrategies: true,
  debugMode: false
}) 