"use client"

import type React from "react"
import { useState } from "react"
import { AITravelItineraryForm } from "@/components/ui/ai-travel-itinerary-form-v2"
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
        interests: data.interests || ['culture', 'food'], // Updated to use data.interests directly
        email: 'user@example.com', // You might want to get this from user context
        name: 'Traveler' // You might want to get this from user context
      }
      
      // Add transportation and accommodation preferences to interests
      if (data.transportation && data.transportation.length > 0) {
        tripFormData.interests = [...tripFormData.interests, ...data.transportation]
      }
      
      if (data.accommodation) {
        tripFormData.interests.push(`${data.accommodation}-accommodation`)
      }
      
      // Add special requests to interests if provided
      if (data.specialRequests) {
        tripFormData.interests.push(`special-request: ${data.specialRequests}`)
      }
      
      // Log what we're sending to the AI
      console.log('Sending to AI generation endpoint:', tripFormData)
      console.log('Original form data:', data)
      
      // Parse budget if provided (now handles budget range strings)
      if (data.budget) {
        // Budget options: budget ($50-150/day), moderate ($150-300/day), premium ($300-500/day), luxury ($500+/day)
        const budgetMap: { [key: string]: [number, number] } = {
          'budget': [50, 150],
          'moderate': [150, 300],
          'premium': [300, 500],
          'luxury': [500, 1000]
        }
        
        if (budgetMap[data.budget]) {
          // Multiply by number of days if dates are available
          const days = data.startDate && data.endDate ? 
            Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 7
          tripFormData.budget = [
            budgetMap[data.budget][0] * days,
            budgetMap[data.budget][1] * days
          ]
        }
      }
      
      toast.info('Generating your AI-powered itinerary...')
      
      // Call the AI generation endpoint
      const response = await fetch('/api/trips-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripFormData), // Send tripFormData directly, not wrapped
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
            perPerson: false // Total budget for the trip
          } : undefined,
          accommodation: data.accommodation,
          interests: data.interests || [], // Now directly using the interests array
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