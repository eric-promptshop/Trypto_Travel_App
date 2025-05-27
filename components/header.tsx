"use client"

import { motion } from "framer-motion"
import { MapIcon, BedDoubleIcon, PlaneIcon, UsersIcon, DollarSignIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoCreative as Logo } from "./logo-creative"

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: "itinerary", label: "ITINERARY", icon: <MapIcon className="h-4 w-4 mr-2" /> },
    { id: "lodging", label: "LODGING", icon: <BedDoubleIcon className="h-4 w-4 mr-2" /> },
    { id: "flights", label: "FLIGHTS", icon: <PlaneIcon className="h-4 w-4 mr-2" /> },
    { id: "travelers", label: "TRAVELERS", icon: <UsersIcon className="h-4 w-4 mr-2" /> },
    { id: "trip-cost", label: "TRIP COST", icon: <DollarSignIcon className="h-4 w-4 mr-2" /> },
  ]

  return (
    <motion.header
      className="border-b border-gray-200 bg-white shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <motion.div
            className="flex items-center"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Logo />
          </motion.div>
          <div className="hidden md:flex space-x-1">
            {tabs.map((tab, index) => (
              <motion.div
                key={tab.id}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
              >
                <Button
                  variant={activeTab === tab.id ? "default" : "outline"}
                  className={`flex items-center transition-all duration-300 ${
                    activeTab === tab.id ? "bg-[#1f5582] text-white shadow-md" : "text-[#1f5582] hover:bg-[#1f5582]/10"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="flex items-center space-x-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Button className="bg-[#ff7b00] hover:bg-[#e56f00] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              QUOTE TRIP
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
