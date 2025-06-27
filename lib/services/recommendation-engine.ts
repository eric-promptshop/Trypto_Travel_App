import { prisma } from '@/lib/prisma'

export interface UserContext {
  userId?: string
  location?: {
    lat: number
    lng: number
    city?: string
    country?: string
  }
  preferences?: {
    activities: string[]
    budget: 'budget' | 'mid-range' | 'luxury'
    travelStyle: string[]
    dietaryRestrictions?: string[]
    accessibility?: string[]
  }
  history?: {
    searches: string[]
    viewedDestinations: string[]
    savedItineraries: string[]
  }
  currentSession?: {
    query?: string
    destination?: string
    dates?: {
      start: Date
      end: Date
    }
    travelers?: number
  }
  seasonality?: {
    month: number
    season: 'winter' | 'spring' | 'summer' | 'fall'
  }
}

export interface Recommendation {
  id: string
  type: 'destination' | 'activity' | 'tour' | 'tip' | 'warning'
  title: string
  description: string
  relevanceScore: number
  reason: string
  data?: any
  action?: {
    label: string
    type: 'link' | 'search' | 'add'
    value: string
  }
}

export class RecommendationEngine {
  private context: UserContext

  constructor(context: UserContext) {
    this.context = context
  }

  async getRecommendations(limit: number = 10): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    // Get destination recommendations
    const destinationRecs = await this.getDestinationRecommendations()
    recommendations.push(...destinationRecs)

    // Get activity recommendations
    const activityRecs = await this.getActivityRecommendations()
    recommendations.push(...activityRecs)

    // Get seasonal recommendations
    const seasonalRecs = await this.getSeasonalRecommendations()
    recommendations.push(...seasonalRecs)

    // Get tour recommendations if operator data available
    const tourRecs = await this.getTourRecommendations()
    recommendations.push(...tourRecs)

    // Get contextual tips
    const tips = await this.getContextualTips()
    recommendations.push(...tips)

    // Sort by relevance and return top N
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }

  private async getDestinationRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // Based on search history
    if (this.context.history?.searches.length) {
      const recentSearches = this.context.history.searches.slice(0, 5)
      const destinations = this.extractDestinationsFromSearches(recentSearches)
      
      destinations.forEach(dest => {
        recommendations.push({
          id: `dest-${dest.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'destination',
          title: `Continue planning your trip to ${dest}`,
          description: `Based on your recent search, here are personalized recommendations for ${dest}`,
          relevanceScore: 0.9,
          reason: 'Based on your recent searches',
          action: {
            label: 'View Itinerary Ideas',
            type: 'search',
            value: dest
          }
        })
      })
    }

    // Based on location proximity
    if (this.context.location) {
      const nearbyDestinations = await this.getNearbyDestinations()
      nearbyDestinations.forEach(dest => {
        recommendations.push({
          id: `nearby-${dest.id}`,
          type: 'destination',
          title: `${dest.name} - ${dest.distance}km away`,
          description: `Perfect for a ${dest.suggestedDuration} trip from your location`,
          relevanceScore: 0.8 - (dest.distance / 1000), // Closer = higher score
          reason: 'Near your location',
          data: dest,
          action: {
            label: 'Explore',
            type: 'search',
            value: dest.name
          }
        })
      })
    }

    // Based on preferences
    if (this.context.preferences?.activities.length) {
      const activityBasedDestinations = this.getDestinationsByActivities(this.context.preferences.activities)
      activityBasedDestinations.forEach(dest => {
        recommendations.push({
          id: `activity-dest-${dest.id}`,
          type: 'destination',
          title: `${dest.name} for ${dest.matchedActivity}`,
          description: dest.description,
          relevanceScore: 0.75,
          reason: `Perfect for ${dest.matchedActivity} enthusiasts`,
          action: {
            label: 'Learn More',
            type: 'search',
            value: `${dest.name} ${dest.matchedActivity}`
          }
        })
      })
    }

    return recommendations
  }

  private async getActivityRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    if (!this.context.currentSession?.destination) {
      return recommendations
    }

    const destination = this.context.currentSession.destination
    const activities = await this.getPopularActivities(destination)

    activities.forEach((activity, index) => {
      recommendations.push({
        id: `activity-${activity.id}`,
        type: 'activity',
        title: activity.name,
        description: `${activity.description} (${activity.duration})`,
        relevanceScore: 0.7 - (index * 0.05),
        reason: `Popular in ${destination}`,
        data: activity,
        action: {
          label: 'Add to Itinerary',
          type: 'add',
          value: activity.id
        }
      })
    })

    // Personalized activities based on preferences
    if (this.context.preferences?.activities) {
      const personalizedActivities = activities.filter(act => 
        this.context.preferences!.activities.some(pref => 
          act.categories.includes(pref)
        )
      )

      personalizedActivities.forEach(activity => {
        const existing = recommendations.find(r => r.id === `activity-${activity.id}`)
        if (existing) {
          existing.relevanceScore += 0.2
          existing.reason = 'Matches your interests'
        }
      })
    }

    return recommendations
  }

  private async getSeasonalRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    if (!this.context.seasonality) {
      const now = new Date()
      this.context.seasonality = {
        month: now.getMonth() + 1,
        season: this.getSeason(now.getMonth() + 1)
      }
    }

    const seasonalDestinations = this.getSeasonalDestinations(this.context.seasonality.season)
    
    seasonalDestinations.forEach(dest => {
      recommendations.push({
        id: `seasonal-${dest.id}`,
        type: 'destination',
        title: `${dest.name} - Perfect for ${this.context.seasonality!.season}`,
        description: dest.seasonalHighlight,
        relevanceScore: 0.65,
        reason: `Best visited in ${this.context.seasonality!.season}`,
        data: dest,
        action: {
          label: 'Plan Trip',
          type: 'search',
          value: dest.name
        }
      })
    })

    return recommendations
  }

  private async getTourRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    try {
      let whereClause: any = {
        status: 'active'
      }
      
      // If we have a destination, search by destination
      if (this.context.currentSession?.destination) {
        whereClause.OR = [
          {
            destination: {
              contains: this.context.currentSession.destination,
              mode: 'insensitive'
            }
          },
          {
            city: {
              contains: this.context.currentSession.destination,
              mode: 'insensitive'
            }
          }
        ]
      }
      
      // If we have user location, prioritize nearby tours
      if (this.context.location && !this.context.currentSession?.destination) {
        whereClause.coordinates = { not: null }
      }

      // Get tours
      const tours = await prisma.tour.findMany({
        where: whereClause,
        include: {
          operator: {
            select: {
              name: true,
              isVerified: true
            }
          }
        },
        take: 10,
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ]
      })

      // Calculate relevance scores based on proximity if we have user location
      const scoredTours = tours.map(tour => {
        let relevanceScore = 0.6
        let reason = 'Popular tour'
        
        // Add distance factor if we have coordinates
        if (this.context.location && tour.coordinates) {
          const coords = tour.coordinates as { lat: number; lng: number }
          const distance = this.calculateDistance(
            this.context.location.lat,
            this.context.location.lng,
            coords.lat,
            coords.lng
          )
          
          // Closer tours get higher scores
          const proximityBonus = Math.max(0, 0.3 - (distance / 1000))
          relevanceScore += proximityBonus
          
          if (distance < 50) {
            reason = 'Near your location'
          } else if (distance < 200) {
            reason = 'Within driving distance'
          }
        }
        
        // Verified operator bonus
        if (tour.operator?.isVerified) {
          relevanceScore += 0.1
          reason = tour.operator.isVerified ? 'Verified operator' : reason
        }
        
        // Rating bonus
        if (tour.rating) {
          relevanceScore += (tour.rating / 5) * 0.1
        }
        
        return { tour, relevanceScore, reason }
      })
      
      // Sort by relevance and take top 5
      scoredTours
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
        .forEach(({ tour, relevanceScore, reason }) => {
          recommendations.push({
            id: `tour-${tour.id}`,
            type: 'tour',
            title: tour.name,
            description: `${tour.duration}${tour.durationType === 'days' ? ' days' : ' hours'} - From $${tour.price} by ${tour.operator?.name || 'Local operator'}`,
            relevanceScore,
            reason,
            data: tour,
            action: {
              label: 'View Details',
              type: 'link',
              value: `/tours/${tour.id}`
            }
          })
        })
    } catch (error) {
      console.error('Error fetching tour recommendations:', error)
    }

    return recommendations
  }

  private async getContextualTips(): Promise<Recommendation[]> {
    const tips: Recommendation[] = []
    
    // Weather-based tips
    if (this.context.currentSession?.destination && this.context.currentSession?.dates) {
      const weatherTip = await this.getWeatherTip(
        this.context.currentSession.destination,
        this.context.currentSession.dates.start
      )
      if (weatherTip) {
        tips.push(weatherTip)
      }
    }

    // Budget tips
    if (this.context.preferences?.budget) {
      const budgetTips = this.getBudgetTips(this.context.preferences.budget)
      tips.push(...budgetTips)
    }

    // Travel warnings or advisories
    if (this.context.currentSession?.destination) {
      const warnings = await this.getTravelWarnings(this.context.currentSession.destination)
      tips.push(...warnings)
    }

    // Accessibility tips
    if (this.context.preferences?.accessibility?.length) {
      const accessibilityTips = this.getAccessibilityTips(
        this.context.currentSession?.destination || 'your destination',
        this.context.preferences.accessibility
      )
      tips.push(...accessibilityTips)
    }

    return tips
  }

  // Helper methods
  private extractDestinationsFromSearches(searches: string[]): string[] {
    const destinations = new Set<string>()
    const commonDestinations = [
      'Paris', 'Tokyo', 'New York', 'London', 'Rome', 'Barcelona',
      'Bali', 'Dubai', 'Singapore', 'Bangkok', 'Istanbul', 'Amsterdam'
    ]
    
    searches.forEach(search => {
      commonDestinations.forEach(dest => {
        if (search.toLowerCase().includes(dest.toLowerCase())) {
          destinations.add(dest)
        }
      })
    })
    
    return Array.from(destinations)
  }

  private async getNearbyDestinations(): Promise<any[]> {
    if (!this.context.location) {
      return []
    }
    
    try {
      // Get tours with coordinates from the database
      const tours = await prisma.tour.findMany({
        where: {
          coordinates: {
            not: null
          },
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          destination: true,
          city: true,
          coordinates: true,
          duration: true,
          durationType: true
        },
        take: 20 // Get more to filter by distance
      })
      
      // Calculate distances and filter nearby destinations
      const nearbyDestinations = tours
        .map(tour => {
          if (!tour.coordinates || typeof tour.coordinates !== 'object') {
            return null
          }
          
          const coords = tour.coordinates as { lat: number; lng: number }
          const distance = this.calculateDistance(
            this.context.location!.lat,
            this.context.location!.lng,
            coords.lat,
            coords.lng
          )
          
          return {
            id: tour.id,
            name: tour.destination || tour.name,
            distance: Math.round(distance),
            suggestedDuration: this.getSuggestedDuration(tour.duration, tour.durationType),
            tourName: tour.name,
            coordinates: coords
          }
        })
        .filter(dest => dest !== null && dest.distance < 300) // Within 300km
        .sort((a, b) => a!.distance - b!.distance)
        .slice(0, 5) // Top 5 nearest
      
      return nearbyDestinations as any[]
    } catch (error) {
      console.error('Error fetching nearby destinations:', error)
      return []
    }
  }
  
  // Haversine formula to calculate distance between two points
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }
  
  private getSuggestedDuration(duration: number, durationType: string): string {
    if (durationType === 'days') {
      if (duration <= 2) return 'weekend'
      if (duration <= 4) return '3-4 day'
      if (duration <= 7) return 'week-long'
      return `${duration} day`
    } else {
      const hours = duration / 60
      if (hours <= 4) return 'half-day'
      if (hours <= 8) return 'full-day'
      return 'multi-day'
    }
  }

  private getDestinationsByActivities(activities: string[]): any[] {
    const activityDestinations: Record<string, any[]> = {
      'beach': [
        { id: 'beach-1', name: 'Maldives', matchedActivity: 'beach relaxation', description: 'Crystal clear waters and overwater bungalows' },
        { id: 'beach-2', name: 'Bora Bora', matchedActivity: 'beach relaxation', description: 'Pristine beaches and luxury resorts' }
      ],
      'hiking': [
        { id: 'hiking-1', name: 'Patagonia', matchedActivity: 'hiking', description: 'Epic trails and stunning landscapes' },
        { id: 'hiking-2', name: 'Swiss Alps', matchedActivity: 'hiking', description: 'Mountain trails with breathtaking views' }
      ],
      'culture': [
        { id: 'culture-1', name: 'Kyoto', matchedActivity: 'cultural exploration', description: 'Ancient temples and traditional culture' },
        { id: 'culture-2', name: 'Florence', matchedActivity: 'cultural exploration', description: 'Renaissance art and architecture' }
      ]
    }

    const results: any[] = []
    activities.forEach(activity => {
      const matches = activityDestinations[activity.toLowerCase()] || []
      results.push(...matches)
    })

    return results
  }

  private async getPopularActivities(destination: string): Promise<any[]> {
    // Mock data - in production, fetch from database or API
    const activities: Record<string, any[]> = {
      'paris': [
        { id: 'paris-1', name: 'Eiffel Tower Visit', description: 'Skip-the-line access', duration: '2-3 hours', categories: ['sightseeing', 'culture'] },
        { id: 'paris-2', name: 'Louvre Museum Tour', description: 'Guided art tour', duration: '3-4 hours', categories: ['culture', 'art'] },
        { id: 'paris-3', name: 'Seine River Cruise', description: 'Evening dinner cruise', duration: '2 hours', categories: ['romantic', 'dining'] }
      ],
      'tokyo': [
        { id: 'tokyo-1', name: 'Tsukiji Fish Market Tour', description: 'Early morning market visit', duration: '3 hours', categories: ['food', 'culture'] },
        { id: 'tokyo-2', name: 'Mount Fuji Day Trip', description: 'Full day excursion', duration: '12 hours', categories: ['nature', 'hiking'] }
      ]
    }

    return activities[destination.toLowerCase()] || []
  }

  private getSeason(month: number): 'winter' | 'spring' | 'summer' | 'fall' {
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'fall'
    return 'winter'
  }

  private getSeasonalDestinations(season: string): any[] {
    const seasonal: Record<string, any[]> = {
      'winter': [
        { id: 'winter-1', name: 'Japan', seasonalHighlight: 'Ski resorts and hot springs' },
        { id: 'winter-2', name: 'Norway', seasonalHighlight: 'Northern lights viewing' }
      ],
      'spring': [
        { id: 'spring-1', name: 'Japan', seasonalHighlight: 'Cherry blossom season' },
        { id: 'spring-2', name: 'Netherlands', seasonalHighlight: 'Tulip fields in bloom' }
      ],
      'summer': [
        { id: 'summer-1', name: 'Greek Islands', seasonalHighlight: 'Perfect beach weather' },
        { id: 'summer-2', name: 'Alaska', seasonalHighlight: 'Midnight sun and wildlife' }
      ],
      'fall': [
        { id: 'fall-1', name: 'New England', seasonalHighlight: 'Fall foliage tours' },
        { id: 'fall-2', name: 'India', seasonalHighlight: 'Festival season' }
      ]
    }

    return seasonal[season] || []
  }

  private async getWeatherTip(destination: string, date: Date): Promise<Recommendation | null> {
    // Mock weather tip
    return {
      id: 'weather-tip',
      type: 'tip',
      title: 'Weather Advisory',
      description: `${destination} in ${date.toLocaleDateString('en-US', { month: 'long' })}: Pack light layers and rain gear`,
      relevanceScore: 0.5,
      reason: 'Seasonal weather information'
    }
  }

  private getBudgetTips(budget: string): Recommendation[] {
    const tips: Record<string, Recommendation[]> = {
      'budget': [
        {
          id: 'budget-tip-1',
          type: 'tip',
          title: 'Save on Transportation',
          description: 'Use public transit passes and book flights on Tuesday/Wednesday',
          relevanceScore: 0.55,
          reason: 'Budget travel tip'
        }
      ],
      'luxury': [
        {
          id: 'luxury-tip-1',
          type: 'tip',
          title: 'Exclusive Experiences',
          description: 'Book private tours and premium experiences in advance',
          relevanceScore: 0.55,
          reason: 'Luxury travel tip'
        }
      ]
    }

    return tips[budget] || []
  }

  private async getTravelWarnings(destination: string): Promise<Recommendation[]> {
    // Mock warnings - in production, check real advisory APIs
    return []
  }

  private getAccessibilityTips(destination: string, needs: string[]): Recommendation[] {
    return needs.map((need, index) => ({
      id: `accessibility-${index}`,
      type: 'tip',
      title: `Accessibility in ${destination}`,
      description: `Information about ${need} accommodations and services`,
      relevanceScore: 0.6,
      reason: 'Accessibility information'
    }))
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine()