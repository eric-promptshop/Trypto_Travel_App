"use client"

import type React from "react"
import { useState } from "react"
import { AITravelItineraryForm } from "@/components/ui/ai-travel-itinerary-form"
import { useTrips } from '@/hooks/use-trips'
import { toast } from "sonner"

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
  const { createTrip } = useTrips()
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleFormComplete = async (data: any) => {
    setIsGenerating(true)
    
    try {
      // Transform the form data for the AI generation endpoint
      const tripFormData = {
        destination: data.destination || '',
        dates: {
          from: data.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          to: data.endDate?.toISOString().split('T')[0] || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        travelers: data.travelers || 2,
        budget: [1000, 5000], // Default budget range if not specified
        interests: data.preferences?.filter((p: any) => p.selected).map((p: any) => p.label.toLowerCase()) || ['culture', 'food'],
        email: 'user@example.com', // You might want to get this from user context
        name: 'Traveler' // You might want to get this from user context
      }
      
      // Parse budget if provided
      if (data.budget) {
        const budgetMatch = data.budget.match(/\$?(\d+)\s*-\s*\$?(\d+)/)
        if (budgetMatch) {
          tripFormData.budget = [parseInt(budgetMatch[1]), parseInt(budgetMatch[2])]
        } else {
          const singleBudget = parseInt(data.budget.replace(/[^0-9]/g, '')) || 2000
          tripFormData.budget = [Math.floor(singleBudget * 0.7), singleBudget]
        }
      }
      
      toast.info('Generating your AI-powered itinerary...')
      
      // Call the AI generation endpoint
      const response = await fetch('/api/trips-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripData: tripFormData }),
      })
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to generate itinerary')
      }
      
      // Create a trip in the database
      const newTrip = await createTrip({
        title: `Trip to ${data.destination || 'Unknown'}`,
        description: data.specialRequests || `A wonderful ${data.travelers}-person trip`,
        startDate: data.startDate?.toISOString() || new Date().toISOString(),
        endDate: data.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: data.destination || 'Unknown',
        itinerary: result.itinerary,
      })
      
      if (newTrip) {
        toast.success('Itinerary generated successfully!')
        
        // Transform to match expected format and complete
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
            amount: tripFormData.budget[1],
            currency: 'USD',
            perPerson: true
          } : undefined,
          interests: data.preferences?.filter((p: any) => p.selected).map((p: any) => p.label) || [],
          specialRequirements: data.specialRequests || '',
          completeness: 100,
          tripId: newTrip.id
        }
        
        onComplete(formData)
      } else {
        throw new Error('Failed to create trip')
      }
    } catch (error: any) {
      console.error('Error generating itinerary:', error)
      toast.error(error.message || 'Failed to generate itinerary. Please try again.')
      setIsGenerating(false)
    }
  }

  return <AITravelItineraryForm onComplete={handleFormComplete} isLoading={isGenerating} />
}