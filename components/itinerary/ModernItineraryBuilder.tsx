"use client"

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
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
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Moon,
  Sun,
  Hotel,
  Plane,
  MoreVertical,
  X,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useItineraryUI } from './ItineraryUIContext'
import { ModernTimeline, TimelineActivity } from './ModernTimeline'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

// Lazy load heavy components
const ItineraryMap = dynamic(
  () => import('./ItineraryMap').then(mod => ({ default: mod.ItineraryMap })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />
  }
)

const AIAssistantChat = lazy(() => import('./AIAssistantChat').then(mod => ({ default: mod.AIAssistantChat })))

// Types (same as original)
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
  duration?: number
  location: {
    lat: number
    lng: number
    address?: string
  }
  description?: string
  category?: 'dining' | 'activity' | 'transport' | 'accommodation' | 'shopping' | 'tour'
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

interface ModernItineraryBuilderProps {
  tripId: string
  initialItinerary?: any
  onSave?: (itinerary: any) => void
  onBack?: () => void
}

// Convert activity to timeline format
const activityToTimeline = (activity: Activity): TimelineActivity => ({
  ...activity,
  category: activity.category || 'activity'
})

// Tab icons
const tabIcons = {
  itinerary: Calendar,
  lodging: Hotel,
  flights: Plane
}

export function ModernItineraryBuilder({
  tripId,
  initialItinerary,
  onSave,
  onBack
}: ModernItineraryBuilderProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [activeTab, setActiveTab] = useState('itinerary')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  
  const { 
    selectedDay, 
    setSelectedDay, 
    selectedLocationId, 
    setSelectedLocationId, 
    highlightedLocationId, 
    setHighlightedLocationId 
  } = useItineraryUI()
  
  // Initialize from initialItinerary (same as original)
  useEffect(() => {
    const initializeItinerary = async () => {
      if (initialItinerary) {
        try {
          const parsedDestinations = await parseItinerary(initialItinerary)
          setDestinations(parsedDestinations)
          if (parsedDestinations.length > 0) {
            setSelectedDestination(parsedDestinations[0].id)
            if (parsedDestinations[0].days.length > 0 && selectedDay === 1) {
              setSelectedDay(1)
            }
          }
          
          // Fetch images after initial render
          setTimeout(async () => {
            for (const destination of parsedDestinations) {
              for (const day of destination.days) {
                const images = await fetchDayImages(day.title, destination.name)
                setDestinations(prev => prev.map(d => 
                  d.id === destination.id 
                    ? {
                        ...d,
                        days: d.days.map(dy => 
                          dy.id === day.id ? { ...dy, images } : dy
                        )
                      }
                    : d
                ))
              }
            }
          }, 100)
        } catch (error) {
          console.error('Error initializing itinerary:', error)
        }
      }
    }
    
    initializeItinerary()
  }, [initialItinerary])
  
  // Helper functions (same as original)
  const fetchDayImages = async (dayTitle: string, destinationName: string): Promise<DayImage[]> => {
    try {
      const searchQuery = `${destinationName} ${dayTitle.split(' ').slice(-1)[0]}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`/api/images?query=${encodeURIComponent(searchQuery)}&count=3`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) return []
      
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
  
  const parseItinerary = async (itinerary: any): Promise<Destination[]> => {
    // Same parsing logic as original
    const destinations: Destination[] = []
    
    if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
      return destinations
    }
    
    const tripLocation = itinerary.location || itinerary.destination || 'Unknown'
    const startDate = itinerary.startDate ? new Date(itinerary.startDate) : new Date()
    const endDate = itinerary.endDate ? new Date(itinerary.endDate) : new Date()
    
    const destination: Destination = {
      id: tripLocation.toLowerCase().replace(/\s+/g, '-'),
      name: tripLocation,
      startDate,
      endDate,
      days: []
    }
    
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
      
      // Parse activities
      const activities = day.activities || []
      const meals = day.meals || []
      const accommodation = day.accommodation
      
      // Add activities
      activities.forEach((activity: any, index: number) => {
        parsedDay.activities.push({
          id: `activity-${dayNumber}-${index}`,
          name: activity.name || activity.title || activity,
          time: activity.time || `${9 + index * 2}:00`,
          duration: activity.duration || 60,
          location: {
            lat: activity.coordinates?.lat || activity.location?.lat || 48.8566 + (Math.random() - 0.5) * 0.1,
            lng: activity.coordinates?.lng || activity.location?.lng || 2.3522 + (Math.random() - 0.5) * 0.1,
            address: activity.address || activity.location?.address
          },
          category: 'activity',
          description: activity.description || activity.details,
          provider: activity.provider,
          isRecommendedTour: activity.isRecommendedTour,
          price: activity.price,
          bookingUrl: activity.bookingUrl,
          rating: activity.rating
        })
      })
      
      // Add meals
      meals.forEach((meal: any, index: number) => {
        const mealTimes: { [key: string]: string } = {
          breakfast: '08:00',
          lunch: '12:30',
          dinner: '19:00'
        }
        
        parsedDay.activities.push({
          id: `meal-${dayNumber}-${index}`,
          name: meal.restaurant || meal.name || `${meal.type || 'Meal'} at local restaurant`,
          time: mealTimes[meal.type] || '12:00',
          duration: meal.type === 'dinner' ? 120 : 60,
          location: {
            lat: meal.coordinates?.lat || 48.8566 + (Math.random() - 0.5) * 0.1,
            lng: meal.coordinates?.lng || 2.3522 + (Math.random() - 0.5) * 0.1,
            address: meal.address
          },
          category: 'dining',
          description: meal.cuisine ? `${meal.cuisine} cuisine` : ''
        })
      })
      
      // Add accommodation
      if (accommodation && i === 0) {
        parsedDay.activities.unshift({
          id: `accommodation-${dayNumber}`,
          name: `Check-in: ${accommodation.name || 'Hotel'}`,
          time: '15:00',
          duration: 30,
          location: {
            lat: accommodation.coordinates?.lat || 48.8566,
            lng: accommodation.coordinates?.lng || 2.3522,
            address: accommodation.address
          },
          category: 'accommodation',
          description: accommodation.type || 'Accommodation'
        })
      }
      
      // Sort activities by time
      parsedDay.activities.sort((a, b) => {
        const timeA = a.time ? parseInt(a.time.replace(':', '')) : 0
        const timeB = b.time ? parseInt(b.time.replace(':', '')) : 0
        return timeA - timeB
      })
      
      destination.days.push(parsedDay)
    }
    
    destinations.push(destination)
    return destinations
  }
  
  // Get current destination and day
  const currentDestination = destinations.find(d => d.id === selectedDestination)
  const currentDay = currentDestination?.days.find(d => d.dayNumber === selectedDay)
  
  // Get map center
  const getMapCenter = (): [number, number] => {
    if (currentDay && currentDay.activities.length > 0) {
      const validActivities = currentDay.activities.filter(a => a.location.lat && a.location.lng)
      if (validActivities.length > 0) {
        const avgLat = validActivities.reduce((sum, a) => sum + a.location.lat, 0) / validActivities.length
        const avgLng = validActivities.reduce((sum, a) => sum + a.location.lng, 0) / validActivities.length
        return [avgLat, avgLng]
      }
    }
    
    return [48.8566, 2.3522]
  }
  
  const handleAddDay = (destinationId: string) => {
    console.log('Add day to destination:', destinationId)
  }
  
  const handleMakeChanges = () => {
    console.log('Make changes to current day')
  }
  
  const handleSaveTrip = () => {
    if (onSave) {
      onSave({ destinations })
    }
  }
  
  const handleTimelineReorder = (activities: TimelineActivity[]) => {
    // Update the activities order
    setDestinations(prev => prev.map(dest => {
      if (dest.id === selectedDestination) {
        return {
          ...dest,
          days: dest.days.map(day => {
            if (day.dayNumber === selectedDay) {
              return {
                ...day,
                activities: activities as Activity[]
              }
            }
            return day
          })
        }
      }
      return dest
    }))
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modern Header */}
      <header className="bg-white border-b sticky top-0 z-50 backdrop-blur-xl bg-white/80">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-2 hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Return to form</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Separator orientation="vertical" className="h-6" />
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  {Object.entries(tabIcons).map(([key, Icon]) => (
                    <TabsTrigger key={key} value={key} className="gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{key.toUpperCase()}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveTrip}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Save Trip</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save your itinerary</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share trip</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatar-placeholder.png" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Calendar className="h-4 w-4" />
                    My Trips
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-600">
                    <X className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:flex w-80 bg-white border-r flex-col">
          <DestinationSidebar
            destinations={destinations}
            selectedDestination={selectedDestination}
            selectedDay={selectedDay}
            onSelectDestination={setSelectedDestination}
            onSelectDay={setSelectedDay}
            onAddDay={handleAddDay}
          />
        </aside>
        
        {/* Mobile Drawer */}
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden fixed bottom-4 left-4 z-40 shadow-lg"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <DestinationSidebar
              destinations={destinations}
              selectedDestination={selectedDestination}
              selectedDay={selectedDay}
              onSelectDestination={(id) => {
                setSelectedDestination(id)
                setMobileDrawerOpen(false)
              }}
              onSelectDay={(day) => {
                setSelectedDay(day)
                setMobileDrawerOpen(false)
              }}
              onAddDay={handleAddDay}
            />
          </SheetContent>
        </Sheet>
        
        {/* Center Panel */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Day Details & Timeline */}
          <div className="flex-1 flex flex-col">
            {/* Day Header */}
            <div className="bg-white border-b">
              <AnimatePresence mode="wait">
                {currentDay && (
                  <motion.div
                    key={currentDay.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">
                          Day {currentDay.dayNumber} - {currentDay.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{currentDestination?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(currentDay.date, 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleMakeChanges} className="gap-2">
                              <Edit2 className="h-4 w-4" />
                              Edit Day Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Plus className="h-4 w-4" />
                              Add Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Add Photos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-red-600">
                              <Trash2 className="h-4 w-4" />
                              Delete Day
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowAIAssistant(true)}
                                className="hover:bg-blue-50"
                              >
                                <Sparkles className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>AI Assistant</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    {currentDay.description && (
                      <p className="text-muted-foreground">
                        {currentDay.description}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Timeline and Map Container */}
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Timeline */}
              <div className="lg:w-96 h-96 lg:h-full p-4 bg-gray-50">
                {currentDay && (
                  <ModernTimeline
                    activities={currentDay.activities.map(activityToTimeline)}
                    onReorder={handleTimelineReorder}
                    onActivityHover={setHighlightedLocationId}
                    onActivityClick={setSelectedLocationId}
                    selectedActivityId={selectedLocationId}
                    highlightedActivityId={highlightedLocationId}
                  />
                )}
              </div>
              
              {/* Map */}
              <div className="flex-1 h-96 lg:h-full relative">
                {currentDay && (
                  <ItineraryMap
                    activities={currentDay.activities}
                    center={getMapCenter()}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - Visual Gallery */}
          <aside className="hidden xl:flex w-80 bg-white border-l">
            <VisualGallery
              destinations={destinations}
              selectedDay={selectedDay}
              onSelectDay={(dest, day) => {
                setSelectedDestination(dest)
                setSelectedDay(day)
              }}
              highlightedLocationId={highlightedLocationId}
              onHoverActivity={setHighlightedLocationId}
            />
          </aside>
        </div>
      </div>
      
      {/* AI Assistant Chat */}
      <AnimatePresence>
        {showAIAssistant && (
          <Suspense fallback={<div />}>
            <AIAssistantChat
              tripId={tripId}
              currentDay={currentDay}
              currentDestination={currentDestination}
              onClose={() => setShowAIAssistant(false)}
              onUpdateItinerary={(updates) => {
                console.log('AI suggested updates:', updates)
              }}
            />
          </Suspense>
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-40"
        >
          <Sparkles className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  )
}

// Destination Sidebar Component
function DestinationSidebar({
  destinations,
  selectedDestination,
  selectedDay,
  onSelectDestination,
  onSelectDay,
  onAddDay
}: {
  destinations: Destination[]
  selectedDestination: string
  selectedDay: number
  onSelectDestination: (id: string) => void
  onSelectDay: (day: number) => void
  onAddDay: (destinationId: string) => void
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        {destinations.map((destination) => (
          <div key={destination.id} className="space-y-3">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{destination.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(destination.startDate, 'MMM d')} - {format(destination.endDate, 'MMM d, yyyy')}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {differenceInDays(destination.endDate, destination.startDate) + 1} nights
                  </Badge>
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="space-y-1">
              <LayoutGroup>
                {destination.days.map((day) => (
                  <motion.div
                    key={day.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2, delay: day.dayNumber * 0.05 }}
                  >
                    <Button
                      variant={selectedDay === day.dayNumber ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start transition-all",
                        selectedDay === day.dayNumber && "shadow-sm"
                      )}
                      onClick={() => {
                        onSelectDestination(destination.id)
                        onSelectDay(day.dayNumber)
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Badge 
                          variant={selectedDay === day.dayNumber ? "secondary" : "outline"}
                          className="w-6 h-6 p-0 flex items-center justify-center"
                        >
                          {day.dayNumber}
                        </Badge>
                        <span className="flex-1 text-left">{day.title}</span>
                        {day.activities.length > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {day.activities.length}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </LayoutGroup>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2 mt-2 border-dashed hover:border-solid"
                  onClick={() => onAddDay(destination.id)}
                >
                  <Plus className="h-3 w-3" />
                  Add Day
                </Button>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// Visual Gallery Component
function VisualGallery({
  destinations,
  selectedDay,
  onSelectDay,
  highlightedLocationId,
  onHoverActivity
}: {
  destinations: Destination[]
  selectedDay: number
  onSelectDay: (destinationId: string, day: number) => void
  highlightedLocationId: string | null
  onHoverActivity: (activityId: string | null) => void
}) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Visual Journey</h3>
          <Badge variant="outline" className="gap-1">
            <ImageIcon className="h-3 w-3" />
            Gallery
          </Badge>
        </div>
        
        <div className="space-y-4">
          {destinations.map((destination) => 
            destination.days.map((day) => (
              <motion.div
                key={day.id}
                className={cn(
                  "space-y-3 p-3 rounded-lg transition-all cursor-pointer",
                  selectedDay === day.dayNumber 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 ring-1 ring-blue-200" 
                    : "hover:bg-gray-50"
                )}
                onClick={() => onSelectDay(destination.id, day.dayNumber)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Day {day.dayNumber}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {format(day.date, 'MMM d')}
                  </Badge>
                </div>
                
                {day.images.length > 0 ? (
                  <div className="grid gap-2">
                    {day.images.map((image, idx) => (
                      <motion.div 
                        key={image.id} 
                        className={cn(
                          "relative aspect-video rounded-lg overflow-hidden transition-all group",
                          highlightedLocationId === day.activities[idx]?.id && "ring-2 ring-orange-400"
                        )}
                        onMouseEnter={() => day.activities[idx] && onHoverActivity(day.activities[idx].id)}
                        onMouseLeave={() => onHoverActivity(null)}
                        whileHover={{ scale: 1.05 }}
                      >
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs font-medium">{day.activities[idx]?.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">Loading images...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  )
}