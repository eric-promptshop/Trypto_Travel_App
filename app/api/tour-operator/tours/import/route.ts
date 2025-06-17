import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ScraperManager } from '@/lib/content-processing/scrapers/scraper-manager'
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
      // Use ScraperManager to extract content
      const scraperManager = new ScraperManager()
      const scrapedContent = await scraperManager.scrapeUrl(url)
      
      if (!scrapedContent || scrapedContent.results.length === 0) {
        throw new Error('No content could be extracted from the URL')
      }
      
      // Get the first result (main tour)
      const tourContent = scrapedContent.results[0]
      console.log('[Import Tour API] Scraped content:', tourContent)
      
      // Convert scraped content to tour format
      let tourData
      
      // Check if it's already in ExtractedTourData format
      if ('duration' in tourContent && 'highlights' in tourContent) {
        // Direct tour data format
        tourData = tourContent
      } else {
        // Convert from generic content format
        const description = tourContent.description || tourContent.overview || ''
        const textContent = `
          Title: ${tourContent.name || tourContent.title}
          Location: ${tourContent.location || ''}
          Price: ${tourContent.price || ''} ${tourContent.currency || ''}
          Description: ${description}
          ${tourContent.highlights ? 'Highlights: ' + tourContent.highlights.join(', ') : ''}
          ${tourContent.included ? 'Included: ' + tourContent.included.join(', ') : ''}
          ${tourContent.excluded ? 'Excluded: ' + tourContent.excluded.join(', ') : ''}
          ${tourContent.itinerary ? 'Itinerary: ' + JSON.stringify(tourContent.itinerary) : ''}
        `
        
        // Use AI to structure the data properly
        tourData = await TourOnboardingService.extractTourFromDocument(textContent)
      }
      
      // Validate and enhance the tour data
      const validatedData = TourOnboardingService.validateAndEnhanceTourData(tourData)
      
      // Calculate duration in minutes
      let durationMinutes = 480 // Default 8 hours
      if (validatedData.duration) {
        const durationMatch = validatedData.duration.match(/(\d+)\s*days?/i)
        if (durationMatch) {
          durationMinutes = parseInt(durationMatch[1]) * 24 * 60
        }
      }
      
      // Save to database
      const tour = await prisma.content.create({
        data: {
          type: 'activity',
          name: validatedData.name,
          description: validatedData.description,
          location: validatedData.destination,
          city: validatedData.destination,
          country: '',
          price: validatedData.price?.amount || tourContent.price || 0,
          currency: validatedData.price?.currency || tourContent.currency || 'USD',
          duration: durationMinutes,
          images: JSON.stringify(tourContent.images || []),
          amenities: JSON.stringify(validatedData.inclusions || []),
          highlights: JSON.stringify(validatedData.highlights || []),
          included: JSON.stringify(validatedData.inclusions || []),
          excluded: JSON.stringify(validatedData.exclusions || []),
          metadata: JSON.stringify({
            ...validatedData,
            sourceUrl: url,
            importedAt: new Date().toISOString(),
            createdBy: session.user.email,
            createdFrom: 'web-import'
          }),
          tenantId,
          active: true,
          featured: false
        }
      })
      
      console.log('[Import Tour API] Tour imported successfully:', tour.id)
      
      return NextResponse.json({
        tour: {
          id: tour.id,
          name: tour.name,
          destination: tour.location,
          price: tour.price,
          currency: tour.currency
        },
        message: 'Tour imported successfully'
      })
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