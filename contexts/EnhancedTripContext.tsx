"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Accommodation, RoomType } from '@/components/lodging-view'
import { Flight, FlightSearch } from '@/components/flights-view'
import { Traveler, TripGroup } from '@/components/travelers-view'
import { TripCost } from '@/components/trip-cost-view'
import { Itinerary } from '@/components/itinerary/ModernItineraryViewer'

// Define the enhanced trip state
interface EnhancedTripState {
  trip: any // Basic trip info from existing API
  itinerary: Itinerary | null
  accommodations: {
    searchResults: Accommodation[]
    searchCriteria: any
    lastUpdated: string
  }
  flights: {
    searchResults: FlightSearch | null
    searchCriteria: any
    lastUpdated: string
  }
  travelers: TripGroup | null
  costs: TripCost | null
  loading: Record<string, boolean>
  errors: Record<string, Error | null>
}

// Define the context actions
interface EnhancedTripActions {
  // Accommodation actions
  searchAccommodations: (criteria: any) => Promise<void>
  bookAccommodation: (accommodationId: string, roomId: string) => Promise<void>
  updateAccommodationSearch: (criteria: any) => Promise<void>
  
  // Flight actions
  searchFlights: (criteria: any) => Promise<void>
  bookFlight: (flightId: string) => Promise<void>
  updateFlightSearch: (criteria: any) => Promise<void>
  
  // Traveler actions
  addTraveler: (traveler: Partial<Traveler>) => Promise<void>
  updateTraveler: (travelerId: string, updates: Partial<Traveler>) => Promise<void>
  removeTraveler: (travelerId: string) => Promise<void>
  
  // Budget actions
  updateBudget: (category: string, amount: number) => Promise<void>
  refreshCosts: () => Promise<void>
  
  // General actions
  refreshTrip: () => Promise<void>
}

// Create the context
const EnhancedTripContext = createContext<{
  state: EnhancedTripState
  actions: EnhancedTripActions
} | null>(null)

// Custom hook to use the context
export function useEnhancedTrip() {
  const context = useContext(EnhancedTripContext)
  if (!context) {
    throw new Error('useEnhancedTrip must be used within EnhancedTripProvider')
  }
  return context
}

// Provider component
export function EnhancedTripProvider({ 
  children, 
  tripId 
}: { 
  children: React.ReactNode
  tripId: string 
}) {
  const { data: session } = useSession()
  
  // Initialize state
  const [state, setState] = useState<EnhancedTripState>({
    trip: null,
    itinerary: null,
    accommodations: {
      searchResults: [],
      searchCriteria: {},
      lastUpdated: new Date().toISOString()
    },
    flights: {
      searchResults: null,
      searchCriteria: {},
      lastUpdated: new Date().toISOString()
    },
    travelers: null,
    costs: null,
    loading: {},
    errors: {}
  })

  // Helper to set loading state
  const setLoading = (key: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }))
  }

  // Helper to set error state
  const setError = (key: string, error: Error | null) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [key]: error }
    }))
  }

  // Fetch basic trip data
  const fetchTrip = useCallback(async () => {
    if (!tripId) return
    
    setLoading('trip', true)
    setError('trip', null)
    
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trip: ${response.statusText}`)
      }
      
      const data = await response.json()
      setState(prev => ({ ...prev, trip: data }))
    } catch (error) {
      console.error('Error fetching trip:', error)
      setError('trip', error as Error)
    } finally {
      setLoading('trip', false)
    }
  }, [tripId])

  // Fetch itinerary data
  const fetchItinerary = useCallback(async () => {
    if (!tripId) return
    
    setLoading('itinerary', true)
    setError('itinerary', null)
    
    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch itinerary: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Transform API response to match Itinerary interface
      const transformedItinerary: Itinerary = {
        id: data.id || tripId,
        title: data.trip?.title || 'My Trip',
        destination: data.trip?.location || 'Unknown',
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || new Date().toISOString(),
        totalDays: data.days?.length || 0,
        travelers: data.travelers || 1,
        totalBudget: data.totalPrice || 0,
        spentBudget: 0, // Calculate from actual bookings
        days: data.days || [],
        description: data.trip?.description || '',
        coverImage: '/images/placeholder.jpg',
        status: 'draft',
        lastUpdated: data.updatedAt || new Date().toISOString()
      }
      
      setState(prev => ({ ...prev, itinerary: transformedItinerary }))
    } catch (error) {
      console.error('Error fetching itinerary:', error)
      setError('itinerary', error as Error)
    } finally {
      setLoading('itinerary', false)
    }
  }, [tripId])

  // Search accommodations using AI pricing insights
  const searchAccommodations = useCallback(async (criteria: any) => {
    setLoading('accommodations', true)
    setError('accommodations', null)
    
    try {
      // For now, use mock data as the API doesn't have accommodation search yet
      // In production, this would call a real accommodation search API
      
      // Update search criteria
      setState(prev => ({
        ...prev,
        accommodations: {
          ...prev.accommodations,
          searchCriteria: criteria,
          lastUpdated: new Date().toISOString()
        }
      }))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock search results (would come from API)
      const mockResults: Accommodation[] = [
        {
          id: 'acc1',
          name: 'Hotel Example',
          type: 'hotel',
          rating: 4.5,
          reviewCount: 230,
          address: {
            street: '123 Main St',
            city: criteria.destination || 'City',
            country: 'Country',
            postalCode: '12345',
            coordinates: { lat: 0, lng: 0 }
          },
          description: 'A wonderful hotel in the heart of the city',
          images: ['/images/hotel-placeholder.jpg'],
          amenities: [
            { name: 'Free WiFi', icon: null, available: true },
            { name: 'Pool', icon: null, available: true },
            { name: 'Gym', icon: null, available: false }
          ],
          roomTypes: [
            {
              id: 'room1',
              name: 'Standard Room',
              description: 'Comfortable room with city view',
              capacity: 2,
              bedType: '1 Queen Bed',
              size: '25 m²',
              price: { amount: 150, currency: 'USD', period: 'night' },
              amenities: ['Air Conditioning', 'Mini Bar'],
              availability: 5,
              images: []
            }
          ],
          policies: {
            checkIn: '15:00',
            checkOut: '11:00',
            cancellation: 'Free cancellation up to 24 hours',
            pets: false,
            smoking: false,
            children: true
          },
          location: {
            distanceToCenter: '0.5 km',
            distanceToAirport: '15 km',
            nearbyAttractions: ['Museum', 'Park', 'Shopping Center'],
            transportation: ['Metro', 'Bus']
          },
          status: 'available'
        }
      ]
      
      setState(prev => ({
        ...prev,
        accommodations: {
          ...prev.accommodations,
          searchResults: mockResults
        }
      }))
    } catch (error) {
      console.error('Error searching accommodations:', error)
      setError('accommodations', error as Error)
    } finally {
      setLoading('accommodations', false)
    }
  }, [])

  // Book accommodation
  const bookAccommodation = useCallback(async (accommodationId: string, roomId: string) => {
    setLoading('bookAccommodation', true)
    setError('bookAccommodation', null)
    
    try {
      // Add to itinerary as an activity
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dayIndex: 0, // First day by default
          activity: {
            time: '14:00',
            title: 'Hotel Check-in',
            description: 'Check into your accommodation',
            location: 'Hotel',
            type: 'accommodation',
            duration: 'Overnight',
            cost: 150,
            metadata: {
              accommodationId,
              roomId,
              bookingStatus: 'confirmed'
            }
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to book accommodation')
      }
      
      // Refresh itinerary to show the booking
      await fetchItinerary()
      
      // Update accommodation status
      setState(prev => ({
        ...prev,
        accommodations: {
          ...prev.accommodations,
          searchResults: prev.accommodations.searchResults.map(acc =>
            acc.id === accommodationId
              ? { ...acc, status: 'booked' as const }
              : acc
          )
        }
      }))
    } catch (error) {
      console.error('Error booking accommodation:', error)
      setError('bookAccommodation', error as Error)
      throw error
    } finally {
      setLoading('bookAccommodation', false)
    }
  }, [tripId, fetchItinerary])

  // Search flights
  const searchFlights = useCallback(async (criteria: any) => {
    setLoading('flights', true)
    setError('flights', null)
    
    try {
      // Mock flight search (would be real API in production)
      setState(prev => ({
        ...prev,
        flights: {
          searchCriteria: criteria,
          searchResults: {
            outbound: [
              {
                id: 'flight1',
                airline: 'Example Airlines',
                flightNumber: 'EX123',
                aircraft: 'Boeing 737',
                departure: {
                  airport: 'Airport A',
                  airportCode: 'AAA',
                  city: criteria.from || 'City A',
                  time: '10:00',
                  date: criteria.departDate || new Date().toISOString()
                },
                arrival: {
                  airport: 'Airport B',
                  airportCode: 'BBB',
                  city: criteria.to || 'City B',
                  time: '14:00',
                  date: criteria.departDate || new Date().toISOString()
                },
                duration: '4h',
                stops: 0,
                price: {
                  amount: 300,
                  currency: 'USD',
                  class: 'economy' as const
                },
                baggage: {
                  carryOn: '1x 7kg',
                  checked: '1x 23kg'
                },
                amenities: ['WiFi', 'Meals'],
                status: 'available' as const,
                cancellationPolicy: 'Free cancellation'
              }
            ],
            return: [],
            searchCriteria: criteria,
            lastUpdated: new Date().toISOString()
          },
          lastUpdated: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error('Error searching flights:', error)
      setError('flights', error as Error)
    } finally {
      setLoading('flights', false)
    }
  }, [])

  // Book flight
  const bookFlight = useCallback(async (flightId: string) => {
    setLoading('bookFlight', true)
    setError('bookFlight', null)
    
    try {
      // Add flight to itinerary
      const flight = state.flights.searchResults?.outbound.find(f => f.id === flightId)
      if (!flight) throw new Error('Flight not found')
      
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dayIndex: 0,
          activity: {
            time: flight.departure.time,
            title: `Flight ${flight.flightNumber}`,
            description: `${flight.departure.city} to ${flight.arrival.city}`,
            location: flight.departure.airport,
            type: 'transport',
            duration: flight.duration,
            cost: flight.price.amount,
            metadata: {
              flightId,
              bookingStatus: 'confirmed'
            }
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to book flight')
      }
      
      await fetchItinerary()
    } catch (error) {
      console.error('Error booking flight:', error)
      setError('bookFlight', error as Error)
      throw error
    } finally {
      setLoading('bookFlight', false)
    }
  }, [tripId, state.flights.searchResults, fetchItinerary])

  // Fetch travelers
  const fetchTravelers = useCallback(async () => {
    setLoading('travelers', true)
    setError('travelers', null)
    
    try {
      // For now, use mock data
      const mockTravelers: TripGroup = {
        travelers: [
          {
            id: '1',
            name: session?.user?.name || 'Main Traveler',
            email: session?.user?.email || 'traveler@example.com',
            role: 'organizer' as const,
            preferences: {
              dietaryRestrictions: [],
              accessibility: [],
              interests: [],
              budgetRange: '$1000-2000',
              accommodationPreference: 'Hotel'
            },
            documents: {
              passport: {
                number: '',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                isValid: true
              }
            },
            emergencyContact: {
              name: '',
              phone: '',
              relationship: ''
            },
            status: 'confirmed' as const
          }
        ],
        groupPreferences: {
          sharedInterests: [],
          consensusBudget: '$1000-2000',
          groupDynamics: 'Flexible'
        }
      }
      
      setState(prev => ({ ...prev, travelers: mockTravelers }))
    } catch (error) {
      console.error('Error fetching travelers:', error)
      setError('travelers', error as Error)
    } finally {
      setLoading('travelers', false)
    }
  }, [session])

  // Add traveler
  const addTraveler = useCallback(async (traveler: Partial<Traveler>) => {
    setLoading('addTraveler', true)
    setError('addTraveler', null)
    
    try {
      // In production, this would call API
      const newTraveler: Traveler = {
        id: Date.now().toString(),
        name: traveler.name || 'New Traveler',
        email: traveler.email || '',
        role: 'traveler' as const,
        preferences: traveler.preferences || {
          dietaryRestrictions: [],
          accessibility: [],
          interests: [],
          budgetRange: '',
          accommodationPreference: ''
        },
        documents: traveler.documents || {
          passport: {
            number: '',
            expiryDate: '',
            isValid: false
          }
        },
        emergencyContact: traveler.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        status: 'pending' as const
      }
      
      setState(prev => ({
        ...prev,
        travelers: prev.travelers ? {
          ...prev.travelers,
          travelers: [...prev.travelers.travelers, newTraveler]
        } : null
      }))
    } catch (error) {
      console.error('Error adding traveler:', error)
      setError('addTraveler', error as Error)
      throw error
    } finally {
      setLoading('addTraveler', false)
    }
  }, [])

  // Update traveler
  const updateTraveler = useCallback(async (travelerId: string, updates: Partial<Traveler>) => {
    setState(prev => ({
      ...prev,
      travelers: prev.travelers ? {
        ...prev.travelers,
        travelers: prev.travelers.travelers.map(t =>
          t.id === travelerId ? { ...t, ...updates } : t
        )
      } : null
    }))
  }, [])

  // Remove traveler
  const removeTraveler = useCallback(async (travelerId: string) => {
    setState(prev => ({
      ...prev,
      travelers: prev.travelers ? {
        ...prev.travelers,
        travelers: prev.travelers.travelers.filter(t => t.id !== travelerId)
      } : null
    }))
  }, [])

  // Fetch costs using pricing insights API
  const fetchCosts = useCallback(async () => {
    setLoading('costs', true)
    setError('costs', null)
    
    try {
      // Try to get pricing insights from AI
      const response = await fetch('/api/trips-ai/pricing-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          destination: state.trip?.location || 'Unknown',
          duration: state.itinerary?.totalDays || 7,
          travelers: state.itinerary?.travelers || 1,
          preferences: {
            budget: state.trip?.budget || [1000, 2000],
            interests: state.trip?.interests || []
          }
        })
      })
      
      if (response.ok) {
        const insights = await response.json()
        
        // Transform insights to TripCost format
        const tripCost: TripCost = {
          totalBudget: state.trip?.budget?.[1] || 2000,
          totalSpent: 0, // Calculate from actual bookings
          currency: 'USD',
          breakdown: [
            {
              category: 'Accommodation',
              budgeted: insights.accommodation?.average || 500,
              actual: 0,
              currency: 'USD',
              percentage: 40
            },
            {
              category: 'Transportation',
              budgeted: insights.transportation?.average || 300,
              actual: 0,
              currency: 'USD',
              percentage: 25
            },
            {
              category: 'Activities',
              budgeted: insights.activities?.average || 200,
              actual: 0,
              currency: 'USD',
              percentage: 20
            },
            {
              category: 'Food',
              budgeted: insights.food?.average || 150,
              actual: 0,
              currency: 'USD',
              percentage: 15
            }
          ],
          savingsOpportunities: insights.tips?.map((tip: string) => ({
            category: 'General',
            potentialSavings: 50,
            recommendation: tip
          })) || []
        }
        
        setState(prev => ({ ...prev, costs: tripCost }))
      }
    } catch (error) {
      console.error('Error fetching costs:', error)
      setError('costs', error as Error)
      
      // Fallback to basic cost structure
      const fallbackCost: TripCost = {
        totalBudget: state.trip?.budget?.[1] || 2000,
        totalSpent: 0,
        currency: 'USD',
        breakdown: [
          { category: 'Accommodation', budgeted: 800, actual: 0, currency: 'USD', percentage: 40 },
          { category: 'Transportation', budgeted: 500, actual: 0, currency: 'USD', percentage: 25 },
          { category: 'Activities', budgeted: 400, actual: 0, currency: 'USD', percentage: 20 },
          { category: 'Food', budgeted: 300, actual: 0, currency: 'USD', percentage: 15 }
        ],
        savingsOpportunities: []
      }
      setState(prev => ({ ...prev, costs: fallbackCost }))
    } finally {
      setLoading('costs', false)
    }
  }, [state.trip, state.itinerary])

  // Update budget
  const updateBudget = useCallback(async (category: string, amount: number) => {
    setState(prev => ({
      ...prev,
      costs: prev.costs ? {
        ...prev.costs,
        breakdown: prev.costs.breakdown.map(item =>
          item.category === category
            ? { ...item, budgeted: amount }
            : item
        )
      } : null
    }))
  }, [])

  // Update accommodation search
  const updateAccommodationSearch = useCallback(async (criteria: any) => {
    await searchAccommodations(criteria)
  }, [searchAccommodations])

  // Update flight search
  const updateFlightSearch = useCallback(async (criteria: any) => {
    await searchFlights(criteria)
  }, [searchFlights])

  // Refresh all data
  const refreshTrip = useCallback(async () => {
    await Promise.all([
      fetchTrip(),
      fetchItinerary(),
      fetchTravelers(),
      fetchCosts()
    ])
  }, [fetchTrip, fetchItinerary, fetchTravelers, fetchCosts])

  // Initial data fetch
  useEffect(() => {
    if (tripId) {
      refreshTrip()
    }
  }, [tripId, refreshTrip])

  // Create actions object
  const actions: EnhancedTripActions = {
    searchAccommodations,
    bookAccommodation,
    updateAccommodationSearch,
    searchFlights,
    bookFlight,
    updateFlightSearch,
    addTraveler,
    updateTraveler,
    removeTraveler,
    updateBudget,
    refreshCosts: fetchCosts,
    refreshTrip
  }

  return (
    <EnhancedTripContext.Provider value={{ state, actions }}>
      {children}
    </EnhancedTripContext.Provider>
  )
}