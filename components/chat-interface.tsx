"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, X, Bot, User, RefreshCw } from "lucide-react"

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

interface ChatInterfaceProps {
  isOpen: boolean
  onToggle: () => void
  formData?: FormData
}

export function ChatInterface({ isOpen, onToggle, formData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize with welcome message based on form data
  useEffect(() => {
    let welcomeMessage = "Hi! I'm your Trypto travel assistant. I can help you with questions about your"

    if (formData?.destinations?.length) {
      welcomeMessage += ` ${formData.destinations.join(" & ")}`
    } else {
      welcomeMessage += " Peru & Brazil"
    }

    welcomeMessage += " itinerary, suggest modifications, or provide travel tips.\n\n"
    welcomeMessage += "Try asking me:\n"
    welcomeMessage += "• What should I pack for Lima?\n"
    welcomeMessage += "• Tell me about Machu Picchu\n"
    welcomeMessage += "• What's the best food to try in Peru?\n"
    welcomeMessage += "• Can we add more time in Rio?\n"
    welcomeMessage += "• What's the weather like in May?\n\n"
    welcomeMessage += "What would you like to know?"

    setMessages([
      {
        id: "1",
        content: welcomeMessage,
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }, [formData])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      // Create context from form data for better AI responses
      const context = createContextFromFormData(formData)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          context: context,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to get response")

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const createContextFromFormData = (data?: FormData): string => {
    if (!data || Object.keys(data).length === 0) {
      return "Peru & Brazil trip for 4 travelers, 13 days, $2,400/person, 3-star hotels"
    }

    let context = ""

    // Add destinations
    if (data.destinations?.length) {
      context += `Trip to ${data.destinations.join(" & ")}`
    } else {
      context += "Trip to Peru & Brazil"
    }

    // Add travelers
    if (data.travelers?.adults) {
      context += ` for ${data.travelers.adults} adult${data.travelers.adults > 1 ? "s" : ""}`
      if (data.travelers.children) {
        context += ` and ${data.travelers.children} child${data.travelers.children > 1 ? "ren" : ""}`
      }
    } else {
      context += " for 4 travelers"
    }

    // Add duration
    context += ", 13 days"

    // Add budget
    if (data.budget?.amount) {
      context += `, $${data.budget.amount.toLocaleString()}${data.budget.perPerson ? "/person" : " total"}`
    } else {
      context += ", $2,400/person"
    }

    // Add accommodation
    if (data.accommodation) {
      context += `, ${data.accommodation} hotels`
    } else {
      context += ", 3-star hotels"
    }

    // Add interests
    if (data.interests?.length) {
      context += `, interested in ${data.interests.join(", ")}`
    }

    return context
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const retryLastMessage = () => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
      if (lastUserMessage) {
        setInputMessage(lastUserMessage.content)
      }
    }
  }

  // Mobile chat dimensions
  const chatWidth = isMobile ? "calc(100vw - 24px)" : "384px"
  const chatHeight = isMobile ? "calc(100vh - 120px)" : "500px"
  const chatBottom = isMobile ? "12px" : "96px"
  const chatRight = isMobile ? "12px" : "24px"

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-[2000]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <Button
          onClick={onToggle}
          className="h-14 w-14 lg:h-16 lg:w-16 rounded-full bg-[#1f5582] hover:bg-[#164569] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6 lg:h-7 lg:w-7" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6 lg:h-7 lg:w-7" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-[1999] flex flex-col"
            style={{
              width: chatWidth,
              height: chatHeight,
              bottom: chatBottom,
              right: chatRight,
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-200 bg-[#1f5582] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="font-semibold text-sm lg:text-base">Trypto Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-white/20 h-8 w-8 lg:h-10 lg:w-10 p-0 min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </div>

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
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#1f5582] flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] p-2 lg:p-3 rounded-lg ${
                        message.role === "user" ? "bg-[#1f5582] text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-xs lg:text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#ff7b00] flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    )}
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
                  <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#1f5582] flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-2 lg:p-3 rounded-lg">
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

              {/* Error with retry option */}
              {error && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryLastMessage}
                    className="text-xs text-[#1f5582] border-[#1f5582] min-h-[44px]"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 lg:p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your itinerary..."
                  className="flex-1 min-h-[48px] lg:min-h-[40px] max-h-[100px] resize-none text-base lg:text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-[#1f5582] hover:bg-[#164569] text-white px-3 min-h-[48px] min-w-[48px]"
                >
                  <Send className="h-5 w-5 lg:h-4 lg:w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
