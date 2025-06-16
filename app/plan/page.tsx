'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AIRequestForm } from '@/components/ai-request-form'
import { motion } from 'framer-motion'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { SkeletonItinerary } from '@/components/ui/skeleton-itinerary'
import { toast } from 'sonner'
import { ItineraryUIProvider } from '@/components/itinerary/ItineraryUIContext'

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

export default function PlanTripPage() {
  const router = useRouter()
  const { track } = useAnalytics()
  const [currentView, setCurrentView] = useState<'form' | 'itinerary' | 'generating'>('form')
  const [formData, setFormData] = useState<FormData>({})
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null)

  const handleFormComplete = async (data: FormData & { generatedItinerary?: any }) => {
    console.log('Form completed with data:', data)
    setFormData(data)
    
    // Use the generated itinerary from the form data
    if (data.generatedItinerary) {
      console.log('Using generated itinerary from form data:', data.generatedItinerary)
      setGeneratedItinerary(data.generatedItinerary)
    } else {
      // Fallback: Check localStorage
      const storedItinerary = localStorage.getItem('lastGeneratedItinerary')
      if (storedItinerary) {
        try {
          const parsed = JSON.parse(storedItinerary)
          console.log('Found stored itinerary:', parsed)
          setGeneratedItinerary(parsed)
          localStorage.removeItem('lastGeneratedItinerary') // Clean up
        } catch (e) {
          console.error('Failed to parse stored itinerary:', e)
        }
      }
    }
    
    setCurrentView('itinerary')
    track('trip_planning_form_complete', data)
  }

  return (
    <ItineraryUIProvider>
      <div className="min-h-screen">
        {currentView === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AIRequestForm 
              onComplete={handleFormComplete} 
              onGenerating={() => setCurrentView('generating')}
            />
          </motion.div>
        )}

        {currentView === 'generating' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SkeletonItinerary />
          </motion.div>
        )}

        {currentView === 'itinerary' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Store itinerary and redirect to new plan page */}
            {(() => {
              if (generatedItinerary) {
                localStorage.setItem('lastGeneratedItinerary', JSON.stringify(generatedItinerary))
                const tripId = formData.tripId || `temp-${Date.now()}`
                router.push(`/plan/${tripId}`)
              }
              return null
            })()}
          </motion.div>
        )}
      </div>
    </ItineraryUIProvider>
  )
}