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
  Car
} from "lucide-react"
import { ResponsiveImage } from '../../components/images/responsive-image'
import { OrientationAwareLayout, useLayoutInfo } from '@/components/layout/orientation-aware-layout'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

interface ItineraryDay {
  id: number
  date: Date
  title: string
  description: string
  activities: Activity[]
  accommodation?: Hotel
  transportation?: Transportation[]
  totalCost: number
}

interface Activity {
  id: string
  name: string
  description: string
  category: 'cultural' | 'adventure' | 'dining' | 'sightseeing' | 'shopping'
  startTime: string
  endTime: string
  duration: number // minutes
  location: {
    name: string
    address: string
    coordinates: [number, number]
  }
  imageUrl: string
  price: number
  rating: number
}

interface Hotel {
  id: string
  name: string
  starRating: number
  address: string
  imageUrl: string
  amenities: string[]
  checkIn: string
  checkOut: string
  pricePerNight: number
}

interface Transportation {
  id: string
  type: 'flight' | 'train' | 'bus' | 'car'
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  price: number
  duration: number // minutes
}

export default function ItineraryDisplay() {
  const [selectedDay, setSelectedDay] = React.useState(1)
  const [selectedView, setSelectedView] = React.useState<'itinerary' | 'map'>('itinerary')

  // Mock data based on the TripNav mockup
  const tripData = {
    title: "Jenny & Tim's Date to South America",
    subtitle: "Peru & Brazil • 13 Days • 4 Travelers",
    budget: "$2,400/person",
    totalDays: 13
  }

  const mockItinerary: ItineraryDay[] = [
    {
      id: 1,
      date: new Date('2024-05-20'),
      title: "Arrival to the City of Kings",
      description: "Lima is not just political capital of Peru, but when it comes to gastronomy, it is one of the capitals of the world! Food is certainly one of the aspects of Peru that charms visitors most and with good reason. You'll get your first taste of it on arrival in this culinary paradise.",
      activities: [
        {
          id: '1-1',
          name: "Airport Pickup & Hotel Check-in",
          description: "Private transfer from Lima airport to your hotel",
          category: 'sightseeing',
          startTime: '14:00',
          endTime: '16:00',
          duration: 120,
          location: {
            name: "Jorge Chávez International Airport",
            address: "Lima, Peru",
            coordinates: [-77.1144, -12.0219]
          },
          imageUrl: "/api/placeholder/400/250",
          price: 45,
          rating: 4.8
        },
        {
          id: '1-2',
          name: "Lima Historic Center Walking Tour",
          description: "Explore the colonial architecture and historic sites of Lima's city center",
          category: 'cultural',
          startTime: '17:00',
          endTime: '19:30',
          duration: 150,
          location: {
            name: "Plaza Mayor",
            address: "Lima Historic Center, Peru",
            coordinates: [-77.0299, -12.0464]
          },
          imageUrl: "/api/placeholder/400/250",
          price: 35,
          rating: 4.6
        }
      ],
      accommodation: {
        id: 'hotel-1',
        name: "Hotel Casa Andina Premium",
        starRating: 4,
        address: "Miraflores, Lima",
        imageUrl: "/api/placeholder/400/250",
        amenities: ["WiFi", "Pool", "Restaurant", "Airport Shuttle"],
        checkIn: "14:00",
        checkOut: "12:00",
        pricePerNight: 120
      },
      totalCost: 200
    },
    {
      id: 2,
      date: new Date('2024-05-21'),
      title: "Lima Like a Local",
      description: "This fascinating walking tour will help you gain a little insight into the local Limeño culture and history. After being picked up from your hotel at 9 a.m., you will take you to the Miraflores market.",
      activities: [
        {
          id: '2-1',
          name: "Miraflores Market Tour",
          description: "Explore local markets and taste traditional Peruvian ingredients",
          category: 'cultural',
          startTime: '09:00',
          endTime: '12:00',
          duration: 180,
          location: {
            name: "Mercado de Surquillo",
            address: "Miraflores, Lima",
            coordinates: [-77.0095, -12.1094]
          },
          imageUrl: "/api/placeholder/400/250",
          price: 55,
          rating: 4.7
        },
        {
          id: '2-2',
          name: "Cooking Class & Lunch",
          description: "Learn to prepare traditional Peruvian dishes with a local chef",
          category: 'dining',
          startTime: '14:00',
          endTime: '17:00',
          duration: 180,
          location: {
            name: "Lima Cooking Experience",
            address: "Barranco, Lima",
            coordinates: [-77.0208, -12.1464]
          },
          imageUrl: "/api/placeholder/400/250",
          price: 75,
          rating: 4.9
        }
      ],
      totalCost: 130
    }
  ]

  const currentDay = mockItinerary.find(day => day.id === selectedDay) || mockItinerary[0]

  // Ensure we always have a valid currentDay
  if (!currentDay) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Itinerary Data</h1>
          <p className="text-gray-600">Please check back later.</p>
        </div>
      </div>
    )
  }

  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    })
  }

  const getTotalDuration = (activities: Activity[]) => {
    return activities.reduce((total, activity) => total + activity.duration, 0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="logo-text text-2xl text-blue-900">TripNav</div>
            </div>

            {/* Action buttons */}
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

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Trip Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {tripData.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {tripData.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-base px-3 py-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  May 20 - June 1, 2024
                </Badge>
                <Badge variant="outline" className="text-base px-3 py-1">
                  <Users className="w-4 h-4 mr-2" />
                  4 Travelers
                </Badge>
                <Badge variant="outline" className="text-base px-3 py-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {tripData.budget}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Day Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-responsive-lg font-semibold text-gray-900">Select Day</h3>
              <div className="text-sm text-gray-500">
                {tripData.totalDays} days total
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: tripData.totalDays }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`touch-target flex-shrink-0 w-12 h-12 rounded-full border-2 font-medium text-sm transition-all ${
                    selectedDay === day
                      ? 'border-blue-900 bg-blue-900 text-white active'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'
                  }`}
                  aria-label={`Select day ${day}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid - Replace with OrientationAwareLayout */}
        <OrientationAwareLayout
          className="mt-6"
          config={{
            hideSidebarsInLandscape: true,
            stackVerticallyInPortrait: true,
            sidebarAsBottomSheet: false,
            enableSwipeNavigation: true
          }}
          sidebar={
            /* Left Sidebar - Trip Overview */
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Trip Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Day</span>
                    <span className="font-semibold">Day {selectedDay} of {tripData.totalDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today's Activities</span>
                    <span className="font-semibold">{currentDay.activities.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Duration</span>
                    <span className="font-semibold">{formatDuration(getTotalDuration(currentDay.activities))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Day Cost</span>
                    <span className="font-semibold">${currentDay.totalCost}</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Quick day navigation */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Quick Navigation</h4>
                  <div className="space-y-1">
                    {mockItinerary.slice(0, 5).map((day) => (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={`w-full text-left p-2 rounded text-sm transition-colors touch-target ${
                          selectedDay === day.id
                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Day {day.id}</div>
                        <div className="text-gray-500 truncate">{day.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          }
          rightPanel={
            /* Right Sidebar - Photos & Map */
            <div className="space-y-6">
              {/* View Toggle */}
              <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="itinerary" className="text-sm touch-target">
                    <Camera className="w-4 h-4 mr-2" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="map" className="text-sm touch-target">
                    <Map className="w-4 h-4 mr-2" />
                    Map View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="itinerary" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">View Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {currentDay.activities.slice(0, 4).map((activity) => (
                          <div key={activity.id} className="relative group cursor-pointer">
                            <ResponsiveImage
                              src={activity.imageUrl}
                              alt={activity.name}
                              width={150}
                              height={150}
                              className="w-full h-24 object-cover rounded-lg"
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 text-center px-2">
                                {activity.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-4 touch-target">
                        View All Photos
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="map" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Map View</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Map className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Interactive map view</p>
                          <p className="text-xs">Shows activity locations</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {currentDay.activities.slice(0, 3).map((activity, index) => (
                          <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.name}</p>
                              <p className="text-xs text-gray-500 truncate">{activity.location.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          }
        >
          {/* Center - Main Itinerary Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-responsive-xl">
                    Day {currentDay.id} - {currentDay.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-responsive-base">
                    {formatDate(currentDay.date)}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  ${currentDay.totalCost}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Day description */}
              <p className="text-gray-700 leading-relaxed text-responsive-base">
                {currentDay.description}
              </p>

              {/* Accommodation */}
              {currentDay.accommodation && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-responsive-lg">
                    <Hotel className="w-4 h-4" />
                    Accommodation
                  </h4>
                  <Card className="p-4 bg-gray-50">
                    <div className="flex gap-4">
                      <ResponsiveImage
                        src={currentDay.accommodation.imageUrl}
                        alt={currentDay.accommodation.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-responsive-base">{currentDay.accommodation.name}</h5>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: currentDay.accommodation.starRating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">{currentDay.accommodation.address}</p>
                        <p className="text-sm font-medium mt-2">${currentDay.accommodation.pricePerNight}/night</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Activities */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-responsive-lg">
                  <Clock className="w-4 h-4" />
                  Today's Activities
                </h4>
                
                <div className="space-y-4">
                  {currentDay.activities.map((activity, index) => (
                    <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        <ResponsiveImage
                          src={activity.imageUrl}
                          alt={activity.name}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 truncate text-responsive-base">{activity.name}</h5>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                              {activity.category}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{activity.location.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${activity.price}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </OrientationAwareLayout>

        {/* Mobile Bottom Navigation for accessing sidebar content */}
        <MobileBottomNav
          tripOverview={
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Day</span>
                  <span className="font-semibold">Day {selectedDay} of {tripData.totalDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Activities</span>
                  <span className="font-semibold">{currentDay.activities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Duration</span>
                  <span className="font-semibold">{formatDuration(getTotalDuration(currentDay.activities))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Day Cost</span>
                  <span className="font-semibold">${currentDay.totalCost}</span>
                </div>
              </div>
              
              {/* Quick day navigation */}
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-medium text-gray-900">Quick Navigation</h4>
                <div className="grid grid-cols-2 gap-2">
                  {mockItinerary.slice(0, 6).map((day) => (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDay(day.id)}
                      className={`text-left p-2 rounded text-sm transition-colors touch-target ${
                        selectedDay === day.id
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium">Day {day.id}</div>
                      <div className="text-gray-500 truncate text-xs">{day.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          }
          photosPanel={
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {currentDay.activities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="relative group cursor-pointer">
                    <ResponsiveImage
                      src={activity.imageUrl}
                      alt={activity.name}
                      width={150}
                      height={150}
                      className="w-full h-24 object-cover rounded-lg"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 text-center px-2">
                        {activity.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full touch-target">
                View All Photos
              </Button>
            </div>
          }
          mapPanel={
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Map className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Interactive map view</p>
                  <p className="text-xs">Shows activity locations</p>
                </div>
              </div>
              <div className="space-y-2">
                {currentDay.activities.slice(0, 4).map((activity, index) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.name}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.location.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
} 