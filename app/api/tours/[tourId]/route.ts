import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const tourId = params.tourId
    
    // Fetch tour from database
    const dbTour = await prisma.content.findFirst({
      where: {
        id: tourId,
        type: 'activity',
        active: true
      }
    })
    
    if (!dbTour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      )
    }
    
    // Parse JSON fields
    const metadata = dbTour.metadata ? JSON.parse(dbTour.metadata) : {}
    const images = dbTour.images ? JSON.parse(dbTour.images) : []
    const included = dbTour.included ? JSON.parse(dbTour.included) : []
    const excluded = dbTour.excluded ? JSON.parse(dbTour.excluded) : []
    const highlights = dbTour.highlights ? JSON.parse(dbTour.highlights) : []
    
    // Transform to detailed tour format
    const tour = {
      id: dbTour.id,
      name: dbTour.name,
      description: dbTour.description,
      destination: `${dbTour.city || dbTour.location}, ${dbTour.country || ''}`.trim(),
      city: dbTour.city || dbTour.location,
      country: dbTour.country || '',
      coordinates: dbTour.coordinates || metadata.coordinates,
      price: dbTour.price || 0,
      currency: dbTour.currency || 'USD',
      duration: dbTour.duration ? Math.floor(dbTour.duration / 60) : 4,
      images: images.length > 0 ? images : [
        `https://source.unsplash.com/800x600/?${dbTour.location},tourism`,
        `https://source.unsplash.com/800x600/?${dbTour.location},landmark`,
        `https://source.unsplash.com/800x600/?${dbTour.location},culture`,
        `https://source.unsplash.com/800x600/?${dbTour.location},food`
      ],
      rating: metadata.rating || 4.5,
      reviews: metadata.reviewCount || Math.floor(Math.random() * 300) + 50,
      operatorName: metadata.operatorName || 'Verified Tour Operator',
      operatorId: metadata.operatorId,
      featured: dbTour.featured || false,
      instantBooking: metadata.instantBooking || true,
      category: determineTourCategory(dbTour.name, dbTour.description),
      included: included.length > 0 ? included : [
        'Professional guide',
        'All entrance fees',
        'Tour insurance',
        'Small group experience'
      ],
      excluded: excluded.length > 0 ? excluded : [
        'Hotel pickup and drop-off',
        'Food and drinks',
        'Gratuities',
        'Personal expenses'
      ],
      highlights: highlights.length > 0 ? highlights : [
        'Expert local guide',
        'Skip-the-line access',
        'Small group size',
        'Hidden gems',
        'Photo opportunities'
      ],
      languages: metadata.languages || ['English'],
      groupSize: metadata.groupSize || { min: 2, max: 15 },
      startingPoint: metadata.startingPoint || metadata.meetingPoint || 'Central meeting point',
      endingPoint: metadata.endingPoint || 'Tour ends at central location',
      cancellationPolicy: metadata.cancellationPolicy || 'Free cancellation up to 24 hours before the tour',
      itinerary: metadata.itinerary || generateSampleItinerary(dbTour.name, dbTour.duration)
    }
    
    return NextResponse.json({ tour })
    
  } catch (error) {
    console.error('Error fetching tour details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour details' },
      { status: 500 }
    )
  }
}

function determineTourCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  
  if (text.includes('food') || text.includes('culinary') || text.includes('wine')) return 'food'
  if (text.includes('culture') || text.includes('history') || text.includes('museum')) return 'cultural'
  if (text.includes('adventure') || text.includes('hiking') || text.includes('extreme')) return 'adventure'
  if (text.includes('nature') || text.includes('wildlife') || text.includes('park')) return 'nature'
  if (text.includes('city') || text.includes('urban') || text.includes('walking')) return 'city'
  if (text.includes('water') || text.includes('beach') || text.includes('diving')) return 'water'
  
  return 'general'
}

function generateSampleItinerary(tourName: string, durationMinutes?: number | null): any[] {
  const duration = durationMinutes ? Math.floor(durationMinutes / 60) : 4
  const itinerary = []
  
  // Generate time slots based on duration
  const startHour = 9 // Default start at 9 AM
  const hourInterval = Math.max(1, Math.floor(duration / 4))
  
  itinerary.push({
    time: `${startHour}:00 AM`,
    title: 'Meet & Greet',
    description: 'Meet your guide at the designated starting point'
  })
  
  if (duration >= 2) {
    itinerary.push({
      time: `${startHour + hourInterval}:00 AM`,
      title: 'First Major Stop',
      description: 'Visit the main attraction with expert commentary'
    })
  }
  
  if (duration >= 4) {
    itinerary.push({
      time: `${startHour + hourInterval * 2}:00 ${startHour + hourInterval * 2 >= 12 ? 'PM' : 'AM'}`,
      title: 'Cultural Experience',
      description: 'Immerse yourself in local culture and traditions'
    })
  }
  
  if (duration >= 6) {
    itinerary.push({
      time: `${(startHour + hourInterval * 3) % 12 || 12}:00 PM`,
      title: 'Lunch Break',
      description: 'Enjoy local cuisine at a recommended restaurant'
    })
  }
  
  itinerary.push({
    time: `${(startHour + duration) % 12 || 12}:00 ${startHour + duration >= 12 ? 'PM' : 'AM'}`,
    title: 'Tour Conclusion',
    description: 'Tour ends with final photo opportunities'
  })
  
  return itinerary
}