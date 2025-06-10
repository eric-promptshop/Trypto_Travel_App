import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, withErrorHandling } from '@/lib/api/response';

// Demo endpoint to show scraping capabilities without actually scraping
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || 'https://www.example-tours.com';
  
  // Return demo data showing what the scraper would extract
  const demoData = {
    websiteUrl: url,
    scraperCapabilities: {
      'TripAdvisor': {
        supported: true,
        dataExtracted: [
          'Activity name and description',
          'Pricing information',
          'Duration and schedule',
          'Location details',
          'Reviews and ratings',
          'Images',
          'Inclusions/exclusions',
          'Availability',
        ],
      },
      'Booking.com': {
        supported: true,
        dataExtracted: [
          'Hotel/accommodation name',
          'Room types and amenities',
          'Pricing per night',
          'Location and address',
          'Star rating',
          'Guest reviews',
          'Images',
          'Policies',
        ],
      },
      'GetYourGuide': {
        supported: true,
        dataExtracted: [
          'Tour/activity name',
          'Detailed description',
          'Pricing and group sizes',
          'Duration',
          'Meeting points',
          'What\'s included',
          'Cancellation policy',
          'Images',
        ],
      },
      'Generic Website': {
        supported: true,
        dataExtracted: [
          'Tour titles from headings',
          'Descriptions from content',
          'Prices if formatted consistently',
          'Images with tours',
          'Basic itinerary information',
        ],
      },
    },
    sampleExtractedTour: {
      name: 'Machu Picchu Classic Trek',
      destination: 'Peru',
      duration: '4 Days',
      price: 650,
      currency: 'USD',
      description: 'Experience the legendary Inca Trail on this 4-day trek to Machu Picchu...',
      highlights: [
        'Professional bilingual guide',
        'Porters to carry camping equipment',
        'All meals during the trek',
        'Entrance to Machu Picchu',
      ],
      images: [
        'https://example.com/machu-picchu-1.jpg',
        'https://example.com/inca-trail-2.jpg',
      ],
    },
    rateLimits: {
      TripAdvisor: '20 requests/minute',
      BookingCom: '15 requests/minute',
      GetYourGuide: '18 requests/minute',
    },
    features: [
      'Headless browser for JavaScript-rendered content',
      'Intelligent rate limiting to avoid blocking',
      'User agent rotation',
      'Proxy support for IP rotation',
      'Automatic retry with exponential backoff',
      'Resource blocking for faster scraping',
      'Structured data extraction',
    ],
  };
  
  return createSuccessResponse(demoData);
});