"use client"

import React, { useState, useCallback } from "react"
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
  AlertCircle,
  Plane,
  Car,
  Train,
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
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { VoiceInputButton } from "@/components/voice/VoiceInputButton"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LocationSearch } from "./location-search"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import { format } from "date-fns"
import { toast } from 'react-hot-toast'

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
  interests: z.array(z.string()).optional().default([]),
  
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
    setValue,
    getValues
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

  // Wrapper for setValue that handles any necessary field transformations
  const setValueWrapper = useCallback(async (name: string, value: any, options?: any) => {
    console.log(`[Form] Setting ${name} to:`, value, 'type:', typeof value);
    
    // The form expects specific types for certain fields
    if (name === 'travelers' && typeof value === 'string') {
      value = parseInt(value, 10);
    }
    
    // Ensure dates are Date objects
    if ((name === 'startDate' || name === 'endDate') && !(value instanceof Date)) {
      console.error(`[Form] ${name} must be a Date object, got:`, value);
      return Promise.resolve(false);
    }
    
    // Special handling for arrays
    if ((name === 'interests' || name === 'transportation') && Array.isArray(value)) {
      console.log(`[Form] Setting array field ${name}:`, value);
    }
    
    try {
      const result = setValue(name, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
        ...options
      });
      
      // Force a re-render to ensure the UI updates
      if (name === 'destination' || name === 'startDate' || name === 'endDate' || name === 'travelers') {
        console.log(`[Form] Critical field ${name} set, triggering validation`);
        setTimeout(() => {
          trigger(name);
        }, 50);
      }
      
      return result;
    } catch (error) {
      console.error(`[Form] Error setting ${name}:`, error);
      return Promise.resolve(false);
    }
  }, [setValue, trigger]);

  const navigateToReview = useCallback(async () => {
    console.log('[Form] Navigating to review, current values:', getValues());
    
    // Validate basic fields before navigating
    const basicFieldsValid = await trigger(['destination', 'startDate', 'endDate', 'travelers'])
    console.log('[Form] Basic fields validation result:', basicFieldsValid);
    
    if (basicFieldsValid) {
      // Clear any focus to prevent accidental submission
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setCurrentStep(3)
        toast.success('Trip details added from voice input!', { duration: 3000 })
        
        // Prevent any immediate form submission
        const form = document.querySelector('form');
        if (form) {
          form.addEventListener('submit', (e) => {
            console.log('[Form] Preventing immediate submission after voice input');
            e.preventDefault();
            e.stopPropagation();
          }, { once: true, capture: true });
          
          // Remove the prevention after a delay
          setTimeout(() => {
            console.log('[Form] Re-enabling form submission');
          }, 1000);
        }
      }, 100);
    } else {
      // Log which fields failed validation
      console.log('[Form] Validation errors:', errors);
      
      // If basic fields aren't filled, just show what we parsed
      toast.success('Voice input processed. Please complete any missing fields.', { duration: 4000 })
    }
  }, [trigger, getValues, errors])


  const handleNext = async () => {
    console.log('[Form] handleNext called, currentStep:', currentStep);
    
    // Validate current step fields
    let fieldsToValidate: (keyof TravelFormData)[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ["destination", "startDate", "endDate", "travelers"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["accommodation", "interests"]
    }
    
    const isStepValid = await trigger(fieldsToValidate)
    console.log('[Form] Validation result:', isStepValid);
    
    if (isStepValid) {
      const nextStep = Math.min(currentStep + 1, 3);
      console.log('[Form] Moving to step:', nextStep);
      setCurrentStep(nextStep);
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onFormSubmit = handleSubmit(async (data) => {
    console.log('[Form] onFormSubmit called, currentStep:', currentStep);
    console.log('[Form] Submitting form with data:', data);
    console.trace('[Form] Submit call stack');
    
    // Only submit if we're on step 3
    if (currentStep !== 3) {
      console.error('[Form] ERROR: Form submitted from step', currentStep);
      return;
    }
    
    // Additional check to prevent auto-submission from voice input
    const submitButton = document.activeElement as HTMLElement;
    if (!submitButton || submitButton.getAttribute('type') !== 'submit' || 
        !(submitButton as any).dataset?.userClicked) {
      console.log('[Form] Form submission not triggered by explicit user click on Generate Trip button, ignoring');
      return;
    }
    
    // Clear the flag
    delete (submitButton as any).dataset.userClicked;
    
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('[Form] Error submitting form:', error);
      toast.error('Failed to generate itinerary. Please try again.');
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

      {/* Voice Input Option */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm">
        <span className="text-gray-600">or</span>
        <VoiceInputButton 
          setValue={setValueWrapper}
          navigateToReview={navigateToReview}
        />
        {/* Debug: Test form setValue */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              console.log('[Debug] Testing form setValue...');
              const testDate = new Date();
              testDate.setDate(testDate.getDate() + 7);
              const endDate = new Date(testDate);
              endDate.setDate(endDate.getDate() + 5);
              
              await setValueWrapper('destination', 'Paris');
              await setValueWrapper('startDate', testDate);
              await setValueWrapper('endDate', endDate);
              await setValueWrapper('travelers', 2);
              
              setTimeout(() => {
                console.log('[Debug] Form values after test:', getValues());
              }, 500);
            }}
            className="text-xs"
          >
            Test Fill
          </Button>
        )}
      </div>

      {/* Form Steps */}
      <Card className="shadow-xl border-gray-200 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8">
          <form onSubmit={onFormSubmit} onKeyDown={(e) => {
            // Prevent Enter key from submitting form except on step 3
            if (e.key === 'Enter' && currentStep !== 3) {
              e.preventDefault();
              console.log('[Form] Prevented Enter key submission on step', currentStep);
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

                  {/* Special Requests */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="specialRequests" className="text-base font-semibold text-gray-900">
                        Anything else we should know?
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Help us personalize your itinerary with any special requests or preferences
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
                  type="submit"
                  disabled={isGenerating || !isValid}
                  className="gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8759] hover:from-[#ff5525] hover:to-[#ff7649] text-white font-medium px-8 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={(e) => {
                    console.log('[Form] Generate Trip button clicked');
                    // Mark this as an explicit user action
                    (e.currentTarget as any).dataset.userClicked = 'true';
                  }}
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
    </div>
  )
}