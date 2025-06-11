"use client"

import React, { useState, useEffect } from 'react'
import { useEnhancedTrip } from '@/contexts/EnhancedTripContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Star, Wifi, Car, Coffee, Dumbbell, Users, Calendar, DollarSign } from 'lucide-react'

// Placeholder data structures for future development
interface Amenity {
  name: string
  icon: React.ReactNode
  available: boolean
  description?: string
}

interface RoomType {
  id: string
  name: string
  description: string
  capacity: number
  bedType: string
  size: string
  price: {
    amount: number
    currency: string
    period: 'night' | 'week' | 'total'
  }
  amenities: string[]
  availability: number
  images: string[]
}

interface Accommodation {
  id: string
  name: string
  type: 'hotel' | 'hostel' | 'apartment' | 'resort' | 'bnb' | 'villa'
  rating: number
  reviewCount: number
  address: {
    street: string
    city: string
    country: string
    postalCode: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  description: string
  images: string[]
  amenities: Amenity[]
  roomTypes: RoomType[]
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    pets: boolean
    smoking: boolean
    children: boolean
  }
  location: {
    distanceToCenter: string
    distanceToAirport: string
    nearbyAttractions: string[]
    transportation: string[]
  }
  status: 'available' | 'booked' | 'unavailable' | 'pending'
  bookingReference?: string
  hostInfo?: {
    name: string
    responseRate: string
    responseTime: string
    superhost: boolean
  }
}

interface AccommodationSearch {
  accommodations: Accommodation[]
  searchCriteria: {
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
  filters: {
    amenities: string[]
    rating: number
    priceSort: 'asc' | 'desc'
  }
  lastUpdated: string
}

// Mock data for development
const mockAccommodationSearch: AccommodationSearch = {
  accommodations: [
    {
      id: 'acc1',
      name: 'Hotel Barcelona Center',
      type: 'hotel',
      rating: 4.5,
      reviewCount: 2847,
      address: {
        street: 'Las Ramblas 125',
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08002',
        coordinates: { lat: 41.3851, lng: 2.1734 }
      },
      description: 'Modern hotel in the heart of Barcelona, steps away from Las Ramblas and Gothic Quarter. Features contemporary rooms with city views.',
      images: ['/hotels/barcelona-center-1.jpg', '/hotels/barcelona-center-2.jpg'],
      amenities: [
        { name: 'Free WiFi', icon: <Wifi className="h-4 w-4" />, available: true },
        { name: 'Fitness Center', icon: <Dumbbell className="h-4 w-4" />, available: true },
        { name: 'Restaurant', icon: <Coffee className="h-4 w-4" />, available: true },
        { name: 'Parking', icon: <Car className="h-4 w-4" />, available: false, description: 'Available for €25/night' }
      ],
      roomTypes: [
        {
          id: 'room1',
          name: 'Standard Double Room',
          description: 'Comfortable room with city view',
          capacity: 2,
          bedType: '1 Queen Bed',
          size: '25 m²',
          price: { amount: 145, currency: 'EUR', period: 'night' },
          amenities: ['Air Conditioning', 'Mini Bar', 'Safe', 'Flat-screen TV'],
          availability: 3,
          images: ['/rooms/standard-double.jpg']
        },
        {
          id: 'room2',
          name: 'Deluxe Suite',
          description: 'Spacious suite with separate living area',
          capacity: 4,
          bedType: '1 King Bed + Sofa Bed',
          size: '45 m²',
          price: { amount: 280, currency: 'EUR', period: 'night' },
          amenities: ['Air Conditioning', 'Mini Bar', 'Safe', 'Flat-screen TV', 'Bathrobe', 'Room Service'],
          availability: 1,
          images: ['/rooms/deluxe-suite.jpg']
        }
      ],
      policies: {
        checkIn: '15:00',
        checkOut: '12:00',
        cancellation: 'Free cancellation until 6 PM, 1 day before arrival',
        pets: false,
        smoking: false,
        children: true
      },
      location: {
        distanceToCenter: '0.1 km',
        distanceToAirport: '12 km',
        nearbyAttractions: ['Gothic Quarter', 'La Boqueria Market', 'Cathedral of Barcelona'],
        transportation: ['Metro L3 - Liceu (50m)', 'Bus Stop (100m)']
      },
      status: 'available'
    },
    {
      id: 'acc2',
      name: 'Casa Marina Apartment',
      type: 'apartment',
      rating: 4.8,
      reviewCount: 156,
      address: {
        street: 'Carrer de la Marina 45',
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08005',
        coordinates: { lat: 41.3895, lng: 2.1787 }
      },
      description: 'Beautiful apartment near the beach with modern amenities. Perfect for families or groups looking for a home-away-from-home experience.',
      images: ['/apartments/casa-marina-1.jpg', '/apartments/casa-marina-2.jpg'],
      amenities: [
        { name: 'Free WiFi', icon: <Wifi className="h-4 w-4" />, available: true },
        { name: 'Kitchen', icon: <Coffee className="h-4 w-4" />, available: true },
        { name: 'Washing Machine', icon: <Building2 className="h-4 w-4" />, available: true }
      ],
      roomTypes: [
        {
          id: 'room3',
          name: 'Entire Apartment',
          description: '2-bedroom apartment with full kitchen and living room',
          capacity: 6,
          bedType: '2 Bedrooms + Living Room',
          size: '75 m²',
          price: { amount: 180, currency: 'EUR', period: 'night' },
          amenities: ['Full Kitchen', 'Washing Machine', 'Balcony', 'Dishwasher'],
          availability: 1,
          images: ['/apartments/entire-apartment.jpg']
        }
      ],
      policies: {
        checkIn: '16:00',
        checkOut: '11:00',
        cancellation: 'Strict cancellation policy',
        pets: true,
        smoking: false,
        children: true
      },
      location: {
        distanceToCenter: '2.5 km',
        distanceToAirport: '15 km',
        nearbyAttractions: ['Barceloneta Beach', 'Port Vell', 'Aquarium Barcelona'],
        transportation: ['Metro L4 - Barceloneta (300m)', 'Bus Stop (150m)']
      },
      status: 'booked',
      bookingReference: 'APT789XYZ',
      hostInfo: {
        name: 'Maria Garcia',
        responseRate: '95%',
        responseTime: 'Within 1 hour',
        superhost: true
      }
    },
    {
      id: 'acc3',
      name: 'Barcelona Backpackers Hostel',
      type: 'hostel',
      rating: 4.2,
      reviewCount: 892,
      address: {
        street: 'Carrer del Regomir 15',
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08002',
        coordinates: { lat: 41.3825, lng: 2.1799 }
      },
      description: 'Budget-friendly hostel in the Gothic Quarter. Great for meeting fellow travelers and exploring Barcelona on a budget.',
      images: ['/hostels/backpackers-1.jpg', '/hostels/backpackers-2.jpg'],
      amenities: [
        { name: 'Free WiFi', icon: <Wifi className="h-4 w-4" />, available: true },
        { name: 'Common Kitchen', icon: <Coffee className="h-4 w-4" />, available: true },
        { name: 'Luggage Storage', icon: <Building2 className="h-4 w-4" />, available: true }
      ],
      roomTypes: [
        {
          id: 'room4',
          name: '6-Bed Mixed Dormitory',
          description: 'Shared room with 6 bunk beds',
          capacity: 1,
          bedType: '1 Bunk Bed',
          size: '20 m²',
          price: { amount: 25, currency: 'EUR', period: 'night' },
          amenities: ['Locker', 'Shared Bathroom', 'Reading Light'],
          availability: 4,
          images: ['/hostels/dorm-room.jpg']
        },
        {
          id: 'room5',
          name: 'Private Double Room',
          description: 'Private room with shared bathroom',
          capacity: 2,
          bedType: '1 Double Bed',
          size: '12 m²',
          price: { amount: 65, currency: 'EUR', period: 'night' },
          amenities: ['Private Room', 'Shared Bathroom', 'Desk'],
          availability: 2,
          images: ['/hostels/private-room.jpg']
        }
      ],
      policies: {
        checkIn: '14:00',
        checkOut: '11:00',
        cancellation: 'Free cancellation until 2 days before arrival',
        pets: false,
        smoking: false,
        children: false
      },
      location: {
        distanceToCenter: '0.3 km',
        distanceToAirport: '14 km',
        nearbyAttractions: ['Gothic Quarter', 'Barcelona Cathedral', 'Picasso Museum'],
        transportation: ['Metro L4 - Jaume I (200m)', 'Bus Stop (50m)']
      },
      status: 'available'
    }
  ],
  searchCriteria: {
    destination: 'Barcelona, Spain',
    checkIn: '2024-06-15',
    checkOut: '2024-06-25',
    guests: 3,
    rooms: 2,
    priceRange: { min: 20, max: 300 },
    accommodationType: ['hotel', 'apartment', 'hostel']
  },
  filters: {
    amenities: ['Free WiFi'],
    rating: 4.0,
    priceSort: 'asc'
  },
  lastUpdated: '2024-12-07T11:15:00Z'
}

interface LodgingViewProps {
  tripId?: string
  editable?: boolean
  onBookAccommodation?: (accommodationId: string, roomId: string) => void
  onSearchAccommodations?: () => void
}

export function LodgingView({ tripId, editable = false, onBookAccommodation, onSearchAccommodations }: LodgingViewProps) {
  const { state, actions } = useEnhancedTrip()
  const [isSearching, setIsSearching] = useState(false)
  
  // Use real data from context instead of mock
  const lodgingData = {
    accommodations: state.accommodations.searchResults,
    searchCriteria: state.accommodations.searchCriteria || mockAccommodationSearch.searchCriteria,
    filters: {
      amenities: state.accommodations.searchCriteria?.amenities || ['Free WiFi'],
      rating: state.accommodations.searchCriteria?.rating || 4.0,
      priceSort: state.accommodations.searchCriteria?.priceSort || 'asc'
    },
    lastUpdated: state.accommodations.lastUpdated
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'booked': return 'bg-blue-100 text-blue-800'
      case 'unavailable': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="h-4 w-4" />
      case 'apartment': return <Building2 className="h-4 w-4" />
      case 'hostel': return <Users className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Search Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Accommodation Search
          </CardTitle>
          <CardDescription>
            {lodgingData.searchCriteria.destination} • {lodgingData.searchCriteria.guests} guests • {lodgingData.searchCriteria.rooms} rooms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Check-in:</span>
              <div className="font-medium">{lodgingData.searchCriteria.checkIn}</div>
            </div>
            <div>
              <span className="text-gray-500">Check-out:</span>
              <div className="font-medium">{lodgingData.searchCriteria.checkOut}</div>
            </div>
            <div>
              <span className="text-gray-500">Price Range:</span>
              <div className="font-medium">€{lodgingData.searchCriteria.priceRange.min} - €{lodgingData.searchCriteria.priceRange.max}</div>
            </div>
            <div>
              <span className="text-gray-500">Types:</span>
              <div className="font-medium">{lodgingData.searchCriteria.accommodationType.join(', ')}</div>
            </div>
          </div>
          
          {editable && (
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={async () => {
                  setIsSearching(true)
                  try {
                    await actions.searchAccommodations(lodgingData.searchCriteria)
                    onSearchAccommodations?.()
                  } finally {
                    setIsSearching(false)
                  }
                }} 
                variant="outline" 
                className="flex-1"
                disabled={isSearching || state.loading.accommodations}
              >
                {isSearching || state.loading.accommodations ? 'Searching...' : 'Update Search'}
              </Button>
              <Button variant="outline">
                Modify Dates
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(lodgingData.lastUpdated).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Accommodations List */}
      <div className="space-y-6">
        {lodgingData.accommodations.map((accommodation) => (
          <Card key={accommodation.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Images */}
                <div className="lg:w-1/3">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-2">
                    <img 
                      src={accommodation.images[0] || '/placeholder-hotel.jpg'} 
                      alt={accommodation.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex gap-1">
                    {accommodation.images.slice(1, 4).map((image, index) => (
                      <div key={index} className="w-16 h-12 bg-gray-200 rounded">
                        <img src={image} alt="" className="w-full h-full object-cover rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {getTypeIcon(accommodation.type)}
                        {accommodation.name}
                        <Badge className={getStatusColor(accommodation.status)}>
                          {accommodation.status}
                        </Badge>
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {renderStars(accommodation.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {accommodation.rating} ({accommodation.reviewCount} reviews)
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {accommodation.address.street}, {accommodation.address.city}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {accommodation.description}
                  </p>

                  {/* Amenities */}
                  <div className="mb-4">
                    <div className="font-medium text-sm mb-2">Amenities</div>
                    <div className="flex flex-wrap gap-2">
                      {accommodation.amenities.slice(0, 4).map((amenity, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                          {amenity.icon}
                          {amenity.name}
                        </div>
                      ))}
                      {accommodation.amenities.length > 4 && (
                        <div className="text-xs text-gray-500">
                          +{accommodation.amenities.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="font-medium mb-1">Location</div>
                      <div className="text-gray-600">
                        {accommodation.location.distanceToCenter} from center
                      </div>
                      <div className="text-gray-600">
                        {accommodation.location.distanceToAirport} from airport
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Nearby</div>
                      <div className="text-gray-600 text-xs">
                        {accommodation.location.nearbyAttractions.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Booking Status */}
                  {accommodation.status === 'booked' && accommodation.bookingReference && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Confirmed</Badge>
                        <span className="text-sm font-medium">
                          Booking Reference: {accommodation.bookingReference}
                        </span>
                      </div>
                      {accommodation.hostInfo && (
                        <div className="text-sm text-gray-600">
                          Host: {accommodation.hostInfo.name}
                          {accommodation.hostInfo.superhost && (
                            <Badge variant="outline" className="ml-2 text-xs">Superhost</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Room Types & Pricing */}
                <div className="lg:w-1/3">
                  <div className="space-y-3">
                    {accommodation.roomTypes.map((room) => (
                      <div key={room.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{room.name}</h4>
                            <p className="text-xs text-gray-600">{room.description}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {room.bedType} • {room.size}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              €{room.price.amount}
                            </div>
                            <div className="text-xs text-gray-500">per {room.price.period}</div>
                          </div>
                          <div className="text-xs text-green-600">
                            {room.availability} available
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {room.amenities.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>

                        {editable && accommodation.status === 'available' && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={async () => {
                              try {
                                await actions.bookAccommodation(accommodation.id, room.id)
                                onBookAccommodation?.(accommodation.id, room.id)
                              } catch (error) {
                                console.error('Failed to book accommodation:', error)
                              }
                            }}
                            disabled={state.loading.bookAccommodation}
                          >
                            {state.loading.bookAccommodation ? 'Booking...' : 'Book Room'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>Check-in: {accommodation.policies.checkIn}</div>
                  <div>Check-out: {accommodation.policies.checkOut}</div>
                  <div>Pets: {accommodation.policies.pets ? 'Allowed' : 'Not allowed'}</div>
                  <div>Smoking: {accommodation.policies.smoking ? 'Allowed' : 'Not allowed'}</div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Cancellation:</span> {accommodation.policies.cancellation}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default LodgingView 