import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useItineraryState } from '@/lib/state/itinerary-state'

interface TourData {
  id: string
  name: string
  operatorName: string
  category?: string
  price?: number
  duration?: number
  location: {
    city: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
}

interface TrackingOptions {
  source: 'discovery_panel' | 'search_results' | 'recommendations' | 'direct_link'
  searchQuery?: string
  filters?: Record<string, any>
  position?: number
  minViewDuration?: number // Minimum time before tracking (ms)
}

export function useTourTracking() {
  const { data: session } = useSession()
  const { currentItinerary } = useItineraryState()
  const trackingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const viewStartTimes = useRef<Map<string, number>>(new Map())
  const trackedTours = useRef<Set<string>>(new Set())
  const sessionId = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Track when a tour comes into view
  const trackTourView = useCallback(async (
    tour: TourData,
    options: TrackingOptions
  ) => {
    const tourKey = `${tour.id}-${options.source}`
    
    // Don't track the same tour multiple times in the same session
    if (trackedTours.current.has(tourKey)) {
      return
    }

    // Record view start time
    viewStartTimes.current.set(tourKey, Date.now())

    // Set up delayed tracking (default 3 seconds)
    const minDuration = options.minViewDuration || 3000
    
    const timerId = setTimeout(async () => {
      try {
        // Check if tour is still in view (duration check)
        const startTime = viewStartTimes.current.get(tourKey)
        if (!startTime || Date.now() - startTime < minDuration) {
          return
        }

        // Track the view
        const response = await fetch('/api/tours/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId: tour.id,
            tourName: tour.name,
            operatorName: tour.operatorName,
            category: tour.category,
            price: tour.price,
            duration: tour.duration,
            location: tour.location,
            viewContext: {
              source: options.source,
              searchQuery: options.searchQuery,
              filters: options.filters,
              position: options.position,
              sessionId: sessionId.current
            },
            userContext: {
              isAuthenticated: !!session?.user,
              userId: session?.user?.id,
              destination: currentItinerary?.destination,
              travelDates: currentItinerary ? {
                startDate: currentItinerary.startDate,
                endDate: currentItinerary.endDate
              } : undefined,
              interests: currentItinerary?.metadata?.interests
            }
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          // Mark as tracked
          trackedTours.current.add(tourKey)
        }
      } catch (error) {
        // Failed to track tour view
      }
    }, minDuration)

    trackingTimers.current.set(tourKey, timerId)
  }, [session, currentItinerary])

  // Track when a tour goes out of view
  const trackTourExit = useCallback((tourId: string, source: string) => {
    const tourKey = `${tourId}-${source}`
    
    // Clear the tracking timer if it hasn't fired yet
    const timerId = trackingTimers.current.get(tourKey)
    if (timerId) {
      clearTimeout(timerId)
      trackingTimers.current.delete(tourKey)
    }

    // Clear the start time
    viewStartTimes.current.delete(tourKey)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timers
      trackingTimers.current.forEach(timer => clearTimeout(timer))
      trackingTimers.current.clear()
      viewStartTimes.current.clear()
    }
  }, [])

  // Track tour interaction (click, save, etc.)
  const trackTourInteraction = useCallback(async (
    tour: TourData,
    action: 'click' | 'save' | 'share' | 'add_to_itinerary',
    context?: any
  ) => {
    try {
      // This could be a separate endpoint for interaction tracking
      
      // If it's an "add_to_itinerary" action, ensure we track the view
      if (action === 'add_to_itinerary' && !trackedTours.current.has(`${tour.id}-interaction`)) {
        await trackTourView(tour, {
          source: 'discovery_panel',
          minViewDuration: 0 // Track immediately for interactions
        })
      }
    } catch (error) {
      console.error('Failed to track tour interaction:', error)
    }
  }, [trackTourView])

  return {
    trackTourView,
    trackTourExit,
    trackTourInteraction,
    sessionId: sessionId.current
  }
}

// Hook for tracking tours in a list/grid
export function useTourListTracking(
  tours: TourData[],
  source: TrackingOptions['source'],
  searchQuery?: string
) {
  const { trackTourView, trackTourExit } = useTourTracking()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const tourRefs = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    // Create intersection observer to track when tours come into view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const tourId = entry.target.getAttribute('data-tour-id')
          const position = entry.target.getAttribute('data-position')
          
          if (!tourId) return

          const tour = tours.find(t => t.id === tourId)
          if (!tour) return

          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Tour is at least 50% visible
            trackTourView(tour, {
              source,
              searchQuery,
              position: position ? parseInt(position) : undefined
            })
          } else {
            // Tour is no longer visible
            trackTourExit(tourId, source)
          }
        })
      },
      {
        threshold: [0, 0.5, 1.0], // Track at different visibility levels
        rootMargin: '0px'
      }
    )

    // Observe all tour elements
    tourRefs.current.forEach(element => {
      observerRef.current?.observe(element)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [tours, source, searchQuery, trackTourView, trackTourExit])

  // Register a tour element for tracking
  const registerTourRef = useCallback((tourId: string, element: HTMLElement | null) => {
    if (element) {
      tourRefs.current.set(tourId, element)
      observerRef.current?.observe(element)
    } else {
      const existingElement = tourRefs.current.get(tourId)
      if (existingElement) {
        observerRef.current?.unobserve(existingElement)
        tourRefs.current.delete(tourId)
      }
    }
  }, [])

  return {
    registerTourRef
  }
}