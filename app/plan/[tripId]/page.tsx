'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { 
  Menu,
  Map as MapIcon,
  Calendar,
  List,
  ChevronLeft,
  Save,
  Share2,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { usePlanStore } from '@/store/planStore'
import { usePaneMode } from '@/hooks/usePaneMode'
import { ExploreSidebar } from '@/components/ExploreSidebar'
import { DayTimeline } from '@/components/DayTimeline'
import { AIQuickSuggest } from '@/components/AIQuickSuggest'
import { MapCanvas } from '@/components/MapCanvas'

// Mobile tab bar component
function MobileTabBar({ activePane, onPaneChange }: { 
  activePane: 'explore' | 'map' | 'timeline'
  onPaneChange: (pane: 'explore' | 'map' | 'timeline') => void 
}) {
  const tabs = [
    { id: 'explore' as const, label: 'Explore', icon: List },
    { id: 'map' as const, label: 'Map', icon: MapIcon },
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar }
  ]
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 px-4 py-2">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onPaneChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors",
                activePane === tab.id 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Date pill selector component
function DatePillSelector({ days, selectedDayId, onDaySelect }: {
  days: { id: string; dayNumber: number; date: Date }[]
  selectedDayId: string | null
  onDaySelect: (dayId: string) => void
}) {
  return (
    <ScrollArea orientation="horizontal" className="w-full">
      <div className="flex gap-2 p-4">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => onDaySelect(day.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all whitespace-nowrap",
              selectedDayId === day.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <span className="text-xs font-medium">Day {day.dayNumber}</span>
            <span className="text-[10px]">
              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

export default function TripPlannerPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  
  const [isLoading, setIsLoading] = useState(true)
  
  const {
    mode,
    activePane,
    setActivePane,
    isDrawerOpen,
    toggleDrawer,
    showExplore,
    showMap,
    showTimeline,
    isMobile,
    isTablet,
    isDesktop
  } = usePaneMode()
  
  const {
    itinerary,
    setItinerary,
    selectedDayId,
    selectDay,
    getSelectedDay
  } = usePlanStore()
  
  // Load trip data
  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true)
      
      try {
        // Check for stored itinerary first (from AI generation)
        const storedItinerary = localStorage.getItem('lastGeneratedItinerary')
        if (storedItinerary) {
          const parsed = JSON.parse(storedItinerary)
          
          // Convert to store format
          const storeItinerary = {
            id: tripId,
            tripId,
            destination: parsed.location || parsed.destination || 'Unknown',
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
          localStorage.removeItem('lastGeneratedItinerary')
        } else {
          // Fetch from API if not in localStorage
          // This would be your actual API call
          console.log('Fetching trip:', tripId)
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
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'e':
          if (!isMobile) {
            if (isTablet) {
              toggleDrawer()
            } else {
              setActivePane('explore')
            }
          }
          break
        case 'm':
          setActivePane('map')
          break
        case 't':
          setActivePane('timeline')
          break
      }
    }
    
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [isMobile, isTablet, toggleDrawer, setActivePane])
  
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
    <div className={cn(
      "min-h-screen bg-gray-50 flex flex-col",
      isMobile && "pb-16" // Space for mobile tab bar
    )}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/plan')}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div>
                <h1 className="font-semibold text-lg">{itinerary.destination}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
        
        {/* Date selector */}
        <DatePillSelector
          days={itinerary.days}
          selectedDayId={selectedDayId}
          onDaySelect={selectDay}
        />
      </header>
      
      {/* Main content area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Desktop: Three panes */}
        {isDesktop && (
          <>
            {/* Left: Explore */}
            <div className="w-80 border-r bg-white">
              <ExploreSidebar />
            </div>
            
            {/* Center: Map */}
            <div className="flex-1 relative">
              <MapCanvas />
            </div>
            
            {/* Right: Timeline */}
            <div className="w-80 border-l bg-white flex flex-col">
              {selectedDay && (
                <>
                  <AIQuickSuggest dayId={selectedDay.id} className="border-b pb-4" />
                  <div className="flex-1">
                    <DayTimeline day={selectedDay} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
        {/* Tablet: Two panes with drawer */}
        {isTablet && (
          <>
            {/* Drawer overlay */}
            <AnimatePresence>
              {isDrawerOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={toggleDrawer}
                  className="absolute inset-0 bg-black/20 z-40"
                />
              )}
            </AnimatePresence>
            
            {/* Explore drawer */}
            <AnimatePresence>
              {isDrawerOpen && (
                <ExploreSidebar isDrawer onClose={toggleDrawer} />
              )}
            </AnimatePresence>
            
            {/* Toggle drawer button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDrawer}
              className="absolute left-4 top-4 z-30 bg-white shadow-md"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Center: Map */}
            <div className="flex-1 relative">
              <MapCanvas />
            </div>
            
            {/* Right: Timeline */}
            <div className="w-80 border-l bg-white flex flex-col">
              {selectedDay && (
                <>
                  <AIQuickSuggest dayId={selectedDay.id} className="border-b pb-4" />
                  <div className="flex-1">
                    <DayTimeline day={selectedDay} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
        {/* Mobile: Single pane with tabs */}
        {isMobile && (
          <>
            <AnimatePresence mode="wait">
              {activePane === 'explore' && (
                <motion.div
                  key="explore"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-white"
                >
                  <ExploreSidebar />
                </motion.div>
              )}
              
              {activePane === 'map' && (
                <motion.div
                  key="map"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <MapCanvas />
                </motion.div>
              )}
              
              {activePane === 'timeline' && selectedDay && (
                <motion.div
                  key="timeline"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <AIQuickSuggest dayId={selectedDay.id} className="border-b pb-4" />
                  <div className="flex-1">
                    <DayTimeline day={selectedDay} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Mobile tab bar */}
            <MobileTabBar activePane={activePane} onPaneChange={setActivePane} />
          </>
        )}
      </div>
    </div>
  )
}