"use client"

import React, { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Hotel,
  Heart,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Plane,
  Car,
  Train,
  Mic,
  MicOff,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LocationSearch } from "./location-search"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import { format } from "date-fns"
import { useVoiceInput, VoiceControlButton } from "./voice-input"
import { AudioVisualizer, CircularVisualizer } from "./audio-visualizer"

// Form schema with Zod
const travelFormSchema = z.object({
  // Step 1: Basics
  destination: z.string().min(2, "Please enter a destination"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  travelers: z.number().min(1, "At least 1 traveler required").max(20),
  
  // Step 2: Preferences
  budget: z.string().optional(),
  accommodation: z.enum(["hotel", "airbnb", "hostel", "resort", "any"]).default("any"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  
  // Step 3: Details
  specialRequests: z.string().optional(),
  transportation: z.array(z.string()).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

type TravelFormData = z.infer<typeof travelFormSchema>

interface AITravelFormWizardProps {
  onSubmit: (data: TravelFormData) => Promise<void>
  isGenerating?: boolean
}

const STEPS = [
  { id: 1, name: "Basics", description: "Where and when" },
  { id: 2, name: "Preferences", description: "Your travel style" },
  { id: 3, name: "Review", description: "Confirm details" }
]

const INTERESTS = [
  { id: "culture", label: "Culture & History", icon: Building },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "relaxation", label: "Relaxation", icon: Heart },
  { id: "nature", label: "Nature", icon: Trees },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "nightlife", label: "Nightlife", icon: Music },
  { id: "photography", label: "Photography", icon: Camera }
]

const ACCOMMODATIONS = [
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "airbnb", label: "Vacation Rental", icon: Home },
  { value: "hostel", label: "Hostel", icon: Building },
  { value: "resort", label: "Resort", icon: Palmtree },
  { value: "any", label: "No Preference", icon: HelpCircle }
]

export function AITravelFormWizard({ onSubmit, isGenerating = false }: AITravelFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [voiceTranscript, setVoiceTranscript] = useState<string>("")
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue
  } = useForm<TravelFormData>({
    resolver: zodResolver(travelFormSchema),
    mode: "onChange",
    defaultValues: {
      travelers: 2,
      accommodation: "any",
      interests: [],
      transportation: []
    }
  })

  const watchedFields = watch()

  // Voice input setup
  const {
    isListening,
    isSupported,
    error: voiceError,
    startListening,
    stopListening
  } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal && transcript) {
        setVoiceTranscript(transcript)
        processVoiceInput(transcript)
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error)
    }
  })

  // Process voice transcript to extract trip details
  const processVoiceInput = (transcript: string) => {
    // Parse the transcript to extract trip details
    const lowerTranscript = transcript.toLowerCase()
    
    // Extract destination (look for city names or "to" patterns)
    const destinationMatch = lowerTranscript.match(/(?:to|visit|going to|travel to|trip to|want to go to)\s+([a-z\s,]+?)(?:from|on|for|with|in|\.|$)/)
    if (destinationMatch) {
      // Capitalize first letter of each word
      const destination = destinationMatch[1].trim().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      setValue('destination', destination)
    }
    
    // Extract dates - handle various date formats
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    // Handle date ranges like "10 to 19 July" or "from May 12 to May 18"
    const dateRangePattern1 = /(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|through|-)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
    const dateRangePattern2 = /from\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})(?:st|nd|rd|th)?\s*to\s*(?:(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*)?(\d{1,2})(?:st|nd|rd|th)?/i
    
    let rangeMatch = lowerTranscript.match(dateRangePattern1)
    let isPattern2 = false
    
    if (!rangeMatch) {
      rangeMatch = lowerTranscript.match(dateRangePattern2)
      isPattern2 = true
    }
    
    if (rangeMatch) {
      let startDay, endDay, startMonthStr, endMonthStr
      
      if (isPattern2) {
        // Pattern: "from May 12 to May 18"
        startMonthStr = rangeMatch[1].toLowerCase()
        startDay = parseInt(rangeMatch[2])
        endMonthStr = rangeMatch[3] ? rangeMatch[3].toLowerCase() : startMonthStr
        endDay = parseInt(rangeMatch[4])
      } else {
        // Pattern: "10 to 19 July"
        startDay = parseInt(rangeMatch[1])
        endDay = parseInt(rangeMatch[2])
        startMonthStr = rangeMatch[3].toLowerCase()
        endMonthStr = startMonthStr
      }
      
      // Find month indices
      let startMonthIndex = monthNames.indexOf(startMonthStr)
      if (startMonthIndex === -1) {
        startMonthIndex = monthsShort.indexOf(startMonthStr.substring(0, 3))
      }
      
      let endMonthIndex = monthNames.indexOf(endMonthStr)
      if (endMonthIndex === -1) {
        endMonthIndex = monthsShort.indexOf(endMonthStr.substring(0, 3))
      }
      
      if (startMonthIndex !== -1 && endMonthIndex !== -1) {
        const startYear = startMonthIndex < currentMonth ? currentYear + 1 : currentYear
        const endYear = endMonthIndex < currentMonth ? currentYear + 1 : currentYear
        setValue('startDate', new Date(startYear, startMonthIndex, startDay))
        setValue('endDate', new Date(endYear, endMonthIndex, endDay))
      }
    } else {
      // Look for single date patterns
      monthNames.forEach((month, index) => {
        const datePattern = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?${month}`, 'i')
        const match = lowerTranscript.match(datePattern)
        if (match) {
          const day = parseInt(match[1])
          const year = index < currentMonth ? currentYear + 1 : currentYear
          const startDate = new Date(year, index, day)
          setValue('startDate', startDate)
          
          // Look for duration
          const durationMatch = lowerTranscript.match(/(\\d+)\\s*(?:days?|nights?)/)
          if (durationMatch) {
            const duration = parseInt(durationMatch[1])
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + duration)
            setValue('endDate', endDate)
          }
        }
      })
    }
    
    // Extract number of travelers
    const travelersPatterns = [
      /(\\d+)\\s*(?:people|persons|travelers|of us|adults)/,
      /we\\s*are\\s*(\\d+)\\s*(?:people|persons)?/,
      /there\\s*are\\s*(\\d+)\\s*of\\s*us/,
      /party\\s*of\\s*(\\d+)/,
      /traveling\\s*with\\s*(\\d+)\\s*(?:people|persons|friends)?/
    ]
    
    for (const pattern of travelersPatterns) {
      const match = lowerTranscript.match(pattern)
      if (match) {
        setValue('travelers', parseInt(match[1]))
        break
      }
    }
    
    // Extract budget - handle various formats
    const budgetPatterns = [
      /budget\s*(?:is|of)?\s*\$?([\d,]+)(?:\s*dollars?)?\s*(?:per\s*person)?/i,
      /\$([\d,]+)\s*(?:dollar|dollars)?\s*(?:per\s*person)?\s*budget/i,
      /spend(?:ing)?\s*\$?([\d,]+)(?:\s*dollars?)?\s*(?:per\s*person)?/i,
      /\$([\d,]+)\s*per\s*person/i,
      /(\d{1,3}(?:,\d{3})*)\s*dollars?\s*per\s*person/i,
      /my\s*budget\s*is\s*\$?([\d,]+)(?:\s*per\s*person)?/i
    ]
    
    let budgetFound = false
    for (const pattern of budgetPatterns) {
      const match = lowerTranscript.match(pattern)
      if (match && !budgetFound) {
        const amount = match[1].replace(/,/g, '')
        const isPerPerson = lowerTranscript.includes('per person')
        setValue('budget', isPerPerson ? `$${amount} per person` : `$${amount}`)
        budgetFound = true
        break
      }
    }
    
    // Extract accommodation
    if (lowerTranscript.includes('any accommodation') || lowerTranscript.includes('no preference')) {
      setValue('accommodation', 'any')
    } else if (lowerTranscript.includes('hotel')) {
      setValue('accommodation', 'hotel')
    } else if (lowerTranscript.includes('airbnb') || lowerTranscript.includes('rental') || lowerTranscript.includes('vacation rental')) {
      setValue('accommodation', 'airbnb')
    } else if (lowerTranscript.includes('hostel')) {
      setValue('accommodation', 'hostel')
    } else if (lowerTranscript.includes('resort')) {
      setValue('accommodation', 'resort')
    }
    
    // Extract interests
    const interestKeywords = {
      culture: ['culture', 'museum', 'history', 'art', 'heritage', 'historical', 'cultural'],
      food: ['food', 'restaurant', 'cuisine', 'eat', 'dining', 'foodie', 'culinary'],
      adventure: ['adventure', 'hiking', 'outdoor', 'trek', 'sport', 'adventurous'],
      relaxation: ['relax', 'spa', 'beach', 'rest', 'peaceful', 'relaxation'],
      nature: ['nature', 'park', 'wildlife', 'animal', 'forest', 'natural'],
      shopping: ['shopping', 'shop', 'market', 'mall', 'boutique', 'stores'],
      nightlife: ['nightlife', 'bar', 'club', 'party', 'night', 'bars', 'clubs'],
      photography: ['photo', 'picture', 'instagram', 'scenic', 'photography', 'photos']
    }
    
    const foundInterests: string[] = []
    Object.entries(interestKeywords).forEach(([interest, keywords]) => {
      if (keywords.some(keyword => lowerTranscript.includes(keyword))) {
        foundInterests.push(interest)
      }
    })
    
    if (foundInterests.length > 0) {
      setValue('interests', foundInterests)
    } else {
      // Default to some common interests if none detected
      setValue('interests', ['culture', 'food'])
    }
    
    // Extract transportation preferences
    const transportationKeywords = {
      'flights': ['fly', 'flight', 'flying', 'plane', 'airplane'],
      'car-rental': ['car', 'drive', 'driving', 'rental car', 'rent a car'],
      'public-transport': ['public transport', 'public transportation', 'bus', 'metro', 'subway', 'train'],
      'walking': ['walk', 'walking', 'on foot', 'by foot']
    }
    
    const foundTransportation: string[] = []
    Object.entries(transportationKeywords).forEach(([transport, keywords]) => {
      if (keywords.some(keyword => lowerTranscript.includes(keyword))) {
        foundTransportation.push(transport)
      }
    })
    
    if (foundTransportation.length > 0) {
      setValue('transportation', foundTransportation)
    }
    
    // Set the full transcript as special requests
    setValue('specialRequests', transcript)
    
    // Jump to review step only if we're currently on step 1 (voice was used from the beginning)
    if (currentStep === 1) {
      setCurrentStep(3)
    }
  }

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleNext = async (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Validate current step fields
    let fieldsToValidate: (keyof TravelFormData)[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ["destination", "startDate", "endDate", "travelers"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["accommodation", "interests"]
    }
    
    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid && currentStep < 3) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Form submission is handled by the Generate Trip button click
    // This prevents any automatic form submission
    return false
  }
  
  const handleGenerateTrip = handleSubmit(async (data) => {
    // Only submit if we're on the review step
    if (currentStep === 3) {
      await onSubmit(data)
    }
  })


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="relative z-10 w-full max-w-4xl mx-auto p-4 sm:p-8">
      {/* AI Travel Planner Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-4"
        >
          <Sparkles className="w-8 h-8 text-orange-600" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-800 to-orange-700 bg-clip-text text-transparent">
            AI Travel Planner
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Let our AI create the perfect itinerary for your next adventure
        </motion.p>
        
        {/* Voice Input Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="h-px bg-gray-300 flex-1 max-w-[100px]" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px bg-gray-300 flex-1 max-w-[100px]" />
          </div>
          <div className="mt-4">
            <div className="relative inline-block">
              <VoiceControlButton
                isListening={isListening}
                isSupported={isSupported}
                error={voiceError}
                onClick={handleVoiceClick}
                disabled={isGenerating}
                size="lg"
                className="mx-auto relative z-10"
              />
            </div>
            
            {/* Status text with audio visualizer */}
            <div className="mt-4 flex flex-col items-center gap-2">
              {isListening ? (
                <>
                  <AudioVisualizer
                    isActive={isListening}
                    barCount={7}
                    minHeight={4}
                    maxHeight={24}
                    color="rgb(59, 130, 246)"
                  />
                  <p className="text-sm text-gray-700 font-medium animate-pulse">
                    Listening... Tell me about your trip
                  </p>
                  <p className="text-xs text-gray-500">
                    Speak clearly about your destination, dates, and preferences
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Describe your trip with voice
                </p>
              )}
            </div>
            
            {voiceTranscript && !isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto"
              >
                <p className="text-sm text-gray-700">
                  <strong>Captured:</strong> "{voiceTranscript}"
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index < STEPS.length - 1 && "flex-1"
              )}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    currentStep > step.id && "bg-[#2563eb] border-[#2563eb] text-white",
                    currentStep === step.id && "border-[#2563eb] text-[#2563eb]",
                    currentStep < step.id && "border-gray-300 text-gray-400"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-gray-900" : "text-gray-400"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-4 mt-5">
                  <div
                    className="h-full bg-[#2563eb] transition-all duration-500"
                    style={{
                      width: currentStep > step.id ? "100%" : "0%"
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <Card className="shadow-xl border-gray-200 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8">
          <form onSubmit={onFormSubmit} onKeyDown={(e) => {
            // Prevent form submission on Enter key for all elements except the Generate Trip button
            if (e.key === 'Enter') {
              const target = e.target as HTMLElement
              const isGenerateTripButton = target.textContent?.includes('Generate Trip')
              
              if (!isGenerateTripButton) {
                e.preventDefault()
              }
            }
          }}>
            <AnimatePresence mode="wait">
              {/* Step 1: Basics */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Let's start with the basics
                    </h2>
                    <p className="text-gray-600">
                      Tell us where you want to go and when
                    </p>
                  </div>

                  {/* Destination */}
                  <div className="space-y-2">
                    <Label htmlFor="destination">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Destination
                    </Label>
                    <Controller
                      name="destination"
                      control={control}
                      render={({ field }) => (
                        <LocationSearch
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Where do you want to go?"
                          error={errors.destination?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Travel Dates
                    </Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field: startField }) => (
                        <Controller
                          name="endDate"
                          control={control}
                          render={({ field: endField }) => (
                            <DatePickerWithRange
                              from={startField.value}
                              to={endField.value}
                              onSelect={(range) => {
                                if (range?.from) startField.onChange(range.from)
                                if (range?.to) endField.onChange(range.to)
                              }}
                            />
                          )}
                        />
                      )}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>

                  {/* Travelers */}
                  <div className="space-y-2">
                    <Label htmlFor="travelers">
                      <Users className="w-4 h-4 inline mr-1" />
                      Number of Travelers
                    </Label>
                    <Controller
                      name="travelers"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="20"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          className={errors.travelers && "border-red-500"}
                        />
                      )}
                    />
                    {errors.travelers && (
                      <p className="text-sm text-red-500">{errors.travelers.message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Preferences */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      What's your travel style?
                    </h2>
                    <p className="text-gray-600">
                      Help us personalize your trip
                    </p>
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <Label htmlFor="budget">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Budget per Person (Optional)
                    </Label>
                    <Controller
                      name="budget"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="e.g., $1500"
                          className="max-w-xs"
                        />
                      )}
                    />
                    <p className="text-sm text-gray-500">
                      Leave blank for recommendations at all price points
                    </p>
                  </div>

                  {/* Accommodation */}
                  <div className="space-y-2">
                    <Label>
                      <Hotel className="w-4 h-4 inline mr-1" />
                      Preferred Accommodation
                    </Label>
                    <Controller
                      name="accommodation"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {ACCOMMODATIONS.map((acc) => {
                            const Icon = acc.icon
                            return (
                              <button
                                key={acc.value}
                                type="button"
                                onClick={() => field.onChange(acc.value)}
                                className={cn(
                                  "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                                  field.value === acc.value
                                    ? "border-[#2563eb] bg-blue-50 text-[#1f5582]"
                                    : "border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <Icon className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">{acc.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    />
                  </div>

                  {/* Interests */}
                  <div className="space-y-2">
                    <Label>
                      <Heart className="w-4 h-4 inline mr-1" />
                      Interests (Select all that apply)
                    </Label>
                    <Controller
                      name="interests"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {INTERESTS.map((interest) => {
                            const Icon = interest.icon
                            const isSelected = field.value?.includes(interest.id)
                            return (
                              <button
                                key={interest.id}
                                type="button"
                                onClick={() => {
                                  const newValue = isSelected
                                    ? field.value.filter(v => v !== interest.id)
                                    : [...(field.value || []), interest.id]
                                  field.onChange(newValue)
                                }}
                                className={cn(
                                  "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                                  isSelected
                                    ? "border-[#2563eb] bg-blue-50 text-[#1f5582]"
                                    : "border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <Icon className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium text-center">
                                  {interest.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    />
                    {errors.interests && (
                      <p className="text-sm text-red-500">{errors.interests.message}</p>
                    )}
                  </div>

                  {/* Transportation */}
                  <div className="space-y-2">
                    <Label>
                      <Plane className="w-4 h-4 inline mr-1" />
                      Transportation Preferences (Optional)
                    </Label>
                    <Controller
                      name="transportation"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { id: "flights", label: "Flights", icon: Plane },
                            { id: "car-rental", label: "Car Rental", icon: Car },
                            { id: "public-transport", label: "Public Transit", icon: Train },
                            { id: "walking", label: "Walking", icon: Users }
                          ].map((transport) => {
                            const Icon = transport.icon
                            const isSelected = field.value?.includes(transport.id)
                            return (
                              <button
                                key={transport.id}
                                type="button"
                                onClick={() => {
                                  const newValue = isSelected
                                    ? field.value?.filter(v => v !== transport.id) || []
                                    : [...(field.value || []), transport.id]
                                  field.onChange(newValue)
                                }}
                                className={cn(
                                  "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                                  isSelected
                                    ? "border-[#2563eb] bg-blue-50 text-[#1f5582]"
                                    : "border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <Icon className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium text-center">
                                  {transport.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Almost done!
                    </h2>
                    <p className="text-gray-600">
                      Review your trip details and add any special requests
                    </p>
                  </div>

                  {/* Trip Summary */}
                  <div className="space-y-4">
                    {/* Basic Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          Trip Details
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Destination:</span>
                          <span className="font-medium">{watchedFields.destination || "Not selected"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dates:</span>
                          <span className="font-medium">
                            {watchedFields.startDate && watchedFields.endDate ? (
                              <>
                                {format(watchedFields.startDate, "MMM d")} - {format(watchedFields.endDate, "MMM d, yyyy")}
                                <span className="text-gray-500 ml-1">
                                  ({Math.ceil((watchedFields.endDate.getTime() - watchedFields.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                                </span>
                              </>
                            ) : (
                              "Not selected"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Travelers:</span>
                          <span className="font-medium">{watchedFields.travelers} {watchedFields.travelers === 1 ? 'person' : 'people'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-gray-600" />
                          Your Preferences
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {watchedFields.budget ? 
                              (watchedFields.budget.includes('$') ? watchedFields.budget : `$${watchedFields.budget} per person`) 
                              : "No preference"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accommodation:</span>
                          <span className="font-medium capitalize">
                            {watchedFields.accommodation === "any" ? "No preference" : watchedFields.accommodation}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Interests:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {watchedFields.interests && watchedFields.interests.length > 0 ? (
                              watchedFields.interests.map((interest) => (
                                <span
                                  key={interest}
                                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium"
                                >
                                  {INTERESTS.find(i => i.id === interest)?.label || interest}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">None selected</span>
                            )}
                          </div>
                        </div>
                        {watchedFields.transportation && watchedFields.transportation.length > 0 && (
                          <div>
                            <span className="text-gray-600">Transportation:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {watchedFields.transportation.map((transport) => {
                                const transportLabels: Record<string, string> = {
                                  "flights": "Flights",
                                  "car-rental": "Car Rental",
                                  "public-transport": "Public Transit",
                                  "walking": "Walking"
                                }
                                return (
                                  <span
                                    key={transport}
                                    className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
                                  >
                                    {transportLabels[transport] || transport}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Voice Input Indicator */}
                  {voiceTranscript && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <Mic className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Voice Input Captured:</strong> Your trip details were captured from voice. Please review and edit any information below if needed.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Special Requests */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="specialRequests" className="text-base font-semibold text-gray-900">
                        {voiceTranscript ? "Your Trip Description" : "Anything else we should know?"}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {voiceTranscript 
                          ? "This is what we captured from your voice input. You can edit it if needed."
                          : "Help us personalize your itinerary with any special requests or preferences"}
                      </p>
                    </div>
                    <Controller
                      name="specialRequests"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Examples:
• Dietary restrictions (vegetarian, gluten-free, etc.)
• Accessibility needs
• Celebrating a special occasion
• Specific activities or experiences you want
• Places you've heard about and want to visit
• Travel pace preferences (relaxed vs packed schedule)
• Any concerns or things to avoid"
                          rows={6}
                          className="resize-none"
                        />
                      )}
                    />
                  </div>

                  {/* AI Preview */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <Sparkles className="w-4 h-4" />
                    <AlertDescription>
                      Our AI will create a personalized {watchedFields.endDate && watchedFields.startDate && 
                        Math.ceil((watchedFields.endDate.getTime() - watchedFields.startDate.getTime()) / (1000 * 60 * 60 * 24))
                      }-day itinerary including daily activities, restaurant recommendations, and travel tips!
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-8 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium px-6"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleGenerateTrip}
                  disabled={isGenerating || !isValid}
                  className="gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8759] hover:from-[#ff5525] hover:to-[#ff7649] text-white font-medium px-8 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Trip
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Skip Optional Fields Notice */}
      {currentStep === 2 && (
        <>
          <p className="text-center text-sm text-gray-500 mt-4">
            Tip: You can skip optional fields and we'll provide general recommendations
          </p>
          <p className="text-center text-sm text-blue-600 mt-2 font-medium">
            Click "Next" to review your trip details before generating your itinerary
          </p>
        </>
      )}
      </div>
    </div>
  )
}

// Import missing icons
import { 
  Building, 
  Mountain, 
  Utensils, 
  Trees, 
  ShoppingBag, 
  Music, 
  Camera,
  Home,
  Palmtree,
  HelpCircle
} from "lucide-react"