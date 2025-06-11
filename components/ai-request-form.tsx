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
} from "lucide-react"
import { useTrips } from '@/hooks/use-trips'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      const response = await fetch("/api/trips-ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate itinerary")
      }

      const result = await response.json()
      
      // Create trip in the system with the generated itinerary
      const newTrip = await createTrip({
        title: result.itinerary.title || `Trip to ${tripData.destination}`,
        description: `AI-generated ${result.itinerary.duration}-day itinerary`,
        startDate: result.itinerary.startDate,
        endDate: result.itinerary.endDate,
        location: tripData.destination
      })

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
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
    </div>
  )
}