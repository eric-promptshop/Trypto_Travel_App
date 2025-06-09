"use client"

import { useState } from "react"
import { ModernItineraryViewer } from "./itinerary/ModernItineraryViewer"
import { ConnectedItineraryViewer } from "./itinerary/ConnectedItineraryViewer"
import { Header } from "./header"
import { ChatInterface } from "./chat-interface"
import { AnimatePresence } from "framer-motion"
import type { Itinerary } from "./itinerary/ModernItineraryViewer"

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

// This component provides backward compatibility for the old ItineraryBuilder interface
// It wraps the new ModernItineraryViewer component
export function ItineraryBuilder({ formData, isMobile }: ItineraryBuilderProps) {
  const [activeTab, setActiveTab] = useState("itinerary")
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Convert formData to itinerary format for ModernItineraryViewer
  const defaultStartDate = new Date().toISOString().split('T')[0];
  const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const startDate = formData?.travelDates?.startDate ? formData.travelDates.startDate : defaultStartDate;
  const endDate = formData?.travelDates?.endDate ? formData.travelDates.endDate : defaultEndDate;
  
  const mockItinerary: Itinerary = {
    id: "generated-1",
    title: formData?.destinations?.length ? `Trip to ${formData.destinations.join(", ")}` : "Your Custom Trip",
    destination: formData?.destinations?.[0] || "Various Destinations",
    startDate: startDate as string,
    endDate: endDate as string,
    totalDays: 7,
    travelers: (formData?.travelers?.adults || 1) + (formData?.travelers?.children || 0),
    totalBudget: formData?.budget?.amount || 2500,
    spentBudget: 0,
    description: formData?.specialRequirements || "A custom trip tailored to your preferences",
    coverImage: "/images/placeholder.jpg",
    status: "draft" as const,
    lastUpdated: new Date().toISOString(),
    days: [] // This would be populated by the actual itinerary generation
  }

  // For now, use the ConnectedItineraryViewer which handles trip data
  // In the future, this can be replaced with actual trip data from the API
  const tripId = "mock-trip-id" // This would come from the actual trip creation

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-white to-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} {...(formData && { formData })} />
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "itinerary" ? (
            <ConnectedItineraryViewer tripId={tripId} formData={formData} />
          ) : (
            // For other tabs, we can add appropriate components here
            <div className="p-8 text-center">
              <p>Tab content for: {activeTab}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      <ChatInterface isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} {...(formData && { formData })} />
    </div>
  )
}