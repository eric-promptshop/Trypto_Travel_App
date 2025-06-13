import { NextRequest, NextResponse } from 'next/server'
import { GeocodingService } from '@/lib/services/geocoding-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results = await GeocodingService.searchLocations(query)

    return NextResponse.json({ 
      results,
      query,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Location search error:', error)
    return NextResponse.json(
      { error: 'Failed to search locations', results: [] },
      { status: 500 }
    )
  }
}