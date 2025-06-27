import { NextRequest, NextResponse } from 'next/server'
import { googlePlacesService } from '@/lib/services/google-places'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') || 'New York, NY'
  const testType = searchParams.get('type') || 'attractions'
  
  try {
    
    let results
    switch (testType) {
      case 'attractions':
        results = await googlePlacesService.findAttractions(location, 10)
        break
      case 'restaurants':
        results = await googlePlacesService.findRestaurants(location, 10)
        break
      case 'accommodation':
        results = await googlePlacesService.findAccommodation(location, 10)
        break
      case 'entertainment':
        results = await googlePlacesService.findEntertainment(location, 10)
        break
      case 'shopping':
        results = await googlePlacesService.findShopping(location, 10)
        break
      case 'culture':
        results = await googlePlacesService.findCulture(location, 10)
        break
      case 'tourism':
        results = await googlePlacesService.findTourismPlaces(location, 10)
        break
      default:
        // Test basic search
        results = await googlePlacesService.searchPlaces({
          location,
          limit: 5,
          category: 'all'
        })
        break
    }
    
    return NextResponse.json({
      success: true,
      location,
      testType,
      resultsCount: results.length,
      sampleResults: results.slice(0, 3),
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Google Places test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      location,
      testType,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Simple POST test for comprehensive testing
export async function POST(request: NextRequest) {
  try {
    const { location, interests } = await request.json()
    
    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 })
    }
    
    // Test multiple service methods
    const testResults: {
      attractions: any[]
      restaurants: any[]
      tourism: any[]
    } = {
      attractions: [],
      restaurants: [],
      tourism: []
    }
    
    try {
      testResults.attractions = await googlePlacesService.findAttractions(location, 5)
    } catch (e) {
    }
    
    try {
      testResults.restaurants = await googlePlacesService.findRestaurants(location, 5)
    } catch (e) {
    }
    
    try {
      testResults.tourism = await googlePlacesService.findTourismPlaces(location, 5)
    } catch (e) {
    }
    
    return NextResponse.json({
      success: true,
      location,
      interests: interests || [],
      results: {
        attractions: {
          count: testResults.attractions.length,
          sample: testResults.attractions.slice(0, 2)
        },
        restaurants: {
          count: testResults.restaurants.length,
          sample: testResults.restaurants.slice(0, 2)
        },
        tourism: {
          count: testResults.tourism.length,
          sample: testResults.tourism.slice(0, 2)
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Comprehensive test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 