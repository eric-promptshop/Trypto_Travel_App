import { Accommodation, RoomType } from '@/components/lodging-view'

export interface SearchCriteria {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  priceRange: {
    min: number
    max: number
  }
  accommodationType: string[]
}

export interface AccommodationBooking {
  accommodationId: string
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  specialRequests?: string
}

export class AccommodationService {
  private baseUrl = '/api/trips'

  async searchAccommodations(tripId: string, criteria: SearchCriteria): Promise<Accommodation[]> {
    try {
      // In a real implementation, this would call a third-party API or your own accommodation service
      // For now, we'll generate mock data based on the search criteria
      
      const mockAccommodations: Accommodation[] = [
        {
          id: `acc-${Date.now()}-1`,
          name: `${criteria.destination} Grand Hotel`,
          type: 'hotel',
          rating: 4.6,
          reviewCount: 342,
          address: {
            street: '123 Main Street',
            city: criteria.destination,
            country: 'Country',
            postalCode: '12345',
            coordinates: { lat: 0, lng: 0 }
          },
          description: `Luxurious hotel in the heart of ${criteria.destination} with stunning city views`,
          images: ['/images/hotel-placeholder.jpg'],
          amenities: [
            { name: 'Free WiFi', icon: null, available: true },
            { name: 'Pool', icon: null, available: true },
            { name: 'Spa', icon: null, available: true },
            { name: 'Gym', icon: null, available: true },
            { name: 'Restaurant', icon: null, available: true },
            { name: 'Bar', icon: null, available: true }
          ],
          roomTypes: [
            {
              id: 'room-std',
              name: 'Standard Room',
              description: 'Comfortable room with city view',
              capacity: 2,
              bedType: '1 Queen Bed',
              size: '28 m²',
              price: { 
                amount: Math.floor(criteria.priceRange.min + (criteria.priceRange.max - criteria.priceRange.min) * 0.3), 
                currency: 'USD', 
                period: 'night' as const 
              },
              amenities: ['Air Conditioning', 'Mini Bar', 'Safe', 'Flat-screen TV'],
              availability: 8,
              images: []
            },
            {
              id: 'room-deluxe',
              name: 'Deluxe Room',
              description: 'Spacious room with premium amenities',
              capacity: 2,
              bedType: '1 King Bed',
              size: '35 m²',
              price: { 
                amount: Math.floor(criteria.priceRange.min + (criteria.priceRange.max - criteria.priceRange.min) * 0.5), 
                currency: 'USD', 
                period: 'night' as const 
              },
              amenities: ['Air Conditioning', 'Mini Bar', 'Safe', 'Flat-screen TV', 'Balcony', 'Coffee Machine'],
              availability: 4,
              images: []
            }
          ],
          policies: {
            checkIn: '15:00',
            checkOut: '11:00',
            cancellation: 'Free cancellation up to 48 hours before check-in',
            pets: false,
            smoking: false,
            children: true
          },
          location: {
            distanceToCenter: '0.8 km',
            distanceToAirport: '25 km',
            nearbyAttractions: ['City Museum', 'Central Park', 'Shopping District'],
            transportation: ['Metro Station - 200m', 'Bus Stop - 50m']
          },
          status: 'available' as const
        },
        {
          id: `acc-${Date.now()}-2`,
          name: `Cozy ${criteria.destination} Apartment`,
          type: 'apartment',
          rating: 4.8,
          reviewCount: 89,
          address: {
            street: '456 Residential Ave',
            city: criteria.destination,
            country: 'Country',
            postalCode: '12346',
            coordinates: { lat: 0, lng: 0 }
          },
          description: `Modern apartment perfect for extended stays in ${criteria.destination}`,
          images: ['/images/apartment-placeholder.jpg'],
          amenities: [
            { name: 'Free WiFi', icon: null, available: true },
            { name: 'Kitchen', icon: null, available: true },
            { name: 'Washing Machine', icon: null, available: true },
            { name: 'Workspace', icon: null, available: true }
          ],
          roomTypes: [
            {
              id: 'apt-full',
              name: 'Entire Apartment',
              description: '2-bedroom apartment with full amenities',
              capacity: criteria.guests,
              bedType: '2 Bedrooms',
              size: '75 m²',
              price: { 
                amount: Math.floor(criteria.priceRange.min + (criteria.priceRange.max - criteria.priceRange.min) * 0.4), 
                currency: 'USD', 
                period: 'night' as const 
              },
              amenities: ['Full Kitchen', 'Washing Machine', 'Dishwasher', 'Balcony', 'Smart TV'],
              availability: 2,
              images: []
            }
          ],
          policies: {
            checkIn: '16:00',
            checkOut: '11:00',
            cancellation: 'Moderate - Free cancellation up to 5 days before',
            pets: true,
            smoking: false,
            children: true
          },
          location: {
            distanceToCenter: '2.3 km',
            distanceToAirport: '28 km',
            nearbyAttractions: ['Local Market', 'Riverside Walk', 'Art Gallery'],
            transportation: ['Bus Stop - 100m', 'Train Station - 1km']
          },
          status: 'available' as const
        }
      ]

      // Filter based on accommodation type
      if (criteria.accommodationType && criteria.accommodationType.length > 0) {
        return mockAccommodations.filter(acc => 
          criteria.accommodationType.includes(acc.type)
        )
      }

      return mockAccommodations
    } catch (error) {
      console.error('Error searching accommodations:', error)
      throw new Error('Failed to search accommodations')
    }
  }

  async bookAccommodation(tripId: string, booking: AccommodationBooking): Promise<any> {
    try {
      // Add accommodation booking to trip itinerary
      const response = await fetch(`${this.baseUrl}/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dayIndex: 0, // You might want to calculate this based on check-in date
          activity: {
            time: '15:00',
            title: 'Hotel Check-in',
            description: `Check into accommodation`,
            location: 'Hotel',
            type: 'accommodation',
            duration: 'Overnight',
            cost: 0, // Will be calculated from actual booking
            metadata: {
              ...booking,
              bookingStatus: 'confirmed',
              confirmationNumber: `CONF-${Date.now()}`,
              bookedAt: new Date().toISOString()
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to book accommodation')
      }

      return await response.json()
    } catch (error) {
      console.error('Error booking accommodation:', error)
      throw error
    }
  }

  async getAccommodationDetails(accommodationId: string): Promise<Accommodation | null> {
    try {
      // In a real implementation, this would fetch from a database or API
      // For now, return mock data
      return null
    } catch (error) {
      console.error('Error fetching accommodation details:', error)
      throw error
    }
  }

  async cancelBooking(tripId: string, bookingId: string): Promise<boolean> {
    try {
      // Implement cancellation logic
      return true
    } catch (error) {
      console.error('Error cancelling booking:', error)
      throw error
    }
  }

  async getSuggestedAccommodations(tripId: string): Promise<Accommodation[]> {
    try {
      // Get AI-powered accommodation suggestions based on trip details
      const response = await fetch(`/api/trips-ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId,
          type: 'accommodations'
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.accommodations || []
      }

      return []
    } catch (error) {
      console.error('Error getting accommodation suggestions:', error)
      return []
    }
  }
}

// Export singleton instance
export const accommodationService = new AccommodationService()