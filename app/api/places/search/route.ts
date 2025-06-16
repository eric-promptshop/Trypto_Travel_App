import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces, searchByCategory } from '@/lib/services/places-search-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = searchParams.get('limit')
    
    // Build proximity from lat/lng if provided
    const proximity = lat && lng ? [parseFloat(lng), parseFloat(lat)] as [number, number] : undefined
    
    let results = []
    
    if (category && !query) {
      // Category-based search
      results = await searchByCategory(
        category,
        proximity,
        limit ? parseInt(limit) : 20
      )
    } else if (query) {
      // Text-based search
      results = await searchPlaces({
        query,
        categories: category ? [category] : undefined,
        proximity,
        limit: limit ? parseInt(limit) : 10
      })
    } else {
      return NextResponse.json(
        { error: 'Either query or category parameter is required' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ places: results })
  } catch (error) {
    console.error('Place search error:', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
}