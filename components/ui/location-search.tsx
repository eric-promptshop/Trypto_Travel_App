"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MapPin, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSelect = (location: Location) => {
    setInputValue(location.label)
    onChange?.(location.label)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-4",
              error && "border-red-500",
              className
            )}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandList>
            {locations.length === 0 && !isLoading && inputValue.length >= 2 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}
            {locations.length > 0 && (
              <CommandGroup>
                {locations.map((location) => (
                  <CommandItem
                    key={`${location.value}-${location.lat}-${location.lng}`}
                    value={location.value}
                    onSelect={() => handleSelect(location)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{location.label}</p>
                      {location.country && (
                        <p className="text-sm text-gray-500">
                          {location.region ? `${location.region}, ` : ""}{location.country}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}