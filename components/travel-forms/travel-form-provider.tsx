"use client"

import React, { createContext, useContext, useState } from 'react'
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Travel form validation schema
export const travelFormSchema = z.object({
  // Trip dates
  startDate: z.date().min(new Date(), 'Start date must be in the future'),
  endDate: z.date(),
  
  // Travelers
  adults: z.number().min(1, 'At least one adult required').max(20),
  children: z.number().min(0).max(20),
  infants: z.number().min(0).max(20),
  
  // Budget
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  currency: z.string().default('USD'),
  
  // Destinations
  primaryDestination: z.string().min(1, 'Primary destination is required'),
  additionalDestinations: z.array(z.string()).optional(),
  
  // Interests and preferences
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  accommodationType: z.enum(['hotel', 'resort', 'vacation-rental', 'hostel', 'any']),
  transportationPreference: z.enum(['flight', 'train', 'car', 'bus', 'any']),
  
  // Additional preferences
  specialRequests: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  mobilityRequirements: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
})

export type TravelFormData = z.infer<typeof travelFormSchema>

// Travel form context for step management
interface TravelFormContextType {
  currentStep: number
  totalSteps: number
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  canProceed: boolean
  isFirstStep: boolean
  isLastStep: boolean
}

const TravelFormContext = createContext<TravelFormContextType | undefined>(undefined)

export const useTravelForm = () => {
  const context = useContext(TravelFormContext)
  if (!context) {
    throw new Error('useTravelForm must be used within a TravelFormProvider')
  }
  return context
}

interface TravelFormProviderProps {
  children: React.ReactNode
  defaultValues?: Partial<TravelFormData>
  onSubmit: (data: TravelFormData) => void
  totalSteps?: number
}

export const TravelFormProvider: React.FC<TravelFormProviderProps> = ({
  children,
  defaultValues,
  onSubmit,
  totalSteps = 5
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  
  const form = useForm<TravelFormData>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      adults: 2,
      children: 0,
      infants: 0,
      budgetMin: 1000,
      budgetMax: 5000,
      currency: 'USD',
      accommodationType: 'any',
      transportationPreference: 'any',
      interests: [],
      additionalDestinations: [],
      dietaryRestrictions: [],
      ...defaultValues,
    },
    mode: 'onChange'
  })
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step)
    }
  }
  
  // Determine if user can proceed based on current step validation
  const getCurrentStepFields = () => {
    switch (currentStep) {
      case 0: return ['startDate', 'endDate'] as const
      case 1: return ['adults', 'children', 'infants'] as const
      case 2: return ['budgetMin', 'budgetMax'] as const
      case 3: return ['primaryDestination'] as const
      case 4: return ['interests', 'accommodationType', 'transportationPreference'] as const
      default: return [] as const
    }
  }
  
  const currentStepFields = getCurrentStepFields()
  
  // Check if all fields for the current step are valid (no errors) AND filled with required values
  const hasNoErrors = currentStepFields.length === 0 || 
    currentStepFields.every(field => !form.formState.errors[field])
  
  // Check if required fields are actually filled
  const areRequiredFieldsFilled = () => {
    const values = form.getValues()
    
    switch (currentStep) {
      case 0: 
        return !!(values.startDate && values.endDate)
      case 1: 
        return values.adults >= 1
      case 2: 
        return values.budgetMin !== undefined && values.budgetMax !== undefined && values.budgetMax >= values.budgetMin
      case 3: 
        return !!(values.primaryDestination && values.primaryDestination.trim().length > 0)
      case 4: 
        return !!(values.interests && values.interests.length > 0 && 
               values.accommodationType && values.transportationPreference)
      default: 
        return true
    }
  }
  
  const canProceed = hasNoErrors && areRequiredFieldsFilled()
  
  const contextValue: TravelFormContextType = {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
  }
  
  return (
    <TravelFormContext.Provider value={contextValue}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {children}
        </form>
      </FormProvider>
    </TravelFormContext.Provider>
  )
} 