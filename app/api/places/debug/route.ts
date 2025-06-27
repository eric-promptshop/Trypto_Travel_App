import { NextResponse } from 'next/server'
import { googlePlacesService } from '@/lib/services/google-places'

export async function GET() {
  // Check all possible API key sources
  const apiKeyExists = !!(
    process.env.GOOGLE_PLACES_API_KEY || 
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  )
  const keySource = process.env.GOOGLE_PLACES_API_KEY ? 'GOOGLE_PLACES_API_KEY' : 
                    process.env.GOOGLE_MAPS_API_KEY ? 'GOOGLE_MAPS_API_KEY' :
                    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' : 
                    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? 'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY' :
                    'NONE'
  
  // List all env vars that contain GOOGLE (for debugging)
  const googleEnvVars = Object.keys(process.env)
    .filter(key => key.includes('GOOGLE'))
    .map(key => key)
  
  // Test a simple search
  let testResult = null
  let error = null
  
  try {
    const results = await googlePlacesService.searchPlaces({
      location: 'Paris, France',
      category: 'attractions',
      limit: 5
    })
    testResult = {
      success: true,
      count: results.length,
      firstResult: results[0] || null,
      allResults: results
    }
  } catch (e: any) {
    error = {
      message: e.message,
      stack: e.stack,
      name: e.name
    }
  }
  
  return NextResponse.json({
    apiKeyConfigured: apiKeyExists,
    keySource,
    availableGoogleEnvVars: googleEnvVars,
    testResult,
    error,
    timestamp: new Date().toISOString()
  })
}