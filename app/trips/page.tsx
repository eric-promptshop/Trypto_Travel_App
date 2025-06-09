'use client'

import { useState } from 'react'
import { TripDashboard } from '@/components/trips/TripDashboard'
import { ConnectedItineraryViewer } from '@/components/itinerary/ConnectedItineraryViewer'
import { AIRequestFormEnhanced } from '@/components/ai-request-form-enhanced'
import { motion, AnimatePresence } from 'framer-motion'
import { type Trip } from '@/hooks/use-trips'

type ViewMode = 'dashboard' | 'create' | 'view' | 'edit'

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

export default function TripsPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState<FormData>({})

  const handleCreateTrip = () => {
    setCurrentView('create')
    setSelectedTrip(null)
    setFormData({})
  }

  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setCurrentView('view')
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    // Convert trip data to form data format
    setFormData({
      destinations: [trip.location],
      travelDates: {
        startDate: trip.startDate,
        endDate: trip.endDate,
        flexible: false
      },
      travelers: {
        adults: trip.participants?.length || 1,
        children: 0
      },
      specialRequirements: trip.description || '',
      tripId: trip.id,
      completeness: 100
    })
    setCurrentView('edit')
  }

  const handleFormComplete = (data: FormData) => {
    setFormData(data)
    if (currentView === 'create') {
      setCurrentView('view')
    } else if (currentView === 'edit') {
      setCurrentView('dashboard')
    }
  }

  const goBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedTrip(null)
    setFormData({})
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
      case 'edit':
        return (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <AIRequestFormEnhanced onComplete={handleFormComplete} />
          </motion.div>
        )

      case 'view':
        return (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <ConnectedItineraryViewer
              tripId={selectedTrip?.id || formData.tripId || null}
              formData={formData}
              onEdit={() => selectedTrip ? handleEditTrip(selectedTrip) : setCurrentView('edit')}
              onShare={() => console.log('Share trip')}
              onDownload={() => console.log('Download trip')}
            />
          </motion.div>
        )

      case 'dashboard':
      default:
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <TripDashboard
              onCreateTrip={handleCreateTrip}
              onEditTrip={handleEditTrip}
              onViewTrip={handleViewTrip}
            />
          </motion.div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Navigation breadcrumb */}
      {currentView !== 'dashboard' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <button
              onClick={goBackToDashboard}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Trips
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {renderCurrentView()}
      </AnimatePresence>
    </div>
  )
} 