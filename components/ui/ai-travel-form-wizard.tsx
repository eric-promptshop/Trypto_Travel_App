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
  Send,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { LocationSearch } from "./location-search"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import { format } from "date-fns"

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

  const handleNext = async () => {
    // Validate current step fields
    let fieldsToValidate: (keyof TravelFormData)[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ["destination", "startDate", "endDate", "travelers"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["accommodation", "interests"]
    }
    
    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  const progress = (currentStep / 3) * 100

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
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
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-8">
          <form onSubmit={onFormSubmit}>
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
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Trip Summary</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destination:</span>
                        <span className="font-medium">{watchedFields.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dates:</span>
                        <span className="font-medium">
                          {watchedFields.startDate && format(watchedFields.startDate, "MMM d")} - 
                          {watchedFields.endDate && format(watchedFields.endDate, "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travelers:</span>
                        <span className="font-medium">{watchedFields.travelers}</span>
                      </div>
                      {watchedFields.budget && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">{watchedFields.budget}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">
                      Special Requests (Optional)
                    </Label>
                    <Controller
                      name="specialRequests"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Any dietary restrictions, accessibility needs, or specific activities you'd like to include?"
                          rows={4}
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
                  type="submit"
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
        <p className="text-center text-sm text-gray-500 mt-4">
          Tip: You can skip optional fields and we'll provide general recommendations
        </p>
      )}
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