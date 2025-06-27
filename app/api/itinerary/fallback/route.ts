import { NextRequest, NextResponse } from 'next/server'

// Simple fallback endpoint that always returns a basic itinerary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destination = 'Paris', startDate, endDate, travelers = { adults: 2, children: 0 } } = body
    
    // Calculate duration
    const start = new Date(startDate || new Date())
    const end = new Date(endDate || new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000))
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 7
    
    // Generate basic itinerary
    const days = []
    for (let i = 0; i < duration; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      
      days.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        title: i === 0 ? `Arrival in ${destination}` : i === duration - 1 ? 'Departure Day' : `Exploring ${destination}`,
        description: `Day ${i + 1} of your trip`,
        activities: [
          {
            id: `morning-${i}`,
            time: '09:00',
            title: 'Morning Activity',
            description: 'Explore local attractions',
            duration: '3 hours',
            location: destination,
            category: 'activity',
            price: 30,
            imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80'
          },
          {
            id: `lunch-${i}`,
            time: '12:30',
            title: 'Lunch',
            description: 'Local cuisine',
            duration: '1.5 hours',
            location: destination,
            category: 'dining',
            price: 25,
            imageUrl: 'https://images.unsplash.com/photo-1559818454-1b46997bfe30?w=800&q=80'
          },
          {
            id: `afternoon-${i}`,
            time: '14:30',
            title: 'Afternoon Activity',
            description: 'Cultural experience',
            duration: '3 hours',
            location: destination,
            category: 'activity',
            price: 40,
            imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80'
          }
        ],
        totalCost: 95
      })
    }
    
    const itinerary = {
      destination,
      duration,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      travelers,
      totalBudget: duration * 200 * (travelers.adults + travelers.children * 0.5),
      days,
      highlights: [`Explore ${destination}`, 'Local cuisine', 'Cultural experiences'],
      tips: ['Book accommodations in advance', 'Learn basic local phrases'],
      estimatedTotalCost: duration * 200 * (travelers.adults + travelers.children * 0.5),
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        interests: []
      }
    }
    
    return NextResponse.json({
      success: true,
      itinerary,
      cached: false,
      generationTime: 100,
      fallback: true
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate fallback itinerary'
    }, { status: 500 })
  }
}