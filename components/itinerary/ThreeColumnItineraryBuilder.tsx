"use client"

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { format, differenceInDays } from 'date-fns'
import { 
  Plus,
  MessageCircle,
  Mic,
  Edit2,
  MapPin,
  Calendar,
  Clock,
  Share2,
  Save,
  User,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useItineraryUI } from './ItineraryUIContext'
import { Skeleton } from '@/components/ui/skeleton-components'

// Dynamic imports
const ItineraryMap = dynamic(
  () => import('./ItineraryMap').then(mod => ({ default: mod.ItineraryMap })),
  { 
    ssr: false,
    loading: () => <Skeleton type="map" />
  }
)

const AIAssistantChat = lazy(() => import('./AIAssistantChat').then(mod => ({ default: mod.AIAssistantChat })))

// Types
interface Destination {
  id: string
  name: string
  startDate: Date
  endDate: Date
  days: Day[]
}

interface Day {
  id: string
  dayNumber: number
  date: Date
  title: string
  description: string
  activities: Activity[]
  images: DayImage[]
}

interface Activity {
  id: string
  name: string
  time?: string
  location: {
    lat: number
    lng: number
    address?: string
  }
  description?: string
  provider?: string
  isRecommendedTour?: boolean
  price?: number
  bookingUrl?: string
  rating?: number
}

interface DayImage {
  id: string
  url: string
  alt: string
  location?: string
}

interface ThreeColumnItineraryBuilderProps {
  tripId: string
  initialItinerary?: any
  onSave?: (itinerary: any) => void
  onBack?: () => void
}


export function ThreeColumnItineraryBuilder({
  tripId,
  initialItinerary,
  onSave,
  onBack
}: ThreeColumnItineraryBuilderProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [activeTab, setActiveTab] = useState('itinerary')
  
  const { selectedDay, setSelectedDay, selectedLocationId, setSelectedLocationId, highlightedLocationId, setHighlightedLocationId } = useItineraryUI()
  
  // Initialize from initialItinerary
  useEffect(() => {
    const initializeItinerary = async () => {
      if (initialItinerary) {
        // Parse initial itinerary
        const parsedDestinations = await parseItinerary(initialItinerary)
        setDestinations(parsedDestinations)
        if (parsedDestinations.length > 0) {
          setSelectedDestination(parsedDestinations[0].id)
          if (parsedDestinations[0].days.length > 0 && selectedDay === 1) {
            // Only set selectedDay if it hasn't been set from URL
            setSelectedDay(1)
          }
        }
      }
    }
    
    initializeItinerary()
  }, [initialItinerary])
  
  // Fetch images for a day using Unsplash API
  const fetchDayImages = async (dayTitle: string, destinationName: string): Promise<DayImage[]> => {
    try {
      // Use the images API endpoint to fetch from Unsplash
      const searchQuery = `${destinationName} ${dayTitle.split(' ').slice(-1)[0]}` // e.g., "Paris Montmartre"
      const response = await fetch(`/api/images?query=${encodeURIComponent(searchQuery)}&count=3`)
      
      if (!response.ok) {
        console.error('Failed to fetch images')
        return []
      }
      
      const data = await response.json()
      
      return data.images.map((img: any, index: number) => ({
        id: `img-${Date.now()}-${index}`,
        url: img.url,
        alt: img.alt || searchQuery,
        location: destinationName
      }))
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }
  
  // Parse itinerary from API format
  const parseItinerary = async (itinerary: any): Promise<Destination[]> => {
    const destinations: Destination[] = []
    
    if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
      return destinations
    }
    
    // Get trip details
    const tripTitle = itinerary.title || 'Trip'
    const tripLocation = itinerary.location || itinerary.destination || 'Unknown'
    const startDate = itinerary.startDate ? new Date(itinerary.startDate) : new Date()
    const endDate = itinerary.endDate ? new Date(itinerary.endDate) : new Date()
    
    // Create single destination from itinerary
    const destination: Destination = {
      id: tripLocation.toLowerCase().replace(/\s+/g, '-'),
      name: tripLocation,
      startDate,
      endDate,
      days: []
    }
    
    // Parse days
    for (let i = 0; i < itinerary.days.length; i++) {
      const day = itinerary.days[i]
      const dayNumber = i + 1
      
      const parsedDay: Day = {
        id: `${destination.id}-day-${dayNumber}`,
        dayNumber,
        date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)),
        title: day.title || `Day ${dayNumber}`,
        description: day.description || day.highlights?.join('. ') || '',
        activities: [],
        images: []
      }
      
      // Parse activities from different possible formats
      const activities = day.activities || []
      const meals = day.meals || []
      const accommodation = day.accommodation
      
      // Add activities
      activities.forEach((activity: any, index: number) => {
        parsedDay.activities.push({
          id: `activity-${dayNumber}-${index}`,
          name: activity.name || activity.title || activity,
          time: activity.time || `${9 + index * 2}:00 AM`,
          location: {
            lat: activity.coordinates?.lat || activity.location?.lat || 48.8566 + (Math.random() - 0.5) * 0.1,
            lng: activity.coordinates?.lng || activity.location?.lng || 2.3522 + (Math.random() - 0.5) * 0.1,
            address: activity.address || activity.location?.address
          },
          description: activity.description || activity.details,
          provider: activity.provider,
          isRecommendedTour: activity.isRecommendedTour,
          price: activity.price,
          bookingUrl: activity.bookingUrl,
          rating: activity.rating
        })
      })
      
      // Add meals as activities
      meals.forEach((meal: any, index: number) => {
        const mealTimes: { [key: string]: string } = {
          breakfast: '8:00 AM',
          lunch: '12:30 PM',
          dinner: '7:00 PM'
        }
        
        parsedDay.activities.push({
          id: `meal-${dayNumber}-${index}`,
          name: meal.restaurant || meal.name || `${meal.type || 'Meal'} at local restaurant`,
          time: mealTimes[meal.type] || '12:00 PM',
          location: {
            lat: meal.coordinates?.lat || 48.8566 + (Math.random() - 0.5) * 0.1,
            lng: meal.coordinates?.lng || 2.3522 + (Math.random() - 0.5) * 0.1,
            address: meal.address
          },
          description: meal.cuisine ? `${meal.cuisine} cuisine` : ''
        })
      })
      
      // Add accommodation check-in/out
      if (accommodation && i === 0) {
        parsedDay.activities.unshift({
          id: `accommodation-${dayNumber}`,
          name: `Check-in: ${accommodation.name || 'Hotel'}`,
          time: '3:00 PM',
          location: {
            lat: accommodation.coordinates?.lat || 48.8566,
            lng: accommodation.coordinates?.lng || 2.3522,
            address: accommodation.address
          },
          description: accommodation.type || 'Accommodation'
        })
      }
      
      // Sort activities by time
      parsedDay.activities.sort((a, b) => {
        const timeA = a.time ? new Date(`2000-01-01 ${a.time}`).getTime() : 0
        const timeB = b.time ? new Date(`2000-01-01 ${b.time}`).getTime() : 0
        return timeA - timeB
      })
      
      // Fetch images for this day
      parsedDay.images = await fetchDayImages(parsedDay.title, tripLocation)
      
      destination.days.push(parsedDay)
    }
    
    destinations.push(destination)
    return destinations
  }
  
  // Get current destination and day
  const currentDestination = destinations.find(d => d.id === selectedDestination)
  const currentDay = currentDestination?.days.find(d => d.dayNumber === selectedDay)
  
  // Get map center based on current day's activities
  const getMapCenter = (): [number, number] => {
    if (currentDay && currentDay.activities.length > 0) {
      // Calculate center of all activities
      const validActivities = currentDay.activities.filter(a => a.location.lat && a.location.lng)
      if (validActivities.length > 0) {
        const avgLat = validActivities.reduce((sum, a) => sum + a.location.lat, 0) / validActivities.length
        const avgLng = validActivities.reduce((sum, a) => sum + a.location.lng, 0) / validActivities.length
        return [avgLat, avgLng]
      }
    }
    
    // Fallback to destination coordinates if available
    if (currentDestination && currentDestination.name) {
      // Use geocoding or predefined coordinates for major cities
      const cityCoordinates: { [key: string]: [number, number] } = {
        'paris': [48.8566, 2.3522],
        'london': [51.5074, -0.1278],
        'new york': [40.7128, -74.0060],
        'tokyo': [35.6762, 139.6503],
        'rome': [41.9028, 12.4964],
        'barcelona': [41.3851, 2.1734],
        'amsterdam': [52.3676, 4.9041],
        'berlin': [52.5200, 13.4050]
      }
      
      const cityKey = currentDestination.name.toLowerCase().split(',')[0].trim()
      if (cityCoordinates[cityKey]) {
        return cityCoordinates[cityKey]
      }
    }
    
    return [48.8566, 2.3522] // Default to Paris center
  }
  
  const handleAddDay = (destinationId: string) => {
    // TODO: Implement add day functionality
    console.log('Add day to destination:', destinationId)
  }
  
  const handleMakeChanges = () => {
    // TODO: Implement edit mode
    console.log('Make changes to current day')
  }
  
  const handleSaveTrip = () => {
    if (onSave) {
      onSave({ destinations })
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Form
                </Button>
              )}
              
              <Separator orientation="vertical" className="h-6" />
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="itinerary">ITINERARY</TabsTrigger>
                  <TabsTrigger value="lodging">LODGING</TabsTrigger>
                  <TabsTrigger value="flights">FLIGHTS</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTrip}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                SAVE TRIP
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content - Three Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Destination & Day Selector */}
        <div className="w-80 bg-white border-r flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {destinations.map((destination) => (
                <div key={destination.id} className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(destination.startDate, 'MMM d')} - {format(destination.endDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {differenceInDays(destination.endDate, destination.startDate) + 1} nights
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {destination.days.map((day) => (
                      <motion.div
                        key={day.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: day.dayNumber * 0.05 }}
                      >
                        <Button
                          variant={selectedDay === day.dayNumber ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedDestination(destination.id)
                            setSelectedDay(day.dayNumber)
                          }}
                        >
                          Day {day.dayNumber}
                        </Button>
                      </motion.div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center gap-2"
                      onClick={() => handleAddDay(destination.id)}
                    >
                      <Plus className="h-3 w-3" />
                      Add Day
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Center Panel - Day Details & Map */}
        <div className="flex-1 flex flex-col">
          {/* Day Details */}
          <div className="bg-white border-b p-6">
            <AnimatePresence mode="wait">
              {currentDay && (
                <motion.div
                  key={currentDay.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">
                            Day {currentDay.dayNumber} - {currentDay.title}
                          </h2>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{currentDestination?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(currentDay.date, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-3">
                        {currentDay.description}
                        <Button variant="link" size="sm" className="ml-1 p-0 h-auto">
                          See more...
                        </Button>
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMakeChanges}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Make Changes
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAIAssistant(true)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Activities Timeline */}
                  <div className="mt-6 space-y-3">
                    {currentDay.activities.map((activity, index) => (
                      <motion.div 
                        key={activity.id} 
                        className="flex gap-3 cursor-pointer"
                        onMouseEnter={() => setHighlightedLocationId(activity.id)}
                        onMouseLeave={() => setHighlightedLocationId(null)}
                        onClick={() => setSelectedLocationId(activity.id)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            highlightedLocationId === activity.id ? "bg-orange-500" : "bg-blue-500"
                          )} />
                          {index < currentDay.activities.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start gap-2">
                                <h4 className="font-medium">{activity.name}</h4>
                                {activity.isRecommendedTour && (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    Recommended Tour
                                  </Badge>
                                )}
                              </div>
                              {activity.provider && (
                                <p className="text-xs text-gray-500 mt-0.5">by {activity.provider}</p>
                              )}
                              {activity.time && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{activity.time}</span>
                                </div>
                              )}
                              {activity.description && (
                                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              )}
                              {activity.price && (
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm font-medium">${activity.price} pp</span>
                                  {activity.rating && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-yellow-500">★</span>
                                      <span className="text-sm">{activity.rating}</span>
                                    </div>
                                  )}
                                  {activity.bookingUrl && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => window.open(activity.bookingUrl, '_blank')}
                                    >
                                      Book Tour
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          
          {/* Interactive Map */}
          <div className="flex-1 relative">
            {currentDay && (
              <ItineraryMap
                activities={currentDay.activities}
                center={getMapCenter()}
              />
            )}
          </div>
        </div>
        
        {/* Right Sidebar - Visual Gallery */}
        <div className="w-80 bg-white border-l">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Visual Highlights</h3>
              
              <Suspense fallback={<Skeleton type="gallery" />}>
                {destinations.map((destination) => 
                  destination.days.map((day) => (
                    <motion.div
                      key={day.id}
                      className={cn(
                        "space-y-3 p-3 rounded-lg transition-colors cursor-pointer",
                        selectedDay === day.dayNumber ? "bg-blue-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => {
                        setSelectedDestination(destination.id)
                        setSelectedDay(day.dayNumber)
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {day.images.map((image, idx) => (
                        <div 
                          key={image.id} 
                          className={cn(
                            "relative aspect-video rounded-lg overflow-hidden transition-all",
                            highlightedLocationId === day.activities[idx]?.id && "ring-2 ring-orange-500"
                          )}
                          onMouseEnter={() => day.activities[idx] && setHighlightedLocationId(day.activities[idx].id)}
                          onMouseLeave={() => setHighlightedLocationId(null)}
                        >
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 text-white">
                            <p className="text-sm font-medium">Day {day.dayNumber}</p>
                            <p className="text-xs opacity-90">{day.title}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ))
                )}
              </Suspense>
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* AI Assistant Chat */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIAssistantChat
            tripId={tripId}
            currentDay={currentDay}
            currentDestination={currentDestination}
            onClose={() => setShowAIAssistant(false)}
            onUpdateItinerary={(updates) => {
              // TODO: Implement itinerary updates from AI
              console.log('AI suggested updates:', updates)
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Floating AI Assistant Button */}
      {!showAIAssistant && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors z-40"
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  )
}