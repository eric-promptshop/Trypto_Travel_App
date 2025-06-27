import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address, placeId } = await request.json();
    
    if (!address && !placeId) {
      return NextResponse.json(
        { error: 'Address or placeId is required' },
        { status: 400 }
      );
    }

    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${googleMapsApiKey}`;
    
    if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    } else if (placeId) {
      url += `&place_id=${placeId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding request failed', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to geocode address', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}