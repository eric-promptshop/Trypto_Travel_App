'use client'

import React, { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { DestinationSelector } from '@/components/travel-forms/destination-selector'
import { DateRangePicker } from '@/components/travel-forms/date-range-picker'
import { TravelerCounter } from '@/components/travel-forms/traveler-counter'
import { BudgetRangeSlider } from '@/components/travel-forms/budget-range-slider'
import { InterestTags } from '@/components/travel-forms/interest-tags'
import { ProgressIndicator } from '@/components/travel-forms/progress-indicator'
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Heart,
  Sparkles,
  Plane,
  Mail,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

// Comprehensive React validation at the top of the file
console.log('[PlanTripPage] React validation:', {
  React: typeof React !== 'undefined' ? 'Defined' : 'Undefined',
  ReactVersion: React?.version || 'N/A',
  useState: typeof useState !== 'undefined' ? 'Defined' : 'Undefined',
  useEffect: typeof useEffect !== 'undefined' ? 'Defined' : 'Undefined',
  Component: typeof Component !== 'undefined' ? 'Defined' : 'Undefined'
})

// Simple wrapper for TravelerCounter when we only need adults
const SimpleTravelerCounter: React.FC<{
  adults: number
  onChange: (count: number) => void
  className?: string
}> = ({ adults, onChange, className }) => {
  console.log('[SimpleTravelerCounter] Rendering with:', { adults, hasOnChange: !!onChange })
  
  return (
    <TravelerCounter
      adults={adults}
      children={0}
      infants={0}
      onAdultsChange={onChange}
      onChildrenChange={() => {
        console.log('[SimpleTravelerCounter] Children change handler called (no-op)')
      }}
      onInfantsChange={() => {
        console.log('[SimpleTravelerCounter] Infants change handler called (no-op)')
      }}
      className={className}
    />
  )
}

interface TripData {
  destination: string
  dates: { from: Date | undefined; to: Date | undefined }
  travelers: number
  budget: [number, number]
  interests: string[]
  email?: string
  name?: string
  phone?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// Error Boundary for Step Content
class StepErrorBoundary extends Component<
  { children: ReactNode; stepName: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; stepName: string }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('[StepErrorBoundary] Error caught:', error)
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[StepErrorBoundary] Error details:', {
      stepName: this.props.stepName,
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: 'StepErrorBoundary'
    })
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error in {this.props.stepName} step
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <details className="text-left bg-muted p-4 rounded-md">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {this.state.error?.stack}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

const steps = [
  { id: 'destination', title: 'Where to?', icon: MapPin, description: 'Choose your dream destination' },
  { id: 'dates', title: 'When?', icon: Calendar, description: 'Select your travel dates' },
  { id: 'travelers', title: 'Who?', icon: Users, description: 'How many travelers?' },
  { id: 'budget', title: 'Budget', icon: DollarSign, description: 'Set your budget range' },
  { id: 'interests', title: 'Interests', icon: Heart, description: 'What do you love?' },
  { id: 'contact', title: 'Contact', icon: Mail, description: 'Get your itinerary' },
  { id: 'review', title: 'Review', icon: Sparkles, description: 'Review and generate' }
]

export default function PlanTripPage() {
  // Add comprehensive logging at component initialization
  console.log('[PlanTripPage] Component initializing:', {
    React: typeof React,
    ReactNamespace: React,
    hooks: {
      useState: typeof useState,
      useEffect: typeof useEffect,
      useAnalytics: typeof useAnalytics
    },
    timestamp: new Date().toISOString()
  })

  // Ensure React is available
  if (typeof React === 'undefined') {
    console.error('[PlanTripPage] React is undefined!')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">React Loading Error</h1>
          <p className="text-muted-foreground">React is not available. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  const { track } = useAnalytics()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    dates: { from: undefined, to: undefined },
    travelers: 1,
    budget: [1000, 5000],
    interests: []
  })

  // Log state initialization
  console.log('[PlanTripPage] State initialized:', {
    currentStep,
    isGenerating,
    tripData,
    hasTrackFunction: typeof track === 'function'
  })

  // Add useEffect to log component lifecycle
  useEffect(() => {
    console.log('[PlanTripPage] Component mounted, React status:', {
      React: typeof React,
      ReactVersion: React?.version,
      currentStep,
      window: typeof window !== 'undefined'
    })
    
    track('trip_planning_page_view', {
      timestamp: new Date().toISOString()
    })
    
    return () => {
      console.log('[PlanTripPage] Component unmounting')
    }
  }, [track])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const currentStepData = steps[currentStep]
      if (currentStepData) {
        track('trip_planning_step_complete', { 
          step: currentStepData.id,
          step_number: currentStep + 1 
        })
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps or the next available step
    if (stepIndex <= currentStep || (stepIndex === currentStep + 1 && isStepValid(currentStep))) {
      setCurrentStep(stepIndex)
      track('trip_planning_step_jump', { 
        from_step: currentStep,
        to_step: stepIndex 
      })
    }
  }

  const handleGenerateItinerary = async () => {
    setIsGenerating(true)
    track('itinerary_generation_start', tripData)

    try {
      const requestData = {
        destination: tripData.destination,
        dates: {
          from: tripData.dates.from?.toISOString().split('T')[0],
          to: tripData.dates.to?.toISOString().split('T')[0]
        },
        travelers: tripData.travelers,
        budget: tripData.budget,
        interests: tripData.interests,
        email: tripData.email,
        name: tripData.name,
        phone: tripData.phone
      }

      console.log('[PlanTripPage] Submitting itinerary generation:', requestData)

      const response = await fetch('/api/v2/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()
      console.log('[PlanTripPage] Itinerary generation response:', result)

      if (result.success) {
        track('itinerary_generation_success', {
          ...tripData,
          generationTime: result.generationTime,
          itineraryId: result.itineraryId
        })
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('generatedItinerary', JSON.stringify(result.itinerary))
          sessionStorage.setItem('itineraryId', result.itineraryId)
        }
        
        window.location.href = '/itinerary-display'
      } else {
        throw new Error(result.error || 'Failed to generate itinerary')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to generate itinerary:', error)
      track('itinerary_generation_error', { error: errorMessage })
      setIsGenerating(false)
      alert(`Failed to generate itinerary: ${errorMessage}`)
    }
  }

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: return tripData.destination.length > 0
      case 1: return tripData.dates.from !== undefined && tripData.dates.to !== undefined
      case 2: return tripData.travelers > 0
      case 3: return tripData.budget[0] < tripData.budget[1]
      case 4: return tripData.interests.length > 0
      case 5: return !!tripData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tripData.email)
      default: return true
    }
  }

  const canProceed = isStepValid(currentStep)
  const progress = ((currentStep + 1) / steps.length) * 100
  const currentStepData = steps[currentStep]

  console.log('[PlanTripPage] Render state:', {
    currentStep,
    canProceed,
    progress,
    currentStepData: currentStepData?.title,
    isGenerating
  })

  if (!currentStepData) {
    console.error('[PlanTripPage] Invalid step data:', { currentStep, stepsLength: steps.length })
    return <div>Error: Invalid step</div>
  }

  const StepIcon = currentStepData.icon

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Plan Your Perfect Trip
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let's create an amazing itinerary tailored just for you
          </p>
          
          {/* Progress bar with animated fill */}
          <div className="relative w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex justify-between min-w-max md:min-w-0">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isClickable = index <= currentStep || (index === currentStep + 1 && canProceed);
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center space-y-2 relative",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => isClickable && handleStepClick(index)}
                >
                  {/* Connector line */}
                  {index > 0 && (
                    <div className="absolute top-4 -left-1/2 w-full h-[2px] bg-muted">
                      {isCompleted && (
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Step circle */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                    isActive 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground bg-background text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step title */}
                  <span className={cn(
                    "text-xs font-medium hidden md:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card className="backdrop-blur-sm bg-card/95 border border-border/40 shadow-lg">
          <CardHeader className="text-center border-b border-border/30 pb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-primary/10 p-3 rounded-full mr-3">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {currentStepData.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="min-h-[300px] flex flex-col justify-center"
              >
                {/* Step Content with Error Boundaries */}
                <StepErrorBoundary stepName={currentStepData.title}>
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <DestinationSelector
                        primaryDestination={tripData.destination}
                        onPrimaryDestinationChange={(destination: string) => {
                          setTripData({ ...tripData, destination })
                          track('destination_selected', { destination })
                        }}
                        onAdditionalDestinationsChange={() => {}}
                        placeholder="Where would you like to go?"
                        className="text-lg p-4 shadow-sm"
                      />
                      {tripData.destination && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <Badge variant="secondary" className="text-base px-4 py-2">
                            <MapPin className="mr-2 h-4 w-4" />
                            {tripData.destination}
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <DateRangePicker
                        startDate={tripData.dates.from}
                        endDate={tripData.dates.to}
                        onStartDateChange={(date: Date | undefined) => {
                          setTripData({ ...tripData, dates: { ...tripData.dates, from: date } })
                          track('date_selected', { type: 'start', date })
                        }}
                        onEndDateChange={(date: Date | undefined) => {
                          setTripData({ ...tripData, dates: { ...tripData.dates, to: date } })
                          track('date_selected', { type: 'end', date })
                        }}
                      />
                      {tripData.dates.from && tripData.dates.to && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <Badge variant="secondary" className="text-base px-4 py-2">
                            <Calendar className="mr-2 h-4 w-4" />
                            {tripData.dates.from.toLocaleDateString()} - {tripData.dates.to.toLocaleDateString()}
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <SimpleTravelerCounter
                          adults={tripData.travelers}
                          onChange={(travelers: number) => {
                            setTripData({ ...tripData, travelers })
                            track('travelers_selected', { travelers })
                          }}
                          className="mx-auto"
                        />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                      >
                        <Badge variant="secondary" className="text-base px-4 py-2">
                          <Users className="mr-2 h-4 w-4" />
                          {tripData.travelers} {tripData.travelers === 1 ? 'Traveler' : 'Travelers'}
                        </Badge>
                      </motion.div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <BudgetRangeSlider
                        minValue={tripData.budget[0]}
                        maxValue={tripData.budget[1]}
                        onMinChange={(value: number) => {
                          setTripData({ ...tripData, budget: [value, tripData.budget[1]] })
                          track('budget_min_selected', { value })
                        }}
                        onMaxChange={(value: number) => {
                          setTripData({ ...tripData, budget: [tripData.budget[0], value] })
                          track('budget_max_selected', { value })
                        }}
                        currency="USD"
                        onCurrencyChange={() => {}}
                        minLimit={500}
                        maxLimit={10000}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                      >
                        <Badge variant="secondary" className="text-base px-4 py-2">
                          <DollarSign className="mr-2 h-4 w-4" />
                          ${tripData.budget[0].toLocaleString()} - ${tripData.budget[1].toLocaleString()}
                        </Badge>
                      </motion.div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <InterestTags
                        selectedInterests={tripData.interests}
                        onInterestToggle={(interestId: string) => {
                          const newInterests = tripData.interests.includes(interestId)
                            ? tripData.interests.filter(i => i !== interestId)
                            : [...tripData.interests, interestId]
                          setTripData({ ...tripData, interests: newInterests })
                          track('interest_toggled', { interestId, selected: !tripData.interests.includes(interestId) })
                        }}
                      />
                      
                      {tripData.interests.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center mt-4"
                        >
                          <p className="text-sm text-muted-foreground mb-2">
                            Selected interests ({tripData.interests.length}):
                          </p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {tripData.interests.map(interest => (
                              <Badge key={interest} variant="outline" className="px-3 py-1">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6 max-w-md mx-auto">
                      <div className="text-center mb-6">
                        <p className="text-muted-foreground">
                          Enter your contact details to receive your personalized itinerary
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={tripData.email || ''}
                            onChange={(e) => {
                              setTripData({ ...tripData, email: e.target.value })
                              track('email_entered', { hasEmail: !!e.target.value })
                            }}
                            className="shadow-sm"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">Name (optional)</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={tripData.name || ''}
                            onChange={(e) => {
                              setTripData({ ...tripData, name: e.target.value })
                              track('name_entered', { hasName: !!e.target.value })
                            }}
                            className="shadow-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">Phone (optional)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={tripData.phone || ''}
                            onChange={(e) => {
                              setTripData({ ...tripData, phone: e.target.value })
                              track('phone_entered', { hasPhone: !!e.target.value })
                            }}
                            className="shadow-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-muted-foreground mt-6 p-4 bg-muted/50 rounded-lg">
                        <p>We'll email you the itinerary and may follow up with personalized recommendations.</p>
                        <p className="mt-2">Your information is secure and will never be shared.</p>
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold mb-2">Review Your Trip Details</h3>
                        <p className="text-muted-foreground">
                          Everything looks perfect? Let's create your personalized itinerary!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <div className="bg-primary/10 p-2 rounded-full mr-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">Destination</span>
                              </div>
                              <p className="text-lg">{tripData.destination}</p>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <div className="bg-primary/10 p-2 rounded-full mr-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">Dates</span>
                              </div>
                              <p className="text-lg">
                                {tripData.dates.from?.toLocaleDateString()} - {tripData.dates.to?.toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <div className="bg-primary/10 p-2 rounded-full mr-2">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">Travelers</span>
                              </div>
                              <p className="text-lg">{tripData.travelers} {tripData.travelers === 1 ? 'person' : 'people'}</p>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <div className="bg-primary/10 p-2 rounded-full mr-2">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">Budget</span>
                              </div>
                              <p className="text-lg">${tripData.budget[0].toLocaleString()} - ${tripData.budget[1].toLocaleString()}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-3">
                              <div className="bg-primary/10 p-2 rounded-full mr-2">
                                <Heart className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">Interests</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tripData.interests.map((interest) => (
                                <Badge key={interest} variant="outline" className="px-3 py-1">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {tripData.email && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-3">
                                <div className="bg-primary/10 p-2 rounded-full mr-2">
                                  <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">Contact Information</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Email:</span> {tripData.email}</p>
                                {tripData.name && <p><span className="font-medium">Name:</span> {tripData.name}</p>}
                                {tripData.phone && <p><span className="font-medium">Phone:</span> {tripData.phone}</p>}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  )}
                </StepErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
            className="flex items-center gap-2 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="hidden md:flex items-center space-x-2">
            {Array.from({ length: steps.length }, (_, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  i === currentStep 
                    ? "bg-primary scale-125" 
                    : i < currentStep 
                      ? "bg-primary/60" 
                      : "bg-muted"
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={handleGenerateItinerary} 
              disabled={!canProceed || isGenerating}
              className="flex items-center gap-2 text-base px-6 py-6 shadow-md"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                  Generating...
                </>
              ) : (
                <>
                  <Plane className="h-5 w-5" />
                  Generate Itinerary
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed}
              className="flex items-center gap-2 shadow-sm"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Bottom progress indicator for mobile */}
        <div className="mt-8 md:hidden">
          <Separator className="mb-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span>Review</span>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </div>
      </div>
    </div>
  )
}