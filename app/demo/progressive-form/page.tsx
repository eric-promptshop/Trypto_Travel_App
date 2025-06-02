"use client"

import { ProgressiveForm, TravelFormData } from '@/components/travel-forms'

export default function ProgressiveFormDemo() {
  const handleFormSubmit = (data: TravelFormData) => {
    console.log('Form submitted:', data)
    alert('Form submitted successfully! Check console for data.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trypto AI Trip Builder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let's create your perfect travel itinerary with our intelligent questionnaire.
            We'll guide you through each step to build a personalized trip experience.
          </p>
        </div>
        
        <ProgressiveForm
          onSubmit={handleFormSubmit}
          defaultValues={{
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
            primaryDestination: ''
          }}
          className="bg-white shadow-2xl rounded-xl"
        />
      </div>
    </div>
  )
} 