"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"

export function ItineraryBuilder() {
  const [activeTab, setActiveTab] = useState("itinerary")
  const [showItineraryList, setShowItineraryList] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-white to-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <Sidebar />
        <AnimatePresence mode="wait">
          <MainContent
            key={activeTab}
            activeTab={activeTab}
            showItineraryList={showItineraryList}
            setShowItineraryList={setShowItineraryList}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}
