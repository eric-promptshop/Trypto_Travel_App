import { NextRequest, NextResponse } from 'next/server'
import { googlePlacesService } from '@/lib/services/google-places'

export async function GET(request: NextRequest) {
  
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = searchParams.get('limit')
    
    // Use the singleton Google Places service instance
    const placesService = googlePlacesService
    
    let results = []
    
    // Build location bias if lat/lng provided
    const locationBias = lat && lng ? {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    } : undefined
    
    if (category) {
      // Category-based search - use query as location if provided
      const searchLocation = query || (locationBias ? `${locationBias.lat},${locationBias.lng}` : 'New York')
      
      // Map frontend categories to service categories
      const categoryMap: Record<string, string> = {
        'restaurants': 'restaurants',
        'cafe-bakery': 'restaurants',
        'bars-nightlife': 'entertainment',
        'art-museums': 'culture',
        'hotels': 'accommodation',
        'attractions': 'attractions',
        'shopping': 'shopping',
        'beauty-fashion': 'shopping',
        'transport': 'all'
      }
      
      // Search by category with location
      const places = await placesService.searchPlaces({
        location: searchLocation,
        category: categoryMap[category] || 'all',
        limit: limit ? parseInt(limit) : 20
      })
      
      // Convert to POI format
      results = places.map(place => ({
        id: place.id,
        name: place.name,
        description: place.description,
        location: {
          lat: place.location.coordinates.latitude,
          lng: place.location.coordinates.longitude,
          address: place.location.address
        },
        category: category,
        subcategories: place.categories || [],
        rating: place.rating,
        reviews: place.reviewCount,
        price: place.priceLevel ? '$'.repeat(place.priceLevel) : undefined,
        hours: place.isOpen !== undefined ? (place.isOpen ? 'Open now' : 'Closed') : undefined,
        images: place.imageUrl ? [place.imageUrl] : [],
        website: place.website,
        phone: place.phone,
        tips: place.tips || []
      }))
    } else if (query) {
      // Text-based search
      const places = await placesService.searchPlaces({
        location: query,
        category: 'all',
        limit: limit ? parseInt(limit) : 20
      })
      
      // Convert to POI format (the service should handle this internally)
      results = places.map(place => ({
        id: place.id,
        name: place.name,
        description: place.description,
        location: {
          lat: place.location.coordinates.latitude,
          lng: place.location.coordinates.longitude,
          address: place.location.address
        },
        category: place.category,
        subcategories: place.categories || [],
        rating: place.rating,
        reviews: place.reviewCount,
        price: place.priceLevel ? '$'.repeat(place.priceLevel) : undefined,
        hours: place.isOpen !== undefined ? (place.isOpen ? 'Open now' : 'Closed') : undefined,
        images: place.imageUrl ? [place.imageUrl] : [],
        website: place.website,
        phone: place.phone,
        tips: place.tips || []
      }))
    } else {
      return NextResponse.json(
        { error: 'Either query or category parameter is required' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ places: results })
  } catch (error) {
    console.error('[API /places/search] Error:', error)
    console.error('[API /places/search] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to search places',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}