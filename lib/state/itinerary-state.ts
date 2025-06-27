import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ItineraryData {
  id?: string
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: {
    adults: number
    children: number
  }
  totalBudget?: number
  days: any[]
  highlights: string[]
  tips: string[]
  estimatedTotalCost?: number
  metadata: {
    generatedAt: string
    version: string
    interests: string[]
  }
}

export interface ItineraryState {
  // Current itinerary data
  currentItinerary: ItineraryData | null
  
  // Trip metadata
  tripData: {
    destinations?: string[]
    travelDates?: {
      startDate?: string
      endDate?: string
      flexible?: boolean
    }
    travelers?: {
      adults?: number
      children?: number
    }
    budget?: {
      amount?: number
      currency?: string
      perPerson?: boolean
    }
    accommodation?: string
    interests?: string[]
    specialRequirements?: string
    completeness?: number
    tripId?: string
  } | null
  
  // Generation state
  isGenerating: boolean
  generationError: string | null
  
  // Actions
  setCurrentItinerary: (itinerary: ItineraryData | null) => void
  setTripData: (data: any) => void
  setIsGenerating: (isGenerating: boolean) => void
  setGenerationError: (error: string | null) => void
  clearItinerary: () => void
  
  // Computed
  hasItinerary: () => boolean
}

/**
 * Unified itinerary state management
 * Persists to localStorage automatically
 */
export const useItineraryState = create<ItineraryState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentItinerary: null,
      tripData: null,
      isGenerating: false,
      generationError: null,
      
      // Actions
      setCurrentItinerary: (itinerary) => {
        set({ currentItinerary: itinerary })
        
        // Also update planStore if available
        if (typeof window !== 'undefined' && window.planStore) {
          window.planStore.setItinerary(itinerary)
        }
      },
      
      setTripData: (data) => set({ tripData: data }),
      
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      setGenerationError: (error) => set({ generationError: error }),
      
      clearItinerary: () => set({
        currentItinerary: null,
        tripData: null,
        generationError: null
      }),
      
      // Computed
      hasItinerary: () => get().currentItinerary !== null
    }),
    {
      name: 'itinerary-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        currentItinerary: state.currentItinerary,
        tripData: state.tripData
      })
    }
  )
)

/**
 * Migration helper to move from old localStorage keys
 */
export function migrateLocalStorageData() {
  if (typeof window === 'undefined') return
  
  try {
    // Migrate currentItinerary
    const oldItinerary = localStorage.getItem('currentItinerary')
    if (oldItinerary) {
      const parsed = JSON.parse(oldItinerary)
      useItineraryState.getState().setCurrentItinerary(parsed)
      localStorage.removeItem('currentItinerary')
    }
    
    // Migrate lastGeneratedItinerary
    const lastGenerated = localStorage.getItem('lastGeneratedItinerary')
    if (lastGenerated && !oldItinerary) {
      const parsed = JSON.parse(lastGenerated)
      useItineraryState.getState().setCurrentItinerary(parsed)
      localStorage.removeItem('lastGeneratedItinerary')
    }
    
    // Migrate currentTripData
    const oldTripData = localStorage.getItem('currentTripData')
    if (oldTripData) {
      const parsed = JSON.parse(oldTripData)
      useItineraryState.getState().setTripData(parsed)
      localStorage.removeItem('currentTripData')
    }
  } catch (error) {
    console.error('Error migrating localStorage data:', error)
  }
}

// Declare global for planStore integration
declare global {
  interface Window {
    planStore: any
  }
}