import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Request schema
const recommendationSchema = z.object({
  destination: z.string(),
  interests: z.array(z.string()).optional(),
  dayInfo: z.object({
    dayNumber: z.number(),
    existingActivities: z.array(z.string()).optional()
  }).optional(),
  category: z.string().optional(),
  userPreferences: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = recommendationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    const { destination, interests, dayInfo, category, userPreferences } = validation.data
    
    
    // Build context for the AI
    let context = `Generate personalized recommendations for a traveler visiting ${destination}.`
    
    if (interests && interests.length > 0) {
      context += ` They are interested in: ${interests.join(', ')}.`
    }
    
    if (dayInfo) {
      context += ` This is for day ${dayInfo.dayNumber} of their trip.`
      if (dayInfo.existingActivities && dayInfo.existingActivities.length > 0) {
        context += ` They already have planned: ${dayInfo.existingActivities.join(', ')}.`
      }
    }
    
    if (category) {
      context += ` Focus on ${category} recommendations.`
    }
    
    if (userPreferences) {
      context += ` Additional preferences: ${userPreferences}`
    }
    
    const systemPrompt = `You are a knowledgeable local travel guide with deep expertise about ${destination}. 
    Provide personalized, authentic recommendations that go beyond typical tourist spots.
    Include hidden gems, local favorites, and unique experiences.
    Format your response as a JSON array of recommendations with the following structure:
    [
      {
        "name": "Place or Activity Name",
        "category": "restaurant|cafe-bakery|bars-nightlife|art-museums|attractions|shopping|hotels",
        "description": "Brief engaging description (2-3 sentences)",
        "whyRecommended": "Why this matches their interests",
        "bestTimeToVisit": "When to go",
        "localTip": "Insider tip or advice",
        "estimatedDuration": "How long to spend (e.g., '2 hours')",
        "priceRange": "$|$$|$$$|$$$$",
        "mustTry": "For restaurants/cafes: signature dish or drink",
        "location": {
          "area": "Neighborhood or district name",
          "nearbyLandmark": "Closest known landmark"
        }
      }
    ]`
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000
    })
    
    const result = response.choices[0].message.content
    if (!result) {
      throw new Error('No recommendations generated')
    }
    
    const recommendations = JSON.parse(result)
    
    // Add some metadata
    const enhancedRecommendations = {
      destination,
      generatedAt: new Date().toISOString(),
      context: {
        interests,
        category,
        dayInfo
      },
      recommendations: Array.isArray(recommendations) ? recommendations : recommendations.recommendations || []
    }
    
    
    return NextResponse.json(enhancedRecommendations)
  } catch (error) {
    console.error('[Recommendations API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}