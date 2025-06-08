"use client"

import { useState, useEffect } from "react"
import { AIRequestForm } from "@/components/ai-request-form"
import { ItineraryBuilder } from "@/components/itinerary-builder"
import LandingPage from "@/components/landing-page"

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

export default function Home() {
  const [currentView, setCurrentView] = useState<"landing" | "form" | "itinerary">("landing")
  const [formData, setFormData] = useState<FormData>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Use the smaller dimension to determine if it's a phone-like device
      // even in landscape.
      setIsMobile(Math.min(window.innerWidth, window.innerHeight) < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleGetStarted = () => {
    setCurrentView("form")
  }

  const handleFormComplete = (data: FormData) => {
    setFormData(data)
    setCurrentView("itinerary")
  }

  if (currentView === "landing") {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  if (currentView === "form") {
    return (
      <main className="min-h-screen">
        <AIRequestForm onComplete={handleFormComplete} />
      </main>
    )
  }

  if (currentView === "itinerary") {
    return (
      <main className="min-h-screen">
        <ItineraryBuilder formData={formData} isMobile={isMobile} />
      </main>
    )
  }

  return <LandingPage onGetStarted={handleGetStarted} />
}
