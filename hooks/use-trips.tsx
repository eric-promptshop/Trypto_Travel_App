"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// Types for trip management
export interface Trip {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  location: string
  participants?: string[]
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  userId: string
  travelers?: number
  totalPrice?: number
  currency?: string
  days?: any[]
}

export interface TripFilters {
  page?: number
  limit?: number
  status?: Trip['status']
  location?: string
  startDate?: string
  endDate?: string
}

export interface CreateTripData {
  title: string
  description?: string
  startDate: string
  endDate: string
  location: string
  participants?: string[]
  itinerary?: any
}

export interface UpdateTripData extends Partial<CreateTripData> {
  status?: Trip['status']
}

export interface TripListResponse {
  data: Trip[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Custom hook for trip management
export function useTrips(filters: TripFilters = {}) {
  const { data: session } = useSession()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<TripListResponse['meta'] | null>(null)

  // Build query string from filters
  const buildQueryString = useCallback((filters: TripFilters) => {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status) params.append('status', filters.status)
    if (filters.location) params.append('location', filters.location)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    return params.toString()
  }, [])

  // Fetch trips
  const fetchTrips = useCallback(async (requestFilters?: TripFilters) => {
    if (!session?.user) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = buildQueryString(requestFilters || filters)
      const url = `/api/trips${queryParams ? `?${queryParams}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: TripListResponse = await response.json()
      setTrips(result.data || [])
      setMeta(result.meta || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trips'
      setError(errorMessage)
      console.error('Error fetching trips:', err)
    } finally {
      setLoading(false)
    }
  }, [session, buildQueryString, filters])

  // Create new trip
  const createTrip = useCallback(async (tripData: CreateTripData): Promise<Trip | null> => {
    if (!session?.user) {
      setError('Authentication required')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const newTrip = result.data

      // Add to local state
      setTrips(prev => [newTrip, ...prev])
      
      return newTrip
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trip'
      setError(errorMessage)
      console.error('Error creating trip:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [session])

  // Update trip
  const updateTrip = useCallback(async (tripId: string, updates: UpdateTripData): Promise<Trip | null> => {
    if (!session?.user) {
      setError('Authentication required')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedTrip = result.data

      // Update in local state
      setTrips(prev => prev.map(trip => 
        trip.id === tripId ? updatedTrip : trip
      ))
      
      return updatedTrip
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trip'
      setError(errorMessage)
      console.error('Error updating trip:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [session])

  // Delete trip
  const deleteTrip = useCallback(async (tripId: string): Promise<boolean> => {
    if (!session?.user) {
      setError('Authentication required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Remove from local state
      setTrips(prev => prev.filter(trip => trip.id !== tripId))
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete trip'
      setError(errorMessage)
      console.error('Error deleting trip:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [session])

  // Refresh trips data
  const refresh = useCallback(() => {
    fetchTrips()
  }, [fetchTrips])

  // Load trips on mount and when filters change
  useEffect(() => {
    if (session?.user) {
      fetchTrips()
    }
  }, [session?.user, JSON.stringify(filters)])

  return {
    trips,
    loading,
    error,
    meta,
    createTrip,
    updateTrip,
    deleteTrip,
    refresh,
    fetchTrips
  }
}

// Hook for single trip management
export function useTrip(tripId: string | null) {
  const { data: session } = useSession()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch single trip
  const fetchTrip = useCallback(async () => {
    if (!session?.user || !tripId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setTrip(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trip'
      setError(errorMessage)
      console.error('Error fetching trip:', err)
    } finally {
      setLoading(false)
    }
  }, [session, tripId])

  // Load trip on mount and when tripId changes
  useEffect(() => {
    if (session?.user && tripId) {
      fetchTrip()
    }
  }, [session?.user, tripId])

  return {
    trip,
    loading,
    error,
    refresh: fetchTrip
  }
} 