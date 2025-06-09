"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DefaultPricingCalculationService } from '@/lib/itinerary-engine/services/pricing-calculation-service'
import type { 
  GeneratedItinerary, 
  Activity, 
  Accommodation, 
  AccommodationType,
  Transportation, 
  Money 
} from '@/lib/types/itinerary'
import type { CostBreakdown } from '@/lib/itinerary-engine/types'

// Types for real-time pricing
export interface SelectedItems {
  accommodations: Accommodation[]
  activities: Activity[]
  transportation: Transportation[]
}

export interface PricingUpdate {
  total: Money
  breakdown: {
    accommodations: Money
    activities: Money
    transportation: Money
    meals: Money
    miscellaneous: Money
  }
  byDay: Array<{
    date: string
    total: Money
    breakdown: {
      accommodations: Money
      activities: Money
      transportation: Money
      meals: Money
      miscellaneous: Money
    }
  }>
  confidence: number
  timestamp: Date
}

export interface PricingHistory {
  original: PricingUpdate
  current: PricingUpdate
  changes: Array<{
    timestamp: Date
    changeType: 'add' | 'remove' | 'modify'
    component: 'accommodation' | 'activity' | 'transportation'
    componentName: string
    priceDifference: Money
    newTotal: Money
  }>
}

export interface CurrencyOption {
  code: string
  symbol: string
  name: string
  rate: number
}

export interface PricingServiceState {
  currentPricing: PricingUpdate | null
  history: PricingHistory | null
  isCalculating: boolean
  error: string | null
  selectedCurrency: string
  availableCurrencies: CurrencyOption[]
}

// Currency data with exchange rates (mock data for demo)
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.85 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.73 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 110.0 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.25 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.35 },
]

export class RealTimePricingService {
  private pricingEngine: DefaultPricingCalculationService
  private cache: Map<string, PricingUpdate> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.pricingEngine = new DefaultPricingCalculationService({
      baseCurrency: 'USD',
      cacheTTLMinutes: 5,
      contingencyPercentage: 15
    })
  }

  /**
   * Calculate pricing for selected items with caching
   */
  async calculatePricing(
    selectedItems: SelectedItems,
    tripDates: { startDate: Date; endDate: Date },
    travelers: { adults: number; children: number; infants: number },
    currency: string = 'USD'
  ): Promise<PricingUpdate> {
    const cacheKey = this.generateCacheKey(selectedItems, tripDates, travelers, currency)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && this.isCacheValid(cached)) {
      return cached
    }

    try {
      // Convert selected items to itinerary format for the pricing engine
      const mockItinerary = this.createMockItinerary(selectedItems, tripDates, travelers)
      
      // Calculate using the existing pricing engine
      const costBreakdown = await this.pricingEngine.calculateItineraryCost(mockItinerary)
      
      // Convert to our pricing update format
      const pricingUpdate = await this.convertToRealTimePricing(
        costBreakdown, 
        selectedItems, 
        tripDates, 
        currency
      )

      // Cache the result
      this.cache.set(cacheKey, pricingUpdate)
      
      // Schedule cache cleanup
      setTimeout(() => {
        this.cache.delete(cacheKey)
      }, this.CACHE_TTL)

      return pricingUpdate
    } catch (error) {
      console.error('Pricing calculation error:', error)
      throw new Error('Failed to calculate pricing')
    }
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount: Money, targetCurrency: string): Promise<Money> {
    if (amount.currency === targetCurrency) {
      return amount
    }

    const fromRate = CURRENCY_OPTIONS.find(c => c.code === amount.currency)?.rate || 1
    const toRate = CURRENCY_OPTIONS.find(c => c.code === targetCurrency)?.rate || 1
    
    const convertedAmount = (amount.amount / fromRate) * toRate

    return {
      amount: Math.round(convertedAmount * 100) / 100,
      currency: targetCurrency
    }
  }

  /**
   * Create comparison between two pricing updates
   */
  createPriceComparison(original: PricingUpdate, current: PricingUpdate): {
    totalDifference: Money
    percentageChange: number
    categoryChanges: Record<string, { amount: Money; percentage: number }>
  } {
    const totalDiff = current.total.amount - original.total.amount
    const percentChange = original.total.amount > 0 
      ? (totalDiff / original.total.amount) * 100 
      : 0

    const categoryChanges: Record<string, { amount: Money; percentage: number }> = {}
    
    Object.keys(current.breakdown).forEach(category => {
      const currentAmount = current.breakdown[category as keyof typeof current.breakdown].amount
      const originalAmount = original.breakdown[category as keyof typeof original.breakdown].amount
      const diff = currentAmount - originalAmount
      const percentDiff = originalAmount > 0 ? (diff / originalAmount) * 100 : 0

      categoryChanges[category] = {
        amount: { amount: diff, currency: current.total.currency },
        percentage: percentDiff
      }
    })

    return {
      totalDifference: { amount: totalDiff, currency: current.total.currency },
      percentageChange: percentChange,
      categoryChanges
    }
  }

  /**
   * Generate cache key for pricing calculations
   */
  private generateCacheKey(
    selectedItems: SelectedItems,
    tripDates: { startDate: Date; endDate: Date },
    travelers: { adults: number; children: number; infants: number },
    currency: string
  ): string {
    const itemsHash = [
      selectedItems.accommodations.map(a => a.id).sort().join(','),
      selectedItems.activities.map(a => a.id).sort().join(','),
      selectedItems.transportation.map(t => t.id).sort().join(','),
    ].join('|')

    const contextHash = [
      tripDates.startDate.toISOString(),
      tripDates.endDate.toISOString(),
      `${travelers.adults}-${travelers.children}-${travelers.infants}`,
      currency
    ].join('|')

    return `${itemsHash}:${contextHash}`
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cached: PricingUpdate): boolean {
    const now = new Date()
    const cacheAge = now.getTime() - cached.timestamp.getTime()
    return cacheAge < this.CACHE_TTL
  }

  /**
   * Create mock itinerary for pricing engine
   */
  private createMockItinerary(
    selectedItems: SelectedItems,
    tripDates: { startDate: Date; endDate: Date },
    travelers: { adults: number; children: number; infants: number }
  ): GeneratedItinerary {
    const tripDuration = Math.ceil(
      (tripDates.endDate.getTime() - tripDates.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Create daily breakdown
    const days = []
    for (let i = 0; i < tripDuration; i++) {
      const date = new Date(tripDates.startDate)
      date.setDate(date.getDate() + i)
      const dateString = date.toISOString().split('T')[0]
      
      // Ensure dateString is not undefined
      if (!dateString) {
        throw new Error('Failed to format date string')
      }
      
      days.push({
        id: `day_${i + 1}`,
        dayNumber: i + 1,
        date: dateString,
        title: `Day ${i + 1}`,
        location: 'Selected Destination',
        coordinates: { latitude: 0, longitude: 0 },
        accommodation: selectedItems.accommodations[Math.min(i, selectedItems.accommodations.length - 1)] || {
          id: 'default_accommodation',
          title: 'Standard Hotel',
          description: 'Standard accommodation',
          type: 'hotel' as AccommodationType,
          starRating: 3,
          location: 'Selected Destination',
          coordinates: { latitude: 0, longitude: 0 },
          amenities: [],
          images: [],
          roomTypes: [{
            name: 'Standard Room',
            capacity: 2,
            bedConfiguration: 'Double',
            amenities: [],
            pricePerNight: { amount: 100, currency: 'USD' }
          }],
          checkInTime: '15:00',
          checkOutTime: '11:00',
          cancellationPolicy: 'flexible',
          contactInfo: {
            phone: '+1-555-0123',
            email: 'info@hotel.com',
            website: 'https://hotel.com',
            address: 'Standard Hotel, Selected Destination'
          },
          tags: [],
          estimatedCost: { amount: 100, currency: 'USD' },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        activities: selectedItems.activities.filter((_, index) => index % tripDuration === i),
        transportation: selectedItems.transportation.filter((_, index) => index % tripDuration === i),
        meals: [],
        totalEstimatedCost: { amount: 0, currency: 'USD' },
        pacing: 'moderate' as const,
        notes: ''
      })
    }

    // Mock itinerary structure
    return {
      id: 'mock_itinerary',
      title: 'Custom Trip',
      description: 'Real-time pricing calculation',
      destinations: [],
      days,
      totalDuration: tripDuration,
      totalEstimatedCost: { amount: 0, currency: 'USD' },
      summary: {
        highlights: [],
        totalActivities: selectedItems.activities.length,
        uniqueDestinations: 1,
        avgDailyCost: { amount: 0, currency: 'USD' },
        recommendedBudget: { amount: 0, currency: 'USD' },
        physicalDemand: 'moderate',
        culturalImmersion: 'moderate'
      },
      metadata: {
        generationTime: 0,
        aiModel: 'real-time-pricing',
        confidenceScore: 0.85,
        optimizationFlags: []
      },
      preferences: {
        adults: travelers.adults,
        children: travelers.children,
        infants: travelers.infants,
        startDate: tripDates.startDate,
        endDate: tripDates.endDate,
        budgetMin: 0,
        budgetMax: 10000,
        primaryDestination: 'Selected Destination',
        interests: [],
        accommodationType: 'hotel',
        transportationPreference: 'flight',
        tripDuration,
        travelerProfiles: [
          { type: 'adult', count: travelers.adults },
          { type: 'child', count: travelers.children },
          { type: 'infant', count: travelers.infants }
        ],
        budgetCategory: 'mid-range',
        pacePreference: 'moderate',
        currency: 'USD'
      },
      generatedAt: new Date(),
      version: '1.0.0'
    }
  }

  /**
   * Convert cost breakdown to real-time pricing format
   */
  private async convertToRealTimePricing(
    costBreakdown: CostBreakdown,
    selectedItems: SelectedItems,
    tripDates: { startDate: Date; endDate: Date },
    currency: string
  ): Promise<PricingUpdate> {
    // Convert to target currency if needed
    const total = await this.convertCurrency(costBreakdown.total, currency)
    const breakdown = {
      accommodations: await this.convertCurrency(costBreakdown.byCategory.accommodation, currency),
      activities: await this.convertCurrency(costBreakdown.byCategory.activities, currency),
      transportation: await this.convertCurrency(costBreakdown.byCategory.transportation, currency),
      meals: await this.convertCurrency(costBreakdown.byCategory.meals, currency),
      miscellaneous: await this.convertCurrency(costBreakdown.byCategory.miscellaneous, currency)
    }

    // Convert daily breakdown
    const byDay = await Promise.all(
      costBreakdown.byDay.map(async (day) => ({
        date: day.date,
        total: await this.convertCurrency(day.total, currency),
        breakdown: {
          accommodations: await this.convertCurrency(day.breakdown.accommodation, currency),
          activities: await this.convertCurrency(day.breakdown.activities, currency),
          transportation: await this.convertCurrency(day.breakdown.transportation, currency),
          meals: await this.convertCurrency(day.breakdown.meals, currency),
          miscellaneous: await this.convertCurrency(day.breakdown.miscellaneous, currency)
        }
      }))
    )

    return {
      total,
      breakdown,
      byDay,
      confidence: costBreakdown.confidence,
      timestamp: new Date()
    }
  }
}

// Custom hook for real-time pricing
export function useRealTimePricing() {
  const [state, setState] = useState<PricingServiceState>({
    currentPricing: null,
    history: null,
    isCalculating: false,
    error: null,
    selectedCurrency: 'USD',
    availableCurrencies: CURRENCY_OPTIONS
  })

  // Create pricing service instance
  const pricingService = useMemo(() => new RealTimePricingService(), [])

  /**
   * Calculate pricing for selected items
   */
  const calculatePricing = useCallback(async (
    selectedItems: SelectedItems,
    tripDates: { startDate: Date; endDate: Date },
    travelers: { adults: number; children: number; infants: number }
  ) => {
    setState(prev => ({ ...prev, isCalculating: true, error: null }))

    try {
      const pricing = await pricingService.calculatePricing(
        selectedItems,
        tripDates,
        travelers,
        state.selectedCurrency
      )

      setState(prev => {
        // Update history if this is a change from existing pricing
        let newHistory = prev.history
        if (prev.currentPricing && prev.currentPricing !== pricing) {
          if (!newHistory) {
            newHistory = {
              original: prev.currentPricing,
              current: pricing,
              changes: []
            }
          } else {
            newHistory = {
              ...newHistory,
              current: pricing,
              changes: [...newHistory.changes, {
                timestamp: new Date(),
                changeType: 'modify',
                component: 'activity', // This would be determined by the actual change
                componentName: 'Updated Selection',
                priceDifference: {
                  amount: pricing.total.amount - prev.currentPricing.total.amount,
                  currency: pricing.total.currency
                },
                newTotal: pricing.total
              }]
            }
          }
        }

        return {
          ...prev,
          currentPricing: pricing,
          history: newHistory,
          isCalculating: false
        }
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCalculating: false,
        error: error instanceof Error ? error.message : 'Failed to calculate pricing'
      }))
    }
  }, [pricingService, state.selectedCurrency])

  /**
   * Change currency and recalculate
   */
  const changeCurrency = useCallback(async (newCurrency: string) => {
    if (newCurrency === state.selectedCurrency) return

    setState(prev => ({ ...prev, selectedCurrency: newCurrency, isCalculating: true }))

    if (state.currentPricing) {
      try {
        // Convert current pricing to new currency
        const convertedTotal = await pricingService.convertCurrency(state.currentPricing.total, newCurrency)
        const convertedBreakdown = {
          accommodations: await pricingService.convertCurrency(state.currentPricing.breakdown.accommodations, newCurrency),
          activities: await pricingService.convertCurrency(state.currentPricing.breakdown.activities, newCurrency),
          transportation: await pricingService.convertCurrency(state.currentPricing.breakdown.transportation, newCurrency),
          meals: await pricingService.convertCurrency(state.currentPricing.breakdown.meals, newCurrency),
          miscellaneous: await pricingService.convertCurrency(state.currentPricing.breakdown.miscellaneous, newCurrency)
        }

        const convertedByDay = await Promise.all(
          state.currentPricing.byDay.map(async (day) => ({
            ...day,
            total: await pricingService.convertCurrency(day.total, newCurrency),
            breakdown: {
              accommodations: await pricingService.convertCurrency(day.breakdown.accommodations, newCurrency),
              activities: await pricingService.convertCurrency(day.breakdown.activities, newCurrency),
              transportation: await pricingService.convertCurrency(day.breakdown.transportation, newCurrency),
              meals: await pricingService.convertCurrency(day.breakdown.meals, newCurrency),
              miscellaneous: await pricingService.convertCurrency(day.breakdown.miscellaneous, newCurrency)
            }
          }))
        )

        setState(prev => ({
          ...prev,
          currentPricing: prev.currentPricing ? {
            ...prev.currentPricing,
            total: convertedTotal,
            breakdown: convertedBreakdown,
            byDay: convertedByDay
          } : null,
          isCalculating: false
        }))
      } catch (error) {
        setState(prev => ({
          ...prev,
          isCalculating: false,
          error: 'Failed to convert currency'
        }))
      }
    } else {
      setState(prev => ({ ...prev, isCalculating: false }))
    }
  }, [pricingService, state.selectedCurrency, state.currentPricing])

  /**
   * Get price comparison with original
   */
  const getPriceComparison = useCallback(() => {
    if (!state.history) return null
    return pricingService.createPriceComparison(state.history.original, state.history.current)
  }, [pricingService, state.history])

  /**
   * Reset pricing history
   */
  const resetHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: null }))
  }, [])

  /**
   * Clear current pricing
   */
  const clearPricing = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPricing: null,
      history: null,
      error: null
    }))
  }, [])

  return {
    ...state,
    calculatePricing,
    changeCurrency,
    getPriceComparison,
    resetHistory,
    clearPricing,
    pricingService
  }
} 