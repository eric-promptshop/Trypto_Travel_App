import { 
  PreferenceMatchingService,
  ValidationResult 
} from '../types'
import { 
  Activity, 
  Accommodation, 
  Transportation, 
  Destination,
  UserPreferences,
  ContentMatchScore,
  MatchingCriteria,
  Money,
  ActivityCategory
} from '@/lib/types/itinerary'

/**
 * Implementation of the preference matching service
 * Scores and ranks content based on user preferences using multiple algorithms
 */
export class DefaultPreferenceMatchingService implements PreferenceMatchingService {
  private readonly weights: PreferenceWeights
  private readonly performance: PerformanceConfig

  constructor(
    weights: Partial<PreferenceWeights> = {},
    performance: Partial<PerformanceConfig> = {}
  ) {
    this.weights = {
      interests: 0.35,
      budget: 0.25,
      location: 0.20,
      timing: 0.10,
      difficulty: 0.05,
      accessibility: 0.05,
      ...weights
    }
    
    this.performance = {
      maxContentItems: 10000,
      enableParallelProcessing: true,
      scoringTimeout: 1000, // 1 second max for scoring
      cacheResults: true,
      ...performance
    }
  }

  /**
   * Score content items based on user preferences
   */
  async scoreContent(
    content: (Activity | Accommodation | Transportation | Destination)[],
    criteria: MatchingCriteria
  ): Promise<ContentMatchScore[]> {
    const startTime = Date.now()
    
    // Apply performance limits
    const limitedContent = content.slice(0, this.performance.maxContentItems)
    
    try {
      const scores = this.performance.enableParallelProcessing
        ? await this.scoreContentParallel(limitedContent, criteria)
        : await this.scoreContentSequential(limitedContent, criteria)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (duration > this.performance.scoringTimeout) {
        console.warn(`Preference matching took ${duration}ms, exceeding timeout of ${this.performance.scoringTimeout}ms`)
      }
      
      // Sort by score (highest first) and add performance metadata
      return scores
        .sort((a, b) => b.score - a.score)
        .map(score => ({
          ...score,
          reasons: score.reasons.slice(0, 5) // Limit reasons for performance
        }))
    } catch (error) {
      console.error('Error in preference matching:', error)
      return []
    }
  }

  /**
   * Filter content by minimum score threshold
   */
  filterByScore(
    scores: ContentMatchScore[],
    minimumScore: number
  ): ContentMatchScore[] {
    return scores.filter(score => score.score >= minimumScore)
  }

  /**
   * Analyze user preferences to extract matching criteria
   */
  analyzePreferences(preferences: UserPreferences): MatchingCriteria {
    const destinationConstraints = this.extractDestinationConstraints(preferences)
    const timeConstraints = this.extractTimeConstraints(preferences)
    const budgetConstraints = this.extractBudgetConstraints(preferences)

    return {
      userPreferences: preferences,
      destinationConstraints,
      timeConstraints,
      budgetConstraints
    }
  }

  // Private methods for scoring

  /**
   * Score content in parallel for better performance
   */
  private async scoreContentParallel(
    content: (Activity | Accommodation | Transportation | Destination)[],
    criteria: MatchingCriteria
  ): Promise<ContentMatchScore[]> {
    const batchSize = 100 // Process in batches to avoid overwhelming the system
    const batches: Array<(Activity | Accommodation | Transportation | Destination)[]> = []
    
    for (let i = 0; i < content.length; i += batchSize) {
      batches.push(content.slice(i, i + batchSize))
    }
    
    const batchPromises = batches.map(batch => 
      Promise.all(batch.map(item => this.scoreIndividualContent(item, criteria)))
    )
    
    const batchResults = await Promise.all(batchPromises)
    return batchResults.flat()
  }

  /**
   * Score content sequentially
   */
  private async scoreContentSequential(
    content: (Activity | Accommodation | Transportation | Destination)[],
    criteria: MatchingCriteria
  ): Promise<ContentMatchScore[]> {
    const scores: ContentMatchScore[] = []
    
    for (const item of content) {
      try {
        const score = await this.scoreIndividualContent(item, criteria)
        scores.push(score)
      } catch (error) {
        console.warn(`Failed to score content item ${item.id}:`, error)
      }
    }
    
    return scores
  }

  /**
   * Score an individual content item
   */
  private async scoreIndividualContent(
    content: Activity | Accommodation | Transportation | Destination,
    criteria: MatchingCriteria
  ): Promise<ContentMatchScore> {
    const scoringFactors: ScoringFactor[] = []
    let totalScore = 0
    const reasons: string[] = []

    // Interest-based scoring
    if (this.isActivity(content)) {
      const interestScore = this.scoreInterestMatch(content, criteria.userPreferences)
      scoringFactors.push({ name: 'interests', score: interestScore.score, weight: this.weights.interests })
      reasons.push(...interestScore.reasons)
    }

    // Budget-based scoring
    const budgetScore = this.scoreBudgetMatch(content, criteria.userPreferences)
    scoringFactors.push({ name: 'budget', score: budgetScore.score, weight: this.weights.budget })
    reasons.push(...budgetScore.reasons)

    // Location-based scoring
    const locationScore = this.scoreLocationMatch(content, criteria.userPreferences)
    scoringFactors.push({ name: 'location', score: locationScore.score, weight: this.weights.location })
    reasons.push(...locationScore.reasons)

    // Timing-based scoring (for activities)
    if (this.isActivity(content)) {
      const timingScore = this.scoreTimingMatch(content, criteria.userPreferences)
      scoringFactors.push({ name: 'timing', score: timingScore.score, weight: this.weights.timing })
      reasons.push(...timingScore.reasons)
    }

    // Difficulty-based scoring (for activities)
    if (this.isActivity(content)) {
      const difficultyScore = this.scoreDifficultyMatch(content, criteria.userPreferences)
      scoringFactors.push({ name: 'difficulty', score: difficultyScore.score, weight: this.weights.difficulty })
      reasons.push(...difficultyScore.reasons)
    }

    // Accessibility scoring
    const accessibilityScore = this.scoreAccessibilityMatch(content, criteria.userPreferences)
    scoringFactors.push({ name: 'accessibility', score: accessibilityScore.score, weight: this.weights.accessibility })
    reasons.push(...accessibilityScore.reasons)

    // Calculate weighted total score
    totalScore = scoringFactors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight)
    }, 0)

    // Apply category-specific bonuses/penalties
    totalScore = this.applyCategoryModifiers(content, totalScore, criteria.userPreferences)

    // Ensure score is between 0 and 1
    totalScore = Math.max(0, Math.min(1, totalScore))

    return {
      contentId: content.id,
      score: totalScore,
      reasons: reasons.filter((reason, index, arr) => arr.indexOf(reason) === index), // Remove duplicates
      category: this.getContentCategory(content)
    }
  }

  // Scoring methods for different factors

  private scoreInterestMatch(activity: Activity, preferences: UserPreferences): ScoringResult {
    if (!preferences.interests || preferences.interests.length === 0) {
      return { score: 0.5, reasons: ['No specific interests specified'] }
    }

    const reasons: string[] = []
    let score = 0
    let matchCount = 0

    // Direct category match
    if (preferences.interests.includes(activity.category)) {
      score += 0.8
      matchCount++
      reasons.push(`Matches ${activity.category} interest`)
    }

    // Tag-based matching
    for (const interest of preferences.interests) {
      const interestLower = interest.toLowerCase()
      for (const tag of activity.tags) {
        if (tag.toLowerCase().includes(interestLower) || interestLower.includes(tag.toLowerCase())) {
          score += 0.3
          matchCount++
          reasons.push(`Tag "${tag}" matches interest "${interest}"`)
        }
      }
    }

    // Title/description matching
    for (const interest of preferences.interests) {
      const interestLower = interest.toLowerCase()
      if (activity.title.toLowerCase().includes(interestLower) || 
          activity.description.toLowerCase().includes(interestLower)) {
        score += 0.2
        matchCount++
        reasons.push(`Description contains "${interest}"`)
      }
    }

    // Normalize score based on number of interests
    const normalizedScore = matchCount > 0 ? Math.min(1, score / preferences.interests.length) : 0

    if (matchCount === 0) {
      reasons.push('No interest matches found')
    }

    return { score: normalizedScore, reasons }
  }

  private scoreBudgetMatch(content: Activity | Accommodation | Transportation | Destination, preferences: UserPreferences): ScoringResult {
    if (!content.estimatedCost) {
      return { score: 0.7, reasons: ['No cost information available'] }
    }

    const cost = content.estimatedCost.amount
    const budgetMin = preferences.budgetMin || 0
    const budgetMax = preferences.budgetMax || Number.MAX_SAFE_INTEGER

    const reasons: string[] = []
    let score = 0

    if (cost <= budgetMin) {
      score = 1.0
      reasons.push('Well within budget')
    } else if (cost <= budgetMax) {
      // Linear interpolation between min and max budget
      const budgetRange = budgetMax - budgetMin
      const costPosition = cost - budgetMin
      score = 1 - (costPosition / budgetRange) * 0.5 // Score between 0.5 and 1.0
      reasons.push('Within budget range')
    } else {
      // Over budget - significant penalty
      const overBudgetRatio = cost / budgetMax
      score = Math.max(0, 0.3 - (overBudgetRatio - 1) * 0.5)
      reasons.push('Over budget')
    }

    return { score, reasons }
  }

  private scoreLocationMatch(content: Activity | Accommodation | Transportation | Destination, preferences: UserPreferences): ScoringResult {
    const reasons: string[] = []
    let score = 0.5 // Default neutral score

    // Get the relevant location string(s) based on content type
    const contentLocations = this.getContentLocations(content)

    // Check if content location matches primary destination
    if (preferences.primaryDestination) {
      const primaryDest = preferences.primaryDestination.toLowerCase()
      
      for (const contentLocation of contentLocations) {
        const locationLower = contentLocation.toLowerCase()
        if (locationLower.includes(primaryDest) || primaryDest.includes(locationLower)) {
          score += 0.4
          reasons.push('Located in primary destination')
          break
        }
      }
    }

    // Check additional destinations
    if (preferences.additionalDestinations && preferences.additionalDestinations.length > 0) {
      for (const dest of preferences.additionalDestinations) {
        const destLower = dest.toLowerCase()
        
        for (const contentLocation of contentLocations) {
          const locationLower = contentLocation.toLowerCase()
          if (locationLower.includes(destLower) || destLower.includes(locationLower)) {
            score += 0.2
            reasons.push(`Located in ${dest}`)
            break
          }
        }
      }
    }

    return { score: Math.min(1, score), reasons }
  }

  // Helper method to get location strings from different content types
  private getContentLocations(content: Activity | Accommodation | Transportation | Destination): string[] {
    if (this.isTransportation(content)) {
      return [content.from, content.to]
    } else {
      // Activity, Accommodation, and Destination all have a location property
      return [(content as Activity | Accommodation | Destination).location]
    }
  }

  private scoreTimingMatch(activity: Activity, preferences: UserPreferences): ScoringResult {
    const reasons: string[] = []
    let score = 0.5 // Default neutral score

    // Check if activity duration fits user's pace preference
    const duration = activity.timeSlot.duration
    const pacePreference = this.derivePaceFromPreferences(preferences)

    switch (pacePreference) {
      case 'slow':
        if (duration > 180) { // More than 3 hours
          score += 0.3
          reasons.push('Long duration fits relaxed pace')
        }
        break
      case 'moderate':
        if (duration >= 60 && duration <= 180) { // 1-3 hours
          score += 0.3
          reasons.push('Moderate duration fits balanced pace')
        }
        break
      case 'fast':
        if (duration < 120) { // Less than 2 hours
          score += 0.3
          reasons.push('Short duration fits active pace')
        }
        break
    }

    return { score: Math.min(1, score), reasons }
  }

  private scoreDifficultyMatch(activity: Activity, preferences: UserPreferences): ScoringResult {
    const reasons: string[] = []
    let score = 0.5 // Default neutral score

    // Derive difficulty preference from traveler composition
    const hasChildren = preferences.children > 0
    const hasInfants = preferences.infants > 0
    const preferredDifficulty = hasInfants ? 'easy' : hasChildren ? 'easy' : 'moderate'

    if (activity.difficulty === preferredDifficulty) {
      score += 0.4
      reasons.push(`${activity.difficulty} difficulty matches group composition`)
    } else if (activity.difficulty === 'easy') {
      score += 0.2
      reasons.push('Easy activity suitable for most travelers')
    }

    return { score: Math.min(1, score), reasons }
  }

  private scoreAccessibilityMatch(content: Activity | Accommodation | Transportation | Destination, preferences: UserPreferences): ScoringResult {
    const reasons: string[] = []
    let score = 0.5 // Default neutral score

    // Check if mobility requirements are specified
    if (preferences.mobilityRequirements) {
      if (this.isActivity(content) && content.accessibility.wheelchairAccessible) {
        score += 0.4
        reasons.push('Wheelchair accessible')
      } else if (this.isActivity(content) && !content.accessibility.wheelchairAccessible) {
        score -= 0.3
        reasons.push('Not wheelchair accessible')
      }
    } else {
      // No specific requirements, slight preference for accessible options
      if (this.isActivity(content) && content.accessibility.wheelchairAccessible) {
        score += 0.1
        reasons.push('Wheelchair accessible option')
      }
    }

    return { score: Math.min(1, score), reasons }
  }

  // Helper methods

  private applyCategoryModifiers(
    content: Activity | Accommodation | Transportation | Destination, 
    score: number, 
    preferences: UserPreferences
  ): number {
    let modifiedScore = score

    // Apply accommodation type preferences
    if (this.isAccommodation(content)) {
      if (preferences.accommodationType === 'any' || content.type === preferences.accommodationType) {
        modifiedScore += 0.1
      } else {
        modifiedScore -= 0.1
      }
    }

    // Apply transportation preferences
    if (this.isTransportation(content)) {
      if (preferences.transportationPreference === 'any' || content.type === preferences.transportationPreference) {
        modifiedScore += 0.1
      } else {
        modifiedScore -= 0.1
      }
    }

    return modifiedScore
  }

  private derivePaceFromPreferences(preferences: UserPreferences): 'slow' | 'moderate' | 'fast' {
    // Derive pace from user composition and interests
    if (preferences.infants > 0 || preferences.children > 2) {
      return 'slow'
    }
    
    if (preferences.interests.includes('adventure') || preferences.interests.includes('sports')) {
      return 'fast'
    }
    
    if (preferences.interests.includes('relaxation') || preferences.interests.includes('cultural')) {
      return 'slow'
    }
    
    return 'moderate'
  }

  private getContentCategory(content: Activity | Accommodation | Transportation | Destination): string {
    if (this.isActivity(content)) return 'activity'
    if (this.isAccommodation(content)) return 'accommodation'
    if (this.isTransportation(content)) return 'transportation'
    if (this.isDestination(content)) return 'destination'
    return 'unknown'
  }

  // Type guards
  private isActivity(content: any): content is Activity {
    return content && typeof content.category === 'string' && content.timeSlot
  }

  private isAccommodation(content: any): content is Accommodation {
    return content && typeof content.type === 'string' && content.roomTypes
  }

  private isTransportation(content: any): content is Transportation {
    return content && typeof content.type === 'string' && content.from && content.to
  }

  private isDestination(content: any): content is Destination {
    return content && typeof content.location === 'string' && content.coordinates && content.countryCode
  }

  // Constraint extraction methods

  private extractDestinationConstraints(preferences: UserPreferences): any[] {
    // Implementation would extract destination constraints from preferences
    return []
  }

  private extractTimeConstraints(preferences: UserPreferences): any[] {
    // Implementation would extract time constraints from preferences
    return []
  }

  private extractBudgetConstraints(preferences: UserPreferences): any[] {
    // Implementation would extract budget constraints from preferences
    return []
  }
}

// Supporting interfaces and types

interface PreferenceWeights {
  interests: number
  budget: number
  location: number
  timing: number
  difficulty: number
  accessibility: number
}

interface PerformanceConfig {
  maxContentItems: number
  enableParallelProcessing: boolean
  scoringTimeout: number
  cacheResults: boolean
}

interface ScoringFactor {
  name: string
  score: number
  weight: number
}

interface ScoringResult {
  score: number
  reasons: string[]
}

/**
 * Factory for creating preference matching services with different configurations
 */
export class PreferenceMatchingServiceFactory {
  static createDefault(): PreferenceMatchingService {
    return new DefaultPreferenceMatchingService()
  }

  static createHighPerformance(): PreferenceMatchingService {
    return new DefaultPreferenceMatchingService(
      {}, // Use default weights
      {
        maxContentItems: 5000,
        enableParallelProcessing: true,
        scoringTimeout: 500,
        cacheResults: true
      }
    )
  }

  static createPrecise(): PreferenceMatchingService {
    return new DefaultPreferenceMatchingService(
      {
        interests: 0.40,
        budget: 0.30,
        location: 0.15,
        timing: 0.10,
        difficulty: 0.03,
        accessibility: 0.02
      },
      {
        maxContentItems: 15000,
        enableParallelProcessing: true,
        scoringTimeout: 2000,
        cacheResults: true
      }
    )
  }
} 