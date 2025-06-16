'use client'

import React, { useEffect, useState } from 'react'
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
  MoreHorizontal
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

// Header component with search and date navigation
function TripHeader({ 
  destination, 
  startDate, 
  endDate,
  currentDate,
  onDateChange,
  onBack 
}: {
  destination: string
  startDate: Date
  endDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
  onBack: () => void
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

export default function ModernTripPlannerPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  
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
      />
      
      {/* Main content */}
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
                    activities={selectedDay?.slots?.map(slot => ({
                      id: slot.id,
                      name: slot.poi?.name || 'Activity',
                      time: slot.startTime,
                      duration: slot.duration,
                      location: {
                        lat: slot.poi?.location?.lat || 0,
                        lng: slot.poi?.location?.lng || 0,
                        address: slot.poi?.location?.address
                      },
                      description: slot.poi?.description,
                      category: slot.poi?.category === 'restaurant' ? 'dining' : 'activity',
                      price: slot.poi?.price
                    })) || []}
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
    </div>
  )
}