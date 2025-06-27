import { NextResponse } from 'next/server'

export async function GET() {
  // Check all possible API key sources
  const keys = {
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  }
  
  // Find which key is available
  let activeKey = null
  let activeKeyName = null
  
  for (const [name, value] of Object.entries(keys)) {
    if (value && value !== '' && !value.includes('your-')) {
      activeKey = value
      activeKeyName = name
      break
    }
  }
  
  if (!activeKey) {
    return NextResponse.json({
      error: 'No valid API key found',
      keys_checked: Object.keys(keys),
      hint: 'Make sure your .env.local file contains an actual API key, not placeholder text like "your-google-maps-api-key"'
    })
  }
  
  // Test the key with a simple API call
  try {
    const testUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Eiffel%20Tower&inputtype=textquery&fields=name,place_id&key=${activeKey}`
    
    const response = await fetch(testUrl)
    const data = await response.json()
    
    return NextResponse.json({
      key_source: activeKeyName,
      key_format: activeKey.startsWith('AIza') ? 'Valid Google API key format' : 'Invalid format - Google keys start with AIza',
      key_length: activeKey.length,
      test_status: data.status,
      test_result: data,
      recommendation: data.status === 'OK' ? 
        'API key is working!' : 
        `API returned ${data.status}. ${data.error_message || 'Check Google Cloud Console for API enablement and restrictions.'}`
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test API key',
      details: error.message
    })
  }
}