'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Share,
  MoreHorizontal,
  Map,
  List,
  Search as SearchIcon,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { usePlanStore } from '@/store/planStore'
import { format, differenceInDays } from 'date-fns'
import { ModernExploreSidebar } from '@/components/ModernExploreSidebar'
import { ModernTimeline } from '@/components/itinerary/ModernTimeline'
import { MapCanvas } from '@/components/MapCanvas'

// Dynamically import map to avoid SSR issues
const DynamicMap = dynamic(() => import('@/components/MapCanvas').then(mod => mod.MapCanvas), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
})

// Mobile Bottom Navigation
function MobileBottomNav({ 
  activeView, 
  onViewChange 
}: { 
  activeView: MobileView
  onViewChange: (view: MobileView) => void 
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => onViewChange('map')}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
            activeView === 'map' 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Map className="h-5 w-5" />
          <span className="text-xs font-medium">Map</span>
        </button>
        
        <button
          onClick={() => onViewChange('timeline')}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
            activeView === 'timeline' 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <List className="h-5 w-5" />
          <span className="text-xs font-medium">Timeline</span>
        </button>
        
        <button
          onClick={() => onViewChange('explore')}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
            activeView === 'explore' 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <SearchIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Explore</span>
        </button>
      </div>
    </div>
  )
}

// Header component with search and date navigation
function TripHeader({ 
  destination, 
  startDate, 
  endDate,
  currentDate,
  onDateChange,
  onBack,
  isMobile
}: {
  destination: string
  startDate: Date
  endDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
  onBack: () => void
  isMobile: boolean
}) {
  const formatDateRange = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const current = new Date(currentDate)
    
    return `${current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(currentDate)
    const newDate = new Date(current)
    newDate.setDate(current.getDate() + (direction === 'next' ? 1 : -1))
    
    // Check bounds
    if (newDate >= new Date(startDate) && newDate <= new Date(endDate)) {
      onDateChange(newDate)
    }
  }

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex flex-col">
          {/* Mobile Header - Simplified */}
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="font-semibold text-base">{destination}</h1>
              <p className="text-xs text-gray-600">
                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="h-7 w-7"
              disabled={currentDate <= startDate}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm font-medium">
                {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-gray-600">Day {Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}</p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('next')}
              className="h-7 w-7"
              disabled={currentDate >= endDate}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    )
  }
  
  // Desktop header remains the same
  return (
    <header className="absolute top-0 left-0 right-0 z-30 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Back button and search */}
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="relative flex-1 max-w-md">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={destination}
              readOnly
              className="pl-10 pr-10 h-9 bg-gray-50 border-gray-200"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Center - Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-8 px-3"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{formatDateRange()}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('next')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 justify-end flex-1">
          <Button
            variant="default"
            size="sm"
            className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <Share className="h-3.5 w-3.5 mr-2" />
            Share
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

// Mobile view types
type MobileView = 'timeline' | 'map' | 'explore'

export default function ModernTripPlannerPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mobileView, setMobileView] = useState<MobileView>('timeline')
  const [isMobile, setIsMobile] = useState(false)
  
  const {
    itinerary,
    setItinerary,
    selectedDayId,
    selectDay,
    getSelectedDay,
    removePoiFromDay,
    selectPoi,
    highlightPoi,
    selectedPoiId,
    highlightedPoiId
  } = usePlanStore()
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setShowLeftSidebar(false)
        setShowRightSidebar(false)
      } else {
        setShowLeftSidebar(true)
        setShowRightSidebar(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Load trip data
  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true)
      
      try {
        // Check for stored itinerary first
        const storedItinerary = localStorage.getItem('lastGeneratedItinerary')
        if (storedItinerary) {
          const parsed = JSON.parse(storedItinerary)
          
          // Convert to store format
          const storeItinerary = {
            id: tripId,
            tripId,
            destination: parsed.location || parsed.destination || 'Paris, France',
            startDate: new Date(parsed.startDate || Date.now()),
            endDate: new Date(parsed.endDate || Date.now()),
            days: parsed.days?.map((day: any, index: number) => ({
              id: `day-${index + 1}`,
              dayNumber: index + 1,
              date: new Date(Date.now() + index * 24 * 60 * 60 * 1000),
              slots: [],
              notes: day.description
            })) || [],
            pois: []
          }
          
          setItinerary(storeItinerary)
          setCurrentDate(storeItinerary.startDate)
          localStorage.removeItem('lastGeneratedItinerary')
        }
      } catch (error) {
        console.error('Error loading trip:', error)
        toast.error('Failed to load trip')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTrip()
  }, [tripId, setItinerary])
  
  // Update selected day when current date changes
  useEffect(() => {
    if (itinerary) {
      const day = itinerary.days.find(d => 
        new Date(d.date).toDateString() === currentDate.toDateString()
      )
      if (day) {
        selectDay(day.id)
      }
    }
  }, [currentDate, itinerary, selectDay])
  
  const selectedDay = getSelectedDay()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    )
  }
  
  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Trip not found</p>
          <Button onClick={() => router.push('/plan')}>
            Back to planner
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header */}
      <TripHeader
        destination={itinerary.destination}
        startDate={itinerary.startDate}
        endDate={itinerary.endDate}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onBack={() => router.push('/plan')}
        isMobile={isMobile}
      />
      
      {/* Main content */}
      {isMobile ? (
        // Mobile Layout
        <div className="absolute inset-0" style={{ top: '120px', bottom: '64px' }}>
          <AnimatePresence mode="wait">
            {mobileView === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <DynamicMap className="w-full h-full" />
              </motion.div>
            )}
            
            {mobileView === 'timeline' && selectedDay && (
              <motion.div
                key="timeline"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute inset-0 bg-white overflow-auto"
              >
                <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-xl font-semibold">{itinerary.destination}</h1>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{`${new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} ({differenceInDays(new Date(itinerary.endDate), new Date(itinerary.startDate)) + 1} days)</span>
                        <span className="text-gray-400">•</span>
                        <MapPin className="h-4 w-4" />
                        <span>{itinerary.destination}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Day selector */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{selectedDay && format(new Date(selectedDay.date), 'EEE, d MMM')}</h2>
                    <span className="text-sm text-gray-500">{selectedDay?.slots?.length || 0}</span>
                  </div>
                </div>
                
                {/* Timeline */}
                <div className="flex-1 overflow-hidden">
                  <ModernTimeline
                    activities={selectedDay?.slots?.map(slot => {
                      const poi = itinerary?.pois?.find(p => p.id === slot.poiId)
                      return {
                        id: slot.id,
                        name: poi?.name || 'Activity',
                        time: slot.startTime,
                        duration: slot.duration,
                        location: {
                          lat: poi?.location?.lat || 0,
                          lng: poi?.location?.lng || 0,
                          address: poi?.location?.address
                        },
                        description: poi?.description,
                        category: poi?.category === 'restaurant' ? 'dining' : 'activity',
                        price: poi?.price
                      }
                    }) || []}
                    onReorder={(activities) => {
                      // Handle reordering
                      console.log('Reordered activities:', activities)
                    }}
                    onEdit={(activity) => {
                      console.log('Edit activity:', activity)
                    }}
                    onDelete={(activityId) => {
                      removePoiFromDay(selectedDay.id, activityId)
                    }}
                    onAdd={() => {
                      console.log('Add new activity')
                    }}
                    onActivityClick={(activityId) => {
                      selectPoi(activityId)
                    }}
                    onActivityHover={(activityId) => {
                      highlightPoi(activityId)
                    }}
                    selectedActivityId={selectedPoiId}
                    highlightedActivityId={highlightedPoiId}
                    startHour={6}
                    endHour={23}
                  />
                </div>
              </div>
              </motion.div>
            )}
            
            {mobileView === 'explore' && (
              <motion.div
                key="explore"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute inset-0 bg-white"
              >
                <ModernExploreSidebar />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Desktop Layout
        <div className="absolute inset-0 top-14 flex">
          {/* Left sidebar - Explore */}
          <AnimatePresence mode="wait">
            {showLeftSidebar && (
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative w-80 bg-white border-r shadow-sm z-20"
              >
                <ModernExploreSidebar />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Center - Map */}
          <div className="flex-1 relative">
            <DynamicMap className="absolute inset-0" />
          </div>
          
          {/* Right sidebar - Timeline */}
          <AnimatePresence mode="wait">
            {showRightSidebar && selectedDay && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative w-96 bg-white border-l shadow-sm z-20"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h1 className="text-xl font-semibold">{itinerary.destination}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{`${new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} ({differenceInDays(new Date(itinerary.endDate), new Date(itinerary.startDate)) + 1} days)</span>
                          <span className="text-gray-400">•</span>
                          <MapPin className="h-4 w-4" />
                          <span>{itinerary.destination}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Day selector */}
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{selectedDay && format(new Date(selectedDay.date), 'EEE, d MMM')}</h2>
                      <span className="text-sm text-gray-500">{selectedDay?.slots?.length || 0}</span>
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="flex-1 overflow-hidden">
                    <ModernTimeline
                      activities={selectedDay?.slots?.map(slot => {
                        const poi = itinerary?.pois?.find(p => p.id === slot.poiId)
                        return {
                          id: slot.id,
                          name: poi?.name || 'Activity',
                          time: slot.startTime,
                          duration: slot.duration,
                          location: {
                            lat: poi?.location?.lat || 0,
                            lng: poi?.location?.lng || 0,
                            address: poi?.location?.address
                          },
                          description: poi?.description,
                          category: poi?.category === 'restaurant' ? 'dining' : 'activity',
                          price: poi?.price
                        }
                      }) || []}
                      onReorder={(activities) => {
                        // Handle reordering
                        console.log('Reordered activities:', activities)
                      }}
                      onEdit={(activity) => {
                        console.log('Edit activity:', activity)
                      }}
                      onDelete={(activityId) => {
                        removePoiFromDay(selectedDay.id, activityId)
                      }}
                      onAdd={() => {
                        console.log('Add new activity')
                      }}
                      onActivityClick={(activityId) => {
                        selectPoi(activityId)
                      }}
                      onActivityHover={(activityId) => {
                        highlightPoi(activityId)
                      }}
                      selectedActivityId={selectedPoiId}
                      highlightedActivityId={highlightedPoiId}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          activeView={mobileView} 
          onViewChange={setMobileView} 
        />
      )}
    </div>
  )
}