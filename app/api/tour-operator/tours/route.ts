import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ExtractedTourData } from '@/lib/services/tour-onboarding-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'AGENT' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = session.user?.tenantId || 'default'
    
    console.log('Tour API - Session:', {
      email: session.user?.email,
      role: session.user?.role,
      tenantId: tenantId
    })
    
    // Fetch tours from content table for this tenant
    console.log('Fetching tours with tenantId:', tenantId)
    
    // First check what content exists
    const allContent = await prisma.content.findMany({
      where: {
        tenantId
      }
    })
    console.log('All content for tenant:', allContent.length, 'items')
    console.log('Content types:', [...new Set(allContent.map(c => c.type))])
    
    const tours = await prisma.content.findMany({
      where: {
        tenantId,
        type: 'activity'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('Tours found:', tours.length)
    
    // If no tours found with current tenant, try 'default' tenant
    if (tours.length === 0 && tenantId !== 'default') {
      console.log('No tours found for tenant, trying default tenant...')
      const defaultTours = await prisma.content.findMany({
        where: {
          tenantId: 'default',
          type: 'activity'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      console.log('Default tenant tours found:', defaultTours.length)
      tours.push(...defaultTours)
    }
    
    // Transform content to tour format
    const formattedTours = tours.map(content => ({
      id: content.id,
      name: content.name,
      destination: content.location || 'Unknown',
      duration: `${content.duration || 1} days`,
      price: content.price || 0,
      currency: content.currency || 'USD',
      status: content.active ? 'active' : 'draft',
      views: 0, // TODO: Implement view tracking
      bookings: 0, // TODO: Implement booking tracking
      nextDeparture: null
    }))
    
    return NextResponse.json({ tours: formattedTours })
    
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
    
    console.log('[Create Tour API] Creating tour:', tourData.name, 'for tenant:', tenantId)
    
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
    
    console.log('[Create Tour API] Tour created successfully:', tour.id)
    
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