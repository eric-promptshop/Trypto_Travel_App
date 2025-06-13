import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api/response';
import { TripAdvisorScraper } from '@/lib/content-processing/scrapers/sites/TripAdvisorScraper';
import { GetYourGuideScraper } from '@/lib/content-processing/scrapers/sites/GetYourGuideScraper';
import { BookingComScraper } from '@/lib/content-processing/scrapers/sites/BookingComScraper';
import { TourOperatorScraper } from '@/lib/content-processing/scrapers/sites/TourOperatorScraper';
import { PeruForLessScraper } from '@/lib/content-processing/scrapers/sites/PeruForLessScraper';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { ScrapingResult } from '@/lib/content-processing/scrapers/base/ScraperConfig';
import type { Activity } from '@/lib/content-processing/scrapers/models/Activity';
import type { Accommodation } from '@/lib/content-processing/scrapers/models/Accommodation';

const scanRequestSchema = z.object({
  websiteUrl: z.string().url('Please provide a valid URL'),
  tenantId: z.string().optional().default('default'),
  scanDepth: z.number().min(1).max(50).optional().default(10), // Number of pages to scan
});

interface ProcessedTour {
  id: string;
  name: string;
  destination: string;
  duration: string;
  status: 'enabled' | 'disabled';
  description?: string;
  price?: number;
  currency?: string;
  metadata?: {
    images?: string[];
    highlights?: string[];
    included?: string[];
    excluded?: string[];
    sourceUrl: string;
    scannedAt: string;
    type: 'activity' | 'accommodation';
  };
}

// Determine which scraper to use based on URL
function getScraperForUrl(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('tripadvisor')) {
    return new TripAdvisorScraper();
  } else if (hostname.includes('booking.com')) {
    return new BookingComScraper();
  } else if (hostname.includes('getyourguide')) {
    return new GetYourGuideScraper();
  } else if (hostname.includes('peruforless')) {
    return new PeruForLessScraper();
  }
  
  // Default to TourOperatorScraper for general tour operator websites
  return new TourOperatorScraper();
}

// Convert scraped activities to tour format
function activityToTour(activity: Activity, sourceUrl: string): ProcessedTour {
  // Handle price conversion
  let price: number | undefined;
  if (typeof activity.price === 'number') {
    price = activity.price;
  } else if (typeof activity.price === 'string') {
    const priceMatch = activity.price.match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      price = parseFloat(priceMatch[0].replace(/,/g, ''));
    }
  }
  
  return {
    id: `activity-${activity.id || Date.now()}`,
    name: activity.title,
    destination: activity.location || 'Unknown',
    duration: activity.duration || 'Varies',
    status: 'enabled',
    description: activity.description,
    price: price,
    currency: activity.currency || 'USD',
    metadata: {
      images: activity.images || [],
      highlights: activity.highlights || [],
      included: activity.includes || [],
      excluded: activity.excludes || [],
      sourceUrl: activity.url || sourceUrl,
      scannedAt: new Date().toISOString(),
      type: 'activity',
    },
  };
}

// Convert scraped accommodations to tour format (for packages)
function accommodationToTour(accommodation: Accommodation, sourceUrl: string): ProcessedTour {
  return {
    id: `accommodation-${accommodation.id || Date.now()}`,
    name: `${accommodation.title} Package`,
    destination: accommodation.location || 'Unknown',
    duration: '3 nights', // Default package duration
    status: 'enabled',
    description: accommodation.description,
    price: typeof accommodation.price === 'number' ? accommodation.price : undefined,
    currency: accommodation.currency,
    metadata: {
      images: accommodation.images || [],
      highlights: accommodation.amenities || [], // Use amenities instead of highlights
      included: ['Accommodation', 'Daily breakfast'],
      excluded: ['Flights', 'Transfers'],
      sourceUrl,
      scannedAt: new Date().toISOString(),
      type: 'accommodation',
    },
  };
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  
  const validation = scanRequestSchema.safeParse(body);
  if (!validation.success) {
    return createErrorResponse(
      'Invalid request data',
      validation.error.format(),
      400
    );
  }
  
  const { websiteUrl, tenantId, scanDepth } = validation.data;
  
  // Initialize the appropriate scraper
  const scraper = getScraperForUrl(websiteUrl);
  
  try {
    console.log(`Starting website scan for ${websiteUrl} with depth ${scanDepth}`);
    
    // Generate URLs to scan
    const urlsToScan: string[] = [websiteUrl];
    
    // For tour operator websites, try to find additional pages to scan
    if (scraper instanceof TourOperatorScraper) {
      // Common tour listing page patterns
      const tourPagePatterns = [
        '/tours', '/trips', '/packages', '/destinations', '/adventures',
        '/our-tours', '/tour-packages', '/travel-packages', '/itineraries',
        '/experiences', '/journeys', '/expeditions', '/vacations',
        '/holiday-packages', '/tour-listing', '/all-tours', '/tour-catalog'
      ];
      
      const baseUrl = new URL(websiteUrl);
      
      // Add base patterns
      tourPagePatterns.forEach(pattern => {
        const potentialUrl = `${baseUrl.origin}${pattern}`;
        if (!urlsToScan.includes(potentialUrl)) {
          urlsToScan.push(potentialUrl);
        }
      });
      
      // Also try with common language variations
      const languages = ['en', 'es', 'fr'];
      languages.forEach(lang => {
        tourPagePatterns.slice(0, 5).forEach(pattern => {
          const potentialUrl = `${baseUrl.origin}/${lang}${pattern}`;
          if (!urlsToScan.includes(potentialUrl)) {
            urlsToScan.push(potentialUrl);
          }
        });
      });
    }
    
    const results: ScrapingResult<any>[] = [];
    const processedTours: ProcessedTour[] = [];
    
    // Scan multiple pages with progress tracking
    for (let i = 0; i < Math.min(urlsToScan.length, scanDepth); i++) {
      const url = urlsToScan[i];
      console.log(`Scanning page ${i + 1}/${urlsToScan.length}: ${url}`);
      
      try {
        const result = await scraper.scrapeUrl(url);
        console.log(`Scan result for ${url}:`, { 
          success: result.success, 
          dataLength: result.data?.length,
          firstItem: result.data?.[0]
        });
        
        if (result.success && result.data) {
          results.push(result);
          
          // Process based on scraper type
          if (scraper instanceof TripAdvisorScraper || scraper instanceof GetYourGuideScraper || scraper instanceof TourOperatorScraper) {
            // These return activities
            const activities = Array.isArray(result.data) ? result.data : [result.data];
            console.log(`Processing ${activities.length} activities from ${url}`);
            activities.forEach((activity: any) => {
              if (activity && activity.title) {
                const tour = activityToTour(activity as Activity, url);
                console.log(`Converted activity to tour:`, tour.name);
                processedTours.push(tour);
              }
            });
          } else if (scraper instanceof BookingComScraper) {
            // This returns accommodations
            const accommodations = Array.isArray(result.data) ? result.data : [result.data];
            accommodations.forEach((accommodation: any) => {
              if (accommodation && accommodation.title) {
                processedTours.push(accommodationToTour(accommodation as Accommodation, url));
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning ${url}:`, error);
        // Continue with other URLs
      }
    }
    
    // Clean up scraper resources
    await scraper.dispose();
    
    // Remove duplicate tours based on title and price
    const uniqueTours = processedTours.filter((tour, index, self) => 
      index === self.findIndex((t) => (
        t.name === tour.name && t.price === tour.price
      ))
    );
    
    console.log(`Filtered from ${processedTours.length} to ${uniqueTours.length} unique tours`);
    
    // Store the results in the database (if needed)
    if (uniqueTours.length > 0 && tenantId !== 'default') {
      // Save to TenantContent or Content table
      for (const tour of uniqueTours) {
        await prisma.content.create({
          data: {
            type: 'activity',
            name: tour.name,
            description: tour.description || '',
            location: tour.destination,
            price: tour.price,
            currency: tour.currency || 'USD',
            duration: parseInt(tour.duration) || 0,
            images: JSON.stringify(tour.metadata?.images || []),
            highlights: JSON.stringify(tour.metadata?.highlights || []),
            included: JSON.stringify(tour.metadata?.included || []),
            excluded: JSON.stringify(tour.metadata?.excluded || []),
            metadata: JSON.stringify(tour.metadata || {}),
            tenantId,
            active: true,
          },
        });
      }
    }
    
    // Calculate summary statistics
    const destinations = [...new Set(uniqueTours.map(t => t.destination))];
    const priceRange = uniqueTours.reduce(
      (acc, tour) => {
        if (tour.price) {
          return {
            min: Math.min(acc.min, tour.price),
            max: Math.max(acc.max, tour.price),
          };
        }
        return acc;
      },
      { min: Infinity, max: 0 }
    );
    
    return createSuccessResponse({
      tours: uniqueTours,
      summary: {
        totalFound: uniqueTours.length,
        destinations,
        priceRange: priceRange.min !== Infinity ? priceRange : null,
        websiteUrl,
        scanDate: new Date().toISOString(),
        scraperUsed: scraper.constructor.name,
      },
    });
  } catch (error) {
    console.error('Website scanning error:', error);
    
    // Ensure scraper is disposed on error
    try {
      await scraper.dispose();
    } catch (disposeError) {
      console.error('Error disposing scraper:', disposeError);
    }
    
    return createErrorResponse(
      'Failed to scan website',
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
});

// Progress endpoint for checking scan status (for future implementation with job queue)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('scanId');
  
  if (!scanId) {
    return createErrorResponse('Scan ID required', null, 400);
  }
  
  // In a production implementation, this would check job queue status
  // For now, return a mock response
  return createSuccessResponse({
    scanId,
    progress: 100,
    status: 'completed',
    message: 'Scan complete!',
  });
});