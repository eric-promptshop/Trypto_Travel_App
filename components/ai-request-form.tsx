"use client"

import type React from "react"
import { AITravelItineraryForm } from "@/components/ui/ai-travel-itinerary-form"

interface FormData {
  destinations?: string[]
  travelDates?: {
    startDate?: string
    endDate?: string
    flexible?: boolean
  }
  travelers?: {
    adults?: number
    children?: number
  }
  budget?: {
    amount?: number
    currency?: string
    perPerson?: boolean
  }
  accommodation?: string
  interests?: string[]
  specialRequirements?: string
  completeness?: number
  tripId?: string
}

interface AIRequestFormProps {
  onComplete: (data: FormData) => void
}

export function AIRequestForm({ onComplete }: AIRequestFormProps) {
  const handleFormComplete = (data: any) => {
    // Transform the new form data to match the expected format
    const formData: FormData = {
      destinations: data.destination ? [data.destination] : [],
      travelDates: {
        startDate: data.startDate?.toISOString(),
        endDate: data.endDate?.toISOString(),
        flexible: false
      },
      travelers: {
        adults: data.travelers || 2,
        children: 0
      },
      budget: data.budget ? {
        amount: parseInt(data.budget.replace(/[^0-9]/g, '')) || 0,
        currency: 'USD',
        perPerson: false
      } : undefined,
      interests: data.preferences?.filter((p: any) => p.selected).map((p: any) => p.label) || [],
      specialRequirements: data.specialRequests || '',
      completeness: 100,
      tripId: data.tripId
    }
    
    onComplete(formData)
  }

  return <AITravelItineraryForm onComplete={handleFormComplete} />
}