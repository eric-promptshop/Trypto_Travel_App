"use client"

import { useEffect, useState } from 'react'
import { EnhancedItineraryViewer } from './EnhancedItineraryViewer'
import { type Itinerary as UIItinerary } from './ModernItineraryViewer'
import { useItinerary, type Itinerary as APIItinerary } from '@/hooks/use-itinerary'
import { useTrip } from '@/hooks/use-trips'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConnectedItineraryViewerProps {
  tripId: string | null
  formData?: any // Fallback form data if no trip ID
  onEdit?: () => void
  onShare?: () => void
  onDownload?: () => void
}

// Convert API itinerary to UI itinerary format
function convertAPIToUIItinerary(apiItinerary: APIItinerary, tripData?: any): UIItinerary {
  return {
    id: apiItinerary.id,
    title: apiItinerary.title,
    destination: apiItinerary.destination,
    startDate: apiItinerary.startDate,
    endDate: apiItinerary.endDate,
    totalDays: apiItinerary.totalDays,
    travelers: apiItinerary.travelers,
    totalBudget: apiItinerary.totalBudget || 0,
    spentBudget: apiItinerary.spentBudget || 0,
    description: apiItinerary.description || '',
    coverImage: apiItinerary.coverImage || '',
    status: apiItinerary.status,
    lastUpdated: apiItinerary.lastUpdated,
    days: apiItinerary.days.map(day => {
      return {
        date: day.date,
        title: `Day ${day.day}`,
        totalCost: day.totalCost || 0,
        highlights: day.highlights || [],
        activities: [
        ...day.activities.map(activity => ({
          id: activity.id,
          time: activity.time,
          title: activity.title,
          description: activity.description || '',
          location: activity.location,
          type: activity.type === 'accommodation' ? 'accommodation' :
                activity.type === 'transportation' ? 'transport' :
                activity.type === 'activity' ? 'activity' : 'activity' as any,
          duration: activity.duration,
          cost: activity.cost,
          ...(activity.rating !== undefined && { rating: activity.rating }),
          ...(activity.image && { image: activity.image }),
          ...(activity.tips && { tips: activity.tips }),
          ...(activity.bookingRequired !== undefined && { bookingRequired: activity.bookingRequired }),
          ...(activity.contactInfo && { contactInfo: activity.contactInfo })
        })),
        ...day.accommodations.map(activity => ({
          id: activity.id,
          time: activity.time,
          title: activity.title,
          description: activity.description || '',
          location: activity.location,
          type: 'accommodation' as any,
          duration: activity.duration,
          cost: activity.cost,
          ...(activity.rating !== undefined && { rating: activity.rating }),
          ...(activity.image && { image: activity.image }),
          ...(activity.tips && { tips: activity.tips }),
          ...(activity.bookingRequired !== undefined && { bookingRequired: activity.bookingRequired }),
          ...(activity.contactInfo && { contactInfo: activity.contactInfo })
        })),
        ...day.transportation.map(activity => ({
          id: activity.id,
          time: activity.time,
          title: activity.title,
          description: activity.description || '',
          location: activity.location,
          type: 'transport' as any,
          duration: activity.duration,
          cost: activity.cost,
          ...(activity.rating !== undefined && { rating: activity.rating }),
          ...(activity.image && { image: activity.image }),
          ...(activity.tips && { tips: activity.tips }),
          ...(activity.bookingRequired !== undefined && { bookingRequired: activity.bookingRequired }),
          ...(activity.contactInfo && { contactInfo: activity.contactInfo })
        }))
      ].sort((a, b) => a.time.localeCompare(b.time))
      }
    })
  }
}

// Create a mock itinerary from form data when no real itinerary exists
function createMockItineraryFromFormData(formData: any): UIItinerary {
  const startDate = formData.travelDates?.startDate || new Date().toISOString()
  const endDate = formData.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const destination = formData.destinations?.[0] || 'Unknown Destination'
  const travelers = (formData.travelers?.adults || 1) + (formData.travelers?.children || 0)
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const days: UIItinerary['days'] = Array.from({ length: totalDays }, (_, index) => {
    const dayDate = new Date(start)
    dayDate.setDate(dayDate.getDate() + index)
    const dateString: string = dayDate.toISOString().split('T')[0]!
    
    return {
      date: dateString,
      title: index === 0 ? `Arrival in ${destination}` : 
             index === totalDays - 1 ? `Departure from ${destination}` : 
             `Explore ${destination}`,
      totalCost: 150,
      highlights: ['Placeholder Activity', 'Sightseeing', 'Local Cuisine'],
      activities: [
        {
          id: `${index}-1`,
          time: '09:00',
          title: 'Morning Activity',
          description: 'Explore the local area and get oriented with your surroundings',
          location: destination,
          type: 'activity' as any,
          duration: '2 hours',
          cost: 50,
          rating: 4.5
        },
        {
          id: `${index}-2`,
          time: '14:00',
          title: 'Afternoon Experience',
          description: 'Discover local culture and attractions',
          location: destination,
          type: 'activity' as any,
          duration: '3 hours',
          cost: 75,
          rating: 4.7
        },
        {
          id: `${index}-3`,
          time: '19:00',
          title: 'Evening Dining',
          description: 'Enjoy local cuisine at a recommended restaurant',
          location: destination,
          type: 'dining' as any,
          duration: '1.5 hours',
          cost: 25,
          rating: 4.3
        }
      ]
    }
  })

  return {
    id: 'mock-itinerary',
    title: `Trip to ${destination}`,
    destination,
    startDate,
    endDate,
    totalDays,
    travelers,
    totalBudget: formData.budget?.amount || 2000,
    spentBudget: totalDays * 150,
    description: formData.specialRequirements || `A wonderful trip to ${destination}`,
    coverImage: '',
    status: 'draft',
    lastUpdated: new Date().toISOString(),
    days
  }
}

export function ConnectedItineraryViewer({
  tripId,
  formData,
  onEdit,
  onShare,
  onDownload
}: ConnectedItineraryViewerProps) {
  const [uiItinerary, setUIItinerary] = useState<UIItinerary | null>(null)
  
  // Use the backend hooks if we have a tripId
  const { trip, loading: tripLoading, error: tripError, refresh: refreshTrip } = useTrip(tripId)
  const { 
    itinerary, 
    loading: itineraryLoading, 
    error: itineraryError, 
    refresh: refreshItinerary,
    exportItinerary,
    shareItinerary
  } = useItinerary(tripId)

  const loading = tripLoading || itineraryLoading
  const error = tripError || itineraryError

  // Convert API data to UI format when available
  useEffect(() => {
    if (itinerary) {
      setUIItinerary(convertAPIToUIItinerary(itinerary, trip))
    } else if (formData && !loading && !tripId) {
      // Use mock data if no real itinerary and we have form data
      setUIItinerary(createMockItineraryFromFormData(formData))
    }
  }, [itinerary, trip, formData, loading, tripId])

  // Enhanced action handlers
  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
    }
  }

  const handleShare = async () => {
    if (tripId && shareItinerary) {
      try {
        const shareResult = await shareItinerary({ isPublic: true, expiresIn: 30 })
        if (shareResult?.shareUrl) {
          // Copy to clipboard
          await navigator.clipboard.writeText(shareResult.shareUrl)
        }
      } catch (error) {
        console.error('Failed to share itinerary:', error)
      }
    } else if (onShare) {
      onShare()
    } else {
    }
  }

  const handleDownload = async () => {
    if (tripId && exportItinerary) {
      try {
        await exportItinerary('pdf')
      } catch (error) {
        console.error('Failed to download PDF:', error)
      }
    } else if (onDownload) {
      onDownload()
    } else {
    }
  }

  const handleRetry = () => {
    if (tripId) {
      refreshTrip()
      refreshItinerary()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Main content skeleton */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  <Skeleton className="h-24 w-full" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="w-16 h-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !uiItinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-xl p-8 border border-gray-200 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Itinerary
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'There was a problem loading your trip itinerary. Please try again.'}
          </p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {formData && (
              <Button 
                variant="outline" 
                onClick={() => setUIItinerary(createMockItineraryFromFormData(formData))}
                className="w-full"
              >
                Continue with Sample Itinerary
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show warning if using mock data
  const showMockWarning = !tripId && formData && uiItinerary?.id === 'mock-itinerary'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {showMockWarning && (
        <div className="bg-amber-50 border-b border-amber-200 p-4">
          <div className="container mx-auto max-w-7xl">
            <Alert className="border-amber-200 bg-transparent">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This is a sample itinerary based on your preferences. Save your trip to get personalized recommendations and real booking options.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      
      {uiItinerary && (
        <EnhancedItineraryViewer
          tripId={tripId || 'temp-' + Date.now()}
          itinerary={uiItinerary}
          onEdit={handleEdit}
          onShare={handleShare}
          onDownload={handleDownload}
          onSave={async (updates) => {
            // Handle save functionality
            if (tripId && refreshItinerary) {
              await refreshItinerary()
            }
          }}
        />
      )}
    </div>
  )
} 