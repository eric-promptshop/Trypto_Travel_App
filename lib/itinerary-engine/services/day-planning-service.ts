import {
  DayPlanningService,
  DayPlanningPreferences,
  DayPlan,
  ScheduledActivity,
  ScheduledMeal,
  DayPlanValidation,
  DayPlanIssue,
  MealPreference
} from '../types'
import {
  Destination,
  Activity,
  TimeSlot,
  Money,
  ActivityCategory
} from '@/lib/types/itinerary'

/**
 * Implementation of the day planning service
 * Handles activity scheduling, meal planning, and daily itinerary optimization
 */
export class DefaultDayPlanningService implements DayPlanningService {
  private readonly config: DayPlanningConfig

  constructor(config: Partial<DayPlanningConfig> = {}) {
    this.config = {
      defaultStartTime: '09:00:00',
      defaultEndTime: '18:00:00',
      mealBufferMinutes: 30,
      activityBufferMinutes: 15,
      maxActivitiesPerDay: 6,
      enableActivityBalancing: true,
      ...config
    }
  }

  /**
   * Plan activities for a specific day
   */
  async planDay(
    destination: Destination,
    date: string,
    availableActivities: Activity[],
    preferences: DayPlanningPreferences
  ): Promise<DayPlan> {
    try {
      // Filter activities suitable for the destination and date
      const suitableActivities = this.filterSuitableActivities(
        availableActivities,
        destination,
        date,
        preferences
      )

      // Schedule meals first as they are fixed points
      const meals = this.scheduleMeals(preferences.mealPreferences, date)

      // Create time slots excluding meal times
      const availableTimeSlots = this.createAvailableTimeSlots(
        preferences.startTime || this.config.defaultStartTime,
        preferences.endTime || this.config.defaultEndTime,
        meals
      )

      // Select and schedule activities
      const scheduledActivities = await this.selectAndScheduleActivities(
        suitableActivities,
        availableTimeSlots,
        preferences
      )

      // Calculate free time
      const freeTime = this.calculateFreeTime(
        scheduledActivities,
        meals,
        preferences.startTime || this.config.defaultStartTime,
        preferences.endTime || this.config.defaultEndTime
      )

      // Calculate total cost
      const totalCost = this.calculateTotalCost(scheduledActivities, meals)

      // Calculate satisfaction score
      const satisfaction = this.calculateSatisfactionScore(
        scheduledActivities,
        preferences
      )

      const dayPlan: DayPlan = {
        date,
        destination,
        activities: scheduledActivities,
        meals,
        freeTime,
        totalCost,
        pacing: preferences.pacing,
        satisfaction
      }

      return dayPlan
    } catch (error) {
      console.error(`Error planning day for ${date}:`, error)
      throw new Error(`Failed to plan day: ${(error as Error).message}`)
    }
  }

  /**
   * Optimize activity timing and sequence within a day
   */
  async optimizeDaySchedule(plan: DayPlan): Promise<DayPlan> {
    try {
      // Sort activities by priority and time constraints
      const sortedActivities = [...plan.activities].sort((a, b) => {
        // First by priority
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff

        // Then by start time
        return a.scheduledTime.startTime.localeCompare(b.scheduledTime.startTime)
      })

      // Optimize for travel time between activities
      const optimizedActivities = this.optimizeActivitySequence(
        sortedActivities,
        plan.destination
      )

      // Recalculate free time and satisfaction
      const freeTime = this.calculateFreeTime(
        optimizedActivities,
        plan.meals,
        '09:00:00', // Use default times for optimization
        '18:00:00'
      )

      const satisfaction = this.calculateSatisfactionScore(
        optimizedActivities,
        this.extractPreferencesFromPlan(plan)
      )

      return {
        ...plan,
        activities: optimizedActivities,
        freeTime,
        satisfaction
      }
    } catch (error) {
      console.error('Error optimizing day schedule:', error)
      return plan // Return original plan if optimization fails
    }
  }

  /**
   * Validate that a day plan is feasible
   */
  validateDayPlan(plan: DayPlan): DayPlanValidation {
    const issues: DayPlanIssue[] = []
    const suggestions: string[] = []

    // Check for overlapping activities
    for (let i = 0; i < plan.activities.length; i++) {
      for (let j = i + 1; j < plan.activities.length; j++) {
        if (this.timeSlotsOverlap(
          plan.activities[i].scheduledTime,
          plan.activities[j].scheduledTime
        )) {
          issues.push({
            type: 'timing',
            severity: 'error',
            message: `Activities "${plan.activities[i].title}" and "${plan.activities[j].title}" overlap`,
            affectedItems: [plan.activities[i].id, plan.activities[j].id]
          })
        }
      }
    }

    // Check for activity-meal conflicts
    plan.activities.forEach(activity => {
      plan.meals.forEach(meal => {
        const mealStart = this.timeStringToMinutes(meal.time)
        const mealEnd = mealStart + meal.duration
        const activityStart = this.timeStringToMinutes(activity.scheduledTime.startTime)
        const activityEnd = this.timeStringToMinutes(activity.scheduledTime.endTime)

        if ((activityStart < mealEnd && activityEnd > mealStart)) {
          issues.push({
            type: 'timing',
            severity: 'warning',
            message: `Activity "${activity.title}" conflicts with ${meal.type} time`,
            affectedItems: [activity.id, `meal-${meal.type}`]
          })
        }
      })
    })

    // Check budget constraints
    if (plan.totalCost.amount > 0) {
      // This would need the preferences to check against budget
      // For now, just validate that costs are reasonable
      const avgActivityCost = plan.totalCost.amount / Math.max(plan.activities.length, 1)
      if (avgActivityCost > 500) { // Example threshold
        issues.push({
          type: 'budget',
          severity: 'warning',
          message: 'Daily costs are quite high',
          affectedItems: ['total-cost']
        })
        suggestions.push('Consider selecting some lower-cost activities')
      }
    }

    // Check activity distribution
    if (plan.activities.length > 6) {
      issues.push({
        type: 'logistics',
        severity: 'warning',
        message: 'Very packed schedule - may be exhausting',
        affectedItems: ['schedule-density']
      })
      suggestions.push('Consider reducing number of activities for a more relaxed pace')
    }

    // Check for sufficient free time
    const totalFreeTime = plan.freeTime.reduce((sum, slot) => sum + slot.duration, 0)
    if (totalFreeTime < 60 && plan.pacing === 'relaxed') {
      issues.push({
        type: 'preferences',
        severity: 'warning',
        message: 'Limited free time for a relaxed pace preference',
        affectedItems: ['free-time']
      })
      suggestions.push('Add more buffer time between activities')
    }

    const overallScore = Math.max(0, 1 - (issues.length * 0.1))

    return {
      valid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      overallScore,
      suggestions
    }
  }

  // Private helper methods

  private filterSuitableActivities(
    activities: Activity[],
    destination: Destination,
    date: string,
    preferences: DayPlanningPreferences
  ): Activity[] {
    return activities.filter(activity => {
      // Check location match
      if (!activity.location.toLowerCase().includes(destination.location.toLowerCase())) {
        return false
      }

      // Check activity type preferences
      if (preferences.activityTypes.length > 0 && 
          !preferences.activityTypes.includes(activity.category)) {
        return false
      }

      // Check accessibility requirements
      if (preferences.accessibility && !activity.accessibility.wheelchairAccessible) {
        return false
      }

      // Check seasonality (simplified)
      const month = new Date(date).getMonth() + 1
      const season = this.getSeasonFromMonth(month)
      if (activity.seasonality.length > 0 && !activity.seasonality.includes(season)) {
        return false
      }

      return true
    })
  }

  private scheduleMeals(
    mealPreferences: MealPreference[],
    date: string
  ): ScheduledMeal[] {
    const defaultMealTimes = {
      breakfast: '08:00',
      lunch: '12:30',
      dinner: '19:00',
      snack: '15:30'
    }

    return mealPreferences.map(pref => ({
      type: pref.type,
      time: pref.timing || defaultMealTimes[pref.type],
      cost: pref.budget,
      duration: this.getEstimatedMealDuration(pref.style)
      // venue is optional in ScheduledMeal interface, so we don't set it
    }))
  }

  private createAvailableTimeSlots(
    startTime: string,
    endTime: string,
    meals: ScheduledMeal[]
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    let currentTime = this.timeStringToMinutes(startTime)
    const endMinutes = this.timeStringToMinutes(endTime)

    // Sort meals by time
    const sortedMeals = [...meals].sort((a, b) => a.time.localeCompare(b.time))

    for (const meal of sortedMeals) {
      const mealStart = this.timeStringToMinutes(meal.time)
      const mealEnd = mealStart + meal.duration

      // Add slot before meal if there's enough time
      if (mealStart - currentTime >= 60) { // At least 1 hour
        slots.push({
          startTime: this.minutesToTimeString(currentTime),
          endTime: this.minutesToTimeString(mealStart - this.config.mealBufferMinutes),
          duration: mealStart - this.config.mealBufferMinutes - currentTime
        })
      }

      currentTime = mealEnd + this.config.mealBufferMinutes
    }

    // Add final slot after last meal
    if (endMinutes - currentTime >= 60) {
      slots.push({
        startTime: this.minutesToTimeString(currentTime),
        endTime: endTime,
        duration: endMinutes - currentTime
      })
    }

    return slots
  }

  private async selectAndScheduleActivities(
    activities: Activity[],
    availableSlots: TimeSlot[],
    preferences: DayPlanningPreferences
  ): Promise<ScheduledActivity[]> {
    const scheduled: ScheduledActivity[] = []
    const maxActivities = Math.min(preferences.maxActivities, this.config.maxActivitiesPerDay)

    // Score activities based on preferences
    const scoredActivities = activities.map(activity => ({
      activity,
      score: this.scoreActivityForDay(activity, preferences)
    })).sort((a, b) => b.score - a.score)

    // Schedule activities in available slots
    const remainingSlots = [...availableSlots]

    for (const { activity } of scoredActivities) {
      if (scheduled.length >= maxActivities) break

      // Find a suitable slot for this activity
      const suitableSlotIndex = remainingSlots.findIndex(slot => 
        slot.duration >= activity.timeSlot.duration + this.config.activityBufferMinutes
      )

      if (suitableSlotIndex !== -1) {
        const slot = remainingSlots[suitableSlotIndex]
        
        if (slot) {
          const scheduledActivity: ScheduledActivity = {
            ...activity,
            scheduledTime: {
              startTime: slot.startTime,
              endTime: this.minutesToTimeString(
                this.timeStringToMinutes(slot.startTime) + activity.timeSlot.duration
              ),
              duration: activity.timeSlot.duration
            },
            bufferTime: this.config.activityBufferMinutes,
            priority: this.determinePriority(activity, preferences)
          }

          scheduled.push(scheduledActivity)

          // Update or remove the slot
          const remainingTime = slot.duration - activity.timeSlot.duration - this.config.activityBufferMinutes
          if (remainingTime >= 60) { // At least 1 hour remaining
            remainingSlots[suitableSlotIndex] = {
              startTime: scheduledActivity.scheduledTime.endTime,
              endTime: slot.endTime,
              duration: remainingTime
            }
          } else {
            remainingSlots.splice(suitableSlotIndex, 1)
          }
        }
      }
    }

    return scheduled
  }

  private optimizeActivitySequence(
    activities: ScheduledActivity[],
    destination: Destination
  ): ScheduledActivity[] {
    // For now, return activities sorted by time
    // In a full implementation, this would optimize for travel time between locations
    return activities.sort((a, b) => 
      a.scheduledTime.startTime.localeCompare(b.scheduledTime.startTime)
    )
  }

  private calculateFreeTime(
    activities: ScheduledActivity[],
    meals: ScheduledMeal[],
    dayStart: string,
    dayEnd: string
  ): TimeSlot[] {
    const freeSlots: TimeSlot[] = []
    const allEvents = [
      ...activities.map(a => ({
        start: this.timeStringToMinutes(a.scheduledTime.startTime),
        end: this.timeStringToMinutes(a.scheduledTime.endTime),
        type: 'activity'
      })),
      ...meals.map(m => ({
        start: this.timeStringToMinutes(m.time),
        end: this.timeStringToMinutes(m.time) + m.duration,
        type: 'meal'
      }))
    ].sort((a, b) => a.start - b.start)

    let currentTime = this.timeStringToMinutes(dayStart)
    const dayEndMinutes = this.timeStringToMinutes(dayEnd)

    for (const event of allEvents) {
      if (event.start > currentTime + 30) { // At least 30 minutes of free time
        freeSlots.push({
          startTime: this.minutesToTimeString(currentTime),
          endTime: this.minutesToTimeString(event.start),
          duration: event.start - currentTime
        })
      }
      currentTime = Math.max(currentTime, event.end)
    }

    // Add final free slot if there's time after last event
    if (dayEndMinutes > currentTime + 30) {
      freeSlots.push({
        startTime: this.minutesToTimeString(currentTime),
        endTime: dayEnd,
        duration: dayEndMinutes - currentTime
      })
    }

    return freeSlots
  }

  private calculateTotalCost(
    activities: ScheduledActivity[],
    meals: ScheduledMeal[]
  ): Money {
    const activityCost = activities.reduce((sum, activity) => 
      sum + (activity.estimatedCost?.amount || 0), 0
    )
    
    const mealCost = meals.reduce((sum, meal) => 
      sum + meal.cost.amount, 0
    )

    // Use the first available currency or default to USD
    const currency = activities.find(a => a.estimatedCost)?.estimatedCost?.currency || 
                    (meals.length > 0 ? meals[0]?.cost?.currency : undefined) || 
                    'USD'

    return {
      amount: activityCost + mealCost,
      currency
    }
  }

  private calculateSatisfactionScore(
    activities: ScheduledActivity[],
    preferences: DayPlanningPreferences
  ): number {
    let score = 0.5 // Base score

    // Preference matching
    if (preferences.activityTypes.length > 0) {
      const matchingActivities = activities.filter(a => 
        preferences.activityTypes.includes(a.category)
      ).length
      score += (matchingActivities / preferences.activityTypes.length) * 0.3
    }

    // Pacing appropriateness
    const activityDensity = activities.length / 10 // Normalize to 10-hour day
    const pacingScore = this.calculatePacingScore(activityDensity, preferences.pacing)
    score += pacingScore * 0.3

    // Activity variety
    const uniqueCategories = new Set(activities.map(a => a.category)).size
    const varietyScore = Math.min(uniqueCategories / 4, 1) // Max score for 4+ categories
    score += varietyScore * 0.2

    return Math.max(0, Math.min(1, score))
  }

  // Utility methods

  private scoreActivityForDay(activity: Activity, preferences: DayPlanningPreferences): number {
    let score = 0.5

    // Category preference
    if (preferences.activityTypes.includes(activity.category)) {
      score += 0.3
    }

    // Duration appropriateness for pacing
    const duration = activity.timeSlot.duration
    switch (preferences.pacing) {
      case 'relaxed':
        score += duration > 120 ? 0.2 : -0.1 // Prefer longer activities
        break
      case 'moderate':
        score += duration >= 60 && duration <= 180 ? 0.2 : -0.1
        break
      case 'packed':
        score += duration < 120 ? 0.2 : -0.1 // Prefer shorter activities
        break
    }

    // Accessibility
    if (preferences.accessibility && activity.accessibility.wheelchairAccessible) {
      score += 0.2
    }

    return Math.max(0, Math.min(1, score))
  }

  private determinePriority(activity: Activity, preferences: DayPlanningPreferences): 'high' | 'medium' | 'low' {
    if (preferences.activityTypes.includes(activity.category)) {
      return 'high'
    }
    if (activity.bookingRequired) {
      return 'medium'
    }
    return 'low'
  }

  private calculatePacingScore(activityDensity: number, pacing: string): number {
    const optimal = pacing === 'relaxed' ? 0.3 : pacing === 'moderate' ? 0.5 : 0.7
    const difference = Math.abs(activityDensity - optimal)
    return Math.max(0, 1 - difference * 2)
  }

  private getEstimatedMealDuration(style: string): number {
    const durations = {
      quick: 30,
      casual: 60,
      fine_dining: 120
    }
    return durations[style as keyof typeof durations] || 60
  }

  private getSeasonFromMonth(month: number): string {
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  }

  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    const start1 = this.timeStringToMinutes(slot1.startTime)
    const end1 = this.timeStringToMinutes(slot1.endTime)
    const start2 = this.timeStringToMinutes(slot2.startTime)
    const end2 = this.timeStringToMinutes(slot2.endTime)

    return start1 < end2 && start2 < end1
  }

  private timeStringToMinutes(timeStr: string): number {
    const timeParts = timeStr.split(':')
    
    if (timeParts.length < 2) {
      throw new Error(`Invalid time format: ${timeStr}`)
    }
    
    const hoursStr = timeParts[0]
    const minutesStr = timeParts[1]
    
    if (!hoursStr || !minutesStr) {
      throw new Error(`Invalid time format: ${timeStr}`)
    }
    
    const hours = parseInt(hoursStr)
    const minutes = parseInt(minutesStr)
    
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${timeStr}`)
    }
    
    return hours * 60 + minutes
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
  }

  private extractPreferencesFromPlan(plan: DayPlan): DayPlanningPreferences {
    // Extract preferences from the existing plan for optimization
    return {
      pacing: plan.pacing as 'relaxed' | 'moderate' | 'packed',
      startTime: '09:00:00',
      endTime: '18:00:00',
      mealPreferences: plan.meals.map(meal => ({
        type: meal.type,
        timing: meal.time,
        style: 'casual' as const,
        budget: meal.cost
      })),
      activityTypes: [...new Set(plan.activities.map(a => a.category))],
      maxActivities: plan.activities.length,
      budgetForDay: plan.totalCost,
      accessibility: false
    }
  }
}

// Configuration interface
interface DayPlanningConfig {
  defaultStartTime: string
  defaultEndTime: string
  mealBufferMinutes: number
  activityBufferMinutes: number
  maxActivitiesPerDay: number
  enableActivityBalancing: boolean
}

// Factory for creating day planning services
export class DayPlanningServiceFactory {
  static createDefault(): DayPlanningService {
    return new DefaultDayPlanningService()
  }

  static createRelaxedPlanning(): DayPlanningService {
    return new DefaultDayPlanningService({
      maxActivitiesPerDay: 3,
      activityBufferMinutes: 30,
      mealBufferMinutes: 45
    })
  }

  static createPackedPlanning(): DayPlanningService {
    return new DefaultDayPlanningService({
      maxActivitiesPerDay: 8,
      activityBufferMinutes: 10,
      mealBufferMinutes: 15
    })
  }
} 