"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plane,
} from "lucide-react"
import { useTrips } from '@/hooks/use-trips'
import { Badge } from "@/components/ui/badge"
import { truncateTextSmart } from '@/lib/truncate-text'

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
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
  tripId?: string
}

interface AIRequestFormProps {
  onComplete: (formData: FormData) => void
}

interface ItineraryDay {
  day: number
  title: string
  location: string
  description: string
  image?: string
}

export function AIRequestForm({ onComplete }: AIRequestFormProps) {
  const { createTrip } = useTrips()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! 👋 I'm excited to help you plan your dream trip! What destination has been calling to you lately?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [extractedData, setExtractedData] = useState<FormData>({})
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(1)
  const [currentItineraryData, setCurrentItineraryData] = useState<ItineraryDay[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock location images for demo
  const locationImages: Record<number, string> = {
    1: '/images/lima-peru.png',
    2: '/images/cusco-peru.png',
    3: '/images/sacred-valley.png',
    4: '/images/machu-picchu.png',
    5: '/images/cusco-peru.png',
    6: '/images/puerto-maldonado.png',
    7: '/images/lima-peru.png'
  }

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      // Send message to AI
      const response = await fetch("/api/form-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const responseText = data.fallbackResponse || data.response

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Extract form data from conversation
      await extractFormData([...messages, userMessage, assistantMessage])
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError(error.message)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble right now. Please try again or continue describing your trip.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const extractFormData = async (conversationHistory: Message[]) => {
    try {
      const response = await fetch("/api/extract-form-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory }),
      })

      if (response.ok) {
        const result = await response.json()
        setExtractedData(result.data)
        
        // Generate mock itinerary preview when we have enough data
        if (result.data.completeness >= 70 && result.data.destinations?.length > 0) {
          const destination = result.data.destinations[0]
          const startDate = new Date(result.data.travelDates?.startDate || new Date())
          const endDate = new Date(result.data.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          
          const mockDays: ItineraryDay[] = []
          for (let i = 0; i < days; i++) {
            mockDays.push({
              day: i + 1,
              title: i === 0 ? `Arrival in ${destination}` : 
                     i === days - 1 ? `Departure from ${destination}` : 
                     `Explore ${destination}`,
              location: destination,
              description: i === 0 ? 
                `Welcome to ${destination}! Check into your accommodation and explore the local area.` :
                i === days - 1 ?
                `Say goodbye to ${destination}. Transfer to the airport for your departure.` :
                `Discover the best of ${destination} with guided tours, local cuisine, and cultural experiences.`,
              image: locationImages[i + 1]
            })
          }
          setCurrentItineraryData(mockDays)
        }
      }
    } catch (error) {
      console.error("Error extracting form data:", error)
    }
  }

  const generateAIItinerary = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Convert extracted data to API format
      const tripData = {
        destination: extractedData.destinations?.[0] || "",
        dates: {
          from: extractedData.travelDates?.startDate || new Date().toISOString(),
          to: extractedData.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        travelers: extractedData.travelers?.adults || 1,
        budget: [
          extractedData.budget?.amount || 1000,
          (extractedData.budget?.amount || 1000) * 1.5
        ],
        interests: extractedData.interests || [],
        email: undefined, // Optional
        name: undefined, // Optional
        phone: undefined, // Optional
      }

      // Generate AI itinerary
      const preferences = {
        primaryDestination: extractedData.destinations?.[0] || "Paris",
        startDate: extractedData.travelDates?.startDate || new Date().toISOString(),
        endDate: extractedData.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        adults: extractedData.travelers?.adults || 1,
        children: extractedData.travelers?.children || 0,
        infants: 0,
        budgetMin: extractedData.budget?.amount || 1000,
        budgetMax: (extractedData.budget?.amount || 1000) * 1.5,
        interests: extractedData.interests || ['sightseeing', 'culinary', 'cultural'],
        accommodationType: extractedData.accommodation || 'hotel',
        transportationPreference: 'mixed',
        pacePreference: 'moderate'
      }

      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate itinerary")
      }

      const result = await response.json()
      
      if (result.success && result.itinerary) {
        // Parse the generated itinerary to create preview data
        const itineraryDays: ItineraryDay[] = result.itinerary.days.map((day: any, index: number) => ({
          day: day.dayNumber || index + 1,
          title: day.title,
          location: day.location || result.itinerary.destinations[0]?.title || preferences.primaryDestination,
          description: day.notes || `Day ${day.dayNumber}: ${day.activities.map((a: any) => a.title).join(', ')}`,
          image: locationImages[day.dayNumber || index + 1]
        }))
        setCurrentItineraryData(itineraryDays)
        
        // Create trip in the system with the generated itinerary
        const newTrip = await createTrip({
          title: result.itinerary.title || `Trip to ${preferences.primaryDestination}`,
          description: result.itinerary.description || `AI-generated ${result.itinerary.totalDuration}-day itinerary`,
          startDate: result.itinerary.days[0]?.date || preferences.startDate,
          endDate: result.itinerary.days[result.itinerary.days.length - 1]?.date || preferences.endDate,
          location: preferences.primaryDestination
        })
      } else {
        throw new Error("Invalid itinerary response")
      }

      if (newTrip) {
        onComplete({
          ...extractedData,
          tripId: newTrip.id,
        })
      } else {
        throw new Error("Failed to create trip")
      }
    } catch (error: any) {
      console.error("Error generating AI itinerary:", error)
      setError(error.message)
      
      // Fallback to basic trip creation
      try {
        const basicTrip = await createTrip({
          title: extractedData.destinations?.[0] ? `Trip to ${extractedData.destinations[0]}` : "New Trip",
          description: extractedData.specialRequirements || "",
          startDate: extractedData.travelDates?.startDate || new Date().toISOString(),
          endDate: extractedData.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: extractedData.destinations?.[0] || "Unknown",
        })

        if (basicTrip) {
          onComplete({
            ...extractedData,
            tripId: basicTrip.id,
          })
        }
      } catch (fallbackError) {
        console.error("Fallback trip creation failed:", fallbackError)
        onComplete(extractedData)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const completeness = extractedData.completeness || 0
  const isReadyToProceed = completeness >= 70

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
      <div className="flex-1 flex">
        {/* Main Chat Interface */}
        <div className="flex-1 max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-2rem)] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">AI Travel Planner</h1>
            <p className="text-gray-600 mt-1">Tell me about your dream trip</p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Trip Details</span>
                <span>{completeness}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t">
            {!isReadyToProceed ? (
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={!inputMessage.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Great! I have enough information to create your personalized itinerary.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={generateAIItinerary}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate AI Itinerary
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                {error && (
                  <Button
                    variant="outline"
                    onClick={generateAIItinerary}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Generation
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Image Gallery - Only show when we have itinerary data */}
      {currentItineraryData.length > 0 && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xl font-bold text-brand-gray-600 mb-2">Destination Gallery</h3>
            <p className="text-sm text-brand-gray-500">
              Day {selectedDay} of {currentItineraryData.length} • {currentItineraryData[selectedDay - 1]?.location}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentItineraryData.map((day) => (
              <motion.div
                key={day.day}
                data-day={day.day}
                className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedDay === day.day
                    ? "ring-4 ring-brand-blue-600 shadow-xl scale-105"
                    : "hover:shadow-lg hover:scale-102"
                }`}
                onClick={() => setSelectedDay(day.day)}
                whileHover={{ scale: selectedDay === day.day ? 1.05 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <img
                    src={
                      locationImages[day.day] ||
                      day.image ||
                      `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(day.location)}`
                    }
                    alt={day.location}
                    className="w-full h-52 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(day.location)}`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base truncate">{day.location}</h4>
                        <p className="text-sm opacity-90 truncate">
                          Day {day.day} - {day.title}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-sm ml-3 flex-shrink-0 font-bold ${
                          selectedDay === day.day ? "bg-brand-orange-600 text-white" : "bg-white/20 text-white"
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
                    <p className="text-sm text-brand-gray-500 leading-relaxed">
                      {truncateTextSmart(day.description, 120)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Plane className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </div>
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
              className="w-full text-brand-blue-600 border-brand-blue-600 hover:bg-brand-blue-600/10 font-semibold"
              onClick={() => {
                const selectedElement = document.querySelector(`[data-day="${selectedDay}"]`)
                if (selectedElement) {
                  selectedElement.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              }}
            >
              <Plane className="w-4 h-4 mr-2" />
              Scroll to Day {selectedDay}
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}