"use client"

import { motion } from "framer-motion"
import { ItineraryView } from "./itinerary-view"
import { LodgingView } from "./lodging-view"
import { FlightsView } from "./flights-view"
import { TravelersView } from "./travelers-view"
import { TripCostView } from "./trip-cost-view"

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

interface MainContentProps {
  activeTab: string
  isMobile: boolean
  formData?: FormData
}

export function MainContent({ activeTab, isMobile, formData }: MainContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "itinerary":
        return <ItineraryView isMobile={isMobile} formData={formData} />
      case "lodging":
        return <LodgingView />
      case "flights":
        return <FlightsView />
      case "travelers":
        return <TravelersView />
      case "trip-cost":
        return <TripCostView />
      default:
        return <ItineraryView isMobile={isMobile} formData={formData} />
    }
  }

  return (
    <motion.div
      className="w-full overflow-hidden flex flex-col flex-1"
      initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
      transition={{ duration: 0.3 }}
    >
      {renderContent()}
    </motion.div>
  )
}
