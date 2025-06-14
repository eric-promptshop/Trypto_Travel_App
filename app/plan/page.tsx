'use client'

import { useState } from 'react'
import { AIRequestForm } from '@/components/ai-request-form'
import { ConnectedItineraryViewer } from '@/components/itinerary/ConnectedItineraryViewer'
import { motion } from 'framer-motion'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { SkeletonItinerary } from '@/components/ui/skeleton-itinerary'

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
  const { track } = useAnalytics()
  const [currentView, setCurrentView] = useState<'form' | 'itinerary' | 'generating'>('form')
  const [formData, setFormData] = useState<FormData>({})

  const handleFormComplete = (data: FormData) => {
    setFormData(data)
    setCurrentView('itinerary')
    track('trip_planning_form_complete', data)
  }

  return (
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
          <ConnectedItineraryViewer
            tripId={formData.tripId || null}
            formData={formData}
            onEdit={() => setCurrentView('form')}
          />
        </motion.div>
      )}
    </div>
  )
}