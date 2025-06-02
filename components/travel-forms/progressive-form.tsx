"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Users, DollarSign, MapPin, Heart, ArrowLeft, ArrowRight } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  TravelFormProvider, 
  useTravelForm, 
  TravelFormData,
  FormSection,
  ProgressIndicator,
  DateRangePicker,
  TravelerCounter,
  BudgetRangeSlider,
  DestinationSelector,
  InterestTags
} from './index'

// Define the form steps
const FORM_STEPS = [
  {
    id: 'dates',
    title: 'Travel Dates',
    description: 'When would you like to travel?',
    icon: Calendar
  },
  {
    id: 'travelers',
    title: 'Travelers',
    description: 'Who\'s joining this adventure?',
    icon: Users
  },
  {
    id: 'budget',
    title: 'Budget',
    description: 'What\'s your budget range?',
    icon: DollarSign
  },
  {
    id: 'destinations',
    title: 'Destinations', 
    description: 'Where would you like to go?',
    icon: MapPin
  },
  {
    id: 'interests',
    title: 'Interests',
    description: 'What interests you most?',
    icon: Heart
  }
]

// Animation variants for step transitions
const stepVariants = {
  hidden: { 
    opacity: 0, 
    x: 50,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: -50,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
}

// Individual step components
const DateStep: React.FC = () => {
  const step = FORM_STEPS[0]!
  const { watch, setValue } = useFormContext<TravelFormData>()
  
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  
  return (
    <FormSection
      title={step.title}
      description={step.description}
      icon={step.icon}
      step={1}
      totalSteps={FORM_STEPS.length}
    >
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(date: Date | undefined) => setValue('startDate', date)}
        onEndDateChange={(date: Date | undefined) => setValue('endDate', date)}
      />
    </FormSection>
  )
}

const TravelersStep: React.FC = () => {
  const step = FORM_STEPS[1]!
  const { watch, setValue } = useFormContext<TravelFormData>()
  
  const adults = watch('adults')
  const children = watch('children')
  const infants = watch('infants')
  
  return (
    <FormSection
      title={step.title}
      description={step.description}
      icon={step.icon}
      step={2}
      totalSteps={FORM_STEPS.length}
    >
      <TravelerCounter
        adults={adults || 2}
        children={children || 0}
        infants={infants || 0}
        onAdultsChange={(count: number) => setValue('adults', count)}
        onChildrenChange={(count: number) => setValue('children', count)}
        onInfantsChange={(count: number) => setValue('infants', count)}
      />
    </FormSection>
  )
}

const BudgetStep: React.FC = () => {
  const step = FORM_STEPS[2]!
  const { watch, setValue } = useFormContext<TravelFormData>()
  
  const budgetMin = watch('budgetMin')
  const budgetMax = watch('budgetMax')
  const currency = watch('currency')
  
  return (
    <FormSection
      title={step.title}
      description={step.description}
      icon={step.icon}
      step={3}
      totalSteps={FORM_STEPS.length}
    >
      <BudgetRangeSlider
        minValue={budgetMin || 1000}
        maxValue={budgetMax || 5000}
        currency={currency || 'USD'}
        onMinChange={(value: number) => setValue('budgetMin', value)}
        onMaxChange={(value: number) => setValue('budgetMax', value)}
        onCurrencyChange={(value: string) => setValue('currency', value)}
      />
    </FormSection>
  )
}

const DestinationsStep: React.FC = () => {
  const step = FORM_STEPS[3]!
  const { watch, setValue } = useFormContext<TravelFormData>()
  
  const primaryDestination = watch('primaryDestination')
  const additionalDestinations = watch('additionalDestinations')
  
  return (
    <FormSection
      title={step.title}
      description={step.description}
      icon={step.icon}
      step={4}
      totalSteps={FORM_STEPS.length}
    >
      <DestinationSelector
        primaryDestination={primaryDestination}
        additionalDestinations={additionalDestinations || []}
        onPrimaryDestinationChange={(destination: string) => setValue('primaryDestination', destination)}
        onAdditionalDestinationsChange={(destinations: string[]) => setValue('additionalDestinations', destinations)}
      />
    </FormSection>
  )
}

const InterestsStep: React.FC = () => {
  const step = FORM_STEPS[4]!
  const { watch, setValue } = useFormContext<TravelFormData>()
  
  const interests = watch('interests')
  
  return (
    <FormSection
      title={step.title}
      description={step.description}
      icon={step.icon}
      step={5}
      totalSteps={FORM_STEPS.length}
    >
      <InterestTags
        selectedInterests={interests || []}
        onInterestsChange={(interests: string[]) => setValue('interests', interests)}
      />
    </FormSection>
  )
}

// Step components array for easy mapping
const STEP_COMPONENTS = [
  DateStep,
  TravelersStep, 
  BudgetStep,
  DestinationsStep,
  InterestsStep
]

// Navigation controls component
const FormNavigation: React.FC = () => {
  const { currentStep, nextStep, prevStep, canProceed, isFirstStep, isLastStep } = useTravelForm()
  const { formState } = useFormContext<TravelFormData>()
  
  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={prevStep}
        disabled={isFirstStep}
        className={cn(
          "transition-all",
          isFirstStep && "opacity-50 cursor-not-allowed"
        )}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>
      
      <div className="text-sm text-muted-foreground">
        Step {currentStep + 1} of {FORM_STEPS.length}
      </div>
      
      {isLastStep ? (
        <Button
          type="submit"
          disabled={!canProceed || formState.isSubmitting}
          className="min-w-[100px]"
        >
          {formState.isSubmitting ? "Creating..." : "Create Trip"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={nextStep}
          disabled={!canProceed}
          className={cn(
            "transition-all",
            !canProceed && "opacity-50 cursor-not-allowed"
          )}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  )
}

// Progressive form content component
const ProgressiveFormContent: React.FC = () => {
  const { currentStep, goToStep } = useTravelForm()
  
  const CurrentStepComponent = STEP_COMPONENTS[currentStep]
  
  if (!CurrentStepComponent) {
    return <div>Invalid step</div>
  }
  
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <ProgressIndicator
        steps={FORM_STEPS}
        currentStep={currentStep}
        showLabels={true}
        showProgress={true}
        onStepClick={goToStep}
        allowClickback={true}
        className="mb-8"
      />
      
      {/* Animated Step Content */}
      <div className="min-h-[400px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="hidden"
            animate="visible" 
            exit="exit"
            className="absolute inset-0"
          >
            <CurrentStepComponent />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation Controls */}
      <FormNavigation />
    </div>
  )
}

// Main progressive form component
interface ProgressiveFormProps {
  defaultValues?: Partial<TravelFormData>
  onSubmit: (data: TravelFormData) => void
  className?: string
}

export const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  defaultValues,
  onSubmit,
  className
}) => {
  return (
    <div className={cn("max-w-2xl mx-auto p-6", className)}>
      <TravelFormProvider
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        totalSteps={FORM_STEPS.length}
      >
        <ProgressiveFormContent />
      </TravelFormProvider>
    </div>
  )
}

export default ProgressiveForm 