"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Send,
  Mic,
  MicOff,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Bed,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Menu,
  X,
} from "lucide-react"
import { TripNavLogo as Logo } from "@/components/ui/TripNavLogo"
import { useTrips } from '@/hooks/use-trips'
import { itineraryUtils } from '@/hooks/use-itinerary'

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
  const { createTrip, loading: tripLoading } = useTrips()
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
  const [isListening, setIsListening] = useState(false)
  const [extractedData, setExtractedData] = useState<FormData>({})
  const [showQuickInputs, setShowQuickInputs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showProgressPanel, setShowProgressPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

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
    setShowQuickInputs(false)
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
        console.error("API error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Check if we got a fallback response due to configuration issues
      const responseText = data.fallbackResponse || data.response

      if (!responseText) {
        throw new Error("No response received from AI service")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Extract form data from conversation (only if we got a real AI response)
      if (data.response && !data.fallbackResponse) {
        await extractFormData([...messages, userMessage, assistantMessage])
      }

      // Reset retry count on success
      setRetryCount(0)
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError(error.message)

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getErrorMessage(error.message),
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      setRetryCount((prev) => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (errorMsg: string): string => {
    if (errorMsg.includes("OpenAI API key")) {
      return "I'm not properly configured right now. Please make sure the OpenAI API key is set up in your environment variables. You can continue our conversation, but I might not be able to provide AI-powered responses."
    }
    if (errorMsg.includes("rate limit")) {
      return "I'm getting a lot of requests right now. Please wait a moment and try again."
    }
    if (errorMsg.includes("quota")) {
      return "I've reached my usage limit for now. Please try again later."
    }
    return "I'm having trouble right now. You can continue typing, and I'll try to help as best I can. Please try refreshing the page if the problem persists."
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
      } else {
        console.error("Failed to extract form data:", response.status)
      }
    } catch (error) {
      console.error("Error extracting form data:", error)
    }
  }

  const handleQuickInput = (text: string) => {
    sendMessage(text)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const proceedToItinerary = async () => {
    try {
      // Convert form data to trip creation format
      const tripData = itineraryUtils.convertFormDataToTrip(extractedData)
      
      // Create the trip in the backend
      const newTrip = await createTrip(tripData)
      
      if (newTrip) {
        // Include the trip ID in the completion data
        onComplete({
          ...extractedData,
          tripId: newTrip.id
        })
      } else {
        // If trip creation fails, still proceed with form data only
        onComplete(extractedData)
      }
    } catch (error) {
      console.error('Error creating trip:', error)
      // If there's an error, still proceed with form data only
      onComplete(extractedData)
    }
  }

  const retryLastMessage = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages[messages.length - 2]
      if (lastUserMessage && lastUserMessage.role === "user") {
        // Remove the last two messages (user message and error response)
        setMessages((prev) => prev.slice(0, -2))
        // Retry sending the last user message
        sendMessage(lastUserMessage.content)
      }
    }
  }

  const completeness = extractedData.completeness || 0
  const isReadyToProceed = completeness >= 70

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
      {/* Mobile Header */}
      <motion.header
        className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-sm text-gray-600">AI-Powered Trip Planning</div>
              {/* Mobile Progress Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProgressPanel(!showProgressPanel)}
                className="lg:hidden text-[#1f5582] p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Progress Panel Overlay */}
      <AnimatePresence>
        {showProgressPanel && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProgressPanel(false)}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-[#1f5582]">Trip Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowProgressPanel(false)} className="p-2">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <ProgressContent
                  completeness={completeness}
                  extractedData={extractedData}
                  isReadyToProceed={isReadyToProceed}
                  proceedToItinerary={proceedToItinerary}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Chat Section - Full width on mobile */}
        <div className="flex-1 flex flex-col p-3 lg:p-6">
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-120px)] lg:h-[700px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Chat Header */}
            <div className="p-3 lg:p-4 border-b border-gray-200 bg-gradient-to-r from-[#1f5582] to-[#2a6b94] text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm lg:text-base">AI Travel Assistant</h2>
                  <p className="text-xs lg:text-sm opacity-90">Let's plan your perfect trip together</p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && retryCount > 0 && (
              <div className="p-3 lg:p-4 border-b border-gray-200">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    Having trouble connecting to AI service. You can continue the conversation manually.
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={retryLastMessage}
                      className="ml-2 h-6 px-2 text-amber-700 hover:text-amber-900"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2 lg:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-[#1f5582] to-[#2a6b94] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] p-2 lg:p-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-[#1f5582] text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p className="text-xs lg:text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 lg:gap-3 justify-start"
                >
                  <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-[#1f5582] to-[#2a6b94] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-2 lg:p-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Input Suggestions */}
              {showQuickInputs && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2 justify-center"
                >
                  {[
                    "Peru and Brazil",
                    "European adventure",
                    "Asian culture tour",
                    "African safari",
                    "Caribbean relaxation",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickInput(suggestion)}
                      className="text-xs hover:bg-[#1f5582] hover:text-white transition-colors min-h-[44px] px-3"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Input Area */}
            <div className="p-3 lg:p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me about your dream trip..."
                    className="min-h-[48px] lg:min-h-[44px] max-h-[120px] resize-none pr-12 text-base lg:text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-1 top-1 h-10 w-10 lg:h-8 lg:w-8 p-0 ${
                      isListening ? "text-red-500" : "text-gray-400"
                    }`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5 lg:h-4 lg:w-4" />
                    ) : (
                      <Mic className="h-5 w-5 lg:h-4 lg:w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-[#1f5582] hover:bg-[#164569] text-white px-4 h-12 lg:h-11 min-w-[48px]"
                >
                  <Send className="h-5 w-5 lg:h-4 lg:w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desktop Progress Sidebar */}
        <div className="hidden lg:block w-80 p-6">
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <ProgressContent
              completeness={completeness}
              extractedData={extractedData}
              isReadyToProceed={isReadyToProceed}
              proceedToItinerary={proceedToItinerary}
            />
          </motion.div>
        </div>
      </div>

      {/* Mobile Bottom Progress Bar */}
      <div className="lg:hidden bg-white border-t border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-[#1f5582]">Progress: {completeness}%</div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-[#1f5582] to-[#ff7b00] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completeness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          {isReadyToProceed && (
            <Button
              onClick={proceedToItinerary}
              className="bg-gradient-to-r from-[#1f5582] to-[#ff7b00] hover:from-[#164569] hover:to-[#e56f00] text-white font-medium py-2 px-4 rounded-lg shadow-lg min-h-[44px]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              View Itinerary
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Progress Content Component
function ProgressContent({
  completeness,
  extractedData,
  isReadyToProceed,
  proceedToItinerary,
}: {
  completeness: number
  extractedData: FormData
  isReadyToProceed: boolean
  proceedToItinerary: () => void
}) {
  return (
    <>
      <h3 className="font-semibold text-lg text-[#1f5582] mb-4">Trip Details</h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-[#1f5582]">{completeness}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-[#1f5582] to-[#ff7b00] h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Extracted Information */}
      <div className="space-y-4">
        {/* Destinations */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-[#1f5582] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Destinations</p>
            {extractedData.destinations?.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {extractedData.destinations.map((dest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {dest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Not specified yet</p>
            )}
          </div>
        </div>

        {/* Travel Dates */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-[#1f5582] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Travel Dates</p>
            {extractedData.travelDates?.startDate ? (
              <p className="text-xs text-gray-600 mt-1">
                {extractedData.travelDates.startDate} - {extractedData.travelDates.endDate || "TBD"}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Not specified yet</p>
            )}
          </div>
        </div>

        {/* Travelers */}
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-[#1f5582] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Travelers</p>
            {extractedData.travelers?.adults ? (
              <p className="text-xs text-gray-600 mt-1">
                {extractedData.travelers.adults} adults
                {extractedData.travelers.children ? `, ${extractedData.travelers.children} children` : ""}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Not specified yet</p>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-[#1f5582] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Budget</p>
            {extractedData.budget?.amount ? (
              <p className="text-xs text-gray-600 mt-1">
                ${extractedData.budget.amount.toLocaleString()}
                {extractedData.budget.perPerson ? " per person" : " total"}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Not specified yet</p>
            )}
          </div>
        </div>

        {/* Accommodation */}
        <div className="flex items-start gap-3">
          <Bed className="h-5 w-5 text-[#1f5582] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Accommodation</p>
            {extractedData.accommodation ? (
              <Badge variant="outline" className="text-xs mt-1">
                {extractedData.accommodation}
              </Badge>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Not specified yet</p>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-[#1f5582] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Interests</p>
            {extractedData.interests?.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {extractedData.interests.map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Not specified yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Proceed Button */}
      <AnimatePresence>
        {isReadyToProceed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <Button
              onClick={proceedToItinerary}
              className="w-full bg-gradient-to-r from-[#1f5582] to-[#ff7b00] hover:from-[#164569] hover:to-[#e56f00] text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              View Your Itinerary
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">Ready to see your personalized trip plan!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Proceed Option */}
      {!isReadyToProceed && completeness > 20 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <Button
            onClick={proceedToItinerary}
            variant="outline"
            className="w-full border-[#1f5582] text-[#1f5582] hover:bg-[#1f5582] hover:text-white min-h-[48px]"
          >
            Continue with Current Info
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">You can always modify details later</p>
        </motion.div>
      )}
    </>
  )
}
