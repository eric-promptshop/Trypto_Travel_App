"use client"

import * as React from "react"
import { CalendarIcon, MapPin, Clock, Users, X, Plus, Edit3 } from "lucide-react"
import { format, differenceInDays, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { VoiceCommandInput } from "@/components/ui/voice-command-input"

export interface TripModificationData {
  primaryDestination: string
  additionalDestinations: string[]
  startDate: Date | undefined
  endDate: Date | undefined
  duration: number
  travelers: {
    adults: number
    children: number
    infants: number
  }
  flexibility: {
    datesFlexible: boolean
    destinationsFlexible: boolean
    durationFlexible: boolean
  }
}

interface TripModificationFormProps {
  initialData?: Partial<TripModificationData>
  onChange: (data: TripModificationData) => void
  onSave: (data: TripModificationData) => void
  onCancel?: () => void
  disabled?: boolean
  showPreview?: boolean
  className?: string
}

interface Destination {
  id: string
  name: string
  country: string
  type: 'city' | 'country' | 'region'
  coordinates?: [number, number]
  popularity: number
}

// Enhanced destination list with popularity scores
const destinations: Destination[] = [
  { id: '1', name: 'Paris', country: 'France', type: 'city', popularity: 95 },
  { id: '2', name: 'Tokyo', country: 'Japan', type: 'city', popularity: 92 },
  { id: '3', name: 'New York', country: 'United States', type: 'city', popularity: 90 },
  { id: '4', name: 'London', country: 'United Kingdom', type: 'city', popularity: 89 },
  { id: '5', name: 'Rome', country: 'Italy', type: 'city', popularity: 87 },
  { id: '6', name: 'Barcelona', country: 'Spain', type: 'city', popularity: 85 },
  { id: '7', name: 'Amsterdam', country: 'Netherlands', type: 'city', popularity: 83 },
  { id: '8', name: 'Bangkok', country: 'Thailand', type: 'city', popularity: 81 },
  { id: '9', name: 'Istanbul', country: 'Turkey', type: 'city', popularity: 79 },
  { id: '10', name: 'Bali', country: 'Indonesia', type: 'region', popularity: 77 },
  { id: '11', name: 'Iceland', country: 'Iceland', type: 'country', popularity: 75 },
  { id: '12', name: 'Dubai', country: 'UAE', type: 'city', popularity: 73 },
  { id: '13', name: 'Sydney', country: 'Australia', type: 'city', popularity: 71 },
  { id: '14', name: 'Prague', country: 'Czech Republic', type: 'city', popularity: 69 },
  { id: '15', name: 'Vienna', country: 'Austria', type: 'city', popularity: 67 }
]

export const TripModificationForm: React.FC<TripModificationFormProps> = ({
  initialData,
  onChange,
  onSave,
  onCancel,
  disabled = false,
  showPreview = true,
  className
}) => {
  const [formData, setFormData] = React.useState<TripModificationData>({
    primaryDestination: initialData?.primaryDestination || '',
    additionalDestinations: initialData?.additionalDestinations || [],
    startDate: initialData?.startDate,
    endDate: initialData?.endDate,
    duration: initialData?.duration || 7,
    travelers: {
      adults: initialData?.travelers?.adults || 2,
      children: initialData?.travelers?.children || 0,
      infants: initialData?.travelers?.infants || 0
    },
    flexibility: {
      datesFlexible: initialData?.flexibility?.datesFlexible || false,
      destinationsFlexible: initialData?.flexibility?.destinationsFlexible || false,
      durationFlexible: initialData?.flexibility?.durationFlexible || false
    }
  })

  const [activeSection, setActiveSection] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDurationMode, setIsDurationMode] = React.useState(false)

  // Update parent when form data changes
  React.useEffect(() => {
    onChange(formData)
  }, [formData, onChange])

  // Sync dates and duration
  React.useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const calculatedDuration = differenceInDays(formData.endDate, formData.startDate)
      if (calculatedDuration !== formData.duration && !isDurationMode) {
        setFormData(prev => ({
          ...prev,
          duration: Math.max(1, calculatedDuration)
        }))
      }
    } else if (formData.startDate && formData.duration && isDurationMode) {
      const calculatedEndDate = addDays(formData.startDate, formData.duration)
      setFormData(prev => ({
        ...prev,
        endDate: calculatedEndDate
      }))
    }
  }, [formData.startDate, formData.endDate, formData.duration, isDurationMode])

  const updateFormData = (updates: Partial<TripModificationData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Filter destinations based on search
  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.country.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.popularity - a.popularity)

  // Handle destination selection
  const handleDestinationSelect = (destination: Destination, type: 'primary' | 'additional') => {
    if (type === 'primary') {
      updateFormData({ primaryDestination: destination.name })
    } else {
      if (formData.additionalDestinations.length < 3 &&
          !formData.additionalDestinations.includes(destination.name) &&
          destination.name !== formData.primaryDestination) {
        updateFormData({
          additionalDestinations: [...formData.additionalDestinations, destination.name]
        })
      }
    }
    setActiveSection(null)
    setSearchQuery("")
  }

  // Remove additional destination
  const removeAdditionalDestination = (destinationToRemove: string) => {
    updateFormData({
      additionalDestinations: formData.additionalDestinations.filter(dest => dest !== destinationToRemove)
    })
  }

  // Handle date selection
  const handleStartDateSelect = (date: Date | undefined) => {
    updateFormData({ startDate: date })
    setActiveSection(null)
    setIsDurationMode(false)
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    updateFormData({ endDate: date })
    setActiveSection(null)
    setIsDurationMode(false)
  }

  // Handle duration change
  const handleDurationChange = (value: number[]) => {
    const newDuration = value[0] || 1
    setIsDurationMode(true)
    updateFormData({ duration: newDuration })
    
    if (formData.startDate) {
      const newEndDate = addDays(formData.startDate, newDuration)
      updateFormData({ endDate: newEndDate })
    }
  }

  // Handle traveler count changes
  const updateTravelerCount = (type: 'adults' | 'children' | 'infants', count: number) => {
    updateFormData({
      travelers: {
        ...formData.travelers,
        [type]: Math.max(0, count)
      }
    })
  }

  // Handle flexibility options
  const updateFlexibility = (type: keyof typeof formData.flexibility, value: boolean) => {
    updateFormData({
      flexibility: {
        ...formData.flexibility,
        [type]: value
      }
    })
  }

  // Get total traveler count
  const totalTravelers = formData.travelers.adults + formData.travelers.children + formData.travelers.infants

  // Handle voice input for destinations
  const handleVoiceTranscript = (transcript: string) => {
    setSearchQuery(transcript)
    
    const exactMatch = destinations.find(dest => 
      dest.name.toLowerCase() === transcript.toLowerCase() ||
      dest.country.toLowerCase() === transcript.toLowerCase()
    )
    
    if (exactMatch) {
      setTimeout(() => {
        handleDestinationSelect(exactMatch, activeSection === 'primary-destination' ? 'primary' : 'additional')
      }, 500)
    }
  }

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Customize Your Trip
        </CardTitle>
        <CardDescription>
          Modify your trip details to create the perfect itinerary
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Destination Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <Label className="text-base font-semibold">Destinations</Label>
          </div>

          {/* Primary Destination */}
          <div className="space-y-2">
            <Label className="text-sm">Main destination</Label>
            <Popover open={activeSection === 'primary-destination'} onOpenChange={(open) => {
              setActiveSection(open ? 'primary-destination' : null)
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between h-12",
                    !formData.primaryDestination && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {formData.primaryDestination || "Select main destination"}
                  </div>
                  {formData.primaryDestination && (
                    <X className="h-4 w-4 touch-target" onClick={(e) => {
                      e.stopPropagation()
                      updateFormData({ primaryDestination: '' })
                    }} />
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
                          onSelect={() => handleDestinationSelect(destination, 'primary')}
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{destination.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {destination.country}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {destination.type}
                          </Badge>
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
              <Label className="text-sm">Additional destinations (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {formData.additionalDestinations.length}/3
              </span>
            </div>

            {formData.additionalDestinations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.additionalDestinations.map((destination) => (
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

            {formData.additionalDestinations.length < 3 && (
              <Popover open={activeSection === 'additional-destination'} onOpenChange={(open) => {
                setActiveSection(open ? 'additional-destination' : null)
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground h-10"
                    disabled={disabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another destination
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <VoiceCommandInput
                      placeholder="Search additional destinations..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      onVoiceTranscript={handleVoiceTranscript}
                      voiceLanguage="en-US"
                    />
                    <CommandList>
                      <CommandEmpty>No destinations found.</CommandEmpty>
                      <CommandGroup heading="Popular Destinations">
                        {filteredDestinations.filter(dest => 
                          dest.name !== formData.primaryDestination && 
                          !formData.additionalDestinations.includes(dest.name)
                        ).map((destination) => (
                          <CommandItem
                            key={destination.id}
                            onSelect={() => handleDestinationSelect(destination, 'additional')}
                            className="flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{destination.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {destination.country}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {destination.type}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {/* Flexibility Option */}
            <div className="flex items-center justify-between pt-2">
              <Label className="text-sm">Open to destination suggestions</Label>
              <Switch
                checked={formData.flexibility.destinationsFlexible}
                onCheckedChange={(checked) => updateFlexibility('destinationsFlexible', checked)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Dates and Duration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-green-600" />
            <Label className="text-base font-semibold">Travel Dates & Duration</Label>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Start Date</Label>
              <Popover open={activeSection === 'start-date'} onOpenChange={(open) => {
                setActiveSection(open ? 'start-date' : null)
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start h-12",
                      !formData.startDate && "text-muted-foreground"
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "MMM dd, yyyy") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={handleStartDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">End Date</Label>
              <Popover open={activeSection === 'end-date'} onOpenChange={(open) => {
                setActiveSection(open ? 'end-date' : null)
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start h-12",
                      !formData.endDate && "text-muted-foreground"
                    )}
                    disabled={disabled || !formData.startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "MMM dd, yyyy") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={handleEndDateSelect}
                    disabled={(date) => {
                      if (!formData.startDate) return true
                      return date <= formData.startDate
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-3">
            <Label className="text-sm">Trip Duration: {formData.duration} days</Label>
            <Slider
              value={[formData.duration]}
              onValueChange={handleDurationChange}
              max={30}
              min={1}
              step={1}
              className="w-full"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>30 days</span>
            </div>
          </div>

          {/* Flexibility Option */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Flexible with dates (±3 days)</Label>
            <Switch
              checked={formData.flexibility.datesFlexible}
              onCheckedChange={(checked) => updateFlexibility('datesFlexible', checked)}
              disabled={disabled}
            />
          </div>
        </div>

        <Separator />

        {/* Travelers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <Label className="text-base font-semibold">Travelers</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Adults</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTravelerCount('adults', formData.travelers.adults - 1)}
                  disabled={disabled || formData.travelers.adults <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center">{formData.travelers.adults}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTravelerCount('adults', formData.travelers.adults + 1)}
                  disabled={disabled || formData.travelers.adults >= 10}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Children (2-12)</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTravelerCount('children', formData.travelers.children - 1)}
                  disabled={disabled || formData.travelers.children <= 0}
                >
                  -
                </Button>
                <span className="w-8 text-center">{formData.travelers.children}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTravelerCount('children', formData.travelers.children + 1)}
                  disabled={disabled || formData.travelers.children >= 8}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Infants (0-2)</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTravelerCount('infants', formData.travelers.infants - 1)}
                  disabled={disabled || formData.travelers.infants <= 0}
                >
                  -
                </Button>
                <span className="w-8 text-center">{formData.travelers.infants}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTravelerCount('infants', formData.travelers.infants + 1)}
                  disabled={disabled || formData.travelers.infants >= 4}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: {totalTravelers} traveler{totalTravelers !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label className="text-base font-semibold">Trip Overview</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Destinations</div>
                  <div className="text-sm text-muted-foreground">
                    {formData.primaryDestination || 'Not selected'}
                    {formData.additionalDestinations.length > 0 && 
                      ` + ${formData.additionalDestinations.length} more`
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-sm text-muted-foreground">
                    {formData.duration} days
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Dates</div>
                  <div className="text-sm text-muted-foreground">
                    {formData.startDate && formData.endDate
                      ? `${format(formData.startDate, "MMM dd")} - ${format(formData.endDate, "MMM dd, yyyy")}`
                      : 'Not selected'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Travelers</div>
                  <div className="text-sm text-muted-foreground">
                    {totalTravelers} traveler{totalTravelers !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onSave(formData)}
            className="flex-1"
            disabled={disabled || !formData.primaryDestination || !formData.startDate || !formData.endDate}
          >
            Save Changes
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={disabled}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 