"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { 
  TripCustomizationState, 
  Action, 
  ActionType, 
  createInitialState, 
  tripCustomizationReducer,
  SelectedAccommodation,
  SelectedActivity,
  SelectedTransportation,
  PricingBreakdown
} from './trip-customization-store'

// Backend API service
class TripCustomizationAPI {
  private baseUrl: string
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }
  
  async saveTrip(tripData: TripCustomizationState): Promise<{ id: string; lastSaved: Date }> {
    const response = await fetch(`${this.baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to save trip: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async updateTrip(tripId: string, tripData: TripCustomizationState): Promise<{ id: string; lastSaved: Date }> {
    const response = await fetch(`${this.baseUrl}/trips/${tripId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update trip: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async loadTrip(tripId: string): Promise<TripCustomizationState> {
    const response = await fetch(`${this.baseUrl}/trips/${tripId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load trip: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async deleteTrip(tripId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/trips/${tripId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete trip: ${response.statusText}`)
    }
  }
  
  async calculatePricing(tripData: TripCustomizationState): Promise<PricingBreakdown> {
    const response = await fetch(`${this.baseUrl}/trips/pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to calculate pricing: ${response.statusText}`)
    }
    
    return response.json()
  }
}

// Context type definition
interface TripCustomizationContextType {
  // State
  state: TripCustomizationState
  
  // Actions
  dispatch: React.Dispatch<Action>
  
  // Trip actions
  updateTripDetails: (details: Partial<TripCustomizationState['trip']>) => void
  setDestination: (destination: string) => void
  addDestination: (destination: string) => void
  removeDestination: (destination: string) => void
  setDates: (dates: { startDate?: Date; endDate?: Date }) => void
  setTravelers: (travelers: Partial<TripCustomizationState['trip']['travelers']>) => void
  setFlexibility: (flexibility: Partial<TripCustomizationState['trip']['flexibility']>) => void
  
  // Component selection actions
  selectAccommodation: (accommodation: SelectedAccommodation) => void
  removeAccommodation: (accommodationId: string) => void
  selectActivity: (activity: SelectedActivity) => void
  removeActivity: (activityId: string) => void
  selectTransportation: (transportation: SelectedTransportation) => void
  removeTransportation: (transportationId: string) => void
  
  // UI actions
  setActiveSection: (section: string | null) => void
  setViewMode: (mode: 'list' | 'grid' | 'timeline') => void
  setLoading: (loading: boolean) => void
  setError: (field: string, message: string) => void
  clearError: (field: string) => void
  
  // History actions
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // Backend integration
  saveTrip: () => Promise<void>
  loadTrip: (tripId: string) => Promise<void>
  deleteTrip: (tripId: string) => Promise<void>
  calculatePricing: () => Promise<void>
  
  // Session management
  setUserId: (userId: string) => void
  setAutoSave: (enabled: boolean) => void
  
  // Utility functions
  resetTrip: () => void
  exportTripData: () => string
  importTripData: (data: string) => void
}

// Create context
const TripCustomizationContext = createContext<TripCustomizationContextType | undefined>(undefined)

// Custom hook to use the context
export function useTripCustomization(): TripCustomizationContextType {
  const context = useContext(TripCustomizationContext)
  if (!context) {
    throw new Error('useTripCustomization must be used within a TripCustomizationProvider')
  }
  return context
}

// Provider component props
interface TripCustomizationProviderProps {
  children: React.ReactNode
  initialState?: Partial<TripCustomizationState>
  apiBaseUrl?: string
  autoSaveInterval?: number
  enablePersistence?: boolean
}

// Provider component
export function TripCustomizationProvider({
  children,
  initialState,
  apiBaseUrl = '/api',
  autoSaveInterval = 30000, // 30 seconds
  enablePersistence = true
}: TripCustomizationProviderProps) {
  // Initialize state
  const [state, dispatch] = useReducer(
    tripCustomizationReducer,
    initialState ? { ...createInitialState(), ...initialState } : createInitialState()
  )
  
  // API instance
  const apiRef = useRef(new TripCustomizationAPI(apiBaseUrl))
  const api = apiRef.current
  
  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Simple debounce implementation
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedAction = useCallback((action: Action, delay: number = 300) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      dispatch(action)
    }, delay)
  }, [])
  
  // Online status detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: ActionType.SET_ONLINE_STATUS, payload: true })
    const handleOffline = () => dispatch({ type: ActionType.SET_ONLINE_STATUS, payload: false })
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Local storage persistence
  useEffect(() => {
    if (!enablePersistence) return
    
    const savedData = localStorage.getItem('trip-customization-state')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        dispatch({ type: ActionType.LOAD_SUCCESS, payload: parsedData })
      } catch (error) {
        console.error('Failed to load saved trip data:', error)
      }
    }
  }, [enablePersistence])
  
  // Save to local storage when state changes
  useEffect(() => {
    if (!enablePersistence) return
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('trip-customization-state', JSON.stringify(state))
    }, 1000) // Debounce saves
    
    return () => clearTimeout(timeoutId)
  }, [state, enablePersistence])
  
  // Auto-save functionality
  useEffect(() => {
    if (!state.session.autoSaveEnabled || !state.ui.isDirty || !state.trip.id) return
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveTrip()
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, autoSaveInterval)
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [state.ui.isDirty, state.session.autoSaveEnabled, state.trip.id, autoSaveInterval])
  
  // Action creators
  const updateTripDetails = useCallback((details: Partial<TripCustomizationState['trip']>) => {
    dispatch({ type: ActionType.UPDATE_TRIP_DETAILS, payload: details })
  }, [])
  
  const setDestination = useCallback((destination: string) => {
    dispatch({ type: ActionType.SET_DESTINATION, payload: destination })
  }, [])
  
  const addDestination = useCallback((destination: string) => {
    dispatch({ type: ActionType.ADD_DESTINATION, payload: destination })
  }, [])
  
  const removeDestination = useCallback((destination: string) => {
    dispatch({ type: ActionType.REMOVE_DESTINATION, payload: destination })
  }, [])
  
  const setDates = useCallback((dates: { startDate?: Date; endDate?: Date }) => {
    dispatch({ type: ActionType.SET_DATES, payload: dates })
  }, [])
  
  const setTravelers = useCallback((travelers: Partial<TripCustomizationState['trip']['travelers']>) => {
    dispatch({ type: ActionType.SET_TRAVELERS, payload: travelers })
  }, [])
  
  const setFlexibility = useCallback((flexibility: Partial<TripCustomizationState['trip']['flexibility']>) => {
    dispatch({ type: ActionType.SET_FLEXIBILITY, payload: flexibility })
  }, [])
  
  const selectAccommodation = useCallback((accommodation: SelectedAccommodation) => {
    dispatch({ type: ActionType.SELECT_ACCOMMODATION, payload: accommodation })
  }, [])
  
  const removeAccommodation = useCallback((accommodationId: string) => {
    dispatch({ type: ActionType.REMOVE_ACCOMMODATION, payload: accommodationId })
  }, [])
  
  const selectActivity = useCallback((activity: SelectedActivity) => {
    dispatch({ type: ActionType.SELECT_ACTIVITY, payload: activity })
  }, [])
  
  const removeActivity = useCallback((activityId: string) => {
    dispatch({ type: ActionType.REMOVE_ACTIVITY, payload: activityId })
  }, [])
  
  const selectTransportation = useCallback((transportation: SelectedTransportation) => {
    dispatch({ type: ActionType.SELECT_TRANSPORTATION, payload: transportation })
  }, [])
  
  const removeTransportation = useCallback((transportationId: string) => {
    dispatch({ type: ActionType.REMOVE_TRANSPORTATION, payload: transportationId })
  }, [])
  
  const setActiveSection = useCallback((section: string | null) => {
    dispatch({ type: ActionType.SET_ACTIVE_SECTION, payload: section })
  }, [])
  
  const setViewMode = useCallback((mode: 'list' | 'grid' | 'timeline') => {
    dispatch({ type: ActionType.SET_VIEW_MODE, payload: mode })
  }, [])
  
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: ActionType.SET_LOADING, payload: loading })
  }, [])
  
  const setError = useCallback((field: string, message: string) => {
    dispatch({ type: ActionType.SET_ERROR, payload: { field, message } })
  }, [])
  
  const clearError = useCallback((field: string) => {
    dispatch({ type: ActionType.CLEAR_ERROR, payload: field })
  }, [])
  
  const undo = useCallback(() => {
    dispatch({ type: ActionType.UNDO })
  }, [])
  
  const redo = useCallback(() => {
    dispatch({ type: ActionType.REDO })
  }, [])
  
  const canUndo = state.history.past.length > 0
  const canRedo = state.history.future.length > 0
  
  // Backend integration functions
  const saveTrip = useCallback(async () => {
    dispatch({ type: ActionType.SET_LOADING, payload: true })
    try {
      const result = state.trip.id 
        ? await api.updateTrip(state.trip.id, state)
        : await api.saveTrip(state)
      
      dispatch({ type: ActionType.SAVE_SUCCESS, payload: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save trip'
      dispatch({ type: ActionType.SAVE_ERROR, payload: message })
      throw error
    }
  }, [state, api])
  
  const loadTrip = useCallback(async (tripId: string) => {
    dispatch({ type: ActionType.SET_LOADING, payload: true })
    try {
      const tripData = await api.loadTrip(tripId)
      dispatch({ type: ActionType.LOAD_SUCCESS, payload: tripData })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load trip'
      dispatch({ type: ActionType.SET_ERROR, payload: { field: 'load', message } })
      throw error
    }
  }, [api])
  
  const deleteTrip = useCallback(async (tripId: string) => {
    dispatch({ type: ActionType.SET_LOADING, payload: true })
    try {
      await api.deleteTrip(tripId)
      dispatch({ type: ActionType.RESET_STATE })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete trip'
      dispatch({ type: ActionType.SET_ERROR, payload: { field: 'delete', message } })
      throw error
    }
  }, [api])
  
  const calculatePricing = useCallback(async () => {
    dispatch({ type: ActionType.SET_PRICING_CALCULATING, payload: true })
    try {
      const pricing = await api.calculatePricing(state)
      dispatch({ type: ActionType.UPDATE_PRICING, payload: pricing })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate pricing'
      dispatch({ type: ActionType.SET_PRICING_ERROR, payload: message })
      throw error
    }
  }, [state, api])
  
  const setUserId = useCallback((userId: string) => {
    dispatch({ type: ActionType.SET_SESSION, payload: { userId } })
  }, [])
  
  const setAutoSave = useCallback((enabled: boolean) => {
    dispatch({ type: ActionType.SET_SESSION, payload: { autoSaveEnabled: enabled } })
  }, [])
  
  const resetTrip = useCallback(() => {
    dispatch({ type: ActionType.RESET_TRIP })
  }, [])
  
  const exportTripData = useCallback(() => {
    return JSON.stringify(state, null, 2)
  }, [state])
  
  const importTripData = useCallback((data: string) => {
    try {
      const parsedData = JSON.parse(data)
      dispatch({ type: ActionType.LOAD_SUCCESS, payload: parsedData })
    } catch (error) {
      throw new Error('Invalid trip data format')
    }
  }, [])
  
  // Context value
  const contextValue: TripCustomizationContextType = {
    state,
    dispatch,
    updateTripDetails,
    setDestination,
    addDestination,
    removeDestination,
    setDates,
    setTravelers,
    setFlexibility,
    selectAccommodation,
    removeAccommodation,
    selectActivity,
    removeActivity,
    selectTransportation,
    removeTransportation,
    setActiveSection,
    setViewMode,
    setLoading,
    setError,
    clearError,
    undo,
    redo,
    canUndo,
    canRedo,
    saveTrip,
    loadTrip,
    deleteTrip,
    calculatePricing,
    setUserId,
    setAutoSave,
    resetTrip,
    exportTripData,
    importTripData
  }
  
  return (
    <TripCustomizationContext.Provider value={contextValue}>
      {children}
    </TripCustomizationContext.Provider>
  )
}

// Additional custom hooks for specific functionality
export function useTripData() {
  const { state } = useTripCustomization()
  return state.trip
}

export function useSelectedItems() {
  const { state } = useTripCustomization()
  return {
    accommodations: state.selectedAccommodations,
    activities: state.selectedActivities,
    transportation: state.selectedTransportation
  }
}

export function usePricing() {
  const { state, calculatePricing } = useTripCustomization()
  return {
    current: state.pricing.current,
    history: state.pricing.history,
    isCalculating: state.pricing.isCalculating,
    currency: state.pricing.currency,
    lastUpdated: state.pricing.lastUpdated,
    calculatePricing
  }
}

export function useSession() {
  const { state, setUserId, setAutoSave } = useTripCustomization()
  return {
    ...state.session,
    setUserId,
    setAutoSave
  }
}

export function useUIState() {
  const { state, setActiveSection, setViewMode, setLoading, setError, clearError } = useTripCustomization()
  return {
    ...state.ui,
    setActiveSection,
    setViewMode,
    setLoading,
    setError,
    clearError
  }
} 