import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import { differenceInMinutes, format } from 'date-fns'

// Types
export interface POI {
  id: string
  name: string
  category: 'restaurant' | 'attraction' | 'hotel' | 'shopping' | 'transport' | 'other' | 'art-museums' | 'bars-nightlife' | 'cafe-bakery' | 'restaurants' | 'hotels' | 'attractions' | 'beauty-fashion'
  location: {
    lat: number
    lng: number
    address?: string
  }
  rating?: number
  price?: number
  description?: string
  images?: string[]
  image?: string  // Single main image for display
  reviews?: number  // Number of reviews
  openingHours?: {
    [day: string]: { open: string; close: string }
  }
  tags?: string[]
}

export interface TimeSlot {
  id: string
  startTime: string // HH:mm format
  endTime: string
  poiId: string
  duration: number // minutes
  transportTime?: number // minutes to next activity
}

export interface DayPlan {
  id: string
  date: Date
  dayNumber: number
  slots: TimeSlot[]
  notes?: string
}

export interface Itinerary {
  id: string
  tripId: string
  destination: string
  startDate: Date
  endDate: Date
  days: DayPlan[]
  pois: POI[] // All POIs in the trip
}

export interface AISuggestion {
  id: string
  type: 'optimize_route' | 'fill_gap' | 'add_meal' | 'add_transport'
  description: string
  slots?: TimeSlot[]
  context?: {
    dayId?: string
    gapStart?: string
    gapEnd?: string
  }
}

interface PlanState {
  // Core data
  itinerary: Itinerary | null
  selectedDayId: string | null
  selectedPoiId: string | null
  highlightedPoiId: string | null
  
  // UI state
  activePane: 'explore' | 'map' | 'timeline'
  exploreDrawerOpen: boolean
  mapCenter: [number, number]
  mapZoom: number
  
  // Suggestions
  suggestions: AISuggestion[]
  appliedSuggestions: string[] // Track which suggestions have been applied
  
  // Actions
  setItinerary: (itinerary: Itinerary) => void
  addPoiToDay: (poi: POI, dayId: string, time?: string) => void
  removePoiFromDay: (dayId: string, slotId: string) => void
  reorderDaySlots: (dayId: string, fromIndex: number, toIndex: number) => void
  updateSlotTime: (dayId: string, slotId: string, startTime: string, duration: number) => void
  
  // Selection
  selectDay: (dayId: string | null) => void
  selectPoi: (poiId: string | null) => void
  highlightPoi: (poiId: string | null) => void
  
  // Map controls
  setMapView: (center: [number, number], zoom?: number) => void
  flyToPoi: (poiId: string) => void
  flyToBounds: (bounds: [[number, number], [number, number]]) => void
  
  // UI controls
  setActivePane: (pane: 'explore' | 'map' | 'timeline') => void
  toggleExploreDrawer: () => void
  
  // AI suggestions
  setSuggestions: (suggestions: AISuggestion[]) => void
  applySuggestion: (suggestionId: string) => void
  dismissSuggestion: (suggestionId: string) => void
  
  // Computed
  getSelectedDay: () => DayPlan | null
  getSelectedPoi: () => POI | null
  getDayRoute: (dayId: string) => [number, number][]
  getTimeGaps: (dayId: string) => { start: string; end: string; duration: number }[]
}

export const usePlanStore = create<PlanState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      itinerary: null,
      selectedDayId: null,
      selectedPoiId: null,
      highlightedPoiId: null,
      activePane: 'map',
      exploreDrawerOpen: false,
      mapCenter: [48.8566, 2.3522], // Default to Paris
      mapZoom: 12,
      suggestions: [],
      appliedSuggestions: [],
      
      // Actions
      setItinerary: (itinerary) => set((state) => {
        state.itinerary = itinerary
        if (itinerary.days.length > 0 && !state.selectedDayId) {
          state.selectedDayId = itinerary.days[0].id
        }
      }),
      
      addPoiToDay: (poi, dayId, time) => set((state) => {
        if (!state.itinerary) return
        
        const day = state.itinerary.days.find(d => d.id === dayId)
        if (!day) return
        
        // Add POI to itinerary if not already there
        if (!state.itinerary.pois.find(p => p.id === poi.id)) {
          state.itinerary.pois.push(poi)
        }
        
        // Create time slot
        const startTime = time || '09:00'
        const slot: TimeSlot = {
          id: `slot-${Date.now()}`,
          startTime,
          endTime: calculateEndTime(startTime, 120), // Default 2 hours
          poiId: poi.id,
          duration: 120
        }
        
        // Insert slot in chronological order
        const insertIndex = day.slots.findIndex(s => s.startTime > startTime)
        if (insertIndex === -1) {
          day.slots.push(slot)
        } else {
          day.slots.splice(insertIndex, 0, slot)
        }
        
        // Recalculate transport times
        recalculateTransportTimes(day, state.itinerary.pois)
      }),
      
      removePoiFromDay: (dayId, slotId) => set((state) => {
        if (!state.itinerary) return
        
        const day = state.itinerary.days.find(d => d.id === dayId)
        if (!day) return
        
        day.slots = day.slots.filter(s => s.id !== slotId)
        recalculateTransportTimes(day, state.itinerary.pois)
      }),
      
      reorderDaySlots: (dayId, fromIndex, toIndex) => set((state) => {
        if (!state.itinerary) return
        
        const day = state.itinerary.days.find(d => d.id === dayId)
        if (!day) return
        
        const [movedSlot] = day.slots.splice(fromIndex, 1)
        day.slots.splice(toIndex, 0, movedSlot)
        
        // Recalculate times based on new order
        recalculateSlotTimes(day)
        recalculateTransportTimes(day, state.itinerary.pois)
      }),
      
      updateSlotTime: (dayId, slotId, startTime, duration) => set((state) => {
        if (!state.itinerary) return
        
        const day = state.itinerary.days.find(d => d.id === dayId)
        if (!day) return
        
        const slot = day.slots.find(s => s.id === slotId)
        if (!slot) return
        
        slot.startTime = startTime
        slot.duration = duration
        slot.endTime = calculateEndTime(startTime, duration)
        
        // Re-sort slots by time
        day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
        recalculateTransportTimes(day, state.itinerary.pois)
      }),
      
      // Selection actions
      selectDay: (dayId) => set((state) => {
        state.selectedDayId = dayId
      }),
      
      selectPoi: (poiId) => set((state) => {
        state.selectedPoiId = poiId
      }),
      
      highlightPoi: (poiId) => set((state) => {
        state.highlightedPoiId = poiId
      }),
      
      // Map controls
      setMapView: (center, zoom) => set((state) => {
        state.mapCenter = center
        if (zoom !== undefined) state.mapZoom = zoom
      }),
      
      flyToPoi: (poiId) => set((state) => {
        const poi = state.itinerary?.pois.find(p => p.id === poiId)
        if (poi) {
          state.mapCenter = [poi.location.lat, poi.location.lng]
          state.mapZoom = 16
        }
      }),
      
      flyToBounds: (bounds) => set((state) => {
        // Calculate center and appropriate zoom
        const center: [number, number] = [
          (bounds[0][0] + bounds[1][0]) / 2,
          (bounds[0][1] + bounds[1][1]) / 2
        ]
        state.mapCenter = center
        // Simple zoom calculation (would be more complex in real implementation)
        const latDiff = Math.abs(bounds[1][0] - bounds[0][0])
        const lngDiff = Math.abs(bounds[1][1] - bounds[0][1])
        const maxDiff = Math.max(latDiff, lngDiff)
        state.mapZoom = maxDiff > 0.1 ? 11 : maxDiff > 0.05 ? 12 : 14
      }),
      
      // UI controls
      setActivePane: (pane) => set((state) => {
        state.activePane = pane
      }),
      
      toggleExploreDrawer: () => set((state) => {
        state.exploreDrawerOpen = !state.exploreDrawerOpen
      }),
      
      // AI suggestions
      setSuggestions: (suggestions) => set((state) => {
        state.suggestions = suggestions
      }),
      
      applySuggestion: (suggestionId) => set((state) => {
        const suggestion = state.suggestions.find(s => s.id === suggestionId)
        if (!suggestion || !state.itinerary) return
        
        state.appliedSuggestions.push(suggestionId)
        
        // Apply the suggestion based on type
        if (suggestion.type === 'optimize_route' && suggestion.slots) {
          const dayId = suggestion.context?.dayId
          if (dayId) {
            const day = state.itinerary.days.find(d => d.id === dayId)
            if (day) {
              day.slots = suggestion.slots
            }
          }
        }
        // Add more suggestion types as needed
      }),
      
      dismissSuggestion: (suggestionId) => set((state) => {
        state.suggestions = state.suggestions.filter(s => s.id !== suggestionId)
      }),
      
      // Computed getters
      getSelectedDay: () => {
        const state = get()
        if (!state.itinerary || !state.selectedDayId) return null
        return state.itinerary.days.find(d => d.id === state.selectedDayId) || null
      },
      
      getSelectedPoi: () => {
        const state = get()
        if (!state.itinerary || !state.selectedPoiId) return null
        return state.itinerary.pois.find(p => p.id === state.selectedPoiId) || null
      },
      
      getDayRoute: (dayId) => {
        const state = get()
        if (!state.itinerary) return []
        
        const day = state.itinerary.days.find(d => d.id === dayId)
        if (!day) return []
        
        return day.slots.map(slot => {
          const poi = state.itinerary!.pois.find(p => p.id === slot.poiId)
          return poi ? [poi.location.lat, poi.location.lng] : null
        }).filter((coord): coord is [number, number] => coord !== null)
      },
      
      getTimeGaps: (dayId) => {
        const state = get()
        if (!state.itinerary) return []
        
        const day = state.itinerary.days.find(d => d.id === dayId)
        if (!day || day.slots.length === 0) return []
        
        const gaps: { start: string; end: string; duration: number }[] = []
        
        // Check gap from day start (8 AM) to first activity
        if (day.slots[0].startTime > '08:00') {
          gaps.push({
            start: '08:00',
            end: day.slots[0].startTime,
            duration: calculateMinutesBetween('08:00', day.slots[0].startTime)
          })
        }
        
        // Check gaps between activities
        for (let i = 0; i < day.slots.length - 1; i++) {
          const currentEnd = day.slots[i].endTime
          const nextStart = day.slots[i + 1].startTime
          const duration = calculateMinutesBetween(currentEnd, nextStart)
          
          if (duration > 30) { // Only show gaps > 30 minutes
            gaps.push({ start: currentEnd, end: nextStart, duration })
          }
        }
        
        // Check gap from last activity to day end (10 PM)
        const lastSlot = day.slots[day.slots.length - 1]
        if (lastSlot.endTime < '22:00') {
          gaps.push({
            start: lastSlot.endTime,
            end: '22:00',
            duration: calculateMinutesBetween(lastSlot.endTime, '22:00')
          })
        }
        
        return gaps
      }
    }))
  )
)

// Helper functions
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

function calculateMinutesBetween(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
}

function recalculateSlotTimes(day: DayPlan): void {
  // This would implement smart time recalculation based on durations and transport times
  // For now, we keep the existing times
}

function recalculateTransportTimes(day: DayPlan, pois: POI[]): void {
  // Calculate transport time between consecutive activities
  for (let i = 0; i < day.slots.length - 1; i++) {
    const currentPoi = pois.find(p => p.id === day.slots[i].poiId)
    const nextPoi = pois.find(p => p.id === day.slots[i + 1].poiId)
    
    if (currentPoi && nextPoi) {
      // Simple distance calculation (would use routing API in real implementation)
      const distance = calculateDistance(
        currentPoi.location.lat,
        currentPoi.location.lng,
        nextPoi.location.lat,
        nextPoi.location.lng
      )
      
      // Assume 4 km/h walking speed
      day.slots[i].transportTime = Math.ceil((distance / 4) * 60)
    }
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for distance calculation
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}