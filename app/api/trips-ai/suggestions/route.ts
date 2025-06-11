import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface TripSuggestion {
  title: string
  destination: string
  description: string
  duration: number
  bestTimeToGo: string
  estimatedBudget: string
  highlights: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { existingTrips, userPreferences } = body

    // Try to get AI suggestions
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
      }

      const travelHistory = existingTrips?.length > 0
        ? `User has visited: ${existingTrips.map((t: any) => t.destination).join(', ')}`
        : 'User has no travel history yet'

      const prompt = `Based on the user's travel profile, suggest 2-3 unique trip ideas:

${travelHistory}
Total trips taken: ${userPreferences?.totalTrips || 0}

Provide suggestions in JSON format:
{
  "suggestions": [
    {
      "title": "Catchy trip name",
      "destination": "City, Country",
      "description": "Brief compelling description",
      "duration": number (days),
      "bestTimeToGo": "Month range or season",
      "estimatedBudget": "$X,XXX-X,XXX per person",
      "highlights": ["highlight1", "highlight2", "highlight3"]
    }
  ]
}

Focus on:
1. Destinations they haven't visited yet
2. Variety in trip types (adventure, cultural, relaxation)
3. Different budget ranges
4. Seasonal considerations`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a travel expert who creates personalized trip suggestions based on user preferences and travel history. Suggest diverse, exciting destinations that match different travel styles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      const aiSuggestions = JSON.parse(responseText)

      return NextResponse.json({
        suggestions: aiSuggestions.suggestions || [],
        source: 'ai'
      })

    } catch (aiError) {
      console.error('AI suggestions error:', aiError)
      // Fall back to curated suggestions
      return generateCuratedSuggestions(existingTrips, userPreferences)
    }

  } catch (error) {
    console.error('Trip suggestions API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

function generateCuratedSuggestions(existingTrips: any[], userPreferences: any): NextResponse {
  const visitedDestinations = new Set(existingTrips?.map(t => t.destination.toLowerCase()) || [])
  
  const allSuggestions: TripSuggestion[] = [
    {
      title: 'Safari Adventure in Tanzania',
      destination: 'Serengeti & Zanzibar, Tanzania',
      description: 'Witness the Great Migration and relax on pristine beaches',
      duration: 10,
      bestTimeToGo: 'June to October',
      estimatedBudget: '$3,500-5,000',
      highlights: ['Wildlife safaris', 'Ngorongoro Crater', 'Beach relaxation']
    },
    {
      title: 'Northern Lights & Ice Hotels',
      destination: 'Lapland, Finland',
      description: 'Experience Arctic wonders and unique ice architecture',
      duration: 5,
      bestTimeToGo: 'December to March',
      estimatedBudget: '$2,000-3,000',
      highlights: ['Aurora viewing', 'Husky sledding', 'Ice hotel stay']
    },
    {
      title: 'Ancient Wonders of Peru',
      destination: 'Cusco & Machu Picchu, Peru',
      description: 'Trek to the lost city of the Incas through stunning landscapes',
      duration: 7,
      bestTimeToGo: 'May to September',
      estimatedBudget: '$1,500-2,500',
      highlights: ['Machu Picchu', 'Sacred Valley', 'Local cuisine']
    },
    {
      title: 'Island Hopping in Greece',
      destination: 'Santorini & Mykonos, Greece',
      description: 'Explore whitewashed villages and crystal-clear waters',
      duration: 8,
      bestTimeToGo: 'April to June, September to October',
      estimatedBudget: '$2,500-3,500',
      highlights: ['Sunset views', 'Beach clubs', 'Ancient ruins']
    },
    {
      title: 'Cultural Immersion in Morocco',
      destination: 'Marrakech & Fes, Morocco',
      description: 'Discover vibrant souks, stunning architecture, and Sahara adventures',
      duration: 7,
      bestTimeToGo: 'March to May, September to November',
      estimatedBudget: '$1,200-2,000',
      highlights: ['Medina exploration', 'Desert camping', 'Traditional riads']
    },
    {
      title: 'New Zealand Adventure',
      destination: 'North & South Islands, New Zealand',
      description: 'From fjords to glowworm caves, experience Middle Earth',
      duration: 14,
      bestTimeToGo: 'December to February',
      estimatedBudget: '$3,000-4,500',
      highlights: ['Milford Sound', 'Hobbiton', 'Adventure sports']
    }
  ]

  // Filter out already visited destinations
  const suggestions = allSuggestions
    .filter(s => !visitedDestinations.has(s.destination.toLowerCase()))
    .slice(0, 3)

  // If user has visited many places, add more exotic suggestions
  if (visitedDestinations.size > 5) {
    suggestions.push({
      title: 'Expedition to Antarctica',
      destination: 'Antarctic Peninsula',
      description: 'The ultimate adventure to the world\'s last frontier',
      duration: 12,
      bestTimeToGo: 'November to March',
      estimatedBudget: '$8,000-15,000',
      highlights: ['Penguin colonies', 'Glacier hiking', 'Whale watching']
    })
  }

  return NextResponse.json({
    suggestions: suggestions.slice(0, 3),
    source: 'curated'
  })
}