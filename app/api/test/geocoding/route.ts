import { NextRequest, NextResponse } from 'next/server'
import { googlePlacesService } from '@/lib/services/google-places'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location } = body
    
    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 })
    }
    
    const result = await googlePlacesService.geocodeLocation(location)
    
    if (result) {
      return NextResponse.json({
        success: true,
        data: result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to geocode location'
      })
    }
  } catch (error) {
    console.error('Geocoding test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const hasApiKey = !!process.env.GOOGLE_PLACES_API_KEY
    const keyLength = process.env.GOOGLE_PLACES_API_KEY?.length || 0
    
    return NextResponse.json({
      status: 'ok',
      hasApiKey,
      keyLength,
      serviceAvailable: hasApiKey && keyLength > 0
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}