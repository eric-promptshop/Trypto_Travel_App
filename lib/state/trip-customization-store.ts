"use client"

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'

// Simple debounce implementation to replace lodash
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Types for the state management system
export interface TripCustomizationState {
  // Core trip data
  trip: {
    id?: string
    name: string
    primaryDestination: string
    additionalDestinations: string[]
    startDate?: Date
    endDate?: Date
    duration: number
    travelers: {
      adults: number
      children: number
      infants: number
    }
    flexibility: {
      datesFlexible: boolean
      destinationsFlexible: boolean
      durationFlexible: boolean
    }
  }
  
  // Selected components
  selectedAccommodations: SelectedAccommodation[]
  selectedActivities: SelectedActivity[]
  selectedTransportation: SelectedTransportation[]
  
  // Pricing information
  pricing: {
    current: PricingBreakdown | null
    history: PricingHistory | null
    isCalculating: boolean
    currency: string
    lastUpdated?: Date
  }
  
  // UI state
  ui: {
    activeSection: string | null
    viewMode: 'list' | 'grid' | 'timeline'
    isLoading: boolean
    errors: Record<string, string>
    isDirty: boolean
  }
  
  // Session management
  session: {
    userId?: string
    sessionId: string
    lastSaved?: Date
    autoSaveEnabled: boolean
    isOnline: boolean
  }
  
  // History for undo/redo
  history: {
    past: TripCustomizationState[]
    present: TripCustomizationState
    future: TripCustomizationState[]
    maxHistorySize: number
  }
}

// Component interfaces
export interface SelectedAccommodation {
  id: string
  name: string
  type: string
  starRating: number
  location: string
  pricing: {
    currency: string
    perNight: number
    total: number
  }
  selectedDates: {
    checkIn: Date
    checkOut: Date
  }
  rooms: number
  guests: number
}

export interface SelectedActivity {
  id: string
  name: string
  category: string
  duration: {
    min: number
    max: number
    typical: number
  }
  location: string
  pricing: {
    currency: string
    adult: number
    child?: number
  }
  selectedDate: string
  selectedTimeSlot: string
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
}

export interface SelectedTransportation {
  id: string
  type: 'flight' | 'train' | 'bus' | 'car' | 'other'
  from: string
  to: string
  departureDate: Date
  arrivalDate?: Date
  pricing: {
    currency: string
    total: number
  }
  passengers: number
  bookingReference?: string
}

export interface PricingBreakdown {
  total: {
    amount: number
    currency: string
  }
  breakdown: {
    accommodations: { amount: number; currency: string }
    activities: { amount: number; currency: string }
    transportation: { amount: number; currency: string }
    meals: { amount: number; currency: string }
    miscellaneous: { amount: number; currency: string }
  }
  confidence: number
  timestamp: Date
}

export interface PricingHistory {
  original: PricingBreakdown
  current: PricingBreakdown
  changes: PricingChange[]
}

export interface PricingChange {
  timestamp: Date
  changeType: 'add' | 'remove' | 'modify'
  component: 'accommodation' | 'activity' | 'transportation'
  componentName: string
  priceDifference: {
    amount: number
    currency: string
  }
  newTotal: {
    amount: number
    currency: string
  }
}

// Action types
export enum ActionType {
  // Trip actions
  UPDATE_TRIP_DETAILS = 'UPDATE_TRIP_DETAILS',
  SET_DESTINATION = 'SET_DESTINATION',
  ADD_DESTINATION = 'ADD_DESTINATION',
  REMOVE_DESTINATION = 'REMOVE_DESTINATION',
  SET_DATES = 'SET_DATES',
  SET_TRAVELERS = 'SET_TRAVELERS',
  SET_FLEXIBILITY = 'SET_FLEXIBILITY',
  
  // Component selection actions
  SELECT_ACCOMMODATION = 'SELECT_ACCOMMODATION',
  REMOVE_ACCOMMODATION = 'REMOVE_ACCOMMODATION',
  SELECT_ACTIVITY = 'SELECT_ACTIVITY',
  REMOVE_ACTIVITY = 'REMOVE_ACTIVITY',
  SELECT_TRANSPORTATION = 'SELECT_TRANSPORTATION',
  REMOVE_TRANSPORTATION = 'REMOVE_TRANSPORTATION',
  
  // Pricing actions
  UPDATE_PRICING = 'UPDATE_PRICING',
  SET_PRICING_CALCULATING = 'SET_PRICING_CALCULATING',
  SET_PRICING_ERROR = 'SET_PRICING_ERROR',
  CHANGE_CURRENCY = 'CHANGE_CURRENCY',
  
  // UI actions
  SET_ACTIVE_SECTION = 'SET_ACTIVE_SECTION',
  SET_VIEW_MODE = 'SET_VIEW_MODE',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  SET_DIRTY = 'SET_DIRTY',
  
  // Session actions
  SET_SESSION = 'SET_SESSION',
  SET_ONLINE_STATUS = 'SET_ONLINE_STATUS',
  SET_LAST_SAVED = 'SET_LAST_SAVED',
  
  // History actions
  UNDO = 'UNDO',
  REDO = 'REDO',
  ADD_TO_HISTORY = 'ADD_TO_HISTORY',
  CLEAR_HISTORY = 'CLEAR_HISTORY',
  
  // Backend sync actions
  SAVE_SUCCESS = 'SAVE_SUCCESS',
  SAVE_ERROR = 'SAVE_ERROR',
  LOAD_SUCCESS = 'LOAD_SUCCESS',
  LOAD_ERROR = 'LOAD_ERROR',
  
  // Reset actions
  RESET_STATE = 'RESET_STATE',
  RESET_TRIP = 'RESET_TRIP'
}

// Action interfaces
export interface Action {
  type: ActionType
  payload?: any
  meta?: {
    skipHistory?: boolean
    source?: string
    timestamp?: Date
  }
}

// Helper function to create initial state
export function createInitialState(): TripCustomizationState {
  const initialState: TripCustomizationState = {
    trip: {
      name: '',
      primaryDestination: '',
      additionalDestinations: [],
      duration: 7,
      travelers: {
        adults: 2,
        children: 0,
        infants: 0
      },
      flexibility: {
        datesFlexible: false,
        destinationsFlexible: false,
        durationFlexible: false
      }
    },
    selectedAccommodations: [],
    selectedActivities: [],
    selectedTransportation: [],
    pricing: {
      current: null,
      history: null,
      isCalculating: false,
      currency: 'USD'
    },
    ui: {
      activeSection: null,
      viewMode: 'grid',
      isLoading: false,
      errors: {},
      isDirty: false
    },
    session: {
      sessionId: generateSessionId(),
      autoSaveEnabled: true,
      isOnline: true
    },
    history: {
      past: [],
      present: {} as TripCustomizationState, // Will be set below
      future: [],
      maxHistorySize: 50
    }
  }
  
  // Set the present state to avoid circular reference
  initialState.history.present = initialState
  return initialState
}

// Helper function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// State reducer
export function tripCustomizationReducer(
  state: TripCustomizationState, 
  action: Action
): TripCustomizationState {
  // Handle history actions first
  if (action.type === ActionType.UNDO) {
    const { past, present, future } = state.history
    if (past.length === 0) return state
    
    const previous = past[past.length - 1]
    if (!previous) return state // Type guard
    
    const newPast = past.slice(0, past.length - 1)
    
    return {
      ...previous,
      history: {
        ...state.history,
        past: newPast,
        present: previous,
        future: [present, ...future]
      }
    }
  }
  
  if (action.type === ActionType.REDO) {
    const { past, present, future } = state.history
    if (future.length === 0) return state
    
    const next = future[0]
    if (!next) return state // Type guard
    
    const newFuture = future.slice(1)
    
    return {
      ...next,
      history: {
        ...state.history,
        past: [...past, present],
        present: next,
        future: newFuture
      }
    }
  }
  
  // Create new state
  let newState = { ...state }
  
  switch (action.type) {
    case ActionType.UPDATE_TRIP_DETAILS:
      newState = {
        ...state,
        trip: { ...state.trip, ...action.payload },
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.SET_DESTINATION:
      newState = {
        ...state,
        trip: { ...state.trip, primaryDestination: action.payload },
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.ADD_DESTINATION:
      if (!state.trip.additionalDestinations.includes(action.payload)) {
        newState = {
          ...state,
          trip: {
            ...state.trip,
            additionalDestinations: [...state.trip.additionalDestinations, action.payload]
          },
          ui: { ...state.ui, isDirty: true }
        }
      }
      break
      
    case ActionType.REMOVE_DESTINATION:
      newState = {
        ...state,
        trip: {
          ...state.trip,
          additionalDestinations: state.trip.additionalDestinations.filter(dest => dest !== action.payload)
        },
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.SET_DATES:
      newState = {
        ...state,
        trip: { ...state.trip, ...action.payload },
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.SET_TRAVELERS:
      newState = {
        ...state,
        trip: { ...state.trip, travelers: { ...state.trip.travelers, ...action.payload } },
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.SELECT_ACCOMMODATION:
      newState = {
        ...state,
        selectedAccommodations: [...state.selectedAccommodations, action.payload],
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.REMOVE_ACCOMMODATION:
      newState = {
        ...state,
        selectedAccommodations: state.selectedAccommodations.filter(acc => acc.id !== action.payload),
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.SELECT_ACTIVITY:
      newState = {
        ...state,
        selectedActivities: [...state.selectedActivities, action.payload],
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.REMOVE_ACTIVITY:
      newState = {
        ...state,
        selectedActivities: state.selectedActivities.filter(act => act.id !== action.payload),
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.UPDATE_PRICING:
      newState = {
        ...state,
        pricing: {
          ...state.pricing,
          current: action.payload,
          isCalculating: false,
          lastUpdated: new Date()
        }
      }
      break
      
    case ActionType.SET_PRICING_CALCULATING:
      newState = {
        ...state,
        pricing: { ...state.pricing, isCalculating: action.payload }
      }
      break
      
    case ActionType.CHANGE_CURRENCY:
      newState = {
        ...state,
        pricing: { ...state.pricing, currency: action.payload },
        ui: { ...state.ui, isDirty: true }
      }
      break
      
    case ActionType.SET_ACTIVE_SECTION:
      newState = {
        ...state,
        ui: { ...state.ui, activeSection: action.payload }
      }
      break
      
    case ActionType.SET_VIEW_MODE:
      newState = {
        ...state,
        ui: { ...state.ui, viewMode: action.payload }
      }
      break
      
    case ActionType.SET_LOADING:
      newState = {
        ...state,
        ui: { ...state.ui, isLoading: action.payload }
      }
      break
      
    case ActionType.SET_ERROR:
      newState = {
        ...state,
        ui: {
          ...state.ui,
          errors: { ...state.ui.errors, [action.payload.field]: action.payload.message }
        }
      }
      break
      
    case ActionType.CLEAR_ERROR:
      const { [action.payload]: _, ...remainingErrors } = state.ui.errors
      newState = {
        ...state,
        ui: { ...state.ui, errors: remainingErrors }
      }
      break
      
    case ActionType.SET_SESSION:
      newState = {
        ...state,
        session: { ...state.session, ...action.payload }
      }
      break
      
    case ActionType.SET_ONLINE_STATUS:
      newState = {
        ...state,
        session: { ...state.session, isOnline: action.payload }
      }
      break
      
    case ActionType.SET_LAST_SAVED:
      newState = {
        ...state,
        session: { ...state.session, lastSaved: action.payload },
        ui: { ...state.ui, isDirty: false }
      }
      break
      
    case ActionType.SAVE_SUCCESS:
      newState = {
        ...state,
        trip: { ...state.trip, id: action.payload.id },
        session: { ...state.session, lastSaved: new Date() },
        ui: { ...state.ui, isDirty: false, isLoading: false }
      }
      break
      
    case ActionType.SAVE_ERROR:
      newState = {
        ...state,
        ui: {
          ...state.ui,
          isLoading: false,
          errors: { ...state.ui.errors, save: action.payload }
        }
      }
      break
      
    case ActionType.LOAD_SUCCESS:
      newState = {
        ...action.payload,
        ui: { ...state.ui, isLoading: false, isDirty: false },
        session: { ...state.session, lastSaved: new Date() }
      }
      break
      
    case ActionType.RESET_STATE:
      newState = createInitialState()
      break
      
    default:
      return state
  }
  
  // Add to history if not explicitly skipped and not undo/redo actions
  const isHistoryAction = (action as Action).type === ActionType.UNDO || (action as Action).type === ActionType.REDO
  if (!action.meta?.skipHistory && !isHistoryAction) {
    const { past, present, future, maxHistorySize } = state.history
    const newPast = [...past, present].slice(-maxHistorySize)
    
    newState = {
      ...newState,
      history: {
        past: newPast,
        present: newState,
        future: [],
        maxHistorySize
      }
    }
  }
  
  return newState
} 