"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { flushSync } from "react-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Send,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  DollarSign,
  Home,
  Heart,
  FileText,
  MapPin,
  Menu,
  ChevronRight,
} from "lucide-react"
import { useTrips } from '@/hooks/use-trips'
import { Badge } from "@/components/ui/badge"
import { truncateTextSmart } from '@/lib/truncate-text'
import { Progress } from "@/components/ui/progress"
import { useDeviceType, type DeviceType } from '@/hooks/use-device-type'
import { AnimatePresence } from 'framer-motion'
import { fadeIn, slideUp, scaleIn, staggerContainer, staggerItem, cardHover, getDeviceAnimation, smoothSpring } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
}

interface AIRequestFormProps {
  onComplete: (data: FormData) => void
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
  const deviceType = useDeviceType()
  
  // Add viewport height CSS variable for mobile and tablet
  useEffect(() => {
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const updateViewportHeight = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }
      
      updateViewportHeight()
      window.addEventListener('resize', updateViewportHeight)
      window.addEventListener('orientationchange', updateViewportHeight)
      
      return () => {
        window.removeEventListener('resize', updateViewportHeight)
        window.removeEventListener('orientationchange', updateViewportHeight)
      }
    }
  }, [deviceType])
  
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
  const [showProgressSidebar, setShowProgressSidebar] = useState(false)
  const [showGallerySidebar, setShowGallerySidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousMessagesLength = useRef(messages.length)
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Mock location images for demo
  const locationImages: Record<number, string> = {
    1: '/images/lima-peru.png',
    2: '/images/cusco-peru.png',
    3: '/images/sacred-valley.png',
    4: '/images/machu-picchu.png',
    5: '/images/puerto-maldonado.png',
    6: '/images/rio-de-janeiro.png',
  }

  // Only scroll when new messages are added, not on every render
  useEffect(() => {
    if (messages.length > previousMessagesLength.current) {
      previousMessagesLength.current = messages.length
      // Delay scroll to allow DOM update
      const timer = setTimeout(() => {
        // Only scroll if the input is not focused AND not currently typing
        if (document.activeElement !== inputRef.current && !isInputFocused) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [messages.length, isInputFocused])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Use flushSync to ensure synchronous state update and maintain focus
    flushSync(() => {
      setInputMessage(newValue)
    })
    
    // Ensure input maintains focus after state update
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  
  // Focus tracking handlers
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true)
  }, [])
  
  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false)
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const messageContent = inputMessage.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: "user",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    // Keep focus on input for mobile and tablet
    if ((deviceType === 'mobile' || deviceType === 'tablet') && inputRef.current) {
      inputRef.current.focus()
    }

    try {
      // Include the current user message in conversation history
      const updatedHistory = [...messages, userMessage]
      
      // Send message to AI
      const response = await fetch("/api/form-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageContent,
          conversationHistory: updatedHistory,
          extractedData,
        }),
      })

      const data = await response.json()
      
      console.log('AI Response data:', {
        hasResponse: !!data.response,
        hasFallback: !!data.fallbackResponse,
        isAI: data.isAI,
        warning: data.warning,
        error: data.error
      })
      
      if (data.response || data.fallbackResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || data.fallbackResponse,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
      }

      // Extract form data from conversation
      const extractResponse = await fetch("/api/extract-form-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedHistory,
          currentData: extractedData,
        }),
      })

      const extractedResult = await extractResponse.json()
      if (extractedResult.data) {
        setExtractedData(extractedResult.data)
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
      // Refocus input on mobile and tablet after loading
      if ((deviceType === 'mobile' || deviceType === 'tablet') && inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const generateAIItinerary = async () => {
    if (!extractedData.destinations?.length) {
      setError("Please provide at least one destination")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extractedData,
          generateAI: true,
        }),
      })

      const result = await response.json()
      console.log("Generate itinerary response:", result)

      if (result.success && result.itinerary?.days) {
        setCurrentItineraryData(result.itinerary.days.map((day: any, index: number) => ({
          day: index + 1,
          title: day.title || `Day ${index + 1}`,
          location: day.location || extractedData.destinations?.[0] || "Unknown",
          description: day.description || day.activities?.join(", ") || "",
          image: day.image,
        })))

        const newTrip = await createTrip({
          title: result.itinerary.title || `Trip to ${extractedData.destinations[0]}`,
          description: result.itinerary.description || "",
          startDate: extractedData.travelDates?.startDate || new Date().toISOString(),
          endDate: extractedData.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: extractedData.destinations[0],
          itinerary: result.itinerary,
        })
        
        if (newTrip) {
          onComplete({
            ...extractedData,
            tripId: newTrip.id,
          })
        } else {
          throw new Error("Failed to create trip")
        }
      } else {
        throw new Error("Invalid itinerary response")
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

  // Progress Sidebar Content Component
  const ProgressSidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Trip Planning Progress</h3>
        <Progress value={completeness} className="h-2" />
        <p className="text-sm text-gray-600 mt-2">{completeness}% Complete</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Destination */}
        <motion.div 
          className={`p-4 rounded-lg border ${extractedData.destinations?.length ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
          initial={false}
          animate={isInputFocused ? undefined : { scale: extractedData.destinations?.length ? 1 : 1 }}
          transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 mb-2">
            <MapPin className={`h-5 w-5 ${extractedData.destinations?.length ? 'text-green-600' : 'text-gray-400'}`} />
            <h4 className="font-medium text-gray-900">Destination</h4>
            {extractedData.destinations?.length ? <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> : null}
          </div>
          {extractedData.destinations?.length ? (
            <div className="space-y-1">
              {extractedData.destinations.map((dest, i) => (
                <Badge key={i} variant="secondary">{dest}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Where would you like to go?</p>
          )}
        </motion.div>
        
        {/* Travel Dates */}
        <div className={`p-4 rounded-lg border ${extractedData.travelDates?.startDate ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className={`h-5 w-5 ${extractedData.travelDates?.startDate ? 'text-green-600' : 'text-gray-400'}`} />
            <h4 className="font-medium text-gray-900">Travel Dates</h4>
            {extractedData.travelDates?.startDate ? <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> : null}
          </div>
          {extractedData.travelDates?.startDate ? (
            <p className="text-sm text-gray-700">
              {new Date(extractedData.travelDates.startDate).toLocaleDateString()} - 
              {extractedData.travelDates.endDate && new Date(extractedData.travelDates.endDate).toLocaleDateString()}
              {extractedData.travelDates.flexible && <Badge variant="outline" className="ml-2 text-xs">Flexible</Badge>}
            </p>
          ) : (
            <p className="text-sm text-gray-500">When do you plan to travel?</p>
          )}
        </div>
        
        {/* Travelers */}
        <div className={`p-4 rounded-lg border ${extractedData.travelers?.adults ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Users className={`h-5 w-5 ${extractedData.travelers?.adults ? 'text-green-600' : 'text-gray-400'}`} />
            <h4 className="font-medium text-gray-900">Travelers</h4>
            {extractedData.travelers?.adults ? <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> : null}
          </div>
          {extractedData.travelers?.adults ? (
            <p className="text-sm text-gray-700">
              {extractedData.travelers.adults} adult{extractedData.travelers.adults > 1 ? 's' : ''}
              {extractedData.travelers.children ? `, ${extractedData.travelers.children} child${extractedData.travelers.children > 1 ? 'ren' : ''}` : ''}
            </p>
          ) : (
            <p className="text-sm text-gray-500">How many people are traveling?</p>
          )}
        </div>
        
        {/* Budget */}
        <div className={`p-4 rounded-lg border ${extractedData.budget?.amount ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className={`h-5 w-5 ${extractedData.budget?.amount ? 'text-green-600' : 'text-gray-400'}`} />
            <h4 className="font-medium text-gray-900">Budget</h4>
            {extractedData.budget?.amount ? <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> : null}
          </div>
          {extractedData.budget?.amount ? (
            <p className="text-sm text-gray-700">
              {extractedData.budget.currency || '$'}{extractedData.budget.amount}
              {extractedData.budget.perPerson ? ' per person' : ' total'}
            </p>
          ) : (
            <p className="text-sm text-gray-500">What's your budget?</p>
          )}
        </div>
        
        {/* Accommodation */}
        <div className={`p-4 rounded-lg border ${extractedData.accommodation ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Home className={`h-5 w-5 ${extractedData.accommodation ? 'text-green-600' : 'text-gray-400'}`} />
            <h4 className="font-medium text-gray-900">Accommodation</h4>
            {extractedData.accommodation ? <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> : null}
          </div>
          {extractedData.accommodation ? (
            <Badge variant="secondary">{extractedData.accommodation}</Badge>
          ) : (
            <p className="text-sm text-gray-500">Preferred accommodation type?</p>
          )}
        </div>
        
        {/* Interests */}
        <div className={`p-4 rounded-lg border ${extractedData.interests?.length ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Heart className={`h-5 w-5 ${extractedData.interests?.length ? 'text-green-600' : 'text-gray-400'}`} />
            <h4 className="font-medium text-gray-900">Interests</h4>
            {extractedData.interests?.length ? <CheckCircle className="h-4 w-4 text-green-600 ml-auto" /> : null}
          </div>
          {extractedData.interests?.length ? (
            <div className="flex flex-wrap gap-1">
              {extractedData.interests.map((interest, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{interest}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">What are your interests?</p>
          )}
        </div>
        
        {/* Special Requirements */}
        {extractedData.specialRequirements && (
          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Special Requirements</h4>
            </div>
            <p className="text-sm text-gray-700">{truncateTextSmart(extractedData.specialRequirements, 60)}</p>
          </div>
        )}
      </div>
    </>
  )

  // Gallery Sidebar Content Component
  const GallerySidebarContent = () => (
    <>
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
            whileHover={isInputFocused ? undefined : { scale: selectedDay === day.day ? 1.05 : 1.02 }}
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
          </motion.div>
        ))}
      </div>
    </>
  )

  // Mobile-specific Messages Component
  const MobileMessages = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 overscroll-contain">
      <div className="space-y-4 pb-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
              message.role === 'user' 
                ? 'bg-brand-blue-600 text-white' 
                : 'bg-gray-50 text-gray-900 border border-gray-200'
            )}>
              <p className={cn(
                "text-sm whitespace-pre-wrap",
                message.role === 'user' ? 'text-white' : 'text-gray-900'
              )}>{message.content}</p>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
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
    </div>
  )

  // Chat Interface Component for Desktop
  const ChatInterface = () => (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={cn(
              "max-w-[80%] rounded-lg p-4 shadow-sm",
              message.role === 'user' 
                ? 'bg-brand-blue-600 text-white' 
                : 'bg-gray-50 text-gray-900 border border-gray-200'
            )}>
              <p className={cn(
                "whitespace-pre-wrap",
                message.role === 'user' ? 'text-white' : 'text-gray-900'
              )}>{message.content}</p>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
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
      <div className="p-6 border-t bg-white">
        {!isReadyToProceed ? (
          <>
            <form 
              key="chat-form-desktop"
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }} 
              className="flex gap-2 mb-4">
              <input
                key="chat-input-desktop"
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 bg-white text-gray-900 placeholder-gray-500"
                disabled={isLoading}
                autoFocus={false}
              />
              <Button type="submit" disabled={!inputMessage.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            
            {/* Manual transition button when completeness > 20% */}
            {completeness > 20 && (
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ready to continue?</span>
                  </div>
                </div>
                <Button
                  onClick={() => onComplete(extractedData)}
                  variant="outline"
                  className="w-full border-brand-blue-600 text-brand-blue-600 hover:bg-brand-blue-50"
                >
                  Continue with Current Info
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Great! I have enough information to create your personalized itinerary.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => onComplete(extractedData)}
              className="w-full bg-gradient-to-r from-brand-blue-600 to-brand-orange-600 hover:from-brand-blue-700 hover:to-brand-orange-700 text-white"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              View Your Itinerary
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  )

  // Mobile Layout
  if (deviceType === 'mobile') {
    return (
      <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10">
          <Sheet open={showProgressSidebar} onOpenChange={setShowProgressSidebar}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Progress
                <Badge variant="secondary" className="ml-1">{completeness}%</Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <ProgressSidebarContent />
            </SheetContent>
          </Sheet>

          <h2 className="text-base font-semibold text-gray-900">AI Travel Planner</h2>

          {currentItineraryData.length > 0 && (
            <Sheet open={showGallerySidebar} onOpenChange={setShowGallerySidebar}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  Gallery
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-80">
                <GallerySidebarContent />
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Messages and Input Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <MobileMessages />

          {/* Error Alert */}
          {error && (
            <div className="px-4 py-2 flex-shrink-0">
              <Alert variant="destructive">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Fixed Input Area */}
          <div className="bg-white border-t flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="px-4 py-3">
            {!isReadyToProceed ? (
              <>
                <form 
                  key="chat-form-mobile"
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }} 
                  className="flex gap-2">
                  <input
                    key="chat-input-mobile"
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    disabled={isLoading}
                    autoComplete="off"
                    autoFocus={false}
                  />
                  <Button type="submit" size="sm" disabled={!inputMessage.trim() || isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              
              {completeness > 20 && (
                <Button
                  onClick={() => onComplete(extractedData)}
                  variant="outline"
                  className="w-full mt-2 text-xs border-brand-blue-600 text-brand-blue-600"
                  size="sm"
                >
                  Continue with Current Info
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
              </>
            ) : (
              <div className="space-y-2">
                <Alert className="py-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <AlertDescription className="text-xs">
                    Great! I have enough information.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => onComplete(extractedData)}
                  className="w-full bg-gradient-to-r from-brand-blue-600 to-brand-orange-600 text-white text-sm"
                  size="sm"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  View Your Itinerary
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tablet Layout
  if (deviceType === 'tablet') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="flex flex-col lg:flex-row h-screen">
          {/* Collapsible Progress Sidebar for Tablet */}
          <Sheet open={showProgressSidebar} onOpenChange={setShowProgressSidebar}>
            <SheetContent side="left" className="w-80 p-0">
              <ProgressSidebarContent />
            </SheetContent>
          </Sheet>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header Bar */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProgressSidebar(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Travel Planner</h1>
                  <p className="text-sm text-gray-600">Tell me about your dream trip</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {completeness}% Complete
              </Badge>
            </div>
            
            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full max-w-4xl mx-auto p-4">
                <motion.div 
                  className="bg-white rounded-lg shadow-lg h-full flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={smoothSpring}
                >
                  <ChatInterface />
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Gallery Sidebar for Tablet - Optional */}
          {currentItineraryData.length > 0 && (
            <Sheet open={showGallerySidebar} onOpenChange={setShowGallerySidebar}>
              <SheetContent side="right" className="w-80 p-0">
                <GallerySidebarContent />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
      {/* Desktop Left Progress Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <ProgressSidebarContent />
      </div>
      
      {/* Main Chat Interface */}
      <div className="flex-1 flex">
        <div className="flex-1 max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-900">AI Travel Planner</h1>
              <p className="text-gray-600 mt-1">Tell me about your dream trip</p>
            </div>

            <ChatInterface />
          </div>
        </div>
      </div>

      {/* Right Image Gallery - Only show when we have itinerary data */}
      {currentItineraryData.length > 0 && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
          <GallerySidebarContent />
        </div>
      )}
    </div>
  )
}