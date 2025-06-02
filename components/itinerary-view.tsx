"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, ArrowLeft, ArrowRight } from "lucide-react"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { ExpandableContentSubtle } from "./expandable-content-subtle"
import dynamic from 'next/dynamic'
import { itineraryData } from "@/data/itinerary-data"
// Update the import for the image service
import { getRealisticImageUrl } from "@/lib/image-service"
import { useSwipeable } from 'react-swipeable'

interface ItineraryViewProps {
  showItineraryList: boolean
  setShowItineraryList: (show: boolean) => void
}

const LeafletMapLoader = dynamic(() => import('./LeafletMapLoader').then(mod => mod.LeafletMapLoader), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse flex items-center justify-center"><span className="text-gray-500">Loading map...</span></div>
})

export function ItineraryView({ showItineraryList, setShowItineraryList }: ItineraryViewProps) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [direction, setDirection] = useState(0)
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})
  const [mapKey, setMapKey] = useState(0) // Key to force map re-render when needed
  // Add a state for location images in the ItineraryView component
  const [locationImages, setLocationImages] = useState<Record<string, string>>({})

  // Swipe handlers for day navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (selectedDay < itineraryData.length) {
        setDirection(1)
        setSelectedDay(selectedDay + 1)
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(10)
        }
      }
    },
    onSwipedRight: () => {
      if (selectedDay > 1) {
        setDirection(-1)
        setSelectedDay(selectedDay - 1)
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(10)
        }
      }
    },
    trackMouse: true
  })

  // Function to extract first two sentences
  const extractFirstTwoSentences = (text: string | undefined) => {
    if (!text) return ""
    const sentenceRegex = /[^.!?]*[.!?]/g
    const sentences = text.match(sentenceRegex) || []
    return sentences.slice(0, 2).join(" ")
  }

  const toggleItineraryView = () => {
    setShowItineraryList(!showItineraryList)
    // Force map re-render when toggling itinerary view
    setTimeout(() => {
      setMapKey((prev) => prev + 1)
    }, 100) // Small delay to allow DOM to update
  }

  const toggleCardExpansion = (day: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  const navigateToPrevDay = useCallback(() => {
    if (selectedDay > 1) {
      setDirection(-1)
      setSelectedDay(selectedDay - 1)
    }
  }, [selectedDay])

  const navigateToNextDay = useCallback(() => {
    if (selectedDay < itineraryData.length) {
      setDirection(1)
      setSelectedDay(selectedDay + 1)
    }
  }, [selectedDay, itineraryData.length])

  const navigateToDay = (day: number) => {
    if (day < 1 || day > itineraryData.length) return

    setDirection(day > selectedDay ? 1 : -1)
    setSelectedDay(day)

    // If itinerary is not open, open it when navigating to a day
    if (!showItineraryList) {
      setShowItineraryList(true)
    }
  }

  // Reset expanded state when changing days
  useEffect(() => {
    setExpandedCards({})
  }, [selectedDay])

  // Enable keyboard navigation
  useKeyboardNavigation(navigateToPrevDay, navigateToNextDay)

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  // Prepare location data for the map including images
  const mapLocations = itineraryData.map((day) => ({
    day: day.day,
    title: day.title,
    location: day.location,
    latitude: day.latitude,
    longitude: day.longitude,
    image: day.image,
  }))

  // Add this useEffect to load images for the itinerary list
  useEffect(() => {
    async function loadImages() {
      const imageMap: Record<string, string> = {}

      // Load images in parallel
      const imagePromises = itineraryData.map(async (day) => {
        try {
          const imageUrl = await getRealisticImageUrl(day.location)
          return { day: day.day, url: imageUrl }
        } catch (error) {
          console.error(`Error loading image for day ${day.day}:`, error)
          return {
            day: day.day,
            url: day.image || `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(day.location)}`,
          }
        }
      })

      // Wait for all images to load
      const results = await Promise.all(imagePromises)

      // Populate the image map
      results.forEach((result) => {
        imageMap[result.day] = result.url
      })

      setLocationImages(imageMap)
    }

    // Start loading images
    loadImages()
  }, [])

  return (
    <div {...swipeHandlers}>
      {/* Map View */}
      <div className={`relative ${showItineraryList ? "w-[50%]" : "w-full"} transition-all duration-500 ease-in-out`}>
        {/* Map Container - Lower z-index */}
        <div className="h-full w-full relative" style={{ zIndex: 1 }}>
          <LeafletMapLoader
            key={`map-${mapKey}`}
            locations={mapLocations}
            selectedDay={selectedDay}
            onMarkerClick={navigateToDay}
            className="rounded-lg overflow-hidden"
            isItineraryOpen={showItineraryList}
          />
        </div>

        {/* UI Controls - Higher z-index */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
          {/* Navigation Buttons - Left */}
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-auto">
            <Button
              variant="outline"
              size="icon"
              className="ml-2 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white rounded-full h-10 w-10 shadow-lg transition-all duration-300 hover:shadow-xl touch-target"
              onClick={navigateToPrevDay}
              disabled={selectedDay === 1}
            >
              <ArrowLeft className="h-5 w-5 text-[#1f5582]" />
              <span className="sr-only">Previous day</span>
            </Button>
          </div>

          {/* Navigation Buttons - Right */}
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-auto">
            <Button
              variant="outline"
              size="icon"
              className="mr-2 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white rounded-full h-10 w-10 shadow-lg transition-all duration-300 hover:shadow-xl touch-target"
              onClick={navigateToNextDay}
              disabled={selectedDay === itineraryData.length}
            >
              <ArrowRight className="h-5 w-5 text-[#1f5582]" />
              <span className="sr-only">Next day</span>
            </Button>
          </div>

          {/* Itinerary Toggle Button */}
          <div className="absolute top-4 right-4 pointer-events-auto">
            <Button
              className="bg-[#1f5582] hover:bg-[#164569] text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 touch-target"
              onClick={toggleItineraryView}
            >
              {showItineraryList ? (
                <>
                  <ChevronRight className="mr-2 h-4 w-4 touch-target" />
                  HIDE ITINERARY
                </>
              ) : (
                <>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  ITINERARY VIEW
                </>
              )}
            </Button>
          </div>

          {/* Day Indicator */}
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-1.5 pointer-events-auto">
            {itineraryData.map((day) => (
              <button
                key={day.day}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  selectedDay === day.day ? "bg-[#1f5582] scale-125" : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => navigateToDay(day.day)}
                aria-label={`Go to day ${day.day}`}
              />
            ))}
          </div>

          {/* Itinerary Card Carousel */}
          <div className="absolute bottom-4 left-12 right-12 pointer-events-auto">
            <AnimatePresence custom={direction} initial={false} mode="wait">
              <motion.div
                key={selectedDay}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="bg-white/95 backdrop-blur-sm p-5 rounded-lg shadow-lg"
              >
                <motion.h3 className="font-bold text-xl text-[#1f5582]">
                  Day {selectedDay} - {itineraryData[selectedDay - 1]?.title}
                </motion.h3>
                <motion.p className="text-gray-700 font-medium mb-3">
                  {itineraryData[selectedDay - 1]?.location} - {itineraryData[selectedDay - 1]?.date}
                </motion.p>

                {/* Description with subtle Read More functionality */}
                {(() => {
                  const currentDay = itineraryData[selectedDay - 1];
                  if (!currentDay) return null;
                  
                  return (
                    <ExpandableContentSubtle
                      summary={extractFirstTwoSentences(currentDay.description)}
                      fullText={currentDay.description || ""}
                      {...(currentDay.additionalInfo && { additionalInfo: currentDay.additionalInfo })}
                      isExpanded={!!expandedCards[selectedDay]}
                      onToggle={() => toggleCardExpansion(selectedDay)}
                    />
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Itinerary List - Highest z-index */}
      <AnimatePresence>
        {showItineraryList && (
          <motion.div
            className="w-[50%] border-l border-gray-200 overflow-y-auto bg-white"
            style={{ zIndex: 2000 }}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "50%" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onAnimationComplete={() => {
              // Force map re-render after animation completes
              setMapKey((prev) => prev + 1)
            }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#1f5582]">Your Itinerary</h2>
                <Button variant="ghost" size="sm" className="text-gray-500" onClick={toggleItineraryView}>
                  <ChevronRight className="h-4 w-4 touch-target" />
                </Button>
              </div>

              <div className="space-y-3">
                {itineraryData.map((day) => (
                  <motion.div
                    key={day.day}
                    className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                      selectedDay === day.day
                        ? "border-[#1f5582] bg-[#1f5582]/5 shadow-md"
                        : "border-gray-200 hover:border-[#1f5582]/50 hover:bg-gray-50"
                    }`}
                    onClick={() => navigateToDay(day.day)}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        {/* Thumbnail image in list */}
                        {day.image && (
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={
                                locationImages[day.day] ||
                                day.image ||
                                `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(day.location)}`
                              }
                              alt={day.location}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(
                                  day.location,
                                )}`
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-[#1f5582]">
                            Day {day.day} - {day.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {day.location} - {day.date}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedDay === day.day ? "bg-[#1f5582] text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {day.day}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{day.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
