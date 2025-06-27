import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || 
    process.env.GOOGLE_MAPS_API_KEY || 
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  
  const keySource = process.env.GOOGLE_PLACES_API_KEY ? 'GOOGLE_PLACES_API_KEY' :
    process.env.GOOGLE_MAPS_API_KEY ? 'GOOGLE_MAPS_API_KEY' :
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' : 'NONE'
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key found' }, { status: 400 })
  }
  
  // Mask the API key for security (show only first 8 chars)
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
  
  try {
    // Direct Google Places API call
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+in+Paris&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return NextResponse.json({
      api_key_source: keySource,
      api_key_masked: maskedKey,
      status: data.status,
      results_count: data.results?.length || 0,
      first_result: data.results?.[0] || null,
      error_message: data.error_message,
      headers_sent: {
        url: url.replace(apiKey, maskedKey)
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}