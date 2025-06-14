"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MapPin, Loader2 } from "lucide-react"
import debounce from "lodash/debounce"

interface Location {
  value: string
  label: string
  country?: string
  region?: string
  lat?: number
  lng?: number
}

interface LocationSearchProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  error?: string
  className?: string
}

export function LocationSearch({
  value = "",
  onChange,
  placeholder = "Search for a location...",
  error,
  className
}: LocationSearchProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Popular destinations
  const popularDestinations: Location[] = [
    { value: 'paris-france', label: 'Paris, France' },
    { value: 'tokyo-japan', label: 'Tokyo, Japan' },
    { value: 'new-york-united-states', label: 'New York, United States' },
    { value: 'london-united-kingdom', label: 'London, United Kingdom' },
    { value: 'dubai-united-arab-emirates', label: 'Dubai, United Arab Emirates' },
    { value: 'barcelona-spain', label: 'Barcelona, Spain' },
    { value: 'rome-italy', label: 'Rome, Italy' },
    { value: 'singapore-singapore', label: 'Singapore, Singapore' }
  ]

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounced search function
  const searchLocations = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setLocations([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        if (data.results && Array.isArray(data.results)) {
          setLocations(data.results.slice(0, 8))
        }
      } catch (error) {
        console.error("Location search error:", error)
        setLocations([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    searchLocations(inputValue)
  }, [inputValue, searchLocations])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (location: Location) => {
    setInputValue(location.label)
    onChange?.(location.label)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue) // Update form value immediately for manual input
    setOpen(true)
    setShowPopular(newValue.length === 0)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setOpen(true)
            if (inputValue.length >= 2) {
              searchLocations(inputValue)
            } else if (inputValue.length === 0) {
              setShowPopular(true)
            }
          }}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-4",
            error && "border-red-500",
            "w-full"
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {open && (inputValue.length >= 2 || locations.length > 0 || showPopular) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {showPopular && inputValue.length === 0 ? (
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Popular Destinations</div>
              {popularDestinations.map((location) => (
                <button
                  key={location.value}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-all duration-150 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start">
                    <MapPin className="mr-2 h-4 w-4 text-[#ff6b35] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{location.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : locations.length > 0 ? (
            <div className="py-1">
              {locations.map((location) => (
                <button
                  key={`${location.value}-${location.lat}-${location.lng}`}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-all duration-150 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{location.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : inputValue.length >= 2 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No locations found for "{inputValue}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}