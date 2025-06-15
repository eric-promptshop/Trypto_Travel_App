"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ViewMode = 'viewer' | 'builder'

interface ItineraryUIContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  selectedDay: number
  setSelectedDay: (day: number) => void
  selectedLocationId: string | null
  setSelectedLocationId: (id: string | null) => void
  highlightedLocationId: string | null
  setHighlightedLocationId: (id: string | null) => void
}

const ItineraryUIContext = createContext<ItineraryUIContextType | undefined>(undefined)

export function ItineraryUIProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('builder')
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [highlightedLocationId, setHighlightedLocationId] = useState<string | null>(null)

  const value = {
    viewMode,
    setViewMode,
    selectedDay,
    setSelectedDay,
    selectedLocationId,
    setSelectedLocationId,
    highlightedLocationId,
    setHighlightedLocationId
  }

  return (
    <ItineraryUIContext.Provider value={value}>
      {children}
    </ItineraryUIContext.Provider>
  )
}

export function useItineraryUI() {
  const context = useContext(ItineraryUIContext)
  if (!context) {
    throw new Error('useItineraryUI must be used within ItineraryUIProvider')
  }
  return context
}