import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { recommendationEngine } from '@/lib/services/recommendation-engine'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'

const recommendationRequestSchema = z.object({
  destination: z.string().optional(),
  interests: z.array(z.string()).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  maxDistance: z.number().optional().default(10), // km
  limit: z.number().optional().default(20)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = recommendationRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.')
        }))
      )
    }
    
    const { destination, interests, coordinates, maxDistance, limit } = validation.data
    
    // For now, skip the recommendation engine and fetch tours directly
    // The recommendation engine needs proper context initialization
    
    // Otherwise, fetch tours from database
    const tours = await prisma.tour.findMany({
      where: {
        status: 'published',
        ...(destination ? {
          OR: [
            { destination: { contains: destination, mode: 'insensitive' } },
            { city: { contains: destination, mode: 'insensitive' } }
          ]
        } : {}),
        ...(interests && interests.length > 0 ? {
          categories: {
            hasSome: interests
          }
        } : {})
      },
      take: limit,
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ],
      include: {
        operator: {
          select: {
            businessName: true,
            slug: true
          }
        }
      }
    })
    
    // Format tours for response
    const formattedTours = tours.map(tour => ({
      id: tour.id,
      name: tour.name,
      description: tour.description,
      destination: tour.destination,
      city: tour.city,
      country: tour.country,
      coordinates: tour.coordinates as { lat: number; lng: number } | null,
      googlePlaceId: tour.googlePlaceId,
      price: tour.price,
      currency: tour.currency,
      duration: tour.duration,
      durationType: tour.durationType,
      categories: tour.categories,
      rating: tour.rating || 0,
      reviewCount: tour.reviewCount || 0,
      images: tour.images as string[],
      operatorName: tour.operator.businessName,
      operatorSlug: tour.operator.slug,
      featured: tour.featured,
      distance: 0, // Would need to calculate if user coords provided
      score: tour.rating || 0, // Simple scoring based on rating
      matchReasons: interests?.filter(i => tour.categories.includes(i)) || []
    }))
    
    return createSuccessResponse({
      tours: formattedTours,
      totalCount: formattedTours.length,
      filters: {
        destination,
        interests,
        maxDistance
      }
    })
    
  } catch (error) {
    console.error('Tour recommendations error:', error)
    return createErrorResponse(
      'Failed to fetch tour recommendations',
      500
    )
  }
}