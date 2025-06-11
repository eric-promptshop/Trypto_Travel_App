import { 
  GeneratedItinerary, 
  GenerationContext, 
  UserPreferences, 
  ContentLibrary,
  Activity,
  Accommodation,
  Transportation,
  Destination,
  ContentMatchScore,
  MatchingCriteria,
  Money,
  TimeSlot
} from '@/lib/types/itinerary'

// ================================
// CORE ENGINE INTERFACES
// ================================

/**
 * Request structure for itinerary generation
 */
export interface GenerationRequest {
  preferences: UserPreferences
  availableContent: (Activity | Accommodation | Transportation | Destination)[]
  options?: GenerationEngineOptions
}

/**
 * Performance metrics for generation operations
 */
export interface GenerationMetrics {
  operationStats: { [key: string]: any }
  totalActiveOperations: number
  memoryUsage: any
}

/**
 * Main interface for the itinerary generation engine
 * Handles the orchestration of all generation components
 */
export interface ItineraryGenerationEngine {
  /**
   * Generate a complete itinerary from user preferences
   * Must complete within the specified timeout (default: 3000ms)
   */
  generateItinerary(
    userPreferences: UserPreferences,
    options?: GenerationEngineOptions
  ): Promise<GenerationResult>

  /**
   * Get cached generation result if available
   */
  getCachedResult(cacheKey: string): Promise<GenerationResult | null>

  /**
   * Validate user preferences before generation
   */
  validatePreferences(preferences: UserPreferences): ValidationResult

  /**
   * Get generation engine status and performance metrics
   */
  getEngineStatus(): EngineStatus
}

export interface GenerationEngineOptions {
  timeoutMs?: number
  enableCaching?: boolean
  includeAlternatives?: boolean
  optimizationLevel?: 'fast' | 'balanced' | 'thorough'
  debugMode?: boolean
}

export interface GenerationResult {
  itinerary: GeneratedItinerary | null
  success: boolean
  error?: GenerationError
  metadata: GenerationMetadata
  alternatives?: GeneratedItinerary[]
  cacheKey?: string
}

export interface GenerationError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface GenerationMetadata {
  generationTimeMs: number
  componentsUsed: ComponentUsageStats
  performanceMetrics: PerformanceMetrics
  optimizationApplied: string[]
  debugInfo?: DebugInfo
}

export interface ComponentUsageStats {
  destinationsProcessed: number
  activitiesEvaluated: number
  accommodationsConsidered: number
  transportationOptions: number
  totalContentItems: number
}

export interface PerformanceMetrics {
  contentLoadingMs: number
  preferencesAnalysisMs: number
  matchingAlgorithmMs: number
  sequencingMs: number
  optimizationMs: number
  cacheHitRate?: number
}

export interface DebugInfo {
  matchingScores: ContentMatchScore[]
  rejectedContent: RejectedContent[]
  fallbacksUsed: string[]
  constraintViolations: string[]
}

export interface RejectedContent {
  contentId: string
  contentType: string
  rejectionReason: string
  score: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

export interface EngineStatus {
  version: string
  uptime: number
  totalGenerations: number
  successRate: number
  averageGenerationTime: number
  cacheStats: CacheStats
  healthChecks: HealthCheck[]
}

export interface CacheStats {
  hitRate: number
  totalHits: number
  totalMisses: number
  cacheSize: number
  lastClearTime: Date
}

export interface HealthCheck {
  component: string
  status: 'healthy' | 'warning' | 'error'
  message?: string
  lastChecked: Date
}

// ================================
// COMPONENT SERVICE INTERFACES
// ================================

/**
 * Interface for the preference matching service
 * Responsible for scoring and ranking content based on user preferences
 */
export interface PreferenceMatchingService {
  /**
   * Score content items based on user preferences
   */
  scoreContent(
    content: (Activity | Accommodation | Transportation | Destination)[],
    criteria: MatchingCriteria
  ): Promise<ContentMatchScore[]>

  /**
   * Filter content by minimum score threshold
   */
  filterByScore(
    scores: ContentMatchScore[],
    minimumScore: number
  ): ContentMatchScore[]

  /**
   * Analyze user preferences to extract matching criteria
   */
  analyzePreferences(preferences: UserPreferences): MatchingCriteria
}

/**
 * Interface for the destination sequencing service
 * Handles the logical ordering and geographical optimization of destinations
 */
export interface DestinationSequencingService {
  /**
   * Calculate optimal sequence for visiting destinations
   */
  optimizeSequence(
    destinations: Destination[],
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<SequencedDestination[]>

  /**
   * Calculate travel time between destinations
   */
  calculateTravelTime(
    from: Destination,
    to: Destination,
    transportType: string
  ): Promise<TravelTimeResult>

  /**
   * Validate that a sequence is logically feasible
   */
  validateSequence(sequence: SequencedDestination[]): SequenceValidation
}

export interface SequencingConstraints {
  maxTravelTimePerDay: number // minutes
  preferredTransportation: string[]
  mustVisitOrder?: string[] // destination IDs that must be visited in specific order
  startLocation?: string
  endLocation?: string
}

export interface SequencedDestination extends Destination {
  sequenceOrder: number
  arrivalDate: string
  departureDate: string
  daysAllocated: number
  travelTimeFromPrevious: number
  transportationToPrevious?: Transportation
}

export interface TravelTimeResult {
  duration: number // minutes
  distance: number // kilometers
  transportationOptions: Transportation[]
  cost: Money
}

export interface SequenceValidation {
  valid: boolean
  issues: SequenceIssue[]
  totalTravelTime: number
  totalDistance: number
}

export interface SequenceIssue {
  type: 'travel_time' | 'cost' | 'logistics' | 'preferences'
  severity: 'error' | 'warning'
  message: string
  affectedDestinations: string[]
}

/**
 * Interface for the day planning service
 * Responsible for organizing activities within each day
 */
export interface DayPlanningService {
  /**
   * Plan activities for a specific day
   */
  planDay(
    destination: Destination,
    date: string,
    availableActivities: Activity[],
    preferences: DayPlanningPreferences
  ): Promise<DayPlan>

  /**
   * Optimize activity timing and sequence within a day
   */
  optimizeDaySchedule(plan: DayPlan): Promise<DayPlan>

  /**
   * Validate that a day plan is feasible
   */
  validateDayPlan(plan: DayPlan): DayPlanValidation
}

export interface DayPlanningPreferences {
  pacing: 'relaxed' | 'moderate' | 'packed'
  startTime: string // preferred start time
  endTime: string // preferred end time
  mealPreferences: MealPreference[]
  activityTypes: string[] // preferred activity categories
  maxActivities: number
  budgetForDay: Money
  accessibility: boolean
}

export interface MealPreference {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  timing: string // preferred time
  style: 'quick' | 'casual' | 'fine_dining'
  budget: Money
}

export interface DayPlan {
  date: string
  destination: Destination
  activities: ScheduledActivity[]
  meals: ScheduledMeal[]
  freeTime: TimeSlot[]
  totalCost: Money
  pacing: string
  satisfaction: number // 0-1 score
}

export interface ScheduledActivity extends Activity {
  scheduledTime: TimeSlot
  bufferTime: number // minutes for travel/preparation
  priority: 'high' | 'medium' | 'low'
}

export interface ScheduledMeal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  time: string
  venue?: string
  cost: Money
  duration: number // minutes
}

export interface DayPlanValidation {
  valid: boolean
  issues: DayPlanIssue[]
  overallScore: number // 0-1
  suggestions: string[]
}

export interface DayPlanIssue {
  type: 'timing' | 'budget' | 'logistics' | 'preferences'
  severity: 'error' | 'warning'
  message: string
  affectedItems: string[]
}

/**
 * Interface for the pricing calculation service
 * Handles cost estimation and budget optimization
 */
export interface PricingCalculationService {
  /**
   * Calculate total cost for an itinerary
   */
  calculateItineraryCost(itinerary: GeneratedItinerary): Promise<CostBreakdown>

  /**
   * Estimate costs for individual components
   */
  estimateComponentCost(
    component: Activity | Accommodation | Transportation,
    context: PricingContext
  ): Promise<Money>

  /**
   * Optimize itinerary for budget constraints
   */
  optimizeForBudget(
    itinerary: GeneratedItinerary,
    maxBudget: Money
  ): Promise<BudgetOptimizationResult>

  /**
   * Get real-time pricing data where available
   */
  getRealTimePricing(componentId: string): Promise<Money | null>
}

export interface CostBreakdown {
  total: Money
  byCategory: CategoryCosts
  byDay: DailyCosts[]
  contingency: Money // recommended buffer
  confidence: number // 0-1, how accurate the estimate is
}

export interface CategoryCosts {
  accommodation: Money
  activities: Money
  transportation: Money
  meals: Money
  miscellaneous: Money
}

export interface DailyCosts {
  date: string
  total: Money
  breakdown: CategoryCosts
}

export interface PricingContext {
  dates: { start: string; end: string }
  travelers: number
  seasonality: 'peak' | 'shoulder' | 'off'
  advanceBooking: number // days in advance
  currency: string
}

export interface BudgetOptimizationResult {
  optimizedItinerary: GeneratedItinerary
  costReduction: Money
  changesApplied: BudgetOptimization[]
  tradeoffs: string[]
}

export interface BudgetOptimization {
  type: 'accommodation_downgrade' | 'activity_substitution' | 'transportation_change' | 'meal_adjustment'
  description: string
  savings: Money
  impact: 'low' | 'medium' | 'high'
}

// ================================
// CACHING STRATEGY INTERFACES
// ================================

/**
 * Interface for the caching service
 * Supports the <3 second performance requirement
 */
export interface CachingService {
  /**
   * Generate cache key from user preferences
   */
  generateCacheKey(preferences: UserPreferences): string

  /**
   * Store generation result in cache
   */
  set(key: string, result: GenerationResult, ttlSeconds?: number): Promise<void>

  /**
   * Retrieve cached result
   */
  get(key: string): Promise<GenerationResult | null>

  /**
   * Check if cached result exists and is valid
   */
  has(key: string): Promise<boolean>

  /**
   * Clear expired cache entries
   */
  cleanup(): Promise<void>

  /**
   * Get cache statistics
   */
  getStats(): CacheStats
}

// ================================
// COMPONENT FACTORY INTERFACES
// ================================

/**
 * Factory for creating itinerary components
 */
export interface ComponentFactory {
  /**
   * Create activity component from content data
   */
  createActivity(data: any, metadata?: ComponentMetadata): Activity

  /**
   * Create accommodation component from content data
   */
  createAccommodation(data: any, metadata?: ComponentMetadata): Accommodation

  /**
   * Create transportation component from content data
   */
  createTransportation(data: any, metadata?: ComponentMetadata): Transportation

  /**
   * Create destination component from content data
   */
  createDestination(data: any, metadata?: ComponentMetadata): Destination

  /**
   * Validate component data before creation
   */
  validateComponentData(data: any, type: string): ValidationResult
}

export interface ComponentMetadata {
  source: string
  confidence: number
  lastUpdated: Date
  version: string
  tags: string[]
}

// ================================
// EXTERNAL SERVICE INTERFACES
// ================================

/**
 * Interface for external data providers
 */
export interface ExternalDataProvider {
  /**
   * Get real-time data for pricing, availability, etc.
   */
  getRealTimeData(query: ExternalDataQuery): Promise<ExternalDataResponse>

  /**
   * Check service availability and health
   */
  healthCheck(): Promise<boolean>

  /**
   * Get service rate limits and usage
   */
  getUsageStats(): Promise<UsageStats>
}

export interface ExternalDataQuery {
  type: 'pricing' | 'availability' | 'weather' | 'transportation'
  location?: string
  dates?: { start: string; end: string }
  parameters: Record<string, any>
}

export interface ExternalDataResponse {
  success: boolean
  data: any
  timestamp: Date
  source: string
  rateLimit?: RateLimitInfo
}

export interface RateLimitInfo {
  remaining: number
  resetTime: Date
  limit: number
}

export interface UsageStats {
  requestsToday: number
  remainingQuota: number
  averageResponseTime: number
  errorRate: number
}

// ================================
// PERFORMANCE MONITORING
// ================================

export interface PerformanceMonitor {
  /**
   * Start timing a operation
   */
  startTimer(operation: string): Timer

  /**
   * Record performance metric
   */
  recordMetric(name: string, value: number, unit: string): void

  /**
   * Get performance summary
   */
  getSummary(timeRange?: { start: Date; end: Date }): PerformanceSummary
}

export interface Timer {
  stop(): number // returns elapsed time in milliseconds
}

export interface PerformanceSummary {
  averageGenerationTime: number
  p95GenerationTime: number
  successRate: number
  errorBreakdown: Record<string, number>
  cacheHitRate: number
  timeRange: { start: Date; end: Date }
} 