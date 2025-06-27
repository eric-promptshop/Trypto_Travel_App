import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {
      parseEndpoint: { status: 'pending', time: 0, error: null },
      generateEndpoint: { status: 'pending', time: 0, error: null },
      fallbackEndpoint: { status: 'pending', time: 0, error: null }
    }
  }
  
  // Test 1: Parse endpoint
  try {
    const startTime = Date.now()
    const parseResponse = await fetch(`${request.nextUrl.origin}/api/ai/parse-travel-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '7 days in Paris' })
    })
    
    results.tests.parseEndpoint.time = Date.now() - startTime
    
    if (parseResponse.ok) {
      const data = await parseResponse.json()
      results.tests.parseEndpoint.status = 'success'
      results.tests.parseEndpoint.data = data
    } else {
      results.tests.parseEndpoint.status = 'failed'
      results.tests.parseEndpoint.error = `HTTP ${parseResponse.status}`
    }
  } catch (error) {
    results.tests.parseEndpoint.status = 'error'
    results.tests.parseEndpoint.error = error instanceof Error ? error.message : 'Unknown error'
  }
  
  // Test 2: Generate endpoint (with minimal data)
  try {
    const startTime = Date.now()
    const generateResponse = await fetch(`${request.nextUrl.origin}/api/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Paris',
        dates: {
          startDate: '2025-08-01',
          endDate: '2025-08-03'
        },
        travelers: {
          adults: 2,
          children: 0
        }
      })
    })
    
    results.tests.generateEndpoint.time = Date.now() - startTime
    
    if (generateResponse.ok) {
      const data = await generateResponse.json()
      results.tests.generateEndpoint.status = 'success'
      results.tests.generateEndpoint.hasItinerary = !!data.itinerary
      results.tests.generateEndpoint.success = data.success
    } else {
      results.tests.generateEndpoint.status = 'failed'
      results.tests.generateEndpoint.error = `HTTP ${generateResponse.status}`
      try {
        const errorData = await generateResponse.json()
        results.tests.generateEndpoint.errorDetails = errorData
      } catch {}
    }
  } catch (error) {
    results.tests.generateEndpoint.status = 'error'
    results.tests.generateEndpoint.error = error instanceof Error ? error.message : 'Unknown error'
  }
  
  // Test 3: Fallback endpoint
  try {
    const startTime = Date.now()
    const fallbackResponse = await fetch(`${request.nextUrl.origin}/api/itinerary/fallback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Paris',
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        travelers: { adults: 2, children: 0 }
      })
    })
    
    results.tests.fallbackEndpoint.time = Date.now() - startTime
    
    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      results.tests.fallbackEndpoint.status = 'success'
      results.tests.fallbackEndpoint.hasItinerary = !!data.itinerary
      results.tests.fallbackEndpoint.success = data.success
    } else {
      results.tests.fallbackEndpoint.status = 'failed'
      results.tests.fallbackEndpoint.error = `HTTP ${fallbackResponse.status}`
    }
  } catch (error) {
    results.tests.fallbackEndpoint.status = 'error'
    results.tests.fallbackEndpoint.error = error instanceof Error ? error.message : 'Unknown error'
  }
  
  // Summary
  const allPassed = Object.values(results.tests).every(test => test.status === 'success')
  
  return NextResponse.json({
    ...results,
    summary: {
      allPassed,
      recommendation: allPassed 
        ? 'All endpoints working correctly' 
        : 'Some endpoints are failing - check individual test results'
    }
  })
}