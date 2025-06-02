"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  PricingBreakdown, 
  PricingHistoryTracker, 
  useRealTimePricing,
  type SelectedItems 
} from "@/components/trip-customization"
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Sparkles,
  RefreshCw,
  Wand2
} from "lucide-react"

// Mock data for demo purposes
const mockAccommodations = [
  {
    id: 'hotel_paris_1',
    title: 'Hotel des Grands Boulevards',
    description: 'Charming boutique hotel in central Paris',
    type: 'hotel' as const,
    starRating: 4,
    location: 'Paris, France',
    coordinates: { latitude: 48.8738, longitude: 2.3419 },
    amenities: ['WiFi', 'Restaurant', 'Concierge'],
    images: ['hotel1.jpg'],
    pricing: { currency: 'EUR', adult: 180, child: 90, isFree: false },
    availability: { dates: ['2024-07-15', '2024-07-16'], maxGuests: 2 },
    policies: { checkIn: '15:00', checkOut: '11:00', cancellation: 'flexible' },
    contact: { phone: '+33-1-23-45-67-89', email: 'info@hotel.com', website: 'hotel.com' },
    tags: ['boutique', 'central', 'historic'],
    estimatedCost: { amount: 180, currency: 'EUR' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'hotel_paris_2',
    title: 'Le Meurice',
    description: 'Luxury palace hotel overlooking Tuileries Garden',
    type: 'hotel' as const,
    starRating: 5,
    location: 'Paris, France',
    coordinates: { latitude: 48.8655, longitude: 2.3283 },
    amenities: ['WiFi', 'Spa', 'Restaurant', 'Concierge', 'Gym'],
    images: ['hotel2.jpg'],
    pricing: { currency: 'EUR', adult: 450, child: 225, isFree: false },
    availability: { dates: ['2024-07-15', '2024-07-16'], maxGuests: 4 },
    policies: { checkIn: '15:00', checkOut: '12:00', cancellation: 'strict' },
    contact: { phone: '+33-1-44-58-10-10', email: 'info@lemeurice.com', website: 'lemeurice.com' },
    tags: ['luxury', 'palace', 'central'],
    estimatedCost: { amount: 450, currency: 'EUR' },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockActivities = [
  {
    id: 'activity_eiffel',
    title: 'Eiffel Tower Skip-the-Line Tour',
    description: 'Fast-track access to Paris\'s most iconic landmark',
    category: 'sightseeing' as const,
    location: 'Paris, France',
    coordinates: { latitude: 48.8584, longitude: 2.2945 },
    timeSlots: [
      { start: '09:00', end: '11:00', duration: 120 },
      { start: '14:00', end: '16:00', duration: 120 }
    ],
    difficulty: 'easy' as const,
    indoorOutdoor: 'outdoor' as const,
    accessibility: {
      wheelchairAccessible: false,
      hearingImpaired: true,
      visuallyImpaired: false,
      mobilityAssistance: false
    },
    seasonality: ['year-round'],
    bookingRequired: true,
    images: ['eiffel.jpg'],
    tags: ['landmark', 'iconic', 'views'],
    estimatedCost: { amount: 35, currency: 'EUR' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'activity_louvre',
    title: 'Louvre Museum Guided Tour',
    description: 'Explore the world\'s largest art museum with an expert guide',
    category: 'cultural' as const,
    location: 'Paris, France',
    coordinates: { latitude: 48.8606, longitude: 2.3376 },
    timeSlots: [
      { start: '10:00', end: '13:00', duration: 180 },
      { start: '15:00', end: '18:00', duration: 180 }
    ],
    difficulty: 'easy' as const,
    indoorOutdoor: 'indoor' as const,
    accessibility: {
      wheelchairAccessible: true,
      hearingImpaired: true,
      visuallyImpaired: true,
      mobilityAssistance: true
    },
    seasonality: ['year-round'],
    bookingRequired: true,
    images: ['louvre.jpg'],
    tags: ['art', 'culture', 'museum'],
    estimatedCost: { amount: 55, currency: 'EUR' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'activity_seine',
    title: 'Seine River Evening Cruise',
    description: 'Romantic cruise along the Seine with dinner',
    category: 'culinary' as const,
    location: 'Paris, France',
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    timeSlots: [
      { start: '19:30', end: '22:00', duration: 150 }
    ],
    difficulty: 'easy' as const,
    indoorOutdoor: 'outdoor' as const,
    accessibility: {
      wheelchairAccessible: true,
      hearingImpaired: false,
      visuallyImpaired: false,
      mobilityAssistance: true
    },
    seasonality: ['spring', 'summer', 'fall'],
    bookingRequired: true,
    images: ['seine.jpg'],
    tags: ['romantic', 'dinner', 'cruise'],
    estimatedCost: { amount: 89, currency: 'EUR' },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockTransportation = [
  {
    id: 'transport_flight',
    title: 'Round-trip Flight to Paris',
    description: 'Economy class flights with major airline',
    type: 'flight' as const,
    from: 'New York, NY',
    to: 'Paris, France',
    departureTime: '08:00',
    arrivalTime: '20:30',
    duration: 450, // 7.5 hours
    provider: 'Air France',
    bookingReference: 'AF123456',
    estimatedCost: { amount: 650, currency: 'USD' },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function RealTimePricingDemo() {
  // Trip configuration state
  const [tripDates] = useState({
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-07-16')
  })
  
  const [travelers] = useState({
    adults: 2,
    children: 0,
    infants: 0
  })

  // Selected items state
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({
    accommodations: [],
    activities: [],
    transportation: []
  })

  // Pricing hook
  const {
    currentPricing,
    history,
    isCalculating,
    error,
    selectedCurrency,
    availableCurrencies,
    calculatePricing,
    changeCurrency,
    resetHistory,
    clearPricing
  } = useRealTimePricing()

  // Auto-calculate pricing when selections change
  useEffect(() => {
    if (selectedItems.accommodations.length > 0 || 
        selectedItems.activities.length > 0 || 
        selectedItems.transportation.length > 0) {
      calculatePricing(selectedItems, tripDates, travelers)
    }
  }, [selectedItems, tripDates, travelers, calculatePricing])

  // Demo action handlers
  const handleSelectAccommodation = (accommodation: typeof mockAccommodations[0]) => {
    setSelectedItems(prev => ({
      ...prev,
      accommodations: prev.accommodations.find(a => a.id === accommodation.id)
        ? prev.accommodations.filter(a => a.id !== accommodation.id)
        : [...prev.accommodations, accommodation]
    }))
  }

  const handleSelectActivity = (activity: typeof mockActivities[0]) => {
    setSelectedItems(prev => ({
      ...prev,
      activities: prev.activities.find(a => a.id === activity.id)
        ? prev.activities.filter(a => a.id !== activity.id)
        : [...prev.activities, activity]
    }))
  }

  const handleSelectTransportation = (transport: typeof mockTransportation[0]) => {
    setSelectedItems(prev => ({
      ...prev,
      transportation: prev.transportation.find(t => t.id === transport.id)
        ? prev.transportation.filter(t => t.id !== transport.id)
        : [...prev.transportation, transport]
    }))
  }

  const handleQuickDemo = () => {
    // Simulate a realistic selection flow
    const scenarios = [
      // Start with budget hotel + basic activities
      {
        accommodations: [mockAccommodations[0]],
        activities: [mockActivities[0]],
        transportation: []
      },
      // Add an activity
      {
        accommodations: [mockAccommodations[0]],
        activities: [mockActivities[0], mockActivities[1]],
        transportation: []
      },
      // Upgrade to luxury hotel
      {
        accommodations: [mockAccommodations[1]],
        activities: [mockActivities[0], mockActivities[1]],
        transportation: []
      },
      // Add dinner cruise
      {
        accommodations: [mockAccommodations[1]],
        activities: mockActivities,
        transportation: []
      },
      // Add transportation
      {
        accommodations: [mockAccommodations[1]],
        activities: mockActivities,
        transportation: [mockTransportation[0]]
      }
    ]

    let scenarioIndex = 0
    const interval = setInterval(() => {
      if (scenarioIndex < scenarios.length) {
        setSelectedItems(scenarios[scenarioIndex])
        scenarioIndex++
      } else {
        clearInterval(interval)
      }
    }, 2000)
  }

  const totalSelectedItems = 
    selectedItems.accommodations.length + 
    selectedItems.activities.length + 
    selectedItems.transportation.length

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Real-time Pricing System</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience dynamic pricing updates as you customize your trip. Watch costs change in real-time 
          with animated breakdowns, currency conversion, and detailed pricing history.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={handleQuickDemo} className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Quick Demo
          </Button>
          <Button variant="outline" onClick={clearPricing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Trip Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Trip Overview
          </CardTitle>
          <CardDescription>
            Configure your trip and see pricing updates in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Dates</div>
                <div className="text-xs text-muted-foreground">
                  {tripDates.startDate.toLocaleDateString()} - {tripDates.endDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">Travelers</div>
                <div className="text-xs text-muted-foreground">
                  {travelers.adults} Adults, {travelers.children} Children
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm font-medium">Selected Items</div>
                <div className="text-xs text-muted-foreground">
                  {totalSelectedItems} {totalSelectedItems === 1 ? 'item' : 'items'} selected
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Item Selection */}
        <div className="space-y-6">
          <Tabs defaultValue="accommodations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accommodations">Hotels</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="transportation">Transport</TabsTrigger>
            </TabsList>
            
            <TabsContent value="accommodations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Accommodations</CardTitle>
                  <CardDescription>
                    Choose your hotels and watch pricing update instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockAccommodations.map((accommodation) => (
                    <div
                      key={accommodation.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedItems.accommodations.find(a => a.id === accommodation.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectAccommodation(accommodation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{accommodation.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {accommodation.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {accommodation.starRating} ⭐
                            </Badge>
                            <Badge variant="outline">
                              {accommodation.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            €{accommodation.pricing.adult}/night
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per adult
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Activities</CardTitle>
                  <CardDescription>
                    Add activities and see costs update in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedItems.activities.find(a => a.id === activity.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectActivity(activity)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {activity.category}
                            </Badge>
                            <Badge variant="outline">
                              {activity.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            €{activity.estimatedCost.amount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per person
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transportation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Transportation</CardTitle>
                  <CardDescription>
                    Add flights and see total trip cost
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTransportation.map((transport) => (
                    <div
                      key={transport.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedItems.transportation.find(t => t.id === transport.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectTransportation(transport)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{transport.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {transport.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {transport.type}
                            </Badge>
                            <Badge variant="outline">
                              {transport.provider}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${transport.estimatedCost.amount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per person
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Pricing */}
        <div className="space-y-6">
          {/* Pricing Breakdown */}
          <PricingBreakdown
            pricing={currentPricing}
            history={history}
            isCalculating={isCalculating}
            error={error}
            selectedCurrency={selectedCurrency}
            availableCurrencies={availableCurrencies}
            onCurrencyChange={changeCurrency}
          />
          
          {/* Pricing History */}
          <PricingHistoryTracker
            history={history}
            currentPricing={currentPricing}
            selectedCurrency={selectedCurrency}
            onResetHistory={resetHistory}
          />
        </div>
      </div>

      {/* Features Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Pricing Features</CardTitle>
          <CardDescription>
            Comprehensive pricing system with advanced functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="font-medium mb-1">Live Updates</div>
              <div className="text-sm text-muted-foreground">
                Instant pricing calculation as you modify your trip
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="font-medium mb-1">Animated Changes</div>
              <div className="text-sm text-muted-foreground">
                Smooth price transitions with visual feedback
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="font-medium mb-1">History Tracking</div>
              <div className="text-sm text-muted-foreground">
                Complete log of pricing changes and modifications
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="font-medium mb-1">Multi-Currency</div>
              <div className="text-sm text-muted-foreground">
                Support for 6 currencies with real-time conversion
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 