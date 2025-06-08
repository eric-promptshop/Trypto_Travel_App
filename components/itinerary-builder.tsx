"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { Header } from "./header"
import { MainContent } from "./main-content"
import { ChatInterface } from "./chat-interface"

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

interface ItineraryBuilderProps {
  formData?: FormData
  isMobile: boolean
}

export function ItineraryBuilder({ formData, isMobile }: ItineraryBuilderProps) {
  const [activeTab, setActiveTab] = useState("itinerary")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [localIsMobile, setLocalIsMobile] = useState(isMobile)

  useEffect(() => {
    const checkMobile = () => {
      // Use the smaller dimension to determine if it's mobile
      const smallerDimension = Math.min(window.innerWidth, window.innerHeight)
      setLocalIsMobile(smallerDimension < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-white to-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isMobile={localIsMobile} formData={formData} />
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <MainContent key={activeTab} activeTab={activeTab} isMobile={localIsMobile} formData={formData} />
        </AnimatePresence>
      </div>
      <ChatInterface isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} formData={formData} />
    </div>
  )
}
