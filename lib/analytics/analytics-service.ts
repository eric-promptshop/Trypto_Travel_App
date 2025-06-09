export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: string
}

export interface UserProperties {
  userId: string
  email?: string
  plan?: 'free' | 'premium' | 'enterprise'
  signupDate?: string
  lastActiveDate?: string
  preferences?: Record<string, any>
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private isInitialized = false
  private queue: AnalyticsEvent[] = []

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  initialize(config: { apiKey?: string; userId?: string }) {
    if (this.isInitialized) return

    // Initialize analytics providers
    this.initializeGoogleAnalytics()
    this.initializeMixpanel(config.apiKey)
    this.initializePostHog()

    this.isInitialized = true

    // Process queued events
    this.queue.forEach(event => this.track(event.event, event.properties, event.userId))
    this.queue = []
  }

  private initializeGoogleAnalytics() {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
      script.async = true
      document.head.appendChild(script)

      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }
      gtag('js', new Date())
      gtag('config', process.env.NEXT_PUBLIC_GA_ID)
    }
  }

  private initializeMixpanel(apiKey?: string) {
    if (typeof window !== 'undefined' && (apiKey || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN)) {
      // Mixpanel initialization would go here
      console.log('Mixpanel initialized')
    }
  }

  private initializePostHog() {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      // PostHog initialization would go here
      console.log('PostHog initialized')
    }
  }

  track(event: string, properties?: Record<string, any>, userId?: string) {
    if (!this.isInitialized) {
      const analyticsEvent: AnalyticsEvent = { 
        event, 
        timestamp: new Date().toISOString() 
      }
      if (properties !== undefined) {
        analyticsEvent.properties = properties
      }
      if (userId !== undefined) {
        analyticsEvent.userId = userId
      }
      this.queue.push(analyticsEvent)
      return
    }

    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      }
    }
    
    if (userId !== undefined) {
      eventData.userId = userId
    }

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, properties)
    }

    // Send to custom analytics endpoint
    this.sendToCustomEndpoint(eventData)

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventData)
    }
  }

  private async sendToCustomEndpoint(eventData: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  identify(userId: string, properties?: UserProperties) {
    if (!this.isInitialized) return

    const userData = {
      userId,
      ...properties,
      lastIdentified: new Date().toISOString()
    }

    // Send to analytics providers
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        user_id: userId
      })
    }

    // Send to custom endpoint
    this.sendUserData(userData)
  }

  private async sendUserData(userData: UserProperties) {
    try {
      await fetch('/api/analytics/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
    } catch (error) {
      console.error('Failed to send user data:', error)
    }
  }

  page(pageName: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page: pageName,
      ...properties
    })
  }

  // Business-specific tracking methods
  trackItineraryGeneration(data: {
    destination: string
    duration: number
    budget?: number
    travelers: number
    interests: string[]
  }) {
    this.track('itinerary_generated', {
      destination: data.destination,
      duration: data.duration,
      budget_range: data.budget ? this.getBudgetRange(data.budget) : undefined,
      travelers: data.travelers,
      interests: data.interests,
      interest_count: data.interests.length
    })
  }

  trackItineraryCustomization(action: string, details?: Record<string, any>) {
    this.track('itinerary_customized', {
      action,
      ...details
    })
  }

  trackBookingIntent(data: {
    type: 'accommodation' | 'activity' | 'transportation'
    provider?: string
    cost?: number
  }) {
    this.track('booking_intent', data)
  }

  trackUserEngagement(action: string, duration?: number) {
    this.track('user_engagement', {
      action,
      duration_seconds: duration
    })
  }

  trackError(error: string, context?: Record<string, any>) {
    this.track('error_occurred', {
      error_message: error,
      error_context: context,
      timestamp: new Date().toISOString()
    })
  }

  private getBudgetRange(budget: number): string {
    if (budget < 500) return 'budget'
    if (budget < 1500) return 'mid_range'
    if (budget < 3000) return 'premium'
    return 'luxury'
  }
}

// Global analytics instance
export const analytics = AnalyticsService.getInstance()

// React hook for analytics
export function useAnalytics() {
  // Add comprehensive logging
  if (typeof window !== 'undefined') {
    console.log('[useAnalytics] Hook called, React status:', {
      hasReact: typeof (window as any).React !== 'undefined',
      analyticsInstance: !!analytics,
      timestamp: new Date().toISOString()
    })
  }
  
  return {
    track: (event: string, properties?: Record<string, any>) => {
      console.log('[useAnalytics] Track called:', { event, properties })
      try {
        analytics.track(event, properties)
      } catch (error) {
        console.error('[useAnalytics] Track error:', error)
      }
    },
    identify: analytics.identify.bind(analytics),
    page: analytics.page.bind(analytics),
    trackItineraryGeneration: analytics.trackItineraryGeneration.bind(analytics),
    trackItineraryCustomization: analytics.trackItineraryCustomization.bind(analytics),
    trackBookingIntent: analytics.trackBookingIntent.bind(analytics),
    trackUserEngagement: analytics.trackUserEngagement.bind(analytics),
    trackError: analytics.trackError.bind(analytics)
  }
}

// Declare global types for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}