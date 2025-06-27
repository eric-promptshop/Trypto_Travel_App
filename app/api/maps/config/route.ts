import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Return configuration for Google Maps
    // This allows us to inject the API key server-side
    return NextResponse.json({
      apiKey: googleMapsApiKey,
      libraries: ['places', 'geometry', 'drawing'],
      region: 'US',
      language: 'en'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get maps configuration' },
      { status: 500 }
    );
  }
}