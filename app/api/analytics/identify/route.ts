import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
// import { prisma } from '@/lib/prisma' // TODO: Uncomment when analytics storage is enabled

interface UserProperties {
  userId: string
  email?: string
  plan?: 'free' | 'premium' | 'enterprise'
  signupDate?: string
  lastActiveDate?: string
  preferences?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const data: UserProperties = await request.json()

    // Validate required fields
    if (!data.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Only allow users to identify themselves or admins to identify anyone
    if (session?.user?.id !== data.userId && session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update user analytics profile
    const userProfile = {
      userId: data.userId,
      email: data.email,
      plan: data.plan || 'free',
      signupDate: data.signupDate ? new Date(data.signupDate) : new Date(),
      lastActiveDate: new Date(),
      preferences: data.preferences || {},
      lastIdentified: new Date()
    }

    // Store in database
    // TODO: Add userAnalytics model to Prisma schema when enabling analytics storage
    if (process.env.ENABLE_ANALYTICS_STORAGE === 'true') {
      // await prisma.userAnalytics.upsert({
      //   where: { userId: data.userId },
      //   update: {
      //     email: userProfile.email,
      //     plan: userProfile.plan,
      //     lastActiveDate: userProfile.lastActiveDate,
      //     preferences: userProfile.preferences,
      //     lastIdentified: userProfile.lastIdentified
      //   },
      //   create: {
      //     userId: userProfile.userId,
      //     email: userProfile.email,
      //     plan: userProfile.plan,
      //     signupDate: userProfile.signupDate,
      //     lastActiveDate: userProfile.lastActiveDate,
      //     preferences: userProfile.preferences,
      //     lastIdentified: userProfile.lastIdentified
      //   }
      // })
    }

    // Send to external analytics services
    await Promise.allSettled([
      identifyInMixpanel(userProfile),
      identifyInPostHog(userProfile),
      identifyInCustomAnalytics(userProfile)
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User identification error:', error)
    return NextResponse.json(
      { error: 'Failed to identify user' },
      { status: 500 }
    )
  }
}

async function identifyInMixpanel(user: any) {
  if (!process.env.MIXPANEL_TOKEN) return

  try {
    const mixpanelData = {
      $token: process.env.MIXPANEL_TOKEN,
      $distinct_id: user.userId,
      $set: {
        $email: user.email,
        $created: user.signupDate?.toISOString(),
        $last_seen: user.lastActiveDate.toISOString(),
        plan: user.plan,
        preferences: user.preferences
      }
    }

    await fetch('https://api.mixpanel.com/engage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mixpanelData)
    })
  } catch (error) {
    console.error('Mixpanel identification error:', error)
  }
}

async function identifyInPostHog(user: any) {
  if (!process.env.POSTHOG_API_KEY) return

  try {
    const postHogData = {
      api_key: process.env.POSTHOG_API_KEY,
      distinct_id: user.userId,
      properties: {
        email: user.email,
        plan: user.plan,
        signup_date: user.signupDate?.toISOString(),
        last_active: user.lastActiveDate.toISOString(),
        ...user.preferences
      }
    }

    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...postHogData,
        event: '$identify'
      })
    })
  } catch (error) {
    console.error('PostHog identification error:', error)
  }
}

async function identifyInCustomAnalytics(user: any) {
  if (!process.env.CUSTOM_ANALYTICS_ENDPOINT) return

  try {
    await fetch(`${process.env.CUSTOM_ANALYTICS_ENDPOINT}/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CUSTOM_ANALYTICS_TOKEN}`
      },
      body: JSON.stringify(user)
    })
  } catch (error) {
    console.error('Custom analytics identification error:', error)
  }
}