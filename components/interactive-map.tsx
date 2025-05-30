"use client"

import { useRef, useEffect, useState } from "react"
// TODO: Fix react-map-gl import issues for CI/CD
// import Map, { Marker, Popup, NavigationControl } from "react-map-gl"
import { motion, AnimatePresence } from "framer-motion"
// import "mapbox-gl/dist/mapbox-gl.css"

// Define the location data type
interface LocationData {
  day: number
  title: string
  location: string
  coordinates: [number, number] // [longitude, latitude]
}

interface InteractiveMapProps {
  selectedDay: number
  locations: LocationData[]
  onMarkerClick?: (day: number) => void
}

export function InteractiveMap({ selectedDay, locations, onMarkerClick }: InteractiveMapProps) {
  // Temporary placeholder component until react-map-gl is properly configured
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Interactive Map</h3>
        <p className="text-sm text-gray-500 mb-4">Map component temporarily disabled for CI/CD</p>
        <div className="space-y-2">
          {locations.map((location) => (
            <div 
              key={location.day}
              className={`p-2 rounded cursor-pointer ${
                selectedDay === location.day ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'
              } border`}
              onClick={() => onMarkerClick?.(location.day)}
            >
              <div className="font-medium">Day {location.day}: {location.title}</div>
              <div className="text-sm text-gray-600">{location.location}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
