import { Flight, FlightSearch } from '@/components/flights-view'

export interface FlightSearchCriteria {
  from: string
  to: string
  departDate: string
  returnDate?: string
  passengers: number
  class: 'economy' | 'premium' | 'business' | 'first'
  directOnly?: boolean
  maxStops?: number
  priceRange?: {
    min: number
    max: number
  }
}

export interface FlightBooking {
  flightId: string
  passengers: Array<{
    firstName: string
    lastName: string
    dateOfBirth: string
    passportNumber?: string
  }>
  seatPreferences?: string[]
  specialRequests?: string
}

export class FlightService {
  private baseUrl = '/api/trips'

  async searchFlights(criteria: FlightSearchCriteria): Promise<FlightSearch> {
    try {
      // In production, this would call a flight search API like Amadeus, Skyscanner, etc.
      // For now, generate mock flight data
      
      const generateFlights = (isOutbound: boolean): Flight[] => {
        const baseTime = isOutbound ? '08:00' : '16:00'
        const date = isOutbound ? criteria.departDate : criteria.returnDate || criteria.departDate
        
        return [
          {
            id: `flight-${Date.now()}-${isOutbound ? 'out' : 'ret'}-1`,
            airline: 'Global Airways',
            flightNumber: `GA${Math.floor(Math.random() * 900) + 100}`,
            aircraft: 'Boeing 787-9',
            departure: {
              airport: `${isOutbound ? criteria.from : criteria.to} International`,
              airportCode: isOutbound ? criteria.from.substring(0, 3).toUpperCase() : criteria.to.substring(0, 3).toUpperCase(),
              city: isOutbound ? criteria.from : criteria.to,
              terminal: '2',
              gate: `A${Math.floor(Math.random() * 20) + 1}`,
              time: baseTime,
              date: date
            },
            arrival: {
              airport: `${isOutbound ? criteria.to : criteria.from} International`,
              airportCode: isOutbound ? criteria.to.substring(0, 3).toUpperCase() : criteria.from.substring(0, 3).toUpperCase(),
              city: isOutbound ? criteria.to : criteria.from,
              terminal: '1',
              gate: `B${Math.floor(Math.random() * 20) + 1}`,
              time: '14:30',
              date: date
            },
            duration: '6h 30m',
            stops: 0,
            price: {
              amount: Math.floor(300 + Math.random() * 500),
              currency: 'USD',
              class: criteria.class
            },
            baggage: {
              carryOn: '1x 7kg included',
              checked: criteria.class === 'economy' ? '1x 23kg included' : '2x 32kg included'
            },
            amenities: [
              'WiFi',
              'In-flight Entertainment',
              criteria.class !== 'economy' ? 'Premium Meals' : 'Meals',
              criteria.class === 'business' || criteria.class === 'first' ? 'Lounge Access' : ''
            ].filter(Boolean),
            status: 'available' as const,
            cancellationPolicy: 'Free cancellation within 24 hours of booking'
          },
          {
            id: `flight-${Date.now()}-${isOutbound ? 'out' : 'ret'}-2`,
            airline: 'Sky Connect',
            flightNumber: `SC${Math.floor(Math.random() * 900) + 100}`,
            aircraft: 'Airbus A350',
            departure: {
              airport: `${isOutbound ? criteria.from : criteria.to} International`,
              airportCode: isOutbound ? criteria.from.substring(0, 3).toUpperCase() : criteria.to.substring(0, 3).toUpperCase(),
              city: isOutbound ? criteria.from : criteria.to,
              terminal: '3',
              time: '22:00',
              date: date
            },
            arrival: {
              airport: `${isOutbound ? criteria.to : criteria.from} International`,
              airportCode: isOutbound ? criteria.to.substring(0, 3).toUpperCase() : criteria.from.substring(0, 3).toUpperCase(),
              city: isOutbound ? criteria.to : criteria.from,
              terminal: '2',
              time: '06:45',
              date: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            duration: '8h 45m',
            stops: 1,
            stopDetails: [{
              airport: 'Hub City International (HUB)',
              duration: '1h 30m'
            }],
            price: {
              amount: Math.floor(250 + Math.random() * 400),
              currency: 'USD',
              class: criteria.class
            },
            baggage: {
              carryOn: '1x 7kg included',
              checked: '1x 23kg included'
            },
            amenities: ['WiFi', 'In-flight Entertainment', 'Snacks'],
            status: 'available' as const,
            cancellationPolicy: 'Cancellation fee applies'
          }
        ]
      }

      const flightSearch: FlightSearch = {
        outbound: generateFlights(true),
        return: criteria.returnDate ? generateFlights(false) : undefined,
        searchCriteria: {
          from: `${criteria.from} (${criteria.from.substring(0, 3).toUpperCase()})`,
          to: `${criteria.to} (${criteria.to.substring(0, 3).toUpperCase()})`,
          departDate: criteria.departDate,
          returnDate: criteria.returnDate,
          passengers: criteria.passengers,
          class: criteria.class.charAt(0).toUpperCase() + criteria.class.slice(1)
        },
        lastUpdated: new Date().toISOString()
      }

      // Apply filters
      if (criteria.directOnly) {
        flightSearch.outbound = flightSearch.outbound.filter(f => f.stops === 0)
        if (flightSearch.return) {
          flightSearch.return = flightSearch.return.filter(f => f.stops === 0)
        }
      }

      if (criteria.priceRange) {
        const filterByPrice = (flight: Flight) => 
          flight.price.amount >= criteria.priceRange!.min && 
          flight.price.amount <= criteria.priceRange!.max

        flightSearch.outbound = flightSearch.outbound.filter(filterByPrice)
        if (flightSearch.return) {
          flightSearch.return = flightSearch.return.filter(filterByPrice)
        }
      }

      return flightSearch
    } catch (error) {
      console.error('Error searching flights:', error)
      throw new Error('Failed to search flights')
    }
  }

  async bookFlight(tripId: string, booking: FlightBooking): Promise<any> {
    try {
      // In production, this would call the airline's booking API
      // For now, add to trip itinerary
      
      const response = await fetch(`${this.baseUrl}/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dayIndex: 0, // Calculate based on flight date
          activity: {
            time: '06:00', // Use actual flight time
            title: 'Flight',
            description: 'Flight booking',
            location: 'Airport',
            type: 'transport',
            duration: '1 day',
            cost: 0, // Will be calculated from actual booking
            metadata: {
              ...booking,
              bookingStatus: 'confirmed',
              confirmationNumber: `FL-${Date.now()}`,
              bookedAt: new Date().toISOString()
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to book flight')
      }

      return await response.json()
    } catch (error) {
      console.error('Error booking flight:', error)
      throw error
    }
  }

  async getFlightStatus(flightId: string): Promise<Flight | null> {
    try {
      // In production, this would check real-time flight status
      return null
    } catch (error) {
      console.error('Error fetching flight status:', error)
      throw error
    }
  }

  async checkIn(tripId: string, bookingReference: string): Promise<any> {
    try {
      // Implement online check-in logic
      return {
        success: true,
        boardingPasses: []
      }
    } catch (error) {
      console.error('Error during check-in:', error)
      throw error
    }
  }

  async getSuggestedFlights(tripId: string, destination: string, dates: { start: string, end: string }): Promise<Flight[]> {
    try {
      // Get AI-powered flight suggestions
      const response = await fetch(`/api/trips-ai/pricing-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          destination,
          duration: Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 60 * 60 * 24)),
          preferences: {
            transportation: true
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Transform pricing insights into flight suggestions
        return []
      }

      return []
    } catch (error) {
      console.error('Error getting flight suggestions:', error)
      return []
    }
  }
}

// Export singleton instance
export const flightService = new FlightService()