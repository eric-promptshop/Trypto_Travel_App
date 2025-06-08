import { Trip, CreateTripData, UpdateTripData, TripFilters, TripListResponse } from '@/hooks/use-trips'
import { Itinerary, CreateActivityData } from '@/hooks/use-itinerary'

// Base API client configuration
const API_BASE_URL = '/api/v1'

// Error handling utility
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    )
  }
}

// Trip management API
export const tripsAPI = {
  // List trips with optional filtering and pagination
  async getTrips(filters: TripFilters = {}): Promise<TripListResponse> {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status) params.append('status', filters.status)
    if (filters.location) params.append('location', filters.location)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const endpoint = `/trips${queryString ? `?${queryString}` : ''}`
    
    return apiRequest<TripListResponse>(endpoint)
  },

  // Get a single trip by ID
  async getTrip(tripId: string): Promise<{ data: Trip }> {
    return apiRequest<{ data: Trip }>(`/trips/${tripId}`)
  },

  // Create a new trip
  async createTrip(tripData: CreateTripData): Promise<{ data: Trip }> {
    return apiRequest<{ data: Trip }>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData)
    })
  },

  // Update an existing trip
  async updateTrip(tripId: string, updates: UpdateTripData): Promise<{ data: Trip }> {
    return apiRequest<{ data: Trip }>(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Delete a trip
  async deleteTrip(tripId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/trips/${tripId}`, {
      method: 'DELETE'
    })
  },

  // Get trip statistics
  async getTripStats(userId?: string): Promise<{
    total: number
    byStatus: Record<string, number>
  }> {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    
    const queryString = params.toString()
    const endpoint = `/trips/stats${queryString ? `?${queryString}` : ''}`
    
    return apiRequest<{
      total: number
      byStatus: Record<string, number>
    }>(endpoint)
  },

  // Get upcoming trips
  async getUpcomingTrips(userId?: string, limit = 5): Promise<{ data: Trip[] }> {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    params.append('limit', limit.toString())
    
    const queryString = params.toString()
    const endpoint = `/trips/upcoming${queryString ? `?${queryString}` : ''}`
    
    return apiRequest<{ data: Trip[] }>(endpoint)
  }
}

// Itinerary management API
export const itineraryAPI = {
  // Get itinerary for a trip
  async getItinerary(tripId: string): Promise<{ data: Itinerary }> {
    return apiRequest<{ data: Itinerary }>(`/trips/${tripId}/itinerary`)
  },

  // Update entire itinerary
  async updateItinerary(tripId: string, updates: Partial<Itinerary>): Promise<{ data: Itinerary }> {
    return apiRequest<{ data: Itinerary }>(`/trips/${tripId}/itinerary`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Add activity to itinerary
  async addActivity(
    tripId: string, 
    dayNumber: number, 
    activityData: CreateActivityData
  ): Promise<{ data: Itinerary }> {
    return apiRequest<{ data: Itinerary }>(`/trips/${tripId}/itinerary/activities`, {
      method: 'POST',
      body: JSON.stringify({
        day: dayNumber,
        ...activityData
      })
    })
  },

  // Update activity in itinerary
  async updateActivity(
    tripId: string,
    activityId: string,
    updates: Partial<CreateActivityData>
  ): Promise<{ data: Itinerary }> {
    return apiRequest<{ data: Itinerary }>(`/trips/${tripId}/itinerary/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Delete activity from itinerary
  async deleteActivity(tripId: string, activityId: string): Promise<{ data: Itinerary }> {
    return apiRequest<{ data: Itinerary }>(`/trips/${tripId}/itinerary/activities/${activityId}`, {
      method: 'DELETE'
    })
  },

  // Export itinerary
  async exportItinerary(tripId: string, format: 'json' | 'pdf' = 'json'): Promise<any> {
    const endpoint = `/trips/${tripId}/itinerary/export?format=${format}`
    
    if (format === 'pdf') {
      // For PDF downloads, we need to handle the blob response differently
      const url = `${API_BASE_URL}${endpoint}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new APIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }
      
      return response.blob()
    } else {
      return apiRequest<any>(endpoint)
    }
  },

  // Share itinerary
  async shareItinerary(
    tripId: string, 
    options: { isPublic: boolean; expiresIn?: number }
  ): Promise<{ shareUrl: string; expiresAt?: string }> {
    return apiRequest<{ shareUrl: string; expiresAt?: string }>(`/trips/${tripId}/itinerary/share`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  },

  // Get suggested activities for a destination
  async getSuggestedActivities(
    tripId: string,
    destination: string,
    day?: number
  ): Promise<{ data: CreateActivityData[] }> {
    const params = new URLSearchParams()
    params.append('destination', destination)
    if (day !== undefined) params.append('day', day.toString())
    
    const queryString = params.toString()
    const endpoint = `/trips/${tripId}/itinerary/suggestions?${queryString}`
    
    return apiRequest<{ data: CreateActivityData[] }>(endpoint)
  },

  // Clone itinerary from another trip
  async cloneItinerary(
    sourceItineraryId: string,
    targetTripId: string
  ): Promise<{ data: Itinerary }> {
    return apiRequest<{ data: Itinerary }>(`/trips/${targetTripId}/itinerary/clone`, {
      method: 'POST',
      body: JSON.stringify({ sourceItineraryId })
    })
  }
}

// Content and pricing API
export const contentAPI = {
  // Get content suggestions based on location and interests
  async getContentSuggestions(
    location: string,
    interests?: string[],
    type?: 'activity' | 'accommodation' | 'restaurant'
  ): Promise<{ data: any[] }> {
    const params = new URLSearchParams()
    params.append('location', location)
    if (interests?.length) params.append('interests', interests.join(','))
    if (type) params.append('type', type)
    
    const queryString = params.toString()
    const endpoint = `/content/suggestions?${queryString}`
    
    return apiRequest<{ data: any[] }>(endpoint)
  },

  // Get pricing estimates for activities
  async getPricingEstimates(
    location: string,
    activities: string[]
  ): Promise<{ data: Record<string, number> }> {
    return apiRequest<{ data: Record<string, number> }>('/content/pricing', {
      method: 'POST',
      body: JSON.stringify({ location, activities })
    })
  }
}

// Utility functions for API client
export const apiUtils = {
  // Check if error is API error
  isAPIError: (error: any): error is APIError => {
    return error instanceof APIError
  },

  // Get error message from any error type
  getErrorMessage: (error: any): string => {
    if (error instanceof APIError) {
      return error.message
    }
    if (error instanceof Error) {
      return error.message
    }
    return 'An unexpected error occurred'
  },

  // Retry wrapper for API calls
  async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
        }
      }
    }
    
    throw lastError!
  },

  // Format API response for consistent error handling
  formatResponse: <T>(response: any): T => {
    if (response.success === false) {
      throw new APIError(response.message || 'API request failed', 0, response)
    }
    
    return response.data ? response.data : response
  }
}

// Export the main API client
export const apiClient = {
  trips: tripsAPI,
  itinerary: itineraryAPI,
  content: contentAPI,
  utils: apiUtils
} 