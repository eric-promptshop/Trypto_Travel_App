"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Clock, 
  Camera, 
  Map, 
  Share2, 
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  Plane,
  Hotel,
  Car,
  Utensils,
  Activity
} from "lucide-react"
import { useRouter } from 'next/navigation'

interface GeneratedItinerary {
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: number
  totalBudget: number
  days: ItineraryDay[]
  highlights: string[]
  tips: string[]
  estimatedTotalCost: number
}

interface ItineraryDay {
  day: number
  date: string
  title: string
  description: string
  activities: {
    time: string
    title: string
    description: string
    duration: string
    location: string
    price?: number
    type: string
  }[]
  accommodation?: {
    name: string
    type: string
    price: number
    location: string
  }
  meals: {
    type: string
    venue: string
    cuisine: string
    price: number
  }[]
  totalCost: number
}

export default function ItineraryDisplay() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = React.useState(1)
  const [itinerary, setItinerary] = React.useState<GeneratedItinerary | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Load itinerary from sessionStorage
    const storedItinerary = sessionStorage.getItem('generatedItinerary')
    const itineraryId = sessionStorage.getItem('itineraryId')
    
    if (storedItinerary) {
      try {
        const parsed = JSON.parse(storedItinerary) as GeneratedItinerary
        setItinerary(parsed)
      } catch (error) {
        console.error('Failed to parse itinerary:', error)
      }
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your itinerary...</p>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Itinerary Found</h1>
          <p className="text-gray-600 mb-4">Please generate an itinerary first.</p>
          <Button onClick={() => router.push('/plan')}>
            Create New Itinerary
          </Button>
        </div>
      </div>
    )
  }

  const currentDay = itinerary.days.find(day => day.day === selectedDay) || itinerary.days[0]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCategoryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'activity':
      case 'sightseeing':
        return <Activity className="w-4 h-4" />
      case 'dining':
      case 'food':
        return <Utensils className="w-4 h-4" />
      case 'accommodation':
        return <Hotel className="w-4 h-4" />
      case 'transport':
        return <Car className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/plan')}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Planning
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Save PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Trip Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your {itinerary.duration}-Day {itinerary.destination} Adventure
          </h1>
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="text-base px-3 py-1">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
            </Badge>
            <Badge variant="outline" className="text-base px-3 py-1">
              <Users className="w-4 h-4 mr-2" />
              {itinerary.travelers} {itinerary.travelers === 1 ? 'Traveler' : 'Travelers'}
            </Badge>
            <Badge variant="outline" className="text-base px-3 py-1">
              <DollarSign className="w-4 h-4 mr-2" />
              ${itinerary.estimatedTotalCost.toLocaleString()} total
            </Badge>
          </div>
        </div>

        {/* Highlights and Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Trip Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {itinerary.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm">{highlight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-500" />
                Travel Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {itinerary.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Day Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Day</h3>
              <div className="text-sm text-gray-500">
                {itinerary.duration} days total
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {itinerary.days.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-2 font-medium text-sm transition-all ${
                    selectedDay === day.day
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-primary/50'
                  }`}
                  aria-label={`Select day ${day.day}`}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      Day {currentDay.day} - {currentDay.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {formatDate(currentDay.date)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    ${currentDay.totalCost}/person
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Day description */}
                <p className="text-gray-700 leading-relaxed">
                  {currentDay.description}
                </p>

                {/* Accommodation */}
                {currentDay.accommodation && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Hotel className="w-4 h-4" />
                      Accommodation
                    </h4>
                    <Card className="p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{currentDay.accommodation.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{currentDay.accommodation.location}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {currentDay.accommodation.type}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold">${currentDay.accommodation.price}/night</p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Activities */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Activities & Experiences
                  </h4>
                  
                  <div className="space-y-4">
                    {currentDay.activities.map((activity, index) => (
                      <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">{activity.title}</h5>
                              {activity.price && (
                                <span className="text-sm font-semibold">${activity.price}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.time} ({activity.duration})
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.location}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Meals */}
                {currentDay.meals && currentDay.meals.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Dining Recommendations
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {currentDay.meals.map((meal, index) => (
                        <Card key={index} className="p-3">
                          <h5 className="font-medium text-sm capitalize mb-1">{meal.type}</h5>
                          <p className="text-sm text-gray-600">{meal.venue}</p>
                          <p className="text-xs text-gray-500">{meal.cuisine} cuisine</p>
                          <p className="text-sm font-semibold mt-2">${meal.price}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Day Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Day Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activities</span>
                  <span className="font-semibold">{currentDay.activities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Accommodation</span>
                  <span className="font-semibold">
                    ${currentDay.accommodation?.price || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activities</span>
                  <span className="font-semibold">
                    ${currentDay.activities.reduce((sum, a) => sum + (a.price || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Meals</span>
                  <span className="font-semibold">
                    ${currentDay.meals.reduce((sum, m) => sum + m.price, 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total per person</span>
                  <span className="font-bold text-lg">${currentDay.totalCost}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {itinerary.days.slice(0, 5).map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(day.day)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedDay === day.day
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">Day {day.day}</div>
                      <div className="text-gray-500 truncate text-xs">{day.title}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}