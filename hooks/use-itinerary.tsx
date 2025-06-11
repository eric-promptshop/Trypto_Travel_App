"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// Types for itinerary management
export interface ItineraryActivity {
  id: string
  type: 'activity' | 'accommodation' | 'transportation'
  time: string
  title: string
  description?: string
  location: string
  duration: string
  cost: number
  rating?: number
  bookingRequired?: boolean
  contactInfo?: {
    phone?: string
    website?: string
    address?: string
  }
  tips?: string[]
  image?: string
}

export interface ItineraryDay {
  day: number
  date: string
  activities: ItineraryActivity[]
  accommodations: ItineraryActivity[]
  transportation: ItineraryActivity[]
  totalCost?: number
  highlights?: string[]
}

export interface Itinerary {
  id: string
  tripId: string
  title: string
  destination: string
  startDate: string
  endDate: string
  totalDays: number
  travelers: number
  totalBudget?: number
  spentBudget?: number
  totalPrice?: number
  currency: string
  days: ItineraryDay[]
  description?: string
  coverImage?: string
  status: 'draft' | 'confirmed' | 'completed'
  lastUpdated: string
}

export interface CreateActivityData {
  type: ItineraryActivity['type']
  time: string
  title: string
  description?: string
  location: string
  duration: string
  cost: number
  rating?: number
  bookingRequired?: boolean
  contactInfo?: ItineraryActivity['contactInfo']
  tips?: string[]
  image?: string
}

export interface UpdateActivityData extends Partial<CreateActivityData> {
  id: string
}

// Custom hook for itinerary management
export function useItinerary(tripId: string | null) {
  const { data: session } = useSession()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch itinerary
  const fetchItinerary = useCallback(async () => {
    if (!session?.user || !tripId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
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
      setItinerary(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch itinerary'
      setError(errorMessage)
      console.error('Error fetching itinerary:', err)
    } finally {
      setLoading(false)
    }
  }, [session, tripId])

  // Update entire itinerary
  const updateItinerary = useCallback(async (updates: Partial<Itinerary>): Promise<Itinerary | null> => {
    if (!session?.user || !tripId) {
      setError('Authentication required or trip ID missing')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
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
      const updatedItinerary = result.data
      setItinerary(updatedItinerary)
      
      return updatedItinerary
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update itinerary'
      setError(errorMessage)
      console.error('Error updating itinerary:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [session, tripId])

  // Add activity to specific day
  const addActivity = useCallback(async (dayNumber: number, activityData: CreateActivityData): Promise<boolean> => {
    if (!session?.user || !tripId) {
      setError('Authentication required or trip ID missing')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day: dayNumber,
          ...activityData
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setItinerary(result.data)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add activity'
      setError(errorMessage)
      console.error('Error adding activity:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [session, tripId])

  // Update activity
  const updateActivity = useCallback(async (activityId: string, updates: Partial<CreateActivityData>): Promise<boolean> => {
    if (!session?.user || !tripId) {
      setError('Authentication required or trip ID missing')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/activities/${activityId}`, {
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
      setItinerary(result.data)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity'
      setError(errorMessage)
      console.error('Error updating activity:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [session, tripId])

  // Delete activity
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    if (!session?.user || !tripId) {
      setError('Authentication required or trip ID missing')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setItinerary(result.data)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity'
      setError(errorMessage)
      console.error('Error deleting activity:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [session, tripId])

  // Reorder activities within a day
  const reorderActivities = useCallback((dayNumber: number, newOrder: ItineraryActivity[]) => {
    if (!itinerary) return

    const updatedDays = itinerary.days.map(day => {
      if (day.day === dayNumber) {
        return {
          ...day,
          activities: newOrder
        }
      }
      return day
    })

    setItinerary(prev => prev ? {
      ...prev,
      days: updatedDays
    } : null)
  }, [itinerary])

  // Get activities for a specific day
  const getDayActivities = useCallback((dayNumber: number): ItineraryActivity[] => {
    if (!itinerary) return []
    
    const day = itinerary.days.find(d => d.day === dayNumber)
    return day ? [
      ...day.activities,
      ...day.accommodations,
      ...day.transportation
    ].sort((a, b) => a.time.localeCompare(b.time)) : []
  }, [itinerary])

  // Calculate total cost for the itinerary
  const calculateTotalCost = useCallback((): number => {
    if (!itinerary) return 0
    
    return itinerary.days.reduce((total, day) => {
      const dayTotal = [
        ...day.activities,
        ...day.accommodations,
        ...day.transportation
      ].reduce((daySum, activity) => daySum + activity.cost, 0)
      
      return total + dayTotal
    }, 0)
  }, [itinerary])

  // Export itinerary data
  const exportItinerary = useCallback(async (format: 'json' | 'pdf' = 'json') => {
    if (!session?.user || !tripId) {
      setError('Authentication required or trip ID missing')
      return null
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (format === 'pdf') {
        // Handle PDF download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `itinerary-${tripId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        return true
      } else {
        // Return JSON data
        return await response.json()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export itinerary'
      setError(errorMessage)
      console.error('Error exporting itinerary:', err)
      return null
    }
  }, [session, tripId])

  // Share itinerary
  const shareItinerary = useCallback(async (options: { isPublic: boolean; expiresIn?: number }) => {
    if (!session?.user || !tripId) {
      setError('Authentication required or trip ID missing')
      return null
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share itinerary'
      setError(errorMessage)
      console.error('Error sharing itinerary:', err)
      return null
    }
  }, [session, tripId])

  // Refresh itinerary data
  const refresh = useCallback(() => {
    fetchItinerary()
  }, [fetchItinerary])

  // Load itinerary on mount and when tripId changes
  useEffect(() => {
    if (session?.user && tripId) {
      fetchItinerary()
    }
  }, [session?.user, tripId])

  return {
    itinerary,
    loading,
    error,
    updateItinerary,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    getDayActivities,
    calculateTotalCost,
    exportItinerary,
    shareItinerary,
    refresh
  }
}

// Utility functions for itinerary management
export const itineraryUtils = {
  // Create a blank itinerary structure
  createBlankItinerary: (tripData: {
    tripId: string
    title: string
    destination: string
    startDate: string
    endDate: string
    travelers: number
  }): Partial<Itinerary> => {
    const start = new Date(tripData.startDate)
    const end = new Date(tripData.endDate)
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const days: ItineraryDay[] = Array.from({ length: numberOfDays }, (_, index) => {
      const dayDate = new Date(start)
      dayDate.setDate(dayDate.getDate() + index)
      
      return {
        day: index + 1,
        date: dayDate.toISOString().split('T')[0] || '',
        activities: [],
        accommodations: [],
        transportation: [],
        totalCost: 0,
        highlights: []
      }
    })

    return {
      tripId: tripData.tripId,
      title: tripData.title,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      totalDays: numberOfDays,
      travelers: tripData.travelers,
      totalBudget: 0,
      spentBudget: 0,
      totalPrice: 0,
      currency: 'USD',
      days,
      status: 'draft',
      lastUpdated: new Date().toISOString()
    }
  },

  // Convert form data to trip creation format
  convertFormDataToTrip: (formData: any) => {
    return {
      title: formData.destinations?.[0] ? `Trip to ${formData.destinations[0]}` : 'New Trip',
      description: formData.specialRequirements || '',
      startDate: formData.travelDates?.startDate || new Date().toISOString(),
      endDate: formData.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: formData.destinations?.[0] || 'Unknown',
      participants: []
    }
  },

  // Format currency
  formatCurrency: (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  },

  // Calculate trip duration
  calculateDuration: (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }
} 