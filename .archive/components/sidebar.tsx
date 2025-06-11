"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react"

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

interface SidebarProps {
  formData?: FormData
}

interface Message {
  id: string
  content: string
  sender: string
  timestamp: Date
}

export function Sidebar({ formData }: SidebarProps) {
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setIsCollapsed(mobile) // Auto-collapse on mobile
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Generate title based on form data
  const title = formData?.destinations?.length
    ? `Trip to ${formData.destinations.join(" & ")}`
    : "Jenny & Tim's Date to South America"

  // Generate subtitle based on form data
  const getSubtitle = () => {
    const destinations = formData?.destinations?.join(" & ") || "Peru & Brazil"
    const days = "13 Days"
    const travelers = formData?.travelers?.adults
      ? `${formData.travelers.adults + (formData.travelers.children || 0)} Travelers`
      : "4 Travelers"
    return `${destinations} | ${days} | ${travelers}`
  }

  // Generate price estimate based on form data
  const getPriceEstimate = () => {
    if (formData?.budget?.amount) {
      return `$${formData.budget.amount.toLocaleString()}${formData.budget.perPerson ? "/person" : " total"}`
    }
    return "$2,400/person"
  }

  // Add initial message based on form data
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      const initialContent = generateInitialMessage(formData)

      setMessages([
        {
          id: "1",
          content: initialContent,
          sender: formData?.travelers?.adults === 1 ? "You" : "Jenny",
          timestamp: new Date(),
        },
      ])
    }
  }, [formData])

  const generateInitialMessage = (data: FormData): string => {
    let message = "I'd like to see a"

    // Add duration
    message += " 13 day"

    // Add destinations
    if (data.destinations?.length) {
      message += ` itinerary of ${data.destinations.join(" and ")}`
    } else {
      message += " itinerary of Brazil and Peru"
    }

    // Add accommodation preference
    if (data.accommodation) {
      message += `, we'd like ${data.accommodation} Hotels`
    } else {
      message += ", we'd like 3-Star Hotels"
    }

    // Add interests
    if (data.interests?.length) {
      message += ` and focus on ${data.interests.join(", ")}`
    } else {
      message += " and private tours"
    }

    // Add travelers info
    if (data.travelers?.adults) {
      message += ` for ${data.travelers.adults} adult${data.travelers.adults > 1 ? "s" : ""}`
      if (data.travelers.children) {
        message += ` and ${data.travelers.children} child${data.travelers.children > 1 ? "ren" : ""}`
      }
    }

    // Add dates if available
    if (data.travelDates?.startDate) {
      message += ` starting on ${data.travelDates.startDate}`
      if (data.travelDates.endDate) {
        message += ` until ${data.travelDates.endDate}`
      }
    }

    return message
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "You",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Here you would typically send the message to your AI service
      // For now, we'll just simulate a response after a delay
      setTimeout(() => {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I've updated your itinerary based on your preferences. You can see the changes in the map view.",
          sender: "Trypto Assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, responseMessage])
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error("Error sending message:", error)
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className={`${
        isMobile ? "w-full" : "w-[30%] min-w-[300px]"
      } border-r border-gray-200 bg-white overflow-y-auto transition-all duration-300`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Mobile Collapsible Header */}
      {isMobile && (
        <div className="border-b border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-4 justify-between text-left min-h-[56px]"
          >
            <div>
              <h2 className="font-semibold text-[#1f5582] text-sm">Trip Details</h2>
              <p className="text-xs text-gray-600">{getSubtitle()}</p>
            </div>
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </Button>
        </div>
      )}

      <div className={`p-4 space-y-4 ${isMobile && isCollapsed ? "hidden" : ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 className={`font-bold text-[#1f5582] ${isMobile ? "text-lg" : "text-xl"}`}>{title}</h1>
          <div className="text-gray-600">
            <p className={isMobile ? "text-sm" : ""}>{getSubtitle()}</p>
            <p className={`font-semibold ${isMobile ? "text-sm" : ""}`}>Price Estimate: {getPriceEstimate()}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <form onSubmit={handleSubmit}>
            <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? "text-sm" : "text-sm"}`}>
              Tell us how to update your travel itinerary:
            </label>
            <div className="relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your travel preferences here..."
                className={`w-full border-gray-300 focus:border-[#1f5582] focus:ring-[#1f5582] transition-all duration-300 pr-12 ${
                  isMobile ? "min-h-[48px] text-base" : "min-h-[40px] text-sm"
                }`}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`absolute right-2 bottom-2 bg-[#1f5582] hover:bg-[#164569] text-white rounded-full ${
                  isMobile ? "h-10 w-10" : "h-8 w-8"
                } p-0`}
              >
                <Send className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`} />
              </Button>
            </div>
            <p className={`text-gray-500 mt-1 flex items-center ${isMobile ? "text-sm" : "text-xs"}`}>
              <MessageCircle className={`mr-1 ${isMobile ? "h-4 w-4" : "h-3 w-3"}`} />
              Try our AI assistant (bottom right) for instant help!
            </p>
          </form>
        </motion.div>

        <motion.div
          className="border-t border-gray-200 pt-4 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className={`${isMobile ? "max-h-[300px]" : "max-h-[calc(100vh-350px)]"} overflow-y-auto space-y-3`}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className="bg-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-semibold text-[#1f5582] ${isMobile ? "text-sm" : ""}`}>{message.sender}</span>
                  <span className={`text-gray-500 ${isMobile ? "text-xs" : "text-xs"}`}>
                    {message.timestamp.toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}{" "}
                    {message.timestamp.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <p className={`text-gray-700 mt-1 ${isMobile ? "text-sm" : ""}`}>{message.content}</p>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-100 p-3 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className={`font-semibold text-[#1f5582] ${isMobile ? "text-sm" : ""}`}>Trypto Assistant</span>
                  <span className={`text-gray-500 ${isMobile ? "text-xs" : "text-xs"}`}>Now</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
