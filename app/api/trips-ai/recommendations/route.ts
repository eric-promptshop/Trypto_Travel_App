import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination, tripDates, participants, selectedActivities, preferences } = body

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      )
    }

    // Try to get AI recommendations
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
      }

      // Build context from selected activities
      const activityContext = selectedActivities?.length > 0
        ? `User has selected: ${selectedActivities.map((a: any) => `${a.name} (${a.category})`).join(', ')}`
        : 'User has not selected any activities yet'

      const prompt = `Based on the following trip details, recommend 2-3 complementary activities:

Destination: ${destination}
Trip dates: ${new Date(tripDates.startDate).toLocaleDateString()} to ${new Date(tripDates.endDate).toLocaleDateString()}
Travelers: ${participants.adults} adults, ${participants.children} children
${activityContext}
${preferences?.categories?.length > 0 ? `Preferred categories: ${preferences.categories.join(', ')}` : ''}

Provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "name": "Activity name",
      "category": "cultural|culinary|adventure|nature|entertainment",
      "reason": "Why this activity complements their selections",
      "matchScore": 0.0-1.0,
      "estimatedDuration": "hours",
      "estimatedPrice": { "adult": number, "child": number, "currency": "EUR" }
    }
  ]
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a travel recommendation expert. Provide activity recommendations that complement the user\'s existing selections and preferences. Focus on variety and creating a well-rounded itinerary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      const aiRecommendations = JSON.parse(responseText)

      // Transform AI recommendations to match frontend format
      const formattedRecommendations = aiRecommendations.recommendations?.map((rec: any, index: number) => ({
        activity: {
          id: `ai-${Date.now()}-${index}`,
          name: rec.name,
          description: rec.description || 'Recommended activity based on your preferences',
          category: rec.category || 'cultural',
          imageUrl: '/api/placeholder/400/250',
          imageUrls: ['/api/placeholder/400/250'],
          location: {
            address: 'Various locations',
            city: destination,
            coordinates: [0, 0]
          },
          duration: {
            min: (rec.estimatedDuration || 2) * 60 - 30,
            max: (rec.estimatedDuration || 2) * 60 + 30,
            typical: (rec.estimatedDuration || 2) * 60
          },
          pricing: {
            currency: rec.estimatedPrice?.currency || 'EUR',
            adult: rec.estimatedPrice?.adult || 30,
            child: rec.estimatedPrice?.child || 15,
            isFree: false
          },
          rating: {
            overall: 4.5,
            reviewCount: Math.floor(Math.random() * 1000) + 100
          },
          timeSlots: ['09:00', '14:00', '16:00'],
          difficulty: 'easy',
          features: ['guidedTour', 'photoOpportunity', 'kidfriendly'],
          languages: ['English', 'French'],
          minParticipants: 1,
          maxParticipants: 20,
          ageRestrictions: { minimum: 0 },
          whatToExpect: ['Professional guide', 'Small group experience'],
          inclusions: ['Entry tickets', 'Guide services'],
          exclusions: ['Food and drinks', 'Transportation'],
          meetingPoint: 'To be confirmed',
          cancellationPolicy: {
            type: 'partial' as const,
            description: 'Free cancellation up to 24 hours before',
            cutoffHours: 24
          },
          providerInfo: {
            name: 'Local Tours',
            rating: 4.5,
            verificationStatus: 'verified' as const
          },
          accessibility: {
            wheelchairAccessible: true,
            mobilityAid: true,
            visualAid: false,
            hearingAid: true
          }
        },
        reason: rec.reason,
        matchScore: rec.matchScore || 0.85
      })) || []

      return NextResponse.json({
        recommendations: formattedRecommendations,
        source: 'ai'
      })

    } catch (aiError) {
      console.error('AI recommendation error:', aiError)
      // Fall back to pattern-based recommendations
      return generateFallbackRecommendations(destination, selectedActivities, preferences)
    }

  } catch (error) {
    console.error('Recommendation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

function generateFallbackRecommendations(
  destination: string,
  selectedActivities: any[],
  preferences: any
) {
  const fallbackRecommendations = []

  // Analyze selected activities
  const hasMuseum = selectedActivities?.some(a => 
    a.name.toLowerCase().includes('museum') || a.category === 'cultural'
  )
  const hasCulinary = selectedActivities?.some(a => a.category === 'culinary')
  const hasOutdoor = selectedActivities?.some(a => 
    a.category === 'nature' || a.category === 'adventure'
  )

  // Recommend based on gaps
  if (!hasMuseum && destination.toLowerCase().includes('paris')) {
    fallbackRecommendations.push({
      activity: {
        id: 'fb-1',
        name: 'Versailles Palace Day Trip',
        description: 'Explore the magnificent palace and gardens of Versailles',
        category: 'cultural',
        imageUrl: '/api/placeholder/400/250',
        imageUrls: ['/api/placeholder/400/250'],
        location: {
          address: 'Place d\'Armes, 78000 Versailles',
          city: 'Versailles',
          coordinates: [48.8049, 2.1204]
        },
        duration: { min: 240, max: 360, typical: 300 },
        pricing: { currency: 'EUR', adult: 45, child: 0, isFree: false },
        rating: { overall: 4.8, reviewCount: 3421 },
        timeSlots: ['09:00', '10:00'],
        difficulty: 'moderate',
        features: ['audioGuide', 'guidedTour', 'photoOpportunity', 'wheelchairAccessible'],
        languages: ['English', 'French', 'Spanish'],
        minParticipants: 1,
        maxParticipants: 30,
        ageRestrictions: { minimum: 0 },
        whatToExpect: ['Palace tour', 'Gardens exploration', 'Musical fountains'],
        inclusions: ['Entry ticket', 'Audio guide'],
        exclusions: ['Transportation', 'Meals'],
        meetingPoint: 'Palace entrance',
        cancellationPolicy: {
          type: 'partial' as const,
          description: '50% refund if cancelled 48h before',
          cutoffHours: 48
        },
        providerInfo: {
          name: 'Versailles Tours',
          rating: 4.7,
          verificationStatus: 'verified' as const
        },
        accessibility: {
          wheelchairAccessible: true,
          mobilityAid: true,
          visualAid: false,
          hearingAid: true
        }
      },
      reason: 'A must-see historical site near Paris, perfect for a day trip',
      matchScore: 0.9
    })
  }

  if (!hasCulinary) {
    fallbackRecommendations.push({
      activity: {
        id: 'fb-2',
        name: 'Food Market Tour & Tasting',
        description: 'Discover local flavors at authentic markets with a food expert',
        category: 'culinary',
        imageUrl: '/api/placeholder/400/250',
        imageUrls: ['/api/placeholder/400/250'],
        location: {
          address: 'Various markets',
          city: destination,
          coordinates: [0, 0]
        },
        duration: { min: 150, max: 180, typical: 165 },
        pricing: { currency: 'EUR', adult: 55, child: 25, isFree: false },
        rating: { overall: 4.6, reviewCount: 567 },
        timeSlots: ['10:00', '15:00'],
        difficulty: 'easy',
        features: ['guidedTour', 'culinary', 'kidfriendly'],
        languages: ['English', 'French'],
        minParticipants: 2,
        maxParticipants: 12,
        ageRestrictions: { minimum: 0 },
        whatToExpect: ['Market visits', 'Food tastings', 'Cultural insights'],
        inclusions: ['Guide', 'All tastings'],
        exclusions: ['Additional purchases'],
        meetingPoint: 'Central meeting point',
        cancellationPolicy: {
          type: 'free' as const,
          description: 'Free cancellation up to 24h before',
          cutoffHours: 24
        },
        providerInfo: {
          name: 'Local Food Tours',
          rating: 4.5,
          verificationStatus: 'verified' as const
        },
        accessibility: {
          wheelchairAccessible: false,
          mobilityAid: false,
          visualAid: true,
          hearingAid: true
        }
      },
      reason: 'Experience local cuisine and culture through authentic food markets',
      matchScore: 0.85
    })
  }

  return NextResponse.json({
    recommendations: fallbackRecommendations,
    source: 'pattern-based'
  })
}