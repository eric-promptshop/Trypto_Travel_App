import { BaseItineraryComponent } from '../base/base-component'
import { 
  Activity, 
  ActivityCategory, 
  TimeSlot, 
  Coordinates, 
  AccessibilityInfo, 
  BaseComponent,
  Money 
} from '@/lib/types/itinerary'

/**
 * Activity component implementation
 * Represents a single activity within an itinerary
 */
export class ActivityComponent extends BaseItineraryComponent implements Activity {
  public readonly category: ActivityCategory
  public readonly location: string
  public readonly coordinates: Coordinates
  public readonly timeSlot: TimeSlot
  public readonly difficulty: 'easy' | 'moderate' | 'challenging'
  public readonly minAge?: number
  public readonly maxGroupSize?: number
  public readonly indoorOutdoor: 'indoor' | 'outdoor' | 'both'
  public readonly accessibility: AccessibilityInfo
  public readonly seasonality: string[]
  public readonly bookingRequired: boolean
  public readonly cancellationPolicy?: string

  constructor(data: Activity) {
    super(data)
    
    this.category = data.category
    this.location = data.location
    this.coordinates = data.coordinates
    this.timeSlot = data.timeSlot
    this.difficulty = data.difficulty
    this.minAge = data.minAge
    this.maxGroupSize = data.maxGroupSize
    this.indoorOutdoor = data.indoorOutdoor
    this.accessibility = data.accessibility
    this.seasonality = data.seasonality
    this.bookingRequired = data.bookingRequired
    this.cancellationPolicy = data.cancellationPolicy
  }

  /**
   * Activity-specific validation
   */
  protected validateSpecific(): void {
    // Validate coordinates
    if (this.coordinates.latitude < -90 || this.coordinates.latitude > 90) {
      throw new Error('Invalid latitude value')
    }
    if (this.coordinates.longitude < -180 || this.coordinates.longitude > 180) {
      throw new Error('Invalid longitude value')
    }

    // Validate time slot
    if (this.timeSlot.duration <= 0) {
      throw new Error('Activity duration must be positive')
    }

    // Validate start time is before end time
    const startTime = this.parseTimeString(this.timeSlot.startTime)
    const endTime = this.parseTimeString(this.timeSlot.endTime)
    if (startTime >= endTime) {
      throw new Error('Activity start time must be before end time')
    }

    // Validate age restrictions
    if (this.minAge !== undefined && this.minAge < 0) {
      throw new Error('Minimum age cannot be negative')
    }

    // Validate group size
    if (this.maxGroupSize !== undefined && this.maxGroupSize <= 0) {
      throw new Error('Maximum group size must be positive')
    }

    // Validate location
    if (!this.location || this.location.trim().length === 0) {
      throw new Error('Activity location is required')
    }

    // Validate seasonality
    const validSeasons = ['spring', 'summer', 'autumn', 'winter', 'year-round']
    for (const season of this.seasonality) {
      if (!validSeasons.includes(season.toLowerCase())) {
        throw new Error(`Invalid season: ${season}`)
      }
    }
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTimeString(timeStr: string): number {
    const timeParts = timeStr.split(':')
    const hours = parseInt(timeParts[0] || '0')
    const minutes = parseInt(timeParts[1] || '0')
    return hours * 60 + minutes
  }

  /**
   * Get estimated duration in minutes
   */
  public getEstimatedDuration(): number {
    return this.timeSlot.duration
  }

  /**
   * Get component type identifier
   */
  public getType(): string {
    return 'activity'
  }

  /**
   * Check if activity is available for given dates
   */
  public isAvailable(startDate: Date, endDate?: Date): boolean {
    // Check seasonality
    if (this.seasonality.length > 0 && !this.seasonality.includes('year-round')) {
      const month = startDate.getMonth() + 1
      const season = this.getSeasonFromMonth(month)
      
      if (!this.seasonality.some(s => s.toLowerCase() === season)) {
        return false
      }
    }

    // Additional availability logic can be added here
    // (e.g., checking against calendar, blackout dates, etc.)
    
    return true
  }

  /**
   * Get season from month number
   */
  private getSeasonFromMonth(month: number): string {
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  }

  /**
   * Get activity priority based on category and characteristics
   */
  public override getPriority(): number {
    let priority = 1

    // Higher priority for must-see categories
    const highPriorityCategories: ActivityCategory[] = ['sightseeing', 'cultural', 'culinary']
    if (highPriorityCategories.includes(this.category)) {
      priority += 2
    }

    // Boost priority for activities requiring booking
    if (this.bookingRequired) {
      priority += 1
    }

    // Boost priority for unique/challenging activities
    if (this.difficulty === 'challenging') {
      priority += 1
    }

    return priority
  }

  /**
   * Get activity-specific data for serialization
   */
  protected getSpecificData(): object {
    return {
      category: this.category,
      location: this.location,
      coordinates: this.coordinates,
      timeSlot: this.timeSlot,
      difficulty: this.difficulty,
      minAge: this.minAge,
      maxGroupSize: this.maxGroupSize,
      indoorOutdoor: this.indoorOutdoor,
      accessibility: this.accessibility,
      seasonality: this.seasonality,
      bookingRequired: this.bookingRequired,
      cancellationPolicy: this.cancellationPolicy
    }
  }

  /**
   * Clone the activity with optional modifications
   */
  public clone(modifications?: Partial<BaseComponent>): ActivityComponent {
    const clonedData: Activity = {
      ...this.toJSON() as Activity,
      ...modifications,
      id: modifications?.id || this.id + '_clone_' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return new ActivityComponent(clonedData)
  }

  /**
   * Check if activity is suitable for a group composition
   */
  public isSuitableForGroup(adultCount: number, childCount: number, infantCount: number): boolean {
    const totalPeople = adultCount + childCount + infantCount

    // Check maximum group size
    if (this.maxGroupSize && totalPeople > this.maxGroupSize) {
      return false
    }

    // Check minimum age restrictions
    if (this.minAge && childCount > 0) {
      // Assuming children are 3-12 years old
      const youngestChildAge = 3
      if (youngestChildAge < this.minAge) {
        return false
      }
    }

    // Activities typically not suitable for infants
    const infantUnfriendlyCategories: ActivityCategory[] = ['adventure', 'nightlife', 'sports']
    if (infantCount > 0 && infantUnfriendlyCategories.includes(this.category)) {
      return false
    }

    return true
  }

  /**
   * Check if activity is accessible based on requirements
   */
  public meetsAccessibilityRequirements(requirements: Partial<AccessibilityInfo>): boolean {
    if (requirements.wheelchairAccessible && !this.accessibility.wheelchairAccessible) {
      return false
    }
    if (requirements.hearingImpaired && !this.accessibility.hearingImpaired) {
      return false
    }
    if (requirements.visuallyImpaired && !this.accessibility.visuallyImpaired) {
      return false
    }
    if (requirements.mobilityAssistance && !this.accessibility.mobilityAssistance) {
      return false
    }
    
    return true
  }

  /**
   * Calculate cost per person
   */
  public getCostPerPerson(groupSize: number = 1): Money | undefined {
    if (!this.estimatedCost) return undefined

    return {
      amount: this.estimatedCost.amount / groupSize,
      currency: this.estimatedCost.currency
    }
  }

  /**
   * Get activity duration category
   */
  public getDurationCategory(): 'short' | 'medium' | 'long' {
    const duration = this.getEstimatedDuration()
    if (duration <= 60) return 'short'     // 1 hour or less
    if (duration <= 240) return 'medium'   // 4 hours or less
    return 'long'                          // More than 4 hours
  }

  /**
   * Create a summary of the activity
   */
  public getSummary(): string {
    const duration = Math.floor(this.getEstimatedDuration() / 60)
    const costInfo = this.estimatedCost ? ` (${this.estimatedCost.amount} ${this.estimatedCost.currency})` : ''
    
    return `${this.title} - ${duration}h ${this.category} activity in ${this.location}${costInfo}`
  }
} 