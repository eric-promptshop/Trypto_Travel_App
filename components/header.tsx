"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X, Plane, Bed, MapPin, Users, DollarSign, Save, Send, Mail, User } from "lucide-react"
import { TripNavLogo } from "./ui/TripNavLogo"

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

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isMobile?: boolean
  formData?: FormData
}

export function Header({ activeTab, setActiveTab, isMobile = false, formData }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Close menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false)
    }
  }, [isMobile])

  const tabs = [
    { id: "itinerary", label: "ITINERARY", icon: MapPin },
    { id: "lodging", label: "LODGING", icon: Bed },
    { id: "flights", label: "FLIGHTS", icon: Plane },
    { id: "travelers", label: "TRAVELERS", icon: Users },
    { id: "trip-cost", label: "TRIP COST", icon: DollarSign },
  ]

  // Generate trip information from form data
  const getTripTitle = () => {
    if (formData?.destinations?.length) {
      return `Trip to ${formData.destinations.join(" & ")}`
    }
    return "Trip to Peru & Brazil"
  }

  const getTripDetails = () => {
    const destinations = formData?.destinations?.join(" & ") || "Peru & Brazil"
    const days = "13 Days"
    const travelers = formData?.travelers?.adults
      ? `${formData.travelers.adults + (formData.travelers.children || 0)} Traveler${
          formData.travelers.adults + (formData.travelers.children || 0) !== 1 ? "s" : ""
        }`
      : "2 Travelers"
    return `${destinations} | ${days} | ${travelers}`
  }

  const getPriceEstimate = () => {
    if (formData?.budget?.amount) {
      const total = formData.budget.perPerson
        ? formData.budget.amount * (formData.travelers?.adults || 1)
        : formData.budget.amount
      return `Price Estimate: $${total.toLocaleString()} total`
    }
    return "Price Estimate: $5,000 total"
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and Trip Info */}
          <div className="flex items-center gap-6">
            <TripNavLogo />
            {!isMobile && (
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold text-[#1f5582] leading-tight">{getTripTitle()}</h1>
                <p className="text-sm text-gray-600 mt-0.5">{getTripDetails()}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{getPriceEstimate()}</p>
              </div>
            )}
          </div>

          {/* Center - Navigation (Desktop) */}
          {!isMobile && (
            <nav className="hidden md:flex">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`relative px-4 py-2 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-[#1f5582] text-white"
                        : "text-gray-600 hover:text-[#1f5582] hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1f5582]"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Button>
                )
              })}
            </nav>
          )}

          {/* Right side - Action Buttons (Desktop) / Menu Button (Mobile) */}
          {!isMobile ? (
            <div className="flex items-center gap-2">
              <Button className="bg-[#ff7b00] hover:bg-[#ff7b00]/90 text-white font-semibold px-6">
                <Save className="w-4 h-4 mr-2" />
                SAVE TRIP
              </Button>
              <Button variant="outline" size="icon" className="text-[#1f5582] border-[#1f5582]">
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-[#1f5582] border-[#1f5582]">
                <Mail className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-[#1f5582] border-[#1f5582]">
                <User className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Mobile Trip Info */}
              <div className="text-right">
                <h1 className="text-sm font-bold text-[#1f5582] leading-tight">{getTripTitle()}</h1>
                <p className="text-xs text-gray-600">{getTripDetails()}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Trip Price (below main header) */}
        {isMobile && (
          <div className="mt-2 text-center">
            <p className="text-sm font-semibold text-gray-800">{getPriceEstimate()}</p>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isMobile && isMenuOpen && (
        <motion.nav
          className="md:hidden bg-white border-t border-gray-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="container mx-auto px-4 py-2 flex flex-col">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`justify-start px-4 py-2 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-gray-100 text-[#1f5582] font-medium"
                      : "text-gray-600 hover:text-[#1f5582] hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMenuOpen(false)
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </motion.nav>
      )}
    </header>
  )
}
