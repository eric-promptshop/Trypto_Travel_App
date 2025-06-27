import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { googlePlacesService } from '@/lib/services/google-places'
import { getCachedItinerary, cacheItinerary } from '@/lib/cache/redis-cache'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/api-auth'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Request validation schema
const generateRequestSchema = z.object({
  destination: z.string().min(1),
  dates: z.object({
    startDate: z.string(),
    endDate: z.string()
  }),
  travelers: z.object({
    adults: z.number().min(1).default(2),
    children: z.number().min(0).default(0)
  }),
  budget: z.object({
    amount: z.number().min(0).optional(),
    currency: z.string().default('USD'),
    perPerson: z.boolean().default(false)
  }).optional(),
  interests: z.array(z.string()).default([]),
  accommodation: z.string().optional(),
  transportation: z.array(z.string()).default([]),
  specialRequirements: z.string().optional(),
  naturalLanguageInput: z.string().optional()
})

// Response types
interface Activity {
  id: string
  time: string
  title: string
  description: string
  duration: string
  location: string
  category: 'dining' | 'activity' | 'transport' | 'accommodation' | 'tour'
  price?: number
  placeId?: string
  imageUrl?: string
  rating?: number
  tips?: string[]
}

interface ItineraryDay {
  day: number
  date: string
  title: string
  description: string
  activities: Activity[]
  totalCost?: number
}

interface GeneratedItinerary {
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: {
    adults: number
    children: number
  }
  totalBudget?: number
  days: ItineraryDay[]
  highlights: string[]
  tips: string[]
  estimatedTotalCost?: number
  metadata: {
    generatedAt: string
    version: string
    interests: string[]
  }
}

// System prompt for itinerary generation
const SYSTEM_PROMPT = `You are an expert travel planner specializing in creating personalized, detailed itineraries. Your goal is to craft memorable travel experiences that match the traveler's preferences, budget, and constraints.

Key guidelines:
1. Create realistic, well-paced itineraries with proper time allocation
2. Include a mix of popular attractions and local experiences
3. Consider travel time between locations
4. Respect the traveler's budget constraints
5. Account for meal times and rest periods
6. Provide practical tips and local insights
7. Consider the needs of all travelers (adults and children)
8. Include specific timings and durations for each activity

Always respond with a valid JSON object matching the specified format. Do not include any explanatory text outside the JSON.`

// Generate a detailed prompt based on user input
function generatePrompt(data: z.infer<typeof generateRequestSchema>): string {
  const { destination, dates, travelers, budget, interests, accommodation, transportation, specialRequirements, naturalLanguageInput } = data
  
  const startDate = new Date(dates.startDate)
  const endDate = new Date(dates.endDate)
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  let prompt = `Create a ${duration}-day itinerary for ${destination}.\n\n`
  prompt += `Travel dates: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`
  prompt += `Travelers: ${travelers.adults} adult${travelers.adults > 1 ? 's' : ''}`
  if (travelers.children > 0) {
    prompt += `, ${travelers.children} child${travelers.children > 1 ? 'ren' : ''}`
  }
  prompt += `\n\n`
  
  if (budget?.amount) {
    prompt += `Budget: $${budget.amount} ${budget.perPerson ? 'per person' : 'total'} (${budget.currency})\n`
  }
  
  if (interests.length > 0) {
    prompt += `Interests: ${interests.join(', ')}\n`
  }
  
  if (accommodation) {
    prompt += `Accommodation preference: ${accommodation}\n`
  }
  
  if (transportation.length > 0) {
    prompt += `Transportation preferences: ${transportation.join(', ')}\n`
  }
  
  if (specialRequirements) {
    prompt += `Special requirements: ${specialRequirements}\n`
  }
  
  if (naturalLanguageInput) {
    prompt += `\nAdditional context from traveler: "${naturalLanguageInput}"\n`
  }
  
  prompt += `\nReturn a JSON object with this exact structure:
{
  "destination": "${destination}",
  "duration": ${duration},
  "startDate": "${dates.startDate}",
  "endDate": "${dates.endDate}",
  "travelers": {
    "adults": ${travelers.adults},
    "children": ${travelers.children}
  },
  "totalBudget": ${budget?.amount || duration * 200 * (travelers.adults + travelers.children * 0.5)},
  "days": [
    {
      "day": 1,
      "date": "${dates.startDate}",
      "title": "Arrival and City Orientation",
      "description": "Brief description of the day",
      "activities": [
        {
          "id": "unique-id",
          "time": "14:00",
          "title": "Activity name",
          "description": "Detailed description",
          "duration": "2 hours",
          "location": "Specific location",
          "category": "activity",
          "price": 50,
          "tips": ["Tip 1", "Tip 2"]
        }
      ],
      "totalCost": 200
    }
  ],
  "highlights": ["Key experience 1", "Key experience 2"],
  "tips": ["Practical tip 1", "Practical tip 2"],
  "estimatedTotalCost": ${budget?.amount || duration * 200 * (travelers.adults + travelers.children * 0.5)},
  "metadata": {
    "generatedAt": "${new Date().toISOString()}",
    "version": "1.0",
    "interests": ${JSON.stringify(interests)}
  }
}`
  
  return prompt
}

// Enrich itinerary with Google Places data
async function enrichWithPlacesData(itinerary: GeneratedItinerary): Promise<GeneratedItinerary> {
  try {
    const enrichedDays = await Promise.all(
      itinerary.days.map(async (day) => {
        const enrichedActivities = await Promise.all(
          day.activities.map(async (activity) => {
            // Skip transport and accommodation activities
            if (activity.category === 'transport' || activity.category === 'accommodation') {
              return activity
            }
            
            try {
              // Search for the place
              const searchQuery = `${activity.title} ${activity.location || itinerary.destination}`
              const places = await googlePlacesService.searchPlaces({
                location: searchQuery,
                limit: 1
              })
              
              if (places.length > 0) {
                const place = places[0]
                return {
                  ...activity,
                  placeId: place.id,
                  imageUrl: place.imageUrl,
                  rating: place.rating,
                  location: place.location.address || activity.location,
                  tips: [...(activity.tips || []), ...(place.tips || [])].slice(0, 3)
                }
              }
            } catch (error) {
            }
            
            return activity
          })
        )
        
        return {
          ...day,
          activities: enrichedActivities
        }
      })
    )
    
    return {
      ...itinerary,
      days: enrichedDays
    }
  } catch (error) {
    console.error('Failed to enrich with Places data:', error)
    return itinerary
  }
}

// Generate fallback itinerary
function generateFallbackItinerary(
  data: z.infer<typeof generateRequestSchema>
): GeneratedItinerary {
  const startDate = new Date(data.dates.startDate)
  const endDate = new Date(data.dates.endDate)
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  const days: ItineraryDay[] = []
  
  for (let i = 0; i < duration; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)
    
    const activities: Activity[] = []
    
    if (i === 0) {
      // Arrival day
      activities.push({
        id: `day-${i}-arrival`,
        time: '14:00',
        title: 'Airport Transfer & Hotel Check-in',
        description: 'Arrive at your destination and settle into your accommodation',
        duration: '2 hours',
        location: data.destination,
        category: 'transport',
        price: 50
      })
      
      activities.push({
        id: `day-${i}-dinner`,
        time: '19:00',
        title: 'Welcome Dinner',
        description: 'Enjoy local cuisine at a recommended restaurant',
        duration: '2 hours',
        location: data.destination,
        category: 'dining',
        price: 40
      })
    } else if (i === duration - 1) {
      // Departure day
      activities.push({
        id: `day-${i}-checkout`,
        time: '10:00',
        title: 'Hotel Check-out',
        description: 'Check out from your accommodation',
        duration: '30 minutes',
        location: data.destination,
        category: 'accommodation'
      })
      
      activities.push({
        id: `day-${i}-departure`,
        time: '12:00',
        title: 'Airport Transfer',
        description: 'Transfer to the airport for departure',
        duration: '1 hour',
        location: data.destination,
        category: 'transport',
        price: 50
      })
    } else {
      // Regular day
      activities.push(
        {
          id: `day-${i}-morning`,
          time: '09:00',
          title: `Explore ${data.destination} - Morning`,
          description: 'Discover popular attractions and landmarks',
          duration: '3 hours',
          location: data.destination,
          category: 'activity',
          price: 30
        },
        {
          id: `day-${i}-lunch`,
          time: '12:30',
          title: 'Lunch Break',
          description: 'Enjoy lunch at a local restaurant',
          duration: '1.5 hours',
          location: data.destination,
          category: 'dining',
          price: 25
        },
        {
          id: `day-${i}-afternoon`,
          time: '14:30',
          title: `${data.destination} Cultural Experience`,
          description: 'Immerse yourself in local culture and traditions',
          duration: '3 hours',
          location: data.destination,
          category: 'activity',
          price: 40
        },
        {
          id: `day-${i}-dinner`,
          time: '19:00',
          title: 'Dinner',
          description: 'Evening meal at a recommended restaurant',
          duration: '2 hours',
          location: data.destination,
          category: 'dining',
          price: 35
        }
      )
    }
    
    days.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0],
      title: i === 0 ? `Arrival in ${data.destination}` : 
             i === duration - 1 ? 'Departure Day' : 
             `Exploring ${data.destination}`,
      description: `Day ${i + 1} of your ${data.destination} adventure`,
      activities,
      totalCost: activities.reduce((sum, act) => sum + (act.price || 0), 0)
    })
  }
  
  const totalCost = days.reduce((sum, day) => sum + (day.totalCost || 0), 0) * 
                    (data.travelers.adults + data.travelers.children * 0.5)
  
  return {
    destination: data.destination,
    duration,
    startDate: data.dates.startDate,
    endDate: data.dates.endDate,
    travelers: data.travelers,
    totalBudget: data.budget?.amount || totalCost,
    days,
    highlights: [
      `Explore the best of ${data.destination}`,
      'Experience local culture and cuisine',
      'Visit top attractions',
      'Enjoy comfortable accommodations'
    ],
    tips: [
      'Book accommodations in advance',
      'Check visa requirements',
      'Purchase travel insurance',
      'Learn basic local phrases'
    ],
    estimatedTotalCost: totalCost,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      interests: data.interests
    }
  }
}

async function handleItineraryGeneration(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const startTime = Date.now()
    
    try {
      // Parse and validate request
      const body = await req.json()
      const validation = generateRequestSchema.safeParse(body)
      
      if (!validation.success) {
        return createValidationErrorResponse(
          validation.error.errors.map(err => ({
            code: 'VALIDATION_ERROR',
            message: err.message,
            field: err.path.join('.')
          }))
        )
      }
      
      const data = validation.data
      
      // Log who is generating itinerary
    
    // Check cache first
    const cacheKey = {
      destination: data.destination,
      dates: data.dates,
      travelers: data.travelers,
      interests: data.interests
    }
    
    const cached = await getCachedItinerary(cacheKey)
    if (cached) {
      return createSuccessResponse(
        {
          itinerary: cached,
          cached: true
        },
        {
          generationTime: Date.now() - startTime
        }
      )
    }
    
    let itinerary: GeneratedItinerary
    
    try {
      // Generate prompt
      const prompt = generatePrompt(data)
      
      // Call OpenAI API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout
      
      const completion = await openai.chat.completions.create({
        model: process.env.MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
      
      clearTimeout(timeoutId)
      
      // Parse AI response
      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI')
      }
      
      itinerary = JSON.parse(content) as GeneratedItinerary
      
      // Enrich with Google Places data
      itinerary = await enrichWithPlacesData(itinerary)
      
    } catch (error) {
      console.error('AI generation failed, using fallback:', error)
      itinerary = generateFallbackItinerary(data)
    }
    
    // Cache the result
    await cacheItinerary(cacheKey, itinerary, { ttl: 3600 }) // 1 hour TTL
    
    const generationTime = Date.now() - startTime
    
    return createSuccessResponse(
      {
        itinerary,
        cached: false
      },
      {
        generationTime
      }
    )
    
    } catch (error) {
      console.error('Itinerary generation error:', error)
      return createErrorResponse(
        'Failed to generate itinerary',
        error instanceof Error ? { message: error.message } : undefined,
        500
      )
    }
  })
}

// Apply rate limiting to the endpoint
export const POST = withRateLimit({
  ...rateLimitConfigs.expensive,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  message: 'Too many itinerary generation requests. Please wait before trying again.',
  keyGenerator: (req) => {
    // Rate limit by authenticated user if available, otherwise by IP
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      return `auth:${authHeader}`
    }
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }
})(handleItineraryGeneration)