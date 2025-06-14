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
  type?: string
  displayName?: string
  shortName?: string
  category?: 'city' | 'region' | 'country' | 'landmark'
  icon?: string
  confidence?: number
  popularityScore?: number
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Popular destinations with enhanced formatting
  const popularDestinations: Location[] = [
    { value: 'paris-france', label: 'Paris, France', displayName: 'Paris, France', shortName: 'Paris', icon: '🏙️', category: 'city', popularityScore: 100 },
    { value: 'tokyo-japan', label: 'Tokyo, Japan', displayName: 'Tokyo, Japan', shortName: 'Tokyo', icon: '🏙️', category: 'city', popularityScore: 100 },
    { value: 'new-york-usa', label: 'New York, United States', displayName: 'New York, United States', shortName: 'New York', icon: '🏙️', category: 'city', popularityScore: 100 },
    { value: 'london-uk', label: 'London, United Kingdom', displayName: 'London, United Kingdom', shortName: 'London', icon: '🏙️', category: 'city', popularityScore: 100 },
    { value: 'dubai-uae', label: 'Dubai, UAE', displayName: 'Dubai, UAE', shortName: 'Dubai', icon: '🏙️', category: 'city', popularityScore: 95 },
    { value: 'barcelona-spain', label: 'Barcelona, Spain', displayName: 'Barcelona, Spain', shortName: 'Barcelona', icon: '🏙️', category: 'city', popularityScore: 90 },
    { value: 'rome-italy', label: 'Rome, Italy', displayName: 'Rome, Italy', shortName: 'Rome', icon: '🏙️', category: 'city', popularityScore: 90 },
    { value: 'singapore', label: 'Singapore', displayName: 'Singapore', shortName: 'Singapore', icon: '🏙️', category: 'city', popularityScore: 85 }
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
    }, 150), // Reduced debounce for faster response
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
    const displayValue = location.displayName || location.label
    setInputValue(displayValue)
    onChange?.(displayValue)
    setOpen(false)
    setShowPopular(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue) // Update form value immediately for manual input
    setOpen(true)
    setShowPopular(newValue.length === 0)
    setHighlightedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentList = showPopular ? popularDestinations : locations
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < currentList.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < currentList.length) {
          handleSelect(currentList[highlightedIndex])
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlightedIndex(-1)
        break
    }
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
          onKeyDown={handleKeyDown}
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
          aria-label="Destination search"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
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
              {popularDestinations.map((location, index) => (
                <button
                  key={location.value}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-all duration-150 border-b border-gray-100 last:border-b-0",
                    highlightedIndex === index && "bg-blue-50"
                  )}
                  role="option"
                  aria-selected={highlightedIndex === index}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{location.icon || '🏙️'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {location.displayName || location.label}
                      </p>
                      {location.category && location.category !== 'city' && (
                        <p className="text-xs text-gray-500 capitalize">{location.category}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : locations.length > 0 ? (
            <div className="py-1">
              {locations.map((location, index) => (
                <button
                  key={`${location.value}-${location.lat}-${location.lng}`}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-all duration-150 border-b border-gray-100 last:border-b-0",
                    highlightedIndex === index && "bg-blue-50"
                  )}
                  role="option"
                  aria-selected={highlightedIndex === index}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{location.icon || '🏙️'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {location.displayName || location.label}
                      </p>
                      {location.confidence && location.confidence > 0.9 && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-green-600 font-medium">Best match</span>
                          {location.popularityScore && location.popularityScore >= 90 && (
                            <span className="text-xs text-orange-600 font-medium">Popular</span>
                          )}
                        </div>
                      )}
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