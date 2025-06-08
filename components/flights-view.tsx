"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Clock, Calendar, MapPin, Star, AlertTriangle, RefreshCw } from 'lucide-react'

// Placeholder data structures for future development
interface Flight {
  id: string
  airline: string
  flightNumber: string
  aircraft: string
  departure: {
    airport: string
    airportCode: string
    city: string
    terminal?: string
    gate?: string
    time: string
    date: string
  }
  arrival: {
    airport: string
    airportCode: string
    city: string
    terminal?: string
    gate?: string
    time: string
    date: string
  }
  duration: string
  stops: number
  stopDetails?: {
    airport: string
    duration: string
  }[]
  price: {
    amount: number
    currency: string
    class: 'economy' | 'premium' | 'business' | 'first'
  }
  baggage: {
    carryOn: string
    checked: string
  }
  amenities: string[]
  status: 'searching' | 'available' | 'booked' | 'cancelled'
  bookingReference?: string
  seatAssignments?: {
    travelerId: string
    seatNumber: string
  }[]
  cancellationPolicy: string
}

interface FlightSearch {
  outbound: Flight[]
  return?: Flight[]
  searchCriteria: {
    from: string
    to: string
    departDate: string
    returnDate?: string
    passengers: number
    class: string
  }
  lastUpdated: string
}

// Mock data for development
const mockFlightSearch: FlightSearch = {
  outbound: [
    {
      id: 'out1',
      airline: 'American Airlines',
      flightNumber: 'AA 150',
      aircraft: 'Boeing 737-800',
      departure: {
        airport: 'John F. Kennedy International',
        airportCode: 'JFK',
        city: 'New York',
        terminal: '8',
        time: '08:30',
        date: '2024-06-15'
      },
      arrival: {
        airport: 'Barcelona-El Prat',
        airportCode: 'BCN',
        city: 'Barcelona',
        terminal: '1',
        time: '21:45',
        date: '2024-06-15'
      },
      duration: '7h 15m',
      stops: 0,
      price: {
        amount: 654,
        currency: 'USD',
        class: 'economy'
      },
      baggage: {
        carryOn: '1x 22kg included',
        checked: '1x 23kg included'
      },
      amenities: ['WiFi', 'In-flight Entertainment', 'Meals Included'],
      status: 'available',
      cancellationPolicy: 'Free cancellation up to 24 hours before departure'
    },
    {
      id: 'out2',
      airline: 'Lufthansa',
      flightNumber: 'LH 441',
      aircraft: 'Airbus A330-300',
      departure: {
        airport: 'John F. Kennedy International',
        airportCode: 'JFK',
        city: 'New York',
        terminal: '1',
        time: '22:20',
        date: '2024-06-15'
      },
      arrival: {
        airport: 'Barcelona-El Prat',
        airportCode: 'BCN',
        city: 'Barcelona',
        terminal: '1',
        time: '18:35',
        date: '2024-06-16'
      },
      duration: '8h 15m',
      stops: 1,
      stopDetails: [{
        airport: 'Frankfurt (FRA)',
        duration: '1h 25m'
      }],
      price: {
        amount: 498,
        currency: 'USD',
        class: 'economy'
      },
      baggage: {
        carryOn: '1x 8kg included',
        checked: '1x 23kg included'
      },
      amenities: ['WiFi', 'In-flight Entertainment', 'Premium Meals'],
      status: 'available',
      cancellationPolicy: 'Refundable with fees'
    },
    {
      id: 'out3',
      airline: 'Delta Airlines',
      flightNumber: 'DL 132',
      aircraft: 'Boeing 767-400',
      departure: {
        airport: 'John F. Kennedy International',
        airportCode: 'JFK',
        city: 'New York',
        terminal: '4',
        time: '23:59',
        date: '2024-06-15'
      },
      arrival: {
        airport: 'Barcelona-El Prat',
        airportCode: 'BCN',
        city: 'Barcelona',
        terminal: '1',
        time: '14:20',
        date: '2024-06-16'
      },
      duration: '7h 21m',
      stops: 0,
      price: {
        amount: 892,
        currency: 'USD',
        class: 'business'
      },
      baggage: {
        carryOn: '2x 10kg included',
        checked: '2x 32kg included'
      },
      amenities: ['WiFi', 'Flat-bed Seats', 'Premium Dining', 'Priority Boarding'],
      status: 'booked',
      bookingReference: 'DL8X9K2',
      seatAssignments: [
        { travelerId: '1', seatNumber: '2A' },
        { travelerId: '2', seatNumber: '2B' }
      ],
      cancellationPolicy: 'Flexible cancellation and changes'
    }
  ],
  return: [
    {
      id: 'ret1',
      airline: 'Vueling',
      flightNumber: 'VY 8301',
      aircraft: 'Airbus A320',
      departure: {
        airport: 'Barcelona-El Prat',
        airportCode: 'BCN',
        city: 'Barcelona',
        terminal: '1',
        time: '16:30',
        date: '2024-06-25'
      },
      arrival: {
        airport: 'John F. Kennedy International',
        airportCode: 'JFK',
        city: 'New York',
        terminal: '4',
        time: '19:15',
        date: '2024-06-25'
      },
      duration: '8h 45m',
      stops: 0,
      price: {
        amount: 421,
        currency: 'USD',
        class: 'economy'
      },
      baggage: {
        carryOn: '1x 10kg included',
        checked: '1x 20kg for fee'
      },
      amenities: ['WiFi (paid)', 'Snacks for purchase'],
      status: 'available',
      cancellationPolicy: 'Non-refundable, changes allowed with fees'
    }
  ],
  searchCriteria: {
    from: 'New York (JFK)',
    to: 'Barcelona (BCN)',
    departDate: '2024-06-15',
    returnDate: '2024-06-25',
    passengers: 3,
    class: 'Economy'
  },
  lastUpdated: '2024-12-07T10:30:00Z'
}

interface FlightsViewProps {
  tripId?: string
  editable?: boolean
  onBookFlight?: (flightId: string) => void
  onSearchFlights?: () => void
}

export function FlightsView({ tripId, editable = false, onBookFlight, onSearchFlights }: FlightsViewProps) {
  const flightData = mockFlightSearch // TODO: Replace with API call using tripId
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'booked': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'searching': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClassIcon = (flightClass: string) => {
    switch (flightClass) {
      case 'business':
      case 'first':
        return <Star className="h-4 w-4 text-gold-500" />
      default:
        return null
    }
  }

  const renderFlightCard = (flight: Flight, type: 'outbound' | 'return') => (
    <Card key={flight.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {flight.airline} {flight.flightNumber}
                {getClassIcon(flight.price.class)}
              </h3>
              <p className="text-sm text-gray-500">{flight.aircraft}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              ${flight.price.amount}
            </div>
            <Badge className={getStatusColor(flight.status)}>
              {flight.status}
            </Badge>
          </div>
        </div>

        {/* Flight Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Departure */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Departure</div>
            <div className="font-semibold">{flight.departure.time}</div>
            <div className="text-sm">{flight.departure.date}</div>
            <div className="text-sm text-gray-600">
              {flight.departure.airportCode} - {flight.departure.city}
            </div>
            {flight.departure.terminal && (
              <div className="text-xs text-gray-500">Terminal {flight.departure.terminal}</div>
            )}
          </div>

          {/* Duration & Stops */}
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Duration</div>
            <div className="font-semibold flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              {flight.duration}
            </div>
            <div className="text-sm">
              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </div>
            {flight.stopDetails && (
              <div className="text-xs text-gray-500">
                via {flight.stopDetails[0].airport}
              </div>
            )}
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Arrival</div>
            <div className="font-semibold">{flight.arrival.time}</div>
            <div className="text-sm">{flight.arrival.date}</div>
            <div className="text-sm text-gray-600">
              {flight.arrival.airportCode} - {flight.arrival.city}
            </div>
            {flight.arrival.terminal && (
              <div className="text-xs text-gray-500">Terminal {flight.arrival.terminal}</div>
            )}
          </div>
        </div>

        {/* Amenities and Baggage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <div className="font-medium mb-1">Amenities</div>
            <div className="flex flex-wrap gap-1">
              {flight.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Baggage</div>
            <div className="text-xs space-y-1">
              <div>Carry-on: {flight.baggage.carryOn}</div>
              <div>Checked: {flight.baggage.checked}</div>
            </div>
          </div>
        </div>

        {/* Booking Status */}
        {flight.status === 'booked' && flight.bookingReference && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Confirmed</Badge>
              <span className="text-sm font-medium">Booking Reference: {flight.bookingReference}</span>
            </div>
            {flight.seatAssignments && (
              <div className="text-sm">
                Seats: {flight.seatAssignments.map(seat => seat.seatNumber).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {editable && (
          <div className="flex gap-2">
            {flight.status === 'available' && (
              <Button onClick={() => onBookFlight?.(flight.id)} className="flex-1">
                Book Flight
              </Button>
            )}
            {flight.status === 'booked' && (
              <>
                <Button variant="outline" className="flex-1">
                  Manage Booking
                </Button>
                <Button variant="outline">
                  Check-in
                </Button>
              </>
            )}
          </div>
        )}

        {/* Cancellation Policy */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          <span className="font-medium">Cancellation Policy:</span> {flight.cancellationPolicy}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Search Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Search
          </CardTitle>
          <CardDescription>
            {flightData.searchCriteria.from} → {flightData.searchCriteria.to} • {flightData.searchCriteria.passengers} passengers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Departure:</span>
              <div className="font-medium">{flightData.searchCriteria.departDate}</div>
            </div>
            {flightData.searchCriteria.returnDate && (
              <div>
                <span className="text-gray-500">Return:</span>
                <div className="font-medium">{flightData.searchCriteria.returnDate}</div>
              </div>
            )}
            <div>
              <span className="text-gray-500">Passengers:</span>
              <div className="font-medium">{flightData.searchCriteria.passengers}</div>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <div className="font-medium">{flightData.searchCriteria.class}</div>
            </div>
          </div>
          
          {editable && (
            <div className="flex gap-2 mt-4">
              <Button onClick={onSearchFlights} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Search
              </Button>
              <Button variant="outline">
                Modify Dates
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(flightData.lastUpdated).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Outbound Flights */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Outbound Flights
        </h3>
        {flightData.outbound.map(flight => renderFlightCard(flight, 'outbound'))}
      </div>

      {/* Return Flights */}
      {flightData.return && flightData.return.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 rotate-180" />
            Return Flights
          </h3>
          {flightData.return.map(flight => renderFlightCard(flight, 'return'))}
        </div>
      )}

      {/* Flight Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Flight Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-yellow-800">Price Alert</div>
              <div className="text-yellow-700">Flight prices for your route have dropped by 15% in the last 24 hours</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">Schedule Change</div>
              <div className="text-blue-700">American Airlines AA 150 departure time changed from 08:30 to 08:45</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FlightsView 