"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronLeft, List, MapIcon as MapIconLucide, Edit, MessageSquare, Mic } from "lucide-react"
import { LeafletMapLoader } from "./LeafletMapLoader"
import { itineraryData } from "@/data/itinerary-data"
import { getRealisticImageUrl } from "@/lib/image-service"

// Add these utility functions at the top of the file
function extractSentences(text: string, count: number): string {
  const sentenceRegex = /[^.!?]*[.!?]/g
  const sentences = text.match(sentenceRegex) || []
  return sentences.slice(0, count).join(" ")
}

function truncateTextSmart(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text

  // Try to find a sentence boundary
  const sentenceRegex = /[^.!?]*[.!?]/g
  const sentences = text.match(sentenceRegex) || []
  let result = ""

  for (const sentence of sentences) {
    if ((result + sentence).length <= maxLength) {
      result += sentence
    } else {
      break
    }
  }

  // If no complete sentence fits, fall back to word boundary
  if (!result) {
    const words = text.split(" ")
    result = words.reduce((acc, word) => {
      if ((acc + " " + word).length <= maxLength) {
        return acc ? acc + " " + word : word
      }
      return acc
    }, "")

    return result + "..."
  }

  return result
}

interface FormData {
  destinations?: string[]
  travelDates?: {
    startDate?: string
    endDate?: string
    flexible?: boolean
  }
  travelers?: {
    adults?: number
    children?: number
  }
  budget?: {
    amount?: number
    currency?: string
    perPerson?: boolean
  }
  accommodation?: string
  interests?: string[]
  specialRequirements?: string
  completeness?: number
}

interface ItineraryViewProps {
  isMobile: boolean
  formData?: FormData
}

export function ItineraryView({ isMobile, formData }: ItineraryViewProps) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [direction, setDirection] = useState(0)
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})
  const [mapKey, setMapKey] = useState(Date.now())
  const [locationImages, setLocationImages] = useState<Record<string, string>>({})
  const [showItineraryList, setShowItineraryList] = useState(isMobile)
  const [currentItineraryData, setCurrentItineraryData] = useState(itineraryData)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Effect to update the itinerary data based on form data
  useEffect(() => {
    if (formData?.destinations?.length) {
      const primaryDestination = formData.destinations[0]
      const modifiedData = itineraryData.map((day) => {
        return {
          ...day,
          title: day.title.replace(/Lima|Peru|Brazil|Cusco|Amazon/gi, primaryDestination),
          location: primaryDestination,
          description: day.description.replace(/Lima|Peru|Brazil|Cusco|Amazon/gi, primaryDestination),
        }
      })

      setCurrentItineraryData(modifiedData)
      setSelectedDay(1)
      setMapKey(Date.now())
    }
  }, [formData?.destinations])

  // Effect to update showItineraryList if isMobile prop changes
  useEffect(() => {
    setShowItineraryList(isMobile)
  }, [isMobile])

  const navigateToDay = (day: number) => {
    if (day < 1 || day > currentItineraryData.length) return
    setDirection(day > selectedDay ? 1 : -1)
    setSelectedDay(day)
    setShowFullDescription(false)
    if (isMobile && showItineraryList) {
      setShowItineraryList(false)
    }
  }

  const mapLocations = currentItineraryData.map((day) => ({
    day: day.day,
    title: day.title,
    location: day.location,
    latitude: day.latitude,
    longitude: day.longitude,
    image: day.image,
  }))

  useEffect(() => {
    async function loadImages() {
      const imageMap: Record<string, string> = {}
      const imagePromises = currentItineraryData.map(async (day) => {
        try {
          const imageUrl = await getRealisticImageUrl(day.location)
          return { day: day.day, url: imageUrl }
        } catch (error) {
          console.error(`Error loading image for day ${day.day}:`, error)
          return {
            day: day.day,
            url: day.image || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(day.location)}`,
          }
        }
      })
      const results = await Promise.all(imagePromises)
      results.forEach((result) => {
        imageMap[result.day] = result.url
      })
      setLocationImages(imageMap)
    }
    loadImages()
  }, [currentItineraryData])

  // Group itinerary data by location for the sidebar
  const groupedItinerary = currentItineraryData.reduce(
    (acc, day) => {
      const location = day.location
      if (!acc[location]) {
        acc[location] = []
      }
      acc[location].push(day)
      return acc
    },
    {} as Record<string, typeof currentItineraryData>,
  )

  const locationGroups = Object.entries(groupedItinerary).map(([location, days]) => {
    const firstDay = Math.min(...days.map((d) => d.day))
    const lastDay = Math.max(...days.map((d) => d.day))
    const totalNights = days.reduce((sum, day) => sum + (day.nights || 0), 0)
    const startDate = days[0].date
    const endDate = days[days.length - 1].date

    return {
      location,
      days: days.sort((a, b) => a.day - b.day),
      dayRange: firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}-${lastDay}`,
      nights: totalNights,
      startDate,
      endDate,
      isSelected: days.some((day) => day.day === selectedDay),
    }
  })

  const selectedDayData = currentItineraryData.find((day) => day.day === selectedDay)

  if (isMobile) {
    // Mobile: Keep existing mobile layout
    return (
      <div
        className={`relative w-full flex-1 flex flex-col ${showItineraryList ? "overflow-y-auto" : "overflow-hidden"}`}
      >
        {showItineraryList ? (
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-3 -mt-4 -mx-4 px-4 border-b">
              <h2 className="text-xl font-bold text-[#1f5582]">Your Itinerary</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-[#1f5582] border-[#1f5582] hover:bg-[#1f5582]/10 min-h-[40px]"
                onClick={() => setShowItineraryList(false)}
              >
                <MapIconLucide className="mr-2 h-4 w-4" /> View Map
              </Button>
            </div>
            {currentItineraryData.map((day) => (
              <motion.div
                key={day.day}
                className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow bg-white"
                onClick={() => navigateToDay(day.day)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: day.day * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={
                      locationImages[day.day] ||
                      day.image ||
                      `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(day.location) || "/placeholder.svg"}`
                    }
                    alt={day.location}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(day.location)}`
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1f5582] text-sm leading-tight">
                      Day {day.day} - {day.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {day.location} - {day.date}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{extractSentences(day.description, 2)}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0 ml-2">
                    {day.day}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative">
            <div className="flex-1 w-full relative" style={{ zIndex: 1 }}>
              <LeafletMapLoader
                key={`map-${mapKey}`}
                locations={mapLocations}
                selectedDay={selectedDay}
                onMarkerClick={navigateToDay}
                className="rounded-lg overflow-hidden"
                isItineraryOpen={false}
              />
            </div>
            <div className="absolute top-4 left-4 pointer-events-auto z-[1001]">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm text-[#1f5582] border-[#1f5582] hover:bg-[#1f5582]/10 min-h-[40px] shadow-md"
                onClick={() => setShowItineraryList(true)}
              >
                <List className="mr-2 h-4 w-4" /> View List
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop: New layout matching the design
  return (
    <div className="flex h-full w-full flex-1 bg-gray-50">
      {/* Left Sidebar - Destination Cards */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Trip Overview</h2>
          <div className="space-y-3">
            {locationGroups.map((group, index) => (
              <Card
                key={group.location}
                className={`p-4 cursor-pointer transition-all duration-200 border ${
                  group.isSelected
                    ? "border-[#1f5582] bg-blue-50/50 shadow-md"
                    : "border-gray-200 hover:border-[#1f5582]/50 hover:shadow-sm"
                }`}
                onClick={() => navigateToDay(group.days[0].day)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1f5582] text-sm leading-tight">{group.location}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {group.startDate} - {group.endDate}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {group.dayRange}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>
                    {group.nights} night{group.nights !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {group.days.length} day{group.days.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Center Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Day Details Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#1f5582] mb-2 truncate">
                Day {selectedDay} - {selectedDayData?.title}
              </h1>
              <p className="text-gray-600 font-medium mb-4">
                {selectedDayData?.location.toUpperCase()} - {selectedDayData?.date.toUpperCase()}
              </p>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {showFullDescription
                    ? selectedDayData?.description
                    : truncateTextSmart(selectedDayData?.description || "", 200)}
                  {selectedDayData?.description && selectedDayData.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-[#1f5582] hover:underline ml-2 font-medium"
                    >
                      {showFullDescription ? "See less..." : "See more..."}
                    </button>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-6 flex-shrink-0">
              <Button variant="outline" size="sm" className="text-[#1f5582] border-[#1f5582] hover:bg-[#1f5582]/10">
                <Edit className="w-4 h-4 mr-2" />
                MAKE CHANGES
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                <MessageSquare className="w-4 h-4 mr-2" />
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                <Mic className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-0">
          <LeafletMapLoader
            key={`map-${mapKey}`}
            locations={mapLocations}
            selectedDay={selectedDay}
            onMarkerClick={navigateToDay}
            className="w-full h-full"
            isItineraryOpen={true}
          />

          {/* Navigation Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-[1001]">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg"
              onClick={() => navigateToDay(selectedDay - 1)}
              disabled={selectedDay === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg"
              onClick={() => navigateToDay(selectedDay + 1)}
              disabled={selectedDay === currentItineraryData.length}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Day Indicator */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-[1001]">
            {currentItineraryData.map((day) => (
              <button
                key={day.day}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  selectedDay === day.day ? "bg-[#1f5582] scale-125" : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => navigateToDay(day.day)}
                aria-label={`Go to day ${day.day}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Image Gallery */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Destination Gallery</h3>
          <p className="text-sm text-gray-600 mt-1">
            Day {selectedDay} of {currentItineraryData.length}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentItineraryData.map((day) => (
            <motion.div
              key={day.day}
              data-day={day.day}
              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                selectedDay === day.day ? "ring-2 ring-[#1f5582] shadow-lg" : "hover:shadow-md"
              }`}
              onClick={() => navigateToDay(day.day)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <div className="relative">
                <img
                  src={
                    locationImages[day.day] ||
                    day.image ||
                    `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(day.location) || "/placeholder.svg"}`
                  }
                  alt={day.location}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(day.location)}`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{day.location}</h4>
                      <p className="text-xs opacity-90">
                        Day {day.day} - {day.title}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ml-2 flex-shrink-0 ${
                        selectedDay === day.day ? "bg-[#ff7b00] text-white" : "bg-white/20 text-white"
                      }`}
                    >
                      {day.day}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Expanded content for selected day */}
              {selectedDay === day.day && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-4 border-t border-gray-200"
                >
                  <p className="text-xs text-gray-600 leading-relaxed">{truncateTextSmart(day.description, 150)}</p>
                  {day.additionalInfo && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {truncateTextSmart(day.additionalInfo, 100)}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Scroll to selected day button */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[#1f5582] border-[#1f5582] hover:bg-[#1f5582]/10"
            onClick={() => {
              const selectedElement = document.querySelector(`[data-day="${selectedDay}"]`)
              if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            }}
          >
            Scroll to Day {selectedDay}
          </Button>
        </div>
      </div>
    </div>
  )
}
