import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { generateEnhancedItinerary } from '@/lib/ai/enhanced-itinerary-generator-optimized'
// import { LeadSyncService } from '@/lib/crm/services/lead-sync-service' // Temporarily disabled due to CrmFactory import issues

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface TripFormData {
  destination: string
  dates: {
    from: string
    to: string
  }
  travelers: number
  budget: [number, number]
  interests: string[]
  email?: string
  name?: string
  phone?: string
}

interface ItineraryDay {
  day: number
  date: string
  title: string
  description: string
  activities: {
    time: string
    title: string
    description: string
    duration: string
    location: string
    price?: number
    type: string
  }[]
  accommodation?: {
    name: string
    type: string
    price: number
    location: string
  }
  meals: {
    type: string
    venue: string
    cuisine: string
    price: number
  }[]
  totalCost: number
}

interface GeneratedItinerary {
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: number
  totalBudget: number
  days: ItineraryDay[]
  highlights: string[]
  tips: string[]
  estimatedTotalCost: number
  tourOperatorOffers?: any[] // Optional tour offers
}

async function generateItineraryWithAI(
  tripData: TripFormData,
  availableContent: any[]
): Promise<GeneratedItinerary> {
  const startDate = new Date(tripData.dates.from)
  const endDate = new Date(tripData.dates.to)
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Create a concise prompt optimized for speed
  const prompt = `Create a ${duration}-day itinerary for ${tripData.destination}.

Details: ${tripData.travelers} travelers, ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}, budget $${tripData.budget[0]}-${tripData.budget[1]} per person, interests: ${tripData.interests.join(', ')}.

Return ONLY valid JSON (no extra text):
{
  "destination": "${tripData.destination}",
  "duration": ${duration},
  "startDate": "${startDate.toISOString().split('T')[0]}",
  "endDate": "${endDate.toISOString().split('T')[0]}",
  "travelers": ${tripData.travelers},
  "totalBudget": ${tripData.budget[1]},
  "days": [
    {
      "day": 1,
      "date": "${startDate.toISOString().split('T')[0]}",
      "title": "Day 1 Title",
      "description": "Brief description",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Short description",
          "duration": "2 hours",
          "location": "Location name",
          "price": 50,
          "type": "sightseeing"
        }
      ],
      "accommodation": {
        "name": "Hotel name",
        "type": "hotel",
        "price": 100,
        "location": "${tripData.destination}"
      },
      "meals": [
        {
          "type": "breakfast",
          "venue": "Local cafe",
          "cuisine": "Local",
          "price": 15
        }
      ],
      "totalCost": 200
    }
  ],
  "highlights": ["Top attraction", "Local experience"],
  "tips": ["Pack light", "Learn basic phrases"],
  "estimatedTotalCost": ${Math.floor(tripData.budget[1] * 0.8 * tripData.travelers)}
}

Keep realistic prices, stay within budget.`

  try {
    console.log(`🤖 Starting AI generation for ${tripData.destination} with ${tripData.travelers} travelers`)
    
    // Add a timeout for the OpenAI API call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI generation timeout after 15 seconds')), 15000)
    )

    const apiPromise = openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      max_tokens: parseInt(process.env.MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.2'),
      messages: [
        {
          role: 'system',
          content: 'You are a professional travel planner. Always respond with valid JSON only, no additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const completion = await Promise.race([apiPromise, timeoutPromise]) as any

    // Extract the JSON from the response
    const content = completion.choices[0]?.message?.content
    if (content) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const itinerary = JSON.parse(jsonMatch[0]) as GeneratedItinerary
        return itinerary
      } else {
        // If the entire response is JSON, try parsing it directly
        try {
          const itinerary = JSON.parse(content) as GeneratedItinerary
          return itinerary
        } catch {
          // Continue to fallback
        }
      }
    }

    // Fallback if AI doesn't return proper JSON
    throw new Error('Failed to parse AI response')
  } catch (error) {
    console.error('AI generation error:', error)
    // Return a basic itinerary as fallback
    return createFallbackItinerary(tripData, duration, startDate, endDate, availableContent)
  }
}

function createFallbackItinerary(
  tripData: TripFormData,
  duration: number,
  startDate: Date,
  endDate: Date,
  availableContent: any[]
): GeneratedItinerary {
  const days: ItineraryDay[] = []
  const activities = availableContent.filter(c => c.type === 'activity')
  const accommodations = availableContent.filter(c => c.type === 'accommodation')
  
  // Create a simple itinerary
  for (let i = 0; i < duration; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)
    
    // Select 2-3 activities per day
    const dayActivities = activities
      .slice(i * 2, (i * 2) + 3)
      .map((activity, index) => ({
        time: index === 0 ? '09:00' : index === 1 ? '14:00' : '17:00',
        title: activity.name,
        description: activity.description,
        duration: `${Math.floor((activity.duration || 180) / 60)} hours`,
        location: activity.location,
        price: activity.price || 50,
        type: activity.type
      }))

    // Select accommodation
    const accommodation = accommodations[0] || {
      name: 'Standard Hotel',
      type: 'hotel',
      price: 100,
      location: tripData.destination
    }

    days.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0]!,
      title: `Day ${i + 1} in ${tripData.destination}`,
      description: `Exploring the best of ${tripData.destination}`,
      activities: dayActivities,
      accommodation: {
        name: accommodation.name || 'Standard Hotel',
        type: accommodation.type || 'hotel',
        price: accommodation.price || 100,
        location: accommodation.location || tripData.destination
      },
      meals: [
        { type: 'breakfast', venue: 'Hotel Restaurant', cuisine: 'Continental', price: 15 },
        { type: 'lunch', venue: 'Local Restaurant', cuisine: 'Local', price: 25 },
        { type: 'dinner', venue: 'Fine Dining', cuisine: 'International', price: 40 }
      ],
      totalCost: (accommodation.price || 100) + 
                 dayActivities.reduce((sum, a) => sum + (a.price || 0), 0) + 
                 80 // meals
    })
  }

  const totalCost = days.reduce((sum, day) => sum + day.totalCost, 0)

  return {
    destination: tripData.destination,
    duration,
    startDate: startDate.toISOString().split('T')[0]!,
    endDate: endDate.toISOString().split('T')[0]!,
    travelers: tripData.travelers,
    totalBudget: tripData.budget[1],
    days,
    highlights: [
      `Visit ${tripData.destination}'s top attractions`,
      'Experience local cuisine',
      'Comfortable accommodations',
      'Well-paced itinerary'
    ],
    tips: [
      'Book accommodations in advance',
      'Check weather forecast before traveling',
      'Learn basic local phrases',
      'Keep copies of important documents'
    ],
    estimatedTotalCost: totalCost * tripData.travelers
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 API route /api/trips-ai/generate called at', new Date().toISOString())
  
  try {
    const body = await request.json()
    console.log('📥 Received body:', JSON.stringify(body, null, 2))
    
    // Handle both wrapped and unwrapped formats
    const tripData = (body.tripData || body) as TripFormData
    
    // Validate required fields
    if (!tripData.destination || !tripData.dates?.from || !tripData.dates?.to) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields',
        received: { destination: tripData.destination, dates: tripData.dates }
      }, { status: 400 })
    }

    // Try to load available content from database, but continue if it fails
    let parsedContent: any[] = []
    try {
      const availableContent = await prisma.content.findMany({
        where: {
          OR: [
            { location: { contains: tripData.destination } },
            { city: { contains: tripData.destination } },
            { country: { contains: tripData.destination } }
          ],
          active: true
        }
      })

      // Parse content for AI
      parsedContent = availableContent.map(content => ({
        id: content.id,
        type: content.type,
        name: content.name,
        description: content.description,
        location: content.location,
        price: content.price,
        duration: content.duration,
        amenities: content.amenities ? JSON.parse(content.amenities) : [],
        included: content.included ? JSON.parse(content.included) : [],
        excluded: content.excluded ? JSON.parse(content.excluded) : []
      }))
    } catch (dbError) {
      console.warn('Database connection failed, continuing without content data:', dbError)
      // Continue with empty content - AI will generate generic itinerary
    }

    // Generate enhanced itinerary with AI and tour operator integration
    console.log('🤖 Starting enhanced AI generator with tour operator integration...')
    console.log('Trip data being sent:', {
      destination: tripData.destination,
      dates: tripData.dates,
      travelers: tripData.travelers,
      budget: tripData.budget,
      interests: tripData.interests
    })
    
    let enhancedResult
    try {
      enhancedResult = await generateEnhancedItinerary(tripData)
      console.log('✅ Enhanced result received:', {
        hasDestination: !!enhancedResult.destination,
        dayCount: enhancedResult.days?.length || 0,
        hasTourOffers: !!(enhancedResult.tourOperatorOffers?.length)
      })
    } catch (genError) {
      console.error('❌ Enhanced generation failed:', genError)
      throw genError
    }
    
    // Transform to match expected format
    const itinerary: GeneratedItinerary = {
      destination: enhancedResult.destination,
      duration: enhancedResult.duration,
      startDate: enhancedResult.startDate,
      endDate: enhancedResult.endDate,
      travelers: enhancedResult.travelers,
      totalBudget: enhancedResult.totalBudget,
      days: enhancedResult.days.map((day: any) => ({
        day: day.day,
        date: day.date,
        title: day.title,
        description: day.description,
        activities: day.activities,
        accommodation: day.accommodation,
        meals: day.meals,
        totalCost: day.totalCost
      })),
      highlights: enhancedResult.highlights || [],
      tips: enhancedResult.tips || [],
      estimatedTotalCost: enhancedResult.estimatedTotalCost || enhancedResult.totalBudget,
      tourOperatorOffers: enhancedResult.tourOperatorOffers // Include tour offers
    }
    
    // Try to save to database in parallel, but don't fail if database is down
    let lead = null
    let savedItinerary = null
    
    try {
      // Prepare data
      const leadData = {
        email: tripData.email || `anonymous_${Date.now()}@example.com`,
        name: tripData.name || null,
        phone: tripData.phone || null,
        destination: tripData.destination,
        startDate: new Date(tripData.dates.from),
        endDate: new Date(tripData.dates.to),
        travelers: tripData.travelers,
        budgetMin: tripData.budget[0],
        budgetMax: tripData.budget[1],
        interests: JSON.stringify(tripData.interests),
        tripData: JSON.stringify(tripData),
        itinerary: JSON.stringify(itinerary),
        score: calculateLeadScore(tripData, itinerary),
        status: 'new',
        tenantId: 'default' // Use default tenant for now
      }

      // Create lead first (needed for itinerary)
      lead = await prisma.lead.create({ data: leadData })

      // Store itinerary with leadId
      const itineraryData = {
        title: `${itinerary.duration}-Day ${itinerary.destination} Adventure`,
        description: `A personalized ${itinerary.duration}-day itinerary for ${itinerary.destination}`,
        destination: itinerary.destination,
        startDate: new Date(itinerary.startDate),
        endDate: new Date(itinerary.endDate),
        travelers: itinerary.travelers,
        totalPrice: itinerary.estimatedTotalCost,
        days: JSON.stringify(itinerary.days),
        metadata: JSON.stringify({
          interests: tripData.interests,
          generatedAt: new Date(),
          generationTime: Date.now() - startTime
        }),
        leadId: lead.id,
        tenantId: 'default'
      }

      savedItinerary = await prisma.itinerary.create({ data: itineraryData })
    } catch (dbError) {
      console.warn('Failed to save to database, but continuing with generated itinerary:', dbError)
      // Continue without database saves - user still gets their itinerary
    }

    // Trigger CRM sync asynchronously (temporarily disabled)
    // LeadSyncService.getInstance().syncLead(lead.id).catch((error: any) => {
    //   console.error('Failed to sync lead to CRM:', error)
    // })

    const generationTime = Date.now() - startTime
    console.log(`✅ API route completed in ${generationTime}ms`)

    const response = {
      success: true,
      itinerary,
      leadId: lead?.id || null,
      itineraryId: savedItinerary?.id || null,
      generationTime,
      performanceTarget: generationTime < 3000
    }
    
    console.log('📤 Sending response:', {
      success: response.success,
      hasItinerary: !!response.itinerary,
      dayCount: response.itinerary?.days?.length || 0
    })
    
    return NextResponse.json(response)

  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`❌ API route failed after ${errorTime}ms:`, error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate itinerary',
      errorTime
    }, { status: 500 })
  }
}

function calculateLeadScore(tripData: TripFormData, itinerary: GeneratedItinerary): number {
  let score = 0
  
  // Budget range (higher budget = higher score)
  if (tripData.budget[1] > 5000) score += 30
  else if (tripData.budget[1] > 3000) score += 20
  else if (tripData.budget[1] > 1500) score += 10
  
  // Trip duration (longer trips = higher score)
  if (itinerary.duration > 14) score += 25
  else if (itinerary.duration > 7) score += 15
  else if (itinerary.duration > 3) score += 10
  
  // Number of travelers (groups = higher score)
  if (tripData.travelers > 4) score += 20
  else if (tripData.travelers > 2) score += 10
  else if (tripData.travelers > 1) score += 5
  
  // Contact information provided
  if (tripData.email) score += 10
  if (tripData.name) score += 5
  if (tripData.phone) score += 10
  
  // Interests indicate luxury preferences
  const luxuryInterests = ['luxury', 'spa', 'fine-dining', 'private-tours']
  const matchedInterests = tripData.interests.filter(i => 
    luxuryInterests.some(li => i.toLowerCase().includes(li))
  )
  score += matchedInterests.length * 5
  
  return Math.min(score, 100) // Cap at 100
}