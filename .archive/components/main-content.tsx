"use client"

import { motion } from "framer-motion"
import { ModernItineraryViewer } from "./itinerary/ModernItineraryViewer"
import { LodgingView } from "./lodging-view"
import { FlightsView } from "./flights-view"
import { TravelersView } from "./travelers-view"
import { TripCostView } from "./trip-cost-view"

// Import the Itinerary type for proper typing
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

interface MainContentProps {
  activeTab: string
  isMobile: boolean
  formData?: FormData
}

// Helper function to transform FormData into Itinerary format for ModernItineraryViewer
function createItineraryFromFormData(formData?: FormData): Itinerary | undefined {
  if (!formData) return undefined
  
  const destination = formData.destinations?.[0] || "Your Destination"
  const startDate = formData.travelDates?.startDate || "2024-03-15"
  const endDate = formData.travelDates?.endDate || "2024-03-22"
  const travelers = (formData.travelers?.adults || 1) + (formData.travelers?.children || 0)
  const budget = formData.budget?.amount || 2500

  return {
    id: '1',
    title: `${destination} Adventure`,
    destination,
    startDate,
    endDate,
    totalDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 7,
    travelers,
    totalBudget: budget,
    spentBudget: Math.floor(budget * 0.7), // 70% of budget as example
    description: `Explore ${destination} with our AI-curated itinerary`,
    coverImage: '/images/destination-placeholder.jpg',
    status: 'draft' as const,
    lastUpdated: new Date().toISOString().split('T')[0] || '2024-01-01',
    days: [
      {
        date: startDate,
        title: `Arrival in ${destination}`,
        totalCost: 150,
        highlights: ['Welcome', 'Exploration', 'Local Culture'],
        activities: [
          {
            id: '1',
            time: '10:00',
            title: 'Airport Arrival',
            description: 'Begin your adventure with a smooth arrival',
            location: `${destination} Airport`,
            type: 'transport' as const,
            duration: '1 hour',
            cost: 50,
          },
          {
            id: '2',
            time: '14:00',
            title: 'City Exploration',
            description: 'Discover the heart of the city',
            location: `${destination} City Center`,
            type: 'activity' as const,
            duration: '3 hours',
            cost: 75,
            rating: 4.5,
          },
          {
            id: '3',
            time: '19:00',
            title: 'Welcome Dinner',
            description: 'Experience local cuisine',
            location: `Local Restaurant, ${destination}`,
            type: 'dining' as const,
            duration: '2 hours',
            cost: 25,
            rating: 4.2,
          }
        ]
      }
    ]
  }
}

export function MainContent({ activeTab, isMobile, formData }: MainContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "itinerary":
        const itinerary = createItineraryFromFormData(formData)
        return (
          <div className={isMobile ? "p-4" : "p-6"}>
            <ModernItineraryViewer 
              {...(itinerary ? { itinerary } : {})}
            />
          </div>
        )
      case "lodging":
        return <LodgingView />
      case "flights":
        return <FlightsView />
      case "travelers":
        return <TravelersView />
      case "trip-cost":
        return <TripCostView />
      default:
        const defaultItinerary = createItineraryFromFormData(formData)
        return (
          <div className={isMobile ? "p-4" : "p-6"}>
            <ModernItineraryViewer 
              {...(defaultItinerary ? { itinerary: defaultItinerary } : {})}
            />
          </div>
        )
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
