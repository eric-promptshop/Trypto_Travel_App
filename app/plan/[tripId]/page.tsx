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
import { convertAIItineraryToStoreFormat, storeItineraryMetadata } from '@/lib/services/itinerary-converter'
import { ModernExploreSidebarWithTabs as ModernExploreSidebar } from '@/components/ModernExploreSidebarWithTabs'
import { MobileDayCards } from '@/components/itinerary/MobileDayCards'
import { TimelineWithImagesV2 as TimelineWithImages } from '@/components/itinerary/TimelineWithImagesV2'
import { ShareItineraryModal } from '@/components/ShareItineraryModal'
import { useItineraryState } from '@/lib/state/itinerary-state'

// Dynamically import Google Maps to avoid SSR issues
const DynamicGoogleMap = dynamic(() => import('@/components/GoogleMapCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
})

// Fallback to Leaflet if Google Maps fails
const DynamicLeafletMap = dynamic(() => import('@/components/MapCanvas').then(mod => mod.MapCanvas), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
})

// Smart map component that prioritizes Google Maps
const DynamicMap = ({ className }: { className?: string }) => {
  const [mapLoadFailed, setMapLoadFailed] = useState(false)
  const [isCheckingGoogleMaps, setIsCheckingGoogleMaps] = useState(true)
  
  // Check if Google Maps API key is available
  useEffect(() => {
    const checkGoogleMapsAvailability = async () => {
      try {
        const response = await fetch('/api/maps/config')
        if (response.ok) {
          const config = await response.json()
          if (config.apiKey) {
            setIsCheckingGoogleMaps(false)
            return
          }
        }
        setMapLoadFailed(true)
      } catch (error) {
        console.error('Failed to check Google Maps availability:', error)
        setMapLoadFailed(true)
      } finally {
        setIsCheckingGoogleMaps(false)
      }
    }
    
    checkGoogleMapsAvailability()
  }, [])
  
  if (isCheckingGoogleMaps) {
    return <div className="w-full h-full bg-gray-100 animate-pulse" />
  }
  
  if (!mapLoadFailed) {
    return (
      <DynamicGoogleMap 
        className={className}
        onError={() => {
          console.error('Google Maps failed to load, falling back to Leaflet')
          setMapLoadFailed(true)
        }}
      />
    )
  }
  
  return <DynamicLeafletMap className={className} />
}

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
          onClick={() => onViewChange('timeline')}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
            activeView === 'timeline' 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <List className="h-5 w-5" />
          <span className="text-xs font-medium">Itinerary</span>
        </button>
        
        <button
          onClick={() => onViewChange('explore')}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
            activeView === 'explore' 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <SearchIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Explore</span>
        </button>
        
        <button
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
            "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => toast.info('Flights feature coming soon!')}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2A1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
          <span className="text-xs font-medium">Flights</span>
        </button>
        
        <button
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
            "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => toast.info('Lodging feature coming soon!')}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Lodging</span>
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
  isMobile,
  onShare
}: {
  destination: string
  startDate: Date
  endDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
  onBack: () => void
  isMobile: boolean
  onShare?: () => void
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
        <div className="flex items-center justify-between px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="font-semibold text-base">Itinerary</h1>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onShare}
          >
            <Share className="h-5 w-5" />
          </Button>
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
            onClick={onShare}
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
  const [showShareModal, setShowShareModal] = useState(false)
  
  // Use unified state
  const { currentItinerary } = useItineraryState()
  
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
        // Check for stored itinerary from unified state
        if (currentItinerary) {
          
          // Convert AI itinerary to store format with activities
          const storeItinerary = await convertAIItineraryToStoreFormat(currentItinerary, tripId)
          
          // Store metadata for later use
          storeItineraryMetadata(currentItinerary)
          
          // Set the itinerary in the store
          setItinerary(storeItinerary)
          setCurrentDate(storeItinerary.startDate)
          
          // Select the first day
          if (storeItinerary.days.length > 0) {
            selectDay(storeItinerary.days[0].id)
          }
          
          // Map will auto-center on POIs
          
          toast.success('Your personalized itinerary is ready!')
        } else {
          // No generated itinerary, create empty one
          const emptyItinerary = {
            id: tripId,
            tripId,
            destination: 'Your Destination',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            days: Array.from({ length: 7 }, (_, i) => ({
              id: `day-${i + 1}`,
              dayNumber: i + 1,
              date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
              slots: [],
              notes: ''
            })),
            pois: []
          }
          
          setItinerary(emptyItinerary)
          setCurrentDate(emptyItinerary.startDate)
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
        onShare={() => setShowShareModal(true)}
      />
      
      {/* Main content */}
      {isMobile ? (
        // Mobile Layout
        <div className="fixed inset-0 pt-14 pb-16">
          <AnimatePresence mode="wait">
            {mobileView === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {/* List/Map Toggle for Map View */}
                <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
                  <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
                    <button
                      onClick={() => setMobileView('timeline')}
                      className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      List
                    </button>
                    <button
                      className="flex-1 py-2 px-4 rounded-md bg-white shadow-sm text-sm font-medium text-gray-900"
                    >
                      Map
                    </button>
                  </div>
                </div>
                <DynamicMap className="w-full h-full" />
              </motion.div>
            )}
            
            {mobileView === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute inset-0 bg-gray-50 overflow-auto"
              >
                <div className="flex flex-col h-full">
                  {/* List/Map Toggle */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        className="flex-1 py-2 px-4 rounded-md bg-white shadow-sm text-sm font-medium text-gray-900"
                      >
                        List
                      </button>
                      <button
                        onClick={() => setMobileView('map')}
                        className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Map
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto px-4 pb-4">
                    {/* Trip Header */}
                    <div className="mb-6 mt-4">
                      <h1 className="text-2xl font-bold text-gray-900">{itinerary.destination}</h1>
                      <p className="text-sm text-gray-600 mt-1">
                        {differenceInDays(new Date(itinerary.endDate), new Date(itinerary.startDate)) + 1} Days, 
                        {differenceInDays(new Date(itinerary.endDate), new Date(itinerary.startDate))} Nights
                      </p>
                    </div>
                  
                  {/* Day Cards */}
                  <MobileDayCards
                    days={itinerary.days}
                    itinerary={itinerary}
                    onActivityClick={(activityId) => {
                      selectPoi(activityId)
                      setMobileView('map')
                    }}
                    onEditDay={(dayId) => {
                      selectDay(dayId)
                      setMobileView('explore')
                    }}
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
                <div className="flex flex-col h-full">
                  {/* List/Map Toggle for Explore View */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setMobileView('timeline')}
                        className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        List
                      </button>
                      <button
                        onClick={() => setMobileView('map')}
                        className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Map
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ModernExploreSidebar />
                  </div>
                </div>
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
                <div className="h-full">
                    <TimelineWithImages
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
                          category: poi?.category === 'restaurant' ? 'dining' : 
                                   poi?.category === 'cafe-bakery' ? 'dining' :
                                   poi?.category === 'bars-nightlife' ? 'dining' :
                                   poi?.category === 'hotel' ? 'accommodation' :
                                   poi?.category === 'shopping' ? 'shopping' :
                                   poi?.category === 'beauty-fashion' ? 'shopping' :
                                   poi?.category === 'transport' ? 'transport' :
                                   poi?.category === 'art-museums' ? 'activity' :
                                   poi?.category === 'attraction' ? 'activity' : 'activity',
                          price: poi?.price,
                          rating: poi?.rating
                        }
                      }) || []}
                      onReorder={(activities) => {
                        // Handle reordering
                      }}
                      onEdit={(activity) => {
                      }}
                      onDelete={(activityId) => {
                        removePoiFromDay(selectedDay.id, activityId)
                      }}
                      onAdd={() => {
                        setShowLeftSidebar(true)
                      }}
                      onActivityClick={(activityId) => {
                        selectPoi(activityId)
                      }}
                      onActivityHover={(activityId) => {
                        highlightPoi(activityId)
                      }}
                      selectedActivityId={selectedPoiId}
                      highlightedActivityId={highlightedPoiId}
                      dayInfo={selectedDay ? {
                        destination: itinerary.destination,
                        date: new Date(selectedDay.date),
                        dayNumber: selectedDay.dayNumber
                      } : undefined}
                    />
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

      {/* Share Modal */}
      {itinerary && (
        <ShareItineraryModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          tripId={tripId}
          tripTitle={`Trip to ${itinerary.destination || 'Unknown Destination'}`}
          destination={itinerary.destination || ''}
          startDate={itinerary.startDate ? itinerary.startDate.toISOString().split('T')[0] : ''}
          endDate={itinerary.endDate ? itinerary.endDate.toISOString().split('T')[0] : ''}
        />
      )}
    </div>
  )
}