"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Plane,
  Hotel,
  Map,
  Share2,
  Download,
  Edit3,
  RefreshCw
} from 'lucide-react'

// Import v0 components
import { LodgingView } from '@/components/lodging-view'
import { FlightsView } from '@/components/flights-view'
import { TravelersView } from '@/components/travelers-view'
import { TripCostView } from '@/components/trip-cost-view'
import { ModernItineraryViewer } from '@/components/itinerary/ModernItineraryViewer'

// Import context
import { EnhancedTripProvider, useEnhancedTrip } from '@/contexts/EnhancedTripContext'

function TripHeader() {
  const { state, actions } = useEnhancedTrip()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const trip = state.trip
  const itinerary = state.itinerary
  
  if (!trip) {
    return (
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await actions.refreshTrip()
    } finally {
      setIsRefreshing(false)
    }
  }
  
  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/trips')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Trips
            </Button>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {trip.title || 'Untitled Trip'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.location || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {trip.startDate && new Date(trip.startDate).toLocaleDateString()} - 
                    {trip.endDate && new Date(trip.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{itinerary?.travelers || 1} travelers</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Trip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TripDetailContent() {
  const { state } = useEnhancedTrip()
  const params = useParams()
  const tripId = params.id as string
  
  // Tab icons mapping
  const tabIcons = {
    itinerary: <Map className="h-4 w-4" />,
    lodging: <Hotel className="h-4 w-4" />,
    flights: <Plane className="h-4 w-4" />,
    travelers: <Users className="h-4 w-4" />,
    budget: <DollarSign className="h-4 w-4" />
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TripHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold">
                    ${state.costs?.totalBudget.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accommodations</p>
                  <p className="text-2xl font-bold">
                    {state.accommodations.searchResults.filter(a => a.status === 'booked').length}
                  </p>
                </div>
                <Hotel className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Flights</p>
                  <p className="text-2xl font-bold">
                    {state.flights.searchResults?.outbound.filter(f => f.status === 'booked').length || 0}
                  </p>
                </div>
                <Plane className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Travelers</p>
                  <p className="text-2xl font-bold">
                    {state.travelers?.travelers.length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="itinerary" className="gap-2">
              {tabIcons.itinerary}
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="lodging" className="gap-2">
              {tabIcons.lodging}
              Lodging
            </TabsTrigger>
            <TabsTrigger value="flights" className="gap-2">
              {tabIcons.flights}
              Flights
            </TabsTrigger>
            <TabsTrigger value="travelers" className="gap-2">
              {tabIcons.travelers}
              Travelers
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              {tabIcons.budget}
              Budget
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="itinerary" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {state.itinerary ? (
                <ModernItineraryViewer 
                  itinerary={state.itinerary}
                  onEdit={() => {/* TODO: Implement edit functionality */}}
                  onShare={() => {/* TODO: Implement share functionality */}}
                  onDownload={() => {/* TODO: Implement download functionality */}}
                />
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Itinerary Yet</h3>
                    <p className="text-gray-600">Start planning your trip to see your itinerary here.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="lodging" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LodgingView 
                tripId={tripId}
                editable={true}
                onBookAccommodation={(accommodationId, roomId) => {
                  // Accommodation booking is handled by the context
                }}
                onSearchAccommodations={() => {
                  // Search is handled by the context
                }}
              />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="flights" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FlightsView 
                tripId={tripId}
                editable={true}
                onBookFlight={(flightId) => {
                  // Flight booking is handled by the context
                }}
                onSearchFlights={() => {
                  // Search is handled by the context
                }}
              />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="travelers" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TravelersView 
                tripId={tripId}
                editable={true}
                onAddTraveler={() => {
                  // Add traveler is handled by the context
                }}
                onUpdateTraveler={(travelerId, updates) => {
                  // Update traveler is handled by the context
                }}
              />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TripCostView 
                tripId={tripId}
                editable={true}
                onUpdateBudget={(category, amount) => {
                  // Budget update is handled by the context
                }}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function TripDetailPage() {
  const params = useParams()
  const tripId = params.id as string
  
  return (
    <EnhancedTripProvider tripId={tripId}>
      <TripDetailContent />
    </EnhancedTripProvider>
  )
}