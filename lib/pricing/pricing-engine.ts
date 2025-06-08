import { differenceInDays, parseISO, format } from 'date-fns'

// Types for pricing calculations
export interface PricingFactors {
  season: 'low' | 'high' | 'peak'
  dayOfWeek: 'weekday' | 'weekend'
  advanceBooking: number // days in advance
  groupSize: number
  duration: number // days
  destination: string
  activityType: string
  demandLevel: 'low' | 'medium' | 'high'
}

export interface PriceBreakdown {
  basePrice: number
  seasonalMultiplier: number
  demandMultiplier: number
  groupDiscountMultiplier: number
  advanceBookingDiscount: number
  finalPrice: number
  savings: number
  pricePerPerson?: number | undefined
}

export interface BudgetOptimization {
  currentTotal: number
  targetBudget?: number | undefined
  isOverBudget: boolean
  overageAmount: number
  suggestions: BudgetSuggestion[]
  alternatives: Alternative[]
}

export interface BudgetSuggestion {
  type: 'reduce_cost' | 'alternative' | 'timing' | 'group_size'
  title: string
  description: string
  potentialSavings: number
  impact: 'low' | 'medium' | 'high'
}

export interface Alternative {
  id: string
  title: string
  originalPrice: number
  alternativePrice: number
  savings: number
  type: 'accommodation' | 'activity' | 'transportation'
  description: string
  tradeoffs: string[]
}

export interface MarketData {
  averagePrice: number
  priceRange: { min: number; max: number }
  trending: 'up' | 'down' | 'stable'
  competitorPrices: number[]
  recommendations: string[]
}

// Seasonal pricing multipliers
const SEASONAL_MULTIPLIERS = {
  low: 0.8,     // Off-season discount
  high: 1.2,    // Popular season
  peak: 1.5     // Peak season (holidays, events)
}

// Demand-based multipliers
const DEMAND_MULTIPLIERS = {
  low: 0.9,
  medium: 1.0,
  high: 1.3
}

// Day of week multipliers
const DAY_MULTIPLIERS = {
  weekday: 0.95,
  weekend: 1.15
}

export class PricingEngine {
  private static instance: PricingEngine
  private marketCache = new Map<string, { data: MarketData; timestamp: number }>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  static getInstance(): PricingEngine {
    if (!PricingEngine.instance) {
      PricingEngine.instance = new PricingEngine()
    }
    return PricingEngine.instance
  }

  /**
   * Calculate dynamic price based on multiple factors
   */
  calculateDynamicPrice(
    basePrice: number,
    factors: PricingFactors
  ): PriceBreakdown {
    const seasonalMultiplier = SEASONAL_MULTIPLIERS[factors.season]
    const demandMultiplier = DEMAND_MULTIPLIERS[factors.demandLevel]
    const dayMultiplier = DAY_MULTIPLIERS[factors.dayOfWeek]

    // Group size discounts
    const groupDiscountMultiplier = this.calculateGroupDiscount(factors.groupSize)

    // Advance booking discounts
    const advanceBookingDiscount = this.calculateAdvanceBookingDiscount(factors.advanceBooking)

    // Calculate final price
    let adjustedPrice = basePrice * seasonalMultiplier * demandMultiplier * dayMultiplier * groupDiscountMultiplier

    // Apply advance booking discount
    const discountAmount = adjustedPrice * advanceBookingDiscount
    const finalPrice = adjustedPrice - discountAmount

    // Calculate per person price if group size > 1
    const pricePerPerson = factors.groupSize > 1 ? finalPrice / factors.groupSize : undefined

    // Calculate total savings from base price
    const savings = basePrice - finalPrice

    return {
      basePrice,
      seasonalMultiplier,
      demandMultiplier,
      groupDiscountMultiplier,
      advanceBookingDiscount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      pricePerPerson: pricePerPerson ? Math.round(pricePerPerson * 100) / 100 : undefined
    }
  }

  /**
   * Calculate group size discount
   */
  private calculateGroupDiscount(groupSize: number): number {
    if (groupSize >= 10) return 0.85  // 15% discount for 10+
    if (groupSize >= 6) return 0.9    // 10% discount for 6-9
    if (groupSize >= 4) return 0.95   // 5% discount for 4-5
    return 1.0 // No discount for 1-3 people
  }

  /**
   * Calculate advance booking discount
   */
  private calculateAdvanceBookingDiscount(daysInAdvance: number): number {
    if (daysInAdvance >= 90) return 0.15  // 15% discount for 90+ days
    if (daysInAdvance >= 60) return 0.12  // 12% discount for 60-89 days
    if (daysInAdvance >= 30) return 0.08  // 8% discount for 30-59 days
    if (daysInAdvance >= 14) return 0.05  // 5% discount for 14-29 days
    return 0 // No discount for less than 14 days
  }

  /**
   * Optimize budget and provide suggestions
   */
  optimizeBudget(
    activities: Array<{ price: number; type: string; title: string; id: string }>,
    targetBudget?: number,
    groupSize: number = 1
  ): BudgetOptimization {
    const currentTotal = activities.reduce((sum, activity) => sum + activity.price, 0)
    const isOverBudget = targetBudget ? currentTotal > targetBudget : false
    const overageAmount = targetBudget ? Math.max(0, currentTotal - targetBudget) : 0

    const suggestions: BudgetSuggestion[] = []
    const alternatives: Alternative[] = []

    if (isOverBudget && targetBudget) {
      // Generate cost reduction suggestions
      suggestions.push(...this.generateBudgetSuggestions(activities, overageAmount, groupSize))
      
      // Generate alternative options
      alternatives.push(...this.generateAlternatives(activities, targetBudget))
    }

    return {
      currentTotal: Math.round(currentTotal * 100) / 100,
      targetBudget,
      isOverBudget,
      overageAmount: Math.round(overageAmount * 100) / 100,
      suggestions,
      alternatives
    }
  }

  /**
   * Generate budget reduction suggestions
   */
  private generateBudgetSuggestions(
    activities: Array<{ price: number; type: string; title: string }>,
    overageAmount: number,
    groupSize: number
  ): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = []

    // Find most expensive activities
    const sortedByPrice = [...activities].sort((a, b) => b.price - a.price)
    const mostExpensive = sortedByPrice.slice(0, 3)

    mostExpensive.forEach(activity => {
      suggestions.push({
        type: 'alternative',
        title: `Consider alternatives to ${activity.title}`,
        description: `Look for similar ${activity.type} options that could reduce costs`,
        potentialSavings: activity.price * 0.3,
        impact: activity.price > overageAmount * 0.5 ? 'high' : 'medium'
      })
    })

    // Group size optimization
    if (groupSize < 4) {
      suggestions.push({
        type: 'group_size',
        title: 'Increase group size for discounts',
        description: 'Adding more travelers can unlock group discounts on many activities',
        potentialSavings: activities.reduce((sum, a) => sum + a.price, 0) * 0.1,
        impact: 'medium'
      })
    }

    // Timing suggestions
    suggestions.push({
      type: 'timing',
      title: 'Adjust travel dates',
      description: 'Traveling during off-peak times can significantly reduce costs',
      potentialSavings: overageAmount * 0.6,
      impact: 'high'
    })

    return suggestions
  }

  /**
   * Generate alternative options
   */
  private generateAlternatives(
    activities: Array<{ price: number; type: string; title: string; id: string }>,
    targetBudget: number
  ): Alternative[] {
    const alternatives: Alternative[] = []

    activities.forEach(activity => {
      if (activity.price > 100) { // Only suggest alternatives for expensive items
        const alternativePrice = activity.price * 0.7 // 30% cheaper alternative
        
        alternatives.push({
          id: `${activity.id}-alt`,
          title: `Budget-friendly ${activity.type}`,
          originalPrice: activity.price,
          alternativePrice,
          savings: activity.price - alternativePrice,
          type: activity.type as 'accommodation' | 'activity' | 'transportation',
          description: `A more affordable option for ${activity.title}`,
          tradeoffs: ['Fewer amenities', 'Different location', 'Limited availability']
        })
      }
    })

    return alternatives.sort((a, b) => b.savings - a.savings).slice(0, 5)
  }

  /**
   * Get market data and price intelligence
   */
  async getMarketData(
    destination: string,
    activityType: string,
    dateRange: { start: string; end: string }
  ): Promise<MarketData> {
    const cacheKey = `${destination}-${activityType}-${dateRange.start}`
    const cached = this.marketCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // Simulate market data (in real implementation, this would call external APIs)
    const marketData = await this.fetchMarketData(destination, activityType, dateRange)
    
    this.marketCache.set(cacheKey, {
      data: marketData,
      timestamp: Date.now()
    })

    return marketData
  }

  /**
   * Simulate fetching market data (replace with real API calls)
   */
  private async fetchMarketData(
    destination: string,
    activityType: string,
    dateRange: { start: string; end: string }
  ): Promise<MarketData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate mock market data
    const basePrice = Math.floor(Math.random() * 200) + 50
    const priceVariation = basePrice * 0.3

    return {
      averagePrice: basePrice,
      priceRange: {
        min: Math.floor(basePrice - priceVariation),
        max: Math.floor(basePrice + priceVariation)
      },
      trending: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      competitorPrices: Array.from({ length: 5 }, () => 
        Math.floor(basePrice + (Math.random() - 0.5) * priceVariation)
      ),
      recommendations: [
        'Book 30 days in advance for best rates',
        'Consider weekday activities for lower prices',
        'Group bookings available for 4+ people'
      ]
    }
  }

  /**
   * Calculate seasonal pricing factors
   */
  getSeasonalFactors(destination: string, date: string): {
    season: PricingFactors['season']
    dayOfWeek: PricingFactors['dayOfWeek']
    demandLevel: PricingFactors['demandLevel']
  } {
    const targetDate = parseISO(date)
    const month = targetDate.getMonth()
    const dayOfWeek = targetDate.getDay()

    // Determine season (this is simplified - real implementation would use destination-specific data)
    let season: PricingFactors['season'] = 'low'
    if ([11, 0, 1].includes(month) || [5, 6, 7].includes(month)) {
      season = 'peak' // Winter holidays or summer
    } else if ([3, 4, 8, 9].includes(month)) {
      season = 'high' // Spring and fall
    }

    // Determine day type
    const dayType: PricingFactors['dayOfWeek'] = dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday'

    // Simulate demand level
    const demandLevel: PricingFactors['demandLevel'] = 
      season === 'peak' ? 'high' : 
      season === 'high' ? 'medium' : 'low'

    return {
      season,
      dayOfWeek: dayType,
      demandLevel
    }
  }

  /**
   * Calculate real-time price updates for a trip
   */
  async calculateTripPricing(tripData: {
    destination: string
    startDate: string
    endDate: string
    groupSize: number
    activities: Array<{
      id: string
      basePrice: number
      type: string
      title: string
    }>
  }) {
    const duration = differenceInDays(parseISO(tripData.endDate), parseISO(tripData.startDate)) + 1
    const daysInAdvance = differenceInDays(parseISO(tripData.startDate), new Date())
    
    const seasonalFactors = this.getSeasonalFactors(tripData.destination, tripData.startDate)

    const pricedActivities = tripData.activities.map(activity => {
      const factors: PricingFactors = {
        ...seasonalFactors,
        advanceBooking: daysInAdvance,
        groupSize: tripData.groupSize,
        duration,
        destination: tripData.destination,
        activityType: activity.type
      }

      const pricing = this.calculateDynamicPrice(activity.basePrice, factors)

      return {
        ...activity,
        originalPrice: activity.basePrice,
        currentPrice: pricing.finalPrice,
        priceBreakdown: pricing,
        savings: pricing.savings
      }
    })

    const totalOriginal = pricedActivities.reduce((sum, a) => sum + a.originalPrice, 0)
    const totalCurrent = pricedActivities.reduce((sum, a) => sum + a.currentPrice, 0)
    const totalSavings = totalOriginal - totalCurrent

    return {
      activities: pricedActivities,
      totals: {
        originalPrice: Math.round(totalOriginal * 100) / 100,
        currentPrice: Math.round(totalCurrent * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        perPersonPrice: Math.round((totalCurrent / tripData.groupSize) * 100) / 100
      },
      priceFactors: seasonalFactors,
      recommendations: [
        daysInAdvance < 30 ? 'Book soon - prices may increase closer to travel date' : 'Great timing! You\'re getting advance booking discounts',
        tripData.groupSize < 4 ? 'Consider adding travelers for group discounts' : 'You\'re getting group discounts!',
        seasonalFactors.season === 'peak' ? 'Peak season pricing is in effect' : 'Good choice for avoiding peak season prices'
      ]
    }
  }
}

// Export singleton instance
export const pricingEngine = PricingEngine.getInstance() 