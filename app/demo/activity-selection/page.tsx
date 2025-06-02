"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ActivitySelector, ActivityTimeline } from "@/components/trip-customization"
import { Calendar, Users, MapPin, DollarSign } from "lucide-react"

// Mock selected activity type to match the component interfaces
interface SelectedActivity {
  id: string
  name: string
  description: string
  category: 'adventure' | 'cultural' | 'culinary' | 'nature' | 'entertainment' | 'shopping' | 'historical' | 'art' | 'sports' | 'nightlife'
  imageUrl: string
  location: {
    address: string
    city: string
    coordinates: [number, number]
  }
  duration: {
    min: number
    max: number
    typical: number
  }
  pricing: {
    currency: string
    adult: number
    child?: number
    isFree: boolean
  }
  rating: {
    overall: number
    reviewCount: number
  }
  selectedDate: string
  selectedTimeSlot: string
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
}

export default function ActivitySelectionDemo() {
  // Demo state
  const [selectedActivities, setSelectedActivities] = React.useState<SelectedActivity[]>([])
  const [currentView, setCurrentView] = React.useState<'selection' | 'timeline'>('selection')

  // Demo trip parameters
  const destination = "Paris, France"
  const tripDates = {
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-04')
  }
  const participants = {
    adults: 2,
    children: 1
  }

  // Event handlers
  const handleActivitySelect = (activity: SelectedActivity) => {
    setSelectedActivities(prev => [...prev, activity])
  }

  const handleActivityRemove = (activityId: string) => {
    setSelectedActivities(prev => prev.filter(a => a.id !== activityId))
  }

  const handleAddActivityClick = (date: string) => {
    setCurrentView('selection')
  }

  // Calculate summary stats
  const totalPrice = selectedActivities.reduce((sum, activity) => sum + activity.totalPrice, 0)
  const totalActivities = selectedActivities.length

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Activity Selection & Management Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Task 5.3: Build Activity Selection and Management System
          </p>
          
          {/* Trip Summary */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Trip Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold">{destination}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">4 days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Travelers</p>
                    <p className="font-semibold">{participants.adults} adults, {participants.children} child</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Activities Total</p>
                    <p className="font-semibold">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Activities Summary */}
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="outline" className="text-base px-3 py-1">
              {totalActivities} Activities Selected
            </Badge>
            <Badge variant="secondary" className="text-base px-3 py-1">
              Total: {formatPrice(totalPrice)}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="selection">Activity Selection</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          {/* Activity Selection Tab */}
          <TabsContent value="selection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Selection Interface</CardTitle>
                <CardDescription>
                  Browse and select activities with advanced filtering, search, and category options.
                  Features demonstrated:
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Category Filtering</Badge>
                  <Badge variant="secondary">Search with Autocomplete</Badge>
                  <Badge variant="secondary">Price & Duration Filters</Badge>
                  <Badge variant="secondary">Grid/List View</Badge>
                  <Badge variant="secondary">Favorites System</Badge>
                  <Badge variant="secondary">Real-time Pricing</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ActivitySelector
                  destination={destination}
                  tripDates={tripDates}
                  onActivitySelect={handleActivitySelect}
                  onActivityRemove={handleActivityRemove}
                  selectedActivities={selectedActivities}
                  participants={participants}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline View Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline & Conflict Detection</CardTitle>
                <CardDescription>
                  View selected activities organized by day with automatic conflict detection.
                  Features demonstrated:
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Day-by-Day Timeline</Badge>
                  <Badge variant="secondary">Time Conflict Detection</Badge>
                  <Badge variant="secondary">Empty State Handling</Badge>
                  <Badge variant="secondary">Activity Management</Badge>
                  <Badge variant="secondary">Duration & Pricing Summary</Badge>
                  <Badge variant="secondary">Add Activity Suggestions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  selectedActivities={selectedActivities}
                  tripDates={tripDates}
                  onActivityRemove={handleActivityRemove}
                  onAddActivityClick={handleAddActivityClick}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Features</CardTitle>
            <CardDescription>
              Task 5.3 deliverables completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">✅ Activity Cards</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Images, descriptions, duration, and pricing</li>
                  <li>• Category badges and difficulty indicators</li>
                  <li>• Star ratings and review counts</li>
                  <li>• Feature badges (guided tour, accessible, etc.)</li>
                  <li>• Add/remove functionality with animations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">✅ Category-based Filtering</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cultural, adventure, culinary, nature, etc.</li>
                  <li>• Duration and price range sliders</li>
                  <li>• Difficulty level filtering</li>
                  <li>• Feature-based filtering</li>
                  <li>• Real-time filter application</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">✅ Search & Autocomplete</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Search by name, description, tags</li>
                  <li>• Autocomplete suggestions with images</li>
                  <li>• Real-time search results</li>
                  <li>• Search result highlighting</li>
                  <li>• Multiple sorting options</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">✅ Timeline View</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Day-by-day activity organization</li>
                  <li>• Time conflict detection and alerts</li>
                  <li>• Empty state suggestions</li>
                  <li>• Activity duration and pricing summaries</li>
                  <li>• Quick add/remove actions</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h4 className="font-semibold mb-3">🔧 Technical Implementation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900 mb-2">TypeScript Interfaces</p>
                  <p>Comprehensive type safety with Activity, SelectedActivity, and filter interfaces</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">State Management</p>
                  <p>React hooks for activity selection, filtering, favorites, and conflict detection</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Responsive Design</p>
                  <p>Mobile-first design with grid/list views and touch-friendly interactions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button 
            onClick={() => setCurrentView('selection')}
            variant={currentView === 'selection' ? 'default' : 'outline'}
          >
            Select Activities
          </Button>
          <Button 
            onClick={() => setCurrentView('timeline')}
            variant={currentView === 'timeline' ? 'default' : 'outline'}
          >
            View Timeline
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedActivities([])}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  )
} 