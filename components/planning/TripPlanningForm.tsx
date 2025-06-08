"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign, 
  Heart, 
  Mountain, 
  Camera, 
  Utensils,
  Music,
  Waves,
  TreePine,
  Building,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plane,
  ArrowRight,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  travelers: z.number().min(1, "At least 1 traveler is required").max(20, "Maximum 20 travelers"),
  budget: z.number().min(100, "Minimum budget is $100").max(100000, "Maximum budget is $100,000"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  accommodationType: z.string().min(1, "Select accommodation type"),
  travelStyle: z.string().min(1, "Select travel style"),
  additionalRequirements: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Step {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

const steps: Step[] = [
  {
    id: 1,
    title: "Destination & Dates",
    description: "Where and when do you want to go?",
    icon: MapPin
  },
  {
    id: 2,
    title: "Travel Details",
    description: "Tell us about your group and budget",
    icon: Users
  },
  {
    id: 3,
    title: "Preferences",
    description: "What kind of experience are you looking for?",
    icon: Heart
  },
  {
    id: 4,
    title: "Review & Generate",
    description: "Finalize your preferences and create your itinerary",
    icon: Sparkles
  }
]

const interests = [
  { id: 'culture', label: 'Culture & History', icon: Building },
  { id: 'nature', label: 'Nature & Wildlife', icon: TreePine },
  { id: 'adventure', label: 'Adventure Sports', icon: Mountain },
  { id: 'food', label: 'Food & Cuisine', icon: Utensils },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'music', label: 'Music & Nightlife', icon: Music },
  { id: 'beaches', label: 'Beaches & Relaxation', icon: Waves },
]

const accommodationTypes = [
  { value: 'luxury', label: 'Luxury Hotels' },
  { value: 'boutique', label: 'Boutique Hotels' },
  { value: 'budget', label: 'Budget Hotels' },
  { value: 'hostel', label: 'Hostels' },
  { value: 'airbnb', label: 'Airbnb/Vacation Rentals' },
  { value: 'camping', label: 'Camping' },
]

const travelStyles = [
  { value: 'relaxed', label: 'Relaxed & Leisurely' },
  { value: 'balanced', label: 'Balanced Mix' },
  { value: 'packed', label: 'Action-Packed' },
  { value: 'spontaneous', label: 'Spontaneous & Flexible' },
]

const popularDestinations = [
  'Paris, France',
  'Tokyo, Japan',
  'New York, USA',
  'Barcelona, Spain',
  'Bali, Indonesia',
  'Rome, Italy',
  'London, UK',
  'Bangkok, Thailand',
  'Santorini, Greece',
  'Machu Picchu, Peru',
]

interface TripPlanningFormProps {
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

export function TripPlanningForm({ onSubmit, isLoading = false }: TripPlanningFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [destinationQuery, setDestinationQuery] = useState("")

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      travelers: 2,
      budget: 2000,
      interests: [],
      accommodationType: "",
      travelStyle: "",
      additionalRequirements: "",
    },
  })

  const { watch, setValue, trigger } = form
  const watchedFields = watch()

  const handleNext = async () => {
    let isValid = false
    
    switch (currentStep) {
      case 1:
        isValid = await trigger(['destination', 'startDate', 'endDate'])
        break
      case 2:
        isValid = await trigger(['travelers', 'budget'])
        break
      case 3:
        isValid = await trigger(['interests', 'accommodationType', 'travelStyle'])
        break
    }
    
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInterestToggle = (interestId: string) => {
    const newInterests = selectedInterests.includes(interestId)
      ? selectedInterests.filter(id => id !== interestId)
      : [...selectedInterests, interestId]
    
    setSelectedInterests(newInterests)
    setValue('interests', newInterests)
  }

  const handleDestinationSelect = (destination: string) => {
    setValue('destination', destination)
    setDestinationQuery(destination)
    setShowDestinationSuggestions(false)
  }

  const filteredDestinations = popularDestinations.filter(dest =>
    dest.toLowerCase().includes(destinationQuery.toLowerCase())
  )

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return watchedFields.destination && watchedFields.startDate && watchedFields.endDate
      case 2:
        return watchedFields.travelers && watchedFields.budget
      case 3:
        return watchedFields.interests?.length > 0 && watchedFields.accommodationType && watchedFields.travelStyle
      case 4:
        return true
      default:
        return false
    }
  }

  const progressPercentage = (currentStep / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Plan Your Perfect Trip</h1>
            <div className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                      isActive 
                        ? "bg-blue-500 text-white" 
                        : isCompleted 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">
                  {steps[currentStep - 1]?.title}
                </CardTitle>
                <CardDescription className="text-lg">
                  {steps[currentStep - 1]?.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Step 1: Destination & Dates */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        {/* Destination Input */}
                        <FormField
                          control={form.control}
                          name="destination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Where do you want to go?</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <Input
                                    placeholder="Enter your dream destination..."
                                    {...field}
                                    value={destinationQuery}
                                    onChange={(e) => {
                                      setDestinationQuery(e.target.value)
                                      field.onChange(e.target.value)
                                      setShowDestinationSuggestions(true)
                                    }}
                                    className="text-lg py-6 pl-10"
                                  />
                                  
                                  {/* Destination Suggestions */}
                                  {showDestinationSuggestions && destinationQuery && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
                                      {filteredDestinations.map((destination) => (
                                        <button
                                          key={destination}
                                          type="button"
                                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                                          onClick={() => handleDestinationSelect(destination)}
                                        >
                                          <MapPin className="w-4 h-4 text-gray-400" />
                                          <span>{destination}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormDescription>
                                Search for cities, countries, or famous landmarks
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Popular Destinations */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">
                            Or choose from popular destinations:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {popularDestinations.slice(0, 8).map((destination) => (
                              <Badge
                                key={destination}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors py-2 px-4"
                                onClick={() => handleDestinationSelect(destination)}
                              >
                                {destination}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Date Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-lg font-semibold">Start Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full pl-3 text-left font-normal py-6",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-lg font-semibold">End Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full pl-3 text-left font-normal py-6",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < watchedFields.startDate}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Travel Details */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        {/* Number of Travelers */}
                        <FormField
                          control={form.control}
                          name="travelers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">How many travelers?</FormLabel>
                              <FormControl>
                                <div className="flex items-center space-x-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => field.onChange(Math.max(1, field.value - 1))}
                                    disabled={field.value <= 1}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <div className="flex items-center gap-2 flex-1 justify-center">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    <span className="text-2xl font-semibold min-w-[3ch] text-center">
                                      {field.value}
                                    </span>
                                    <span className="text-gray-600">
                                      {field.value === 1 ? 'traveler' : 'travelers'}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => field.onChange(Math.min(20, field.value + 1))}
                                    disabled={field.value >= 20}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Budget */}
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">
                                What's your budget?
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                    <Input
                                      type="number"
                                      min="100"
                                      max="100000"
                                      step="100"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="text-xl font-semibold"
                                    />
                                    <span className="text-gray-600">USD total</span>
                                  </div>
                                  <Slider
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    max={10000}
                                    min={100}
                                    step={100}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-sm text-gray-500">
                                    <span>$100</span>
                                    <span>$10,000+</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormDescription>
                                This includes accommodation, activities, food, and local transport
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 3: Preferences */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        {/* Interests */}
                        <FormField
                          control={form.control}
                          name="interests"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">What are you interested in?</FormLabel>
                              <FormDescription>
                                Select all that apply to personalize your itinerary
                              </FormDescription>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                {interests.map((interest) => {
                                  const Icon = interest.icon
                                  const isSelected = selectedInterests.includes(interest.id)
                                  
                                  return (
                                    <Button
                                      key={interest.id}
                                      type="button"
                                      variant={isSelected ? "default" : "outline"}
                                      className={cn(
                                        "h-auto p-4 flex flex-col items-center gap-2 transition-all",
                                        isSelected && "bg-blue-500 hover:bg-blue-600"
                                      )}
                                      onClick={() => handleInterestToggle(interest.id)}
                                    >
                                      <Icon className="w-6 h-6" />
                                      <span className="text-sm text-center leading-tight">
                                        {interest.label}
                                      </span>
                                    </Button>
                                  )
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Accommodation Type */}
                        <FormField
                          control={form.control}
                          name="accommodationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Accommodation Preference</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="py-6">
                                    <SelectValue placeholder="Choose your accommodation style" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {accommodationTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Travel Style */}
                        <FormField
                          control={form.control}
                          name="travelStyle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Travel Style</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="py-6">
                                    <SelectValue placeholder="How do you like to travel?" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {travelStyles.map((style) => (
                                    <SelectItem key={style.value} value={style.value}>
                                      {style.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Additional Requirements */}
                        <FormField
                          control={form.control}
                          name="additionalRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">
                                Additional Requirements (Optional)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any special requirements, dietary restrictions, accessibility needs, or specific requests?"
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 4: Review & Generate */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold mb-2">Review Your Trip Details</h3>
                          <p className="text-gray-600">
                            Everything looks good? Let's generate your personalized itinerary!
                          </p>
                        </div>

                        {/* Trip Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-600">Destination</p>
                                <p className="font-semibold">{watchedFields.destination}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-600">Duration</p>
                                <p className="font-semibold">
                                  {watchedFields.startDate && watchedFields.endDate && 
                                    `${Math.ceil((watchedFields.endDate.getTime() - watchedFields.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-600">Travelers</p>
                                <p className="font-semibold">
                                  {watchedFields.travelers} {watchedFields.travelers === 1 ? 'person' : 'people'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-600">Budget</p>
                                <p className="font-semibold">${watchedFields.budget?.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Selected Interests */}
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Interests</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedInterests.map((interestId) => {
                                const interest = interests.find(i => i.id === interestId)
                                return (
                                  <Badge key={interestId} variant="secondary">
                                    {interest?.label}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Generate Button */}
                        <div className="text-center">
                          <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                Generating Your Itinerary...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate My Itinerary
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
} 