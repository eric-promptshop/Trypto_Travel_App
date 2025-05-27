"use client"

import { useRef, useEffect, useState } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl"
import { motion, AnimatePresence } from "framer-motion"
import "mapbox-gl/dist/mapbox-gl.css"

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
  const mapRef = useRef<any>(null)
  const [popupInfo, setPopupInfo] = useState<LocationData | null>(null)

  // Find the currently selected location
  const selectedLocation = locations.find((loc) => loc.day === selectedDay)

  // Fly to the selected location when it changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: selectedLocation.coordinates,
        zoom: 5,
        duration: 2000,
        essential: true,
      })
    }
  }, [selectedDay, selectedLocation])

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken="pk.eyJ1IjoidHJ5cHRvLWRlbW8iLCJhIjoiY2xzNXdqZXFsMGFsZTJrcGR5ZDFvcWs3ZyJ9.SHEjW5gKsAAZM7rcPK1xJg"
      initialViewState={{
        longitude: -70,
        latitude: -10,
        zoom: 3,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      {/* Add markers for each location */}
      {locations.map((location) => (
        <Marker
          key={location.day}
          longitude={location.coordinates[0]}
          latitude={location.coordinates[1]}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setPopupInfo(location)
            if (onMarkerClick) {
              onMarkerClick(location.day)
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: selectedDay === location.day ? 1.2 : 1,
              opacity: 1,
            }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${
                selectedDay === location.day ? "bg-[#ff7b00] text-white shadow-lg" : "bg-[#1f5582] text-white shadow-md"
              }`}
            >
              {location.day}
            </div>
            {selectedDay === location.day && (
              <motion.div
                className="absolute -inset-1 rounded-full border-2 border-[#ff7b00]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            {selectedDay === location.day && (
              <motion.div
                className="absolute -inset-3 rounded-full border-2 border-[#ff7b00] opacity-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        </Marker>
      ))}

      {/* Popup for the selected marker */}
      <AnimatePresence>
        {popupInfo && (
          <Popup
            longitude={popupInfo.coordinates[0]}
            latitude={popupInfo.coordinates[1]}
            anchor="top"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            closeButton={true}
          >
            <div className="p-1">
              <h3 className="font-semibold text-sm text-[#1f5582]">Day {popupInfo.day}</h3>
              <p className="text-xs">{popupInfo.title}</p>
              <p className="text-xs text-gray-600">{popupInfo.location}</p>
            </div>
          </Popup>
        )}
      </AnimatePresence>

      {/* Navigation controls */}
      <NavigationControl position="top-right" />
    </Map>
  )
}
