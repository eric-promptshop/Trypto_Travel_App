import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TourOnboardingService } from '@/lib/services/tour-onboarding-service'

// Schema for URL import
const importSchema = z.object({
  url: z.string().url()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = importSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      )
    }
    
    const { url } = validation.data
    const tenantId = session.user?.tenantId || 'default'
    
    console.log('[Import Tour API] Importing from URL:', url)
    
    try {
      // Directly use simple fetch instead of scraper
      throw new Error('Using simple fetch approach')
    } catch (scraperError) {
      console.error('[Import Tour API] Scraping error:', scraperError)
      
      // Fallback to simple fetch if scraper fails
      console.log('[Import Tour API] Falling back to simple fetch...')
      
      try {
        const response = await fetch(url)
        const html = await response.text()
        
        // Extract basic info from HTML
        const titleMatch = html.match(/<title>(.*?)<\/title>/i)
        const title = titleMatch ? titleMatch[1] : 'Imported Tour'
        
        // Use AI to extract tour data from HTML
        const tourData = await TourOnboardingService.extractTourFromDocument(html.substring(0, 10000)) // Limit HTML size
        const validatedData = TourOnboardingService.validateAndEnhanceTourData(tourData)
        
        // Save to database
        const tour = await prisma.content.create({
          data: {
            type: 'activity',
            name: validatedData.name || title,
            description: validatedData.description || 'Imported tour',
            location: validatedData.destination || 'Unknown',
            city: validatedData.destination || 'Unknown',
            country: '',
            price: validatedData.price?.amount || 0,
            currency: validatedData.price?.currency || 'USD',
            duration: 480, // Default 8 hours
            images: JSON.stringify([]),
            amenities: JSON.stringify(validatedData.inclusions || []),
            highlights: JSON.stringify(validatedData.highlights || []),
            included: JSON.stringify(validatedData.inclusions || []),
            excluded: JSON.stringify(validatedData.exclusions || []),
            metadata: JSON.stringify({
              ...validatedData,
              sourceUrl: url,
              importedAt: new Date().toISOString(),
              createdBy: session.user.email,
              createdFrom: 'web-import-fallback'
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
            price: tour.price,
            currency: tour.currency
          },
          message: 'Tour imported successfully (basic extraction)'
        })
      } catch (fallbackError) {
        console.error('[Import Tour API] Fallback error:', fallbackError)
        throw new Error('Failed to import tour from URL')
      }
    }
  } catch (error) {
    console.error('[Import Tour API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import tour' },
      { status: 500 }
    )
  }
}