"use client"

import * as React from "react"
import { AccommodationSelector, AccommodationMap } from "@/components/trip-customization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Star, Heart, Settings, Map, List, Grid } from "lucide-react"
import { addDays } from "date-fns"

// Type definitions to match our accommodation interface
interface Accommodation {
  id: string
  name: string
  starRating: 1 | 2 | 3 | 4 | 5
  type: 'hotel' | 'resort' | 'apartment' | 'guesthouse' | 'hostel' | 'villa'
  description: string
  imageUrl: string
  imageUrls: string[]
  location: {
    address: string
    city: string
    coordinates: [number, number]
  }
  pricing: {
    currency: string
    pricePerNight: number
    totalPrice: number
    taxesAndFees: number
    discountPercent?: number
  }
  amenities: string[]
  features: {
    freeWifi: boolean
    parking: boolean
    breakfast: boolean
    gym: boolean
    pool: boolean
    spa: boolean
    airConditioning: boolean
    petFriendly: boolean
    businessCenter: boolean
    roomService: boolean
  }
  roomTypes: Array<{
    id: string
    name: string
    capacity: number
    bedConfiguration: string
    size: string
    pricePerNight: number
  }>
  ratings: {
    overall: number
    cleanliness: number
    service: number
    location: number
    value: number
    reviewCount: number
  }
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    deposit?: string
  }
  availability: boolean
  distanceFromCenter?: number
}

export default function AccommodationSelectionDemo() {
  const [selectedAccommodation, setSelectedAccommodation] = React.useState<Accommodation | undefined>()
  const [activeFilters, setActiveFilters] = React.useState<any>({})
  const [checkInDate] = React.useState<Date>(new Date())
  const [checkOutDate] = React.useState<Date>(addDays(new Date(), 3))
  const [guests] = React.useState(2)
  const destination = "Paris, France"

  // Mock data for the map component (simplified version of accommodation data)
  const mapAccommodations = [
    {
      id: '1',
      name: 'The Grand Palace Hotel',
      coordinates: [48.8566, 2.3522] as [number, number],
      starRating: 5 as const,
      pricePerNight: 350,
      currency: 'EUR',
      imageUrl: '/api/placeholder/400/250',
      type: 'hotel',
      ratings: {
        overall: 4.6,
        reviewCount: 1247
      },
      distanceFromCenter: 0.5
    },
    {
      id: '2',
      name: 'Modern City Apartment',
      coordinates: [48.8606, 2.3376] as [number, number],
      starRating: 4 as const,
      pricePerNight: 180,
      currency: 'EUR',
      imageUrl: '/api/placeholder/400/250',
      type: 'apartment',
      ratings: {
        overall: 4.3,
        reviewCount: 892
      },
      distanceFromCenter: 1.2
    },
    {
      id: '3',
      name: 'Budget Traveler Inn',
      coordinates: [48.8496, 2.3712] as [number, number],
      starRating: 3 as const,
      pricePerNight: 45,
      currency: 'EUR',
      imageUrl: '/api/placeholder/400/250',
      type: 'hostel',
      ratings: {
        overall: 4.1,
        reviewCount: 567
      },
      distanceFromCenter: 2.1
    }
  ]

  const handleAccommodationSelect = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
  }

  const handleMapAccommodationSelect = (accommodation: any) => {
    // Find the full accommodation data from the selector
    // In a real app, this would be handled by a shared state or API
  }

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  const getActiveFiltersCount = () => {
    const { starRating = [], type = [], amenities = [] } = activeFilters
    return starRating.length + type.length + amenities.length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accommodation Selection Interface
          </h1>
          <p className="text-gray-600 mb-4">
            Comprehensive accommodation selection with advanced filtering, map integration, and comparison features.
          </p>
          
          {/* Demo Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold">Destination</div>
                <div className="text-sm text-gray-600">{destination}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="font-semibold">Check-in / Check-out</div>
                <div className="text-sm text-gray-600">
                  {checkInDate.toLocaleDateString()} - {checkOutDate.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="font-semibold">Guests</div>
                <div className="text-sm text-gray-600">{guests} guests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Settings className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold">Active Filters</div>
                <div className="text-sm text-gray-600">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Accommodation Banner */}
        {selectedAccommodation && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedAccommodation.imageUrl}
                  alt={selectedAccommodation.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedAccommodation.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {Array.from({ length: selectedAccommodation.starRating }, (_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 capitalize">
                      {selectedAccommodation.type}
                    </span>
                    <Badge variant="secondary">
                      {formatPrice(selectedAccommodation.pricing.pricePerNight, selectedAccommodation.pricing.currency)} / night
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedAccommodation(undefined)}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Grid & List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            <AccommodationSelector
              destination={destination}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              guests={guests}
              onAccommodationSelect={handleAccommodationSelect}
              selectedAccommodation={selectedAccommodation}
              onFiltersChange={handleFiltersChange}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <AccommodationMap
              accommodations={mapAccommodations}
              selectedAccommodation={mapAccommodations.find(a => a.id === selectedAccommodation?.id)}
              onAccommodationSelect={handleMapAccommodationSelect}
              center={[48.8566, 2.3522]}
              zoom={2}
              height="500px"
            />
            
            {/* Map View Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Interactive Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Click markers to select accommodations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full border-2 border-gray-500"></div>
                    <span className="text-sm">Hover for quick preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">City center reference point</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Map Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p>• Zoom in/out with controls</p>
                    <p>• Reset view to default</p>
                    <p>• Toggle list view overlay</p>
                    <p>• Interactive hover effects</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Real Implementation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p>In production, this would integrate with:</p>
                    <p>• Google Maps or Mapbox</p>
                    <p>• Real geolocation data</p>
                    <p>• Street view integration</p>
                    <p>• Directions and transit info</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Feature Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Accommodation Selection Features</CardTitle>
            <CardDescription>
              Complete accommodation browsing and selection experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Filtering & Search</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Star rating filters (1-5 stars)</li>
                  <li>• Accommodation type selection</li>
                  <li>• Price range slider</li>
                  <li>• Guest rating range</li>
                  <li>• Distance from center</li>
                  <li>• Amenities checklist</li>
                  <li>• Real-time search</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Viewing Options</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Grid view layout</li>
                  <li>• List view with details</li>
                  <li>• Interactive map view</li>
                  <li>• Detailed modal dialogs</li>
                  <li>• Image galleries</li>
                  <li>• Room type comparisons</li>
                  <li>• Sorting options</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">User Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Favorites/wishlist system</li>
                  <li>• One-click selection</li>
                  <li>• Price calculation</li>
                  <li>• Guest ratings display</li>
                  <li>• Policy information</li>
                  <li>• Responsive design</li>
                  <li>• Accessibility features</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 