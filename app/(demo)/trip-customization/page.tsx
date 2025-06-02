"use client"

import * as React from "react"
import { TripModificationForm, type TripModificationData } from "@/components/trip-customization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Save, Download, Share2 } from "lucide-react"
import { addDays } from "date-fns"
import { enqueueOfflineAction, processOfflineQueue, OfflineAction } from '../../../lib/state/offline-action-queue'
import { useNetworkCondition } from '../../../components/images/network-detection'
import { useEffect } from 'react'

export default function TripCustomizationDemo() {
  const [tripData, setTripData] = React.useState<TripModificationData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error' | 'queued'>('idle')

  // Example initial data
  const exampleTripData: Partial<TripModificationData> = {
    primaryDestination: 'Paris',
    additionalDestinations: ['London'],
    startDate: addDays(new Date(), 14), // 2 weeks from now
    endDate: addDays(new Date(), 21), // 3 weeks from now
    duration: 7,
    travelers: {
      adults: 2,
      children: 0,
      infants: 0
    },
    flexibility: {
      datesFlexible: true,
      destinationsFlexible: false,
      durationFlexible: true
    }
  }

  const handleTripDataChange = (data: TripModificationData) => {
    setTripData(data)
  }

  const handleSaveTrip = async (data: TripModificationData) => {
    setSaveStatus('saving')
    setIsLoading(true)

    const { isOnline } = useNetworkCondition()
    if (!isOnline) {
      enqueueOfflineAction({ type: 'saveTrip', payload: data })
      setSaveStatus('queued')
      setTimeout(() => setSaveStatus('idle'), 3000)
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In a real app, you would save to your backend here
      console.log('Saving trip data:', data)
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save trip:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Process offline queue when back online
  useEffect(() => {
    const { isOnline } = useNetworkCondition()
    if (!isOnline) return
    processOfflineQueue(async (action: OfflineAction) => {
      if (action.type === 'saveTrip') {
        await handleSaveTrip(action.payload)
      }
    })
  }, [useNetworkCondition])

  const handleLoadExample = () => {
    // This would trigger the form to populate with example data
    setTripData(exampleTripData as TripModificationData)
  }

  const handleReset = () => {
    setTripData(null)
    setSaveStatus('idle')
  }

  const generateItinerary = async () => {
    if (!tripData) return
    
    setIsLoading(true)
    try {
      // Simulate itinerary generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would call your itinerary generation API
      console.log('Generating itinerary for:', tripData)
      
      // Navigate to results page or show generated itinerary
      alert('Itinerary generated successfully! (This is a demo)')
    } catch (error) {
      console.error('Failed to generate itinerary:', error)
      alert('Failed to generate itinerary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Trip Customization Interface</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience our interactive trip modification system. Customize destinations, dates, and traveler details 
            with real-time validation and smart suggestions.
          </p>
          
          {/* Demo Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" onClick={handleLoadExample}>
              Load Example Trip
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Form
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Modification Form */}
          <div className="lg:col-span-2">
            <TripModificationForm
              initialData={tripData ? tripData : exampleTripData}
              onChange={handleTripDataChange}
              onSave={handleSaveTrip}
              disabled={isLoading}
              showPreview={true}
            />
          </div>

          {/* Sidebar - Trip Summary & Actions */}
          <div className="space-y-6">
            {/* Current Trip Data Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Summary</CardTitle>
                <CardDescription>
                  Current trip configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tripData ? (
                  <>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Destinations</div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="default">{tripData.primaryDestination || 'Not set'}</Badge>
                        {tripData.additionalDestinations.map((dest, index) => (
                          <Badge key={index} variant="secondary">{dest}</Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Duration</div>
                        <div className="text-muted-foreground">{tripData.duration} days</div>
                      </div>
                      <div>
                        <div className="font-medium">Travelers</div>
                        <div className="text-muted-foreground">
                          {tripData.travelers.adults + tripData.travelers.children + tripData.travelers.infants} total
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Flexibility Options</div>
                      <div className="space-y-1">
                        {tripData.flexibility.datesFlexible && (
                          <Badge variant="outline" className="text-xs">Flexible Dates</Badge>
                        )}
                        {tripData.flexibility.destinationsFlexible && (
                          <Badge variant="outline" className="text-xs">Open to Suggestions</Badge>
                        )}
                        {tripData.flexibility.durationFlexible && (
                          <Badge variant="outline" className="text-xs">Flexible Duration</Badge>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No trip data yet. Start customizing your trip!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {tripData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                  <CardDescription>
                    Generate and manage your itinerary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={generateItinerary} 
                    className="w-full"
                    disabled={isLoading || !tripData.primaryDestination || !tripData.startDate}
                  >
                    {isLoading ? 'Generating...' : 'Generate Itinerary'}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled={isLoading}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Draft
                    </Button>
                    <Button variant="outline" size="sm" disabled={isLoading}>
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Status */}
            {saveStatus !== 'idle' && (
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-center py-4 rounded-lg ${
                    saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
                    saveStatus === 'saved' ? 'bg-green-50 text-green-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {saveStatus === 'saving' && 'Saving your trip...'}
                    {saveStatus === 'saved' && 'Trip saved successfully!'}
                    {saveStatus === 'error' && 'Failed to save trip. Please try again.'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features Demo Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Demo Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Voice-enabled destination search</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time date validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Dynamic duration calculator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Traveler count management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span>Flexibility preferences</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            This demo showcases the core UI components for trip modification. 
            In a production environment, this would integrate with the backend itinerary generation engine.
          </p>
          <p className="text-xs text-muted-foreground">
            Task 5.1: Create Core UI Components for Trip Modification - ✅ Implemented
          </p>
        </div>
      </div>
    </div>
  )
} 