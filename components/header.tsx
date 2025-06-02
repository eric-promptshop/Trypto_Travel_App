"use client"

import { motion } from "framer-motion"
import { MapIcon, BedDoubleIcon, PlaneIcon, UsersIcon, DollarSignIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoCreative as Logo } from "./logo-creative"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon } from "lucide-react"
import { useOneHandedMode } from "@/hooks/use-one-handed-mode"

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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const oneHanded = useOneHandedMode();
  return (
    <motion.header
      className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center p-4">
          <motion.div
            className="flex items-center space-x-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Logo />
            {!oneHanded && (
              <nav className="hidden md:flex space-x-6" role="navigation" aria-label="Main navigation">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 ${
                      activeTab === tab.id
                        ? "bg-[#1f5582] text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    aria-current={activeTab === tab.id ? "page" : undefined}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}
          </motion.div>

          <motion.div
            className="flex items-center space-x-4 relative"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Floating Theme Switcher Button */}
            <button
              type="button"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 w-10 h-10 absolute top-2 right-2 z-20 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
            </button>
            {!oneHanded && (
              <Button className="bg-[#ff7b00] hover:bg-[#e56f00] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                QUOTE TRIP
              </Button>
            )}
          </motion.div>
        </div>
      </div>
      {oneHanded && (
        <Button
          className="fixed bottom-4 right-4 z-50 bg-[#ff7b00] hover:bg-[#e56f00] text-white shadow-lg hover:shadow-xl transition-all duration-300 w-16 h-16 rounded-full flex items-center justify-center text-lg"
          style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}
        >
          QUOTE
        </Button>
      )}
    </motion.header>
  )
}
