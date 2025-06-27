import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ExtractedTourData } from '@/lib/services/tour-onboarding-service'

// Demo tours data
const DEMO_TOURS = [
  {
    id: 'demo-tour-1',
    name: 'Paris City Tour with Eiffel Tower',
    destination: 'Paris, France',
    duration: '8 hours',
    price: 120,
    currency: 'EUR',
    status: 'active' as const,
    views: 1234,
    bookings: 45,
    nextDeparture: '2025-02-15'
  },
  {
    id: 'demo-tour-2',
    name: 'Vatican Museums & Sistine Chapel Tour',
    destination: 'Vatican City, Rome',
    duration: '4 hours',
    price: 95,
    currency: 'EUR',
    status: 'active' as const,
    views: 890,
    bookings: 28,
    nextDeparture: '2025-02-10'
  },
  {
    id: 'demo-tour-3',
    name: 'London Royal Walking Tour',
    destination: 'London, UK',
    duration: '6 hours',
    price: 75,
    currency: 'GBP',
    status: 'active' as const,
    views: 567,
    bookings: 19,
    nextDeparture: null
  },
  {
    id: 'demo-tour-4',
    name: 'Tokyo Food & Culture Experience',
    destination: 'Tokyo, Japan',
    duration: '5 hours',
    price: 150,
    currency: 'USD',
    status: 'draft' as const,
    views: 234,
    bookings: 0,
    nextDeparture: null
  },
  {
    id: 'demo-tour-5',
    name: 'Barcelona Sagrada Familia & Park Güell Tour',
    destination: 'Barcelona, Spain',
    duration: '4.5 hours',
    price: 85,
    currency: 'EUR',
    status: 'active' as const,
    views: 1567,
    bookings: 62,
    nextDeparture: '2025-02-20'
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'AGENT' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = session.user?.tenantId || 'default'
    
    console.log('[Tours API] GET request:', {
      email: session.user?.email,
      role: session.user?.role,
      tenantId: tenantId
    })
    
    // Try to fetch tours from database
    let tours = []
    let useDemo = false
    
    try {
      // Fetch tours from content table for this tenant
      
      const dbTours = await prisma.content.findMany({
        where: {
          tenantId,
          type: 'activity'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      
      // If no tours found with current tenant, try 'default' tenant
      if (dbTours.length === 0 && tenantId !== 'default') {
        const defaultTours = await prisma.content.findMany({
          where: {
            tenantId: 'default',
            type: 'activity'
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        dbTours.push(...defaultTours)
      }
      
      // Transform content to tour format
      tours = dbTours.map(content => ({
        id: content.id,
        name: content.name,
        destination: content.location || 'Unknown',
        duration: content.duration ? `${Math.floor(content.duration / 60)} hours` : '1 day',
        price: content.price || 0,
        currency: content.currency || 'USD',
        status: content.active ? 'active' : 'draft' as const,
        views: Math.floor(Math.random() * 2000), // Random for demo
        bookings: Math.floor(Math.random() * 100), // Random for demo
        nextDeparture: null
      }))
    } catch (dbError) {
      console.error('Database error, using demo data:', dbError)
      useDemo = true
    }
    
    // Use demo data if database is not available or no tours found
    if (useDemo || tours.length === 0) {
      tours = DEMO_TOURS
    }
    
    return NextResponse.json({ tours })
    
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json(
      { message: 'Failed to fetch tours', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Create tour from extracted data
const createTourSchema = z.object({
  tourData: z.object({
    name: z.string(),
    destination: z.string(),
    duration: z.string(),
    description: z.string(),
    highlights: z.array(z.string()).optional(),
    inclusions: z.array(z.string()).optional(),
    exclusions: z.array(z.string()).optional(),
    price: z.object({
      amount: z.number(),
      currency: z.string()
    }).optional(),
    itinerary: z.array(z.object({
      day: z.number(),
      title: z.string(),
      description: z.string(),
      activities: z.array(z.string())
    })).optional(),
    categories: z.array(z.string()).optional(),
    difficulty: z.string().optional(),
    groupSize: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    languages: z.array(z.string()).optional(),
    startingPoint: z.string().optional(),
    endingPoint: z.string().optional(),
    accommodation: z.string().optional(),
    meals: z.string().optional(),
    transportation: z.string().optional()
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = createTourSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid tour data', errors: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { tourData } = validation.data
    const tenantId = session.user?.tenantId || 'default'
    
    
    // Calculate duration in minutes
    let durationMinutes = 480 // Default 8 hours
    const durationMatch = tourData.duration.match(/(\d+)\s*days?/i)
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1]) * 24 * 60
    }
    
    // Create tour in content table
    const tour = await prisma.content.create({
      data: {
        type: 'activity',
        name: tourData.name,
        description: tourData.description,
        location: tourData.destination,
        city: tourData.destination, // Extract city if needed
        country: '', // Extract country if needed
        price: tourData.price?.amount || 0,
        currency: tourData.price?.currency || 'USD',
        duration: durationMinutes,
        images: JSON.stringify([]), // Add default images or extract from description
        amenities: JSON.stringify(tourData.inclusions || []),
        highlights: JSON.stringify(tourData.highlights || []),
        included: JSON.stringify(tourData.inclusions || []),
        excluded: JSON.stringify(tourData.exclusions || []),
        metadata: JSON.stringify({
          itinerary: tourData.itinerary,
          categories: tourData.categories,
          difficulty: tourData.difficulty,
          groupSize: tourData.groupSize,
          languages: tourData.languages,
          startingPoint: tourData.startingPoint,
          endingPoint: tourData.endingPoint,
          accommodation: tourData.accommodation,
          meals: tourData.meals,
          transportation: tourData.transportation,
          createdBy: session.user.email,
          createdFrom: 'upload'
        }),
        tenantId,
        active: true,
        featured: false
      }
    })
    
    
    return NextResponse.json({
      tour: {
        id: tour.id,
        name: tour.name,
        destination: tour.location,
        duration: tourData.duration,
        price: tour.price,
        currency: tour.currency,
        status: tour.active ? 'active' : 'draft'
      }
    })
    
  } catch (error) {
    console.error('[Create Tour API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to create tour', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}