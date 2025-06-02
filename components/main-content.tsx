"use client"

import { motion } from "framer-motion"
import { ItineraryView } from "./itinerary-view"
import { LodgingView } from "./lodging-view"
import { FlightsView } from "./flights-view"
import { TravelersView } from "./travelers-view"
import { TripCostView } from "./trip-cost-view"
import { useOneHandedMode } from "@/hooks/use-one-handed-mode"
import { useBatteryStatus } from "@/hooks/use-battery-status"

interface MainContentProps {
  activeTab: string
  showItineraryList: boolean
  setShowItineraryList: (show: boolean) => void
}

export function MainContent({ activeTab, showItineraryList, setShowItineraryList }: MainContentProps) {
  const oneHanded = useOneHandedMode();
  const { powerSaving } = useBatteryStatus();
  const duration = powerSaving ? 0.05 : 0.3;
  const renderContent = () => {
    switch (activeTab) {
      case "itinerary":
        return <ItineraryView showItineraryList={showItineraryList} setShowItineraryList={setShowItineraryList} />
      case "lodging":
        return <LodgingView />
      case "flights":
        return <FlightsView />
      case "travelers":
        return <TravelersView />
      case "trip-cost":
        return <TripCostView />
      default:
        return <ItineraryView showItineraryList={showItineraryList} setShowItineraryList={setShowItineraryList} />
    }
  }

  return (
    <motion.div
      className={`w-full md:w-[70%] bg-gradient-to-br from-white to-gray-50 overflow-hidden flex${oneHanded ? ' pb-24' : ''}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration }}
    >
      {renderContent()}
    </motion.div>
  )
}
