import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { replicateService } from '@/lib/services/replicate-service'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import { googlePlacesService } from '@/lib/services/google-places'

const batchImportSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
  autoPublish: z.boolean().default(false),
})

interface ImportResult {
  url: string
  success: boolean
  tourId?: string
  tourName?: string
  error?: string
}

async function handleBatchImport(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = batchImportSchema.safeParse(body)
    
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.')
        }))
      )
    }
    
    const { urls, autoPublish } = validation.data
    const operatorId = session.user?.operatorId
    
    if (!operatorId && session.user?.role !== 'ADMIN') {
      return createErrorResponse(
        'No operator account associated with user',
        undefined,
        400
      )
    }
    
    
    // Process URLs in parallel (with concurrency limit)
    const BATCH_SIZE = 3
    const results: ImportResult[] = []
    
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(url => importSingleTour(url, operatorId || 'default', autoPublish))
      )
      results.push(...batchResults)
    }
    
    // Calculate summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    // Log import activity
    if (operatorId) {
      await prisma.auditLog.create({
        data: {
          action: 'batch_import_tours',
          resource: 'tours',
          resourceId: operatorId,
          tenantId: session.user?.tenantId || 'default',
          userId: session.user.id,
          metadata: {
            totalUrls: urls.length,
            successful,
            failed,
            autoPublish
          }
        }
      })
    }
    
    return createSuccessResponse({
      summary: {
        total: urls.length,
        successful,
        failed
      },
      results
    })
    
  } catch (error) {
    console.error('[Batch Import] Error:', error)
    return createErrorResponse(
      'Failed to process batch import',
      error instanceof Error ? { message: error.message } : undefined,
      500
    )
  }
}

// Apply rate limiting to POST endpoint
export const POST = withRateLimit({
  ...rateLimitConfigs.expensive,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // 2 batch imports per 10 minutes
  message: 'Too many batch import requests. Please wait before trying again.',
  keyGenerator: (req) => {
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      return `auth:${authHeader}`
    }
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }
})(handleBatchImport)

async function importSingleTour(
  url: string,
  operatorId: string,
  autoPublish: boolean
): Promise<ImportResult> {
  try {
    
    // Extract tour data using AI
    let tourData: any
    
    // Try Supabase Edge Function first
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { data, error } = await supabase.functions.invoke('ai-tour-scraper', {
        body: { url, operatorId }
      })
      
      if (!error && data?.tourData) {
        tourData = data.tourData
      }
    }
    
    // Fallback to direct extraction
    if (!tourData) {
      const response = await fetch(url)
      const html = await response.text()
      tourData = await replicateService.extractTourFromWebpage(html, url)
    }
    
    // Generate unique slug
    const baseSlug = tourData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    while (await prisma.tour.findFirst({ where: { slug, operatorId } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    // Geocode the tour location to get coordinates and Google Place ID
    let coordinates = null
    let googlePlaceId = null
    
    if (tourData.destination || tourData.city) {
      const locationString = tourData.startingPoint || 
                            `${tourData.destination || ''}, ${tourData.city || ''}, ${tourData.country || ''}`.trim()
      
      
      const geocodeResult = await googlePlacesService.geocodeLocation(locationString)
      
      if (geocodeResult) {
        googlePlaceId = geocodeResult.placeId
        coordinates = {
          lat: geocodeResult.coordinates.lat,
          lng: geocodeResult.coordinates.lng
        }
        
        // Update city and country if not already set
        if (!tourData.city && geocodeResult.city) {
          tourData.city = geocodeResult.city
        }
        if (!tourData.country && geocodeResult.country) {
          tourData.country = geocodeResult.country
        }
        
      } else {
      }
    }
    
    // Calculate duration in minutes
    let durationMinutes = 480 // Default 8 hours
    const durationMatch = tourData.duration?.match(/(\d+)\s*(hour|day)/i)
    if (durationMatch) {
      const value = parseInt(durationMatch[1])
      const unit = durationMatch[2].toLowerCase()
      durationMinutes = unit === 'day' ? value * 24 * 60 : value * 60
    }
    
    // Create tour in database
    const tour = await prisma.tour.create({
      data: {
        operatorId,
        name: tourData.name,
        slug,
        description: tourData.description || '',
        shortDescription: tourData.shortDescription,
        destination: tourData.destination || 'Unknown',
        city: tourData.city,
        country: tourData.country,
        coordinates: coordinates,
        duration: durationMinutes,
        durationType: durationMinutes >= 1440 ? 'days' : 'hours',
        price: tourData.price?.amount || 0,
        currency: tourData.price?.currency || 'USD',
        priceType: tourData.price?.perPerson ? 'per_person' : 'total',
        categories: tourData.categories || ['General'],
        difficulty: tourData.difficulty,
        languages: tourData.languages || ['English'],
        images: {
          main: tourData.images?.[0] || '/placeholder.jpg',
          gallery: tourData.images?.slice(1) || []
        },
        highlights: tourData.highlights || [],
        included: tourData.included || [],
        excluded: tourData.excluded || [],
        itinerary: tourData.itinerary,
        startingPoint: tourData.startingPoint,
        endingPoint: tourData.endingPoint,
        groupSize: tourData.groupSize,
        status: autoPublish ? 'active' : 'draft',
        publishedAt: autoPublish ? new Date() : null,
        sourceUrl: url,
        lastScrapedAt: new Date(),
        metadata: {
          importedAt: new Date(),
          importMethod: 'batch_ai_scrape',
          googlePlaceId: googlePlaceId,
          extractionData: tourData
        }
      }
    })
    
    return {
      url,
      success: true,
      tourId: tour.id,
      tourName: tour.name
    }
    
  } catch (error) {
    console.error(`[Batch Import] Failed to import ${url}:`, error)
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// GET endpoint to check batch import status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const operatorId = session.user?.operatorId
    
    if (!operatorId && session.user?.role !== 'ADMIN') {
      return createErrorResponse(
        'No operator account associated with user',
        undefined,
        400
      )
    }
    
    // Get recent imports
    const recentImports = await prisma.tour.findMany({
      where: {
        operatorId: operatorId || undefined,
        metadata: {
          path: ['importMethod'],
          equals: 'batch_ai_scrape'
        }
      },
      select: {
        id: true,
        name: true,
        destination: true,
        sourceUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    
    return createSuccessResponse({
      recentImports,
      capabilities: {
        maxUrlsPerBatch: 10,
        aiPowered: !!process.env.REPLICATE_API_TOKEN,
        supportedSites: [
          'GetYourGuide',
          'Viator',
          'TripAdvisor',
          'Custom tour operator sites'
        ]
      }
    })
    
  } catch (error) {
    console.error('[Batch Import Status] Error:', error)
    return createErrorResponse(
      'Failed to fetch import status',
      error instanceof Error ? { message: error.message } : undefined,
      500
    )
  }
}