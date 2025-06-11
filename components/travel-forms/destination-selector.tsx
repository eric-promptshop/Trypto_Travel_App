"use client"

import * as React from "react"
import { MapPin, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { VoiceCommandInput } from "@/components/ui/voice-command-input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Destination {
  id: string
  name: string
  country: string
  type: 'city' | 'country' | 'region'
  coordinates?: [number, number]
}

interface DestinationSelectorProps {
  primaryDestination?: string
  additionalDestinations?: string[]
  onPrimaryDestinationChange: (destination: string) => void
  onAdditionalDestinationsChange: (destinations: string[]) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  maxAdditionalDestinations?: number
}

// Mock popular destinations - in a real app, this would come from an API
const popularDestinations: Destination[] = [
  { id: '1', name: 'Paris', country: 'France', type: 'city' },
  { id: '2', name: 'Tokyo', country: 'Japan', type: 'city' },
  { id: '3', name: 'New York', country: 'United States', type: 'city' },
  { id: '4', name: 'London', country: 'United Kingdom', type: 'city' },
  { id: '5', name: 'Rome', country: 'Italy', type: 'city' },
  { id: '6', name: 'Barcelona', country: 'Spain', type: 'city' },
  { id: '7', name: 'Amsterdam', country: 'Netherlands', type: 'city' },
  { id: '8', name: 'Thailand', country: 'Thailand', type: 'country' },
  { id: '9', name: 'Iceland', country: 'Iceland', type: 'country' },
  { id: '10', name: 'Bali', country: 'Indonesia', type: 'region' },
]

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  primaryDestination,
  additionalDestinations = [],
  onPrimaryDestinationChange,
  onAdditionalDestinationsChange,
  disabled = false,
  className,
  placeholder = "Where would you like to go?",
  maxAdditionalDestinations = 3
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedType, setSelectedType] = React.useState<'primary' | 'additional'>('primary')

  // Filter destinations based on search query
  const filteredDestinations = popularDestinations.filter((dest) =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDestinationSelect = (destination: Destination) => {
    if (selectedType === 'primary') {
      onPrimaryDestinationChange(destination.name)
    } else {
      if (additionalDestinations.length < maxAdditionalDestinations && 
          !additionalDestinations.includes(destination.name) &&
          destination.name !== primaryDestination) {
        onAdditionalDestinationsChange([...additionalDestinations, destination.name])
      }
    }
    setIsOpen(false)
    setSearchQuery("")
  }

  const removeAdditionalDestination = (destinationToRemove: string) => {
    onAdditionalDestinationsChange(
      additionalDestinations.filter(dest => dest !== destinationToRemove)
    )
  }

  const clearPrimaryDestination = () => {
    onPrimaryDestinationChange("")
  }

  // Handle voice transcript for destination search
  const handleVoiceTranscript = (transcript: string) => {
    setSearchQuery(transcript)
    
    // Try to auto-select if there's an exact match
    const exactMatch = popularDestinations.find(dest => 
      dest.name.toLowerCase() === transcript.toLowerCase() ||
      dest.country.toLowerCase() === transcript.toLowerCase()
    )
    
    if (exactMatch) {
      setTimeout(() => {
        handleDestinationSelect(exactMatch)
      }, 500) // Small delay to show the match visually
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Destinations
      </Label>

      {/* Primary Destination */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Main destination</label>
        <Popover open={isOpen && selectedType === 'primary'} onOpenChange={(open) => {
          setIsOpen(open)
          if (open) setSelectedType('primary')
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen && selectedType === 'primary'}
              className={cn(
                "w-full justify-between",
                !primaryDestination && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 shrink-0" />
                {primaryDestination || placeholder}
              </div>
              {primaryDestination && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearPrimaryDestination()
                  }}
                  className="h-auto p-0"
                >
                  <X className="h-4 w-4 touch-target" />
                </Button>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <VoiceCommandInput
                placeholder="Search destinations or say a location..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                onVoiceTranscript={handleVoiceTranscript}
                voiceLanguage="en-US"
              />
              <CommandList>
                <CommandEmpty>No destinations found.</CommandEmpty>
                <CommandGroup heading="Popular Destinations">
                  {filteredDestinations.map((destination) => (
                    <CommandItem
                      key={destination.id}
                      onSelect={() => handleDestinationSelect(destination)}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{destination.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {destination.country}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Additional Destinations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Additional destinations (optional)</label>
          <span className="text-xs text-muted-foreground">
            {additionalDestinations.length}/{maxAdditionalDestinations}
          </span>
        </div>

        {/* Show additional destinations */}
        {additionalDestinations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {additionalDestinations.map((destination) => (
              <Badge key={destination} variant="secondary" className="gap-1">
                {destination}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAdditionalDestination(destination)}
                  className="h-auto p-0 ml-1"
                  disabled={disabled}
                >
                  <X className="h-3 w-3 touch-target" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add additional destination button */}
        {additionalDestinations.length < maxAdditionalDestinations && (
          <Popover open={isOpen && selectedType === 'additional'} onOpenChange={(open) => {
            setIsOpen(open)
            if (open) setSelectedType('additional')
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                disabled={disabled}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add another destination
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <VoiceCommandInput
                  placeholder="Search additional destinations or say a location..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onVoiceTranscript={handleVoiceTranscript}
                  voiceLanguage="en-US"
                />
                <CommandList>
                  <CommandEmpty>No destinations found.</CommandEmpty>
                  <CommandGroup heading="Popular Destinations">
                    {filteredDestinations.filter(dest => 
                      dest.name !== primaryDestination && 
                      !additionalDestinations.includes(dest.name)
                    ).map((destination) => (
                      <CommandItem
                        key={destination.id}
                        onSelect={() => handleDestinationSelect(destination)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{destination.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {destination.country}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
} 