import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces, searchByCategory } from '@/lib/services/places-search-service'

export async function GET(request: NextRequest) {
  console.log('[API /places/search] Request received')
  console.log('[API /places/search] Headers:', Object.fromEntries(request.headers.entries()))
  console.log('[API /places/search] URL:', request.url)
  
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = searchParams.get('limit')
    
    console.log('[API /places/search] Params:', { query, category, lat, lng, limit })
    console.log('[API /places/search] Mapbox token check:', {
      exists: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      length: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.length || 0
    })
    
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
    
    console.log('[API /places/search] Returning results:', results.length, 'places')
    return NextResponse.json({ places: results })
  } catch (error) {
    console.error('[API /places/search] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
}