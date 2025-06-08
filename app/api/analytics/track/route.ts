import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const data: AnalyticsEvent = await request.json()

    // Validate required fields
    if (!data.event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      )
    }

    // Get user ID from session or request data
    const userId = session?.user?.id || data.userId
    
    // Get IP address for geolocation
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Create analytics event record
    const analyticsEvent = {
      event: data.event,
      properties: data.properties || {},
      userId: userId || null,
      sessionId: session?.user?.id ? `session_${session.user.id}` : 'anonymous',
      timestamp: new Date(data.timestamp || Date.now()),
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
      url: data.properties?.url || ''
    }

    // Store in database (optional - for long-term analytics)
    if (process.env.ENABLE_ANALYTICS_STORAGE === 'true') {
      await prisma.analyticsEvent.create({
        data: {
          event: analyticsEvent.event,
          properties: analyticsEvent.properties,
          userId: analyticsEvent.userId,
          sessionId: analyticsEvent.sessionId,
          timestamp: analyticsEvent.timestamp,
          metadata: {
            ipAddress: analyticsEvent.ipAddress,
            userAgent: analyticsEvent.userAgent,
            referrer: analyticsEvent.referrer,
            url: analyticsEvent.url
          }
        }
      })
    }

    // Send to external analytics services
    await Promise.allSettled([
      sendToMixpanel(analyticsEvent),
      sendToPostHog(analyticsEvent),
      sendToCustomAnalytics(analyticsEvent)
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

async function sendToMixpanel(event: any) {
  if (!process.env.MIXPANEL_TOKEN) return

  try {
    const mixpanelData = {
      event: event.event,
      properties: {
        ...event.properties,
        distinct_id: event.userId || event.sessionId,
        time: Math.floor(event.timestamp.getTime() / 1000),
        $ip: event.ipAddress,
        $user_agent: event.userAgent,
        $referrer: event.referrer
      }
    }

    await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.MIXPANEL_TOKEN + ':').toString('base64')}`
      },
      body: JSON.stringify([mixpanelData])
    })
  } catch (error) {
    console.error('Mixpanel tracking error:', error)
  }
}

async function sendToPostHog(event: any) {
  if (!process.env.POSTHOG_API_KEY) return

  try {
    const postHogData = {
      api_key: process.env.POSTHOG_API_KEY,
      event: event.event,
      properties: event.properties,
      distinct_id: event.userId || event.sessionId,
      timestamp: event.timestamp.toISOString()
    }

    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postHogData)
    })
  } catch (error) {
    console.error('PostHog tracking error:', error)
  }
}

async function sendToCustomAnalytics(event: any) {
  // Send to custom analytics service if configured
  if (!process.env.CUSTOM_ANALYTICS_ENDPOINT) return

  try {
    await fetch(process.env.CUSTOM_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CUSTOM_ANALYTICS_TOKEN}`
      },
      body: JSON.stringify(event)
    })
  } catch (error) {
    console.error('Custom analytics tracking error:', error)
  }
}