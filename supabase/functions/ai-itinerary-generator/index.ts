import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ItineraryRequest {
  naturalLanguageInput?: string
  destination?: string
  startDate?: string
  endDate?: string
  travelers?: number
  budget?: {
    min: number
    max: number
    currency: string
  }
  interests?: string[]
  specialRequests?: string
}

interface ItineraryDay {
  date: string
  dayNumber: number
  title: string
  description: string
  meals: {
    breakfast?: {
      name: string
      type: string
      location: string
      price?: number
      duration?: number
    }
    lunch?: {
      name: string
      type: string
      location: string
      price?: number
      duration?: number
    }
    dinner?: {
      name: string
      type: string
      location: string
      price?: number
      duration?: number
    }
  }
  activities: {
    morning?: {
      name: string
      description: string
      location: string
      duration: number
      price: number
      category: string
      bookingRequired: boolean
    }
    afternoon?: {
      name: string
      description: string
      location: string
      duration: number
      price: number
      category: string
      bookingRequired: boolean
    }
    evening?: {
      name: string
      description: string
      location: string
      duration: number
      price: number
      category: string
      bookingRequired: boolean
    }
  }
  accommodation: {
    name: string
    type: string
    location: string
    checkIn?: string
    checkOut?: string
    pricePerNight: number
  }
  transportation: Array<{
    type: string
    from: string
    to: string
    departureTime: string
    arrivalTime: string
    price: number
    bookingInfo?: string
  }>
  notes?: string[]
}

interface GeneratedItinerary {
  title: string
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: number
  totalBudget: {
    min: number
    max: number
    currency: string
  }
  days: ItineraryDay[]
  highlights: string[]
  tips: string[]
  packingList: string[]
  weatherInfo: {
    season: string
    averageTemp: string
    description: string
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { naturalLanguageInput, ...structuredData } = await req.json() as ItineraryRequest

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const configuration = new Configuration({
      apiKey: openaiApiKey,
    })
    const openai = new OpenAIApi(configuration)

    // Build the prompt
    const systemPrompt = `You are an expert travel planner AI. Create detailed, personalized travel itineraries that are practical, budget-conscious, and tailored to the traveler's preferences. Include specific recommendations for activities, restaurants, accommodations, and transportation. Always provide realistic timings and prices.`

    let userPrompt = ''
    
    if (naturalLanguageInput) {
      userPrompt = `Create a detailed travel itinerary based on this request: "${naturalLanguageInput}"`
      if (structuredData.destination) {
        userPrompt += `\nDestination: ${structuredData.destination}`
      }
      if (structuredData.startDate && structuredData.endDate) {
        userPrompt += `\nTravel dates: ${structuredData.startDate} to ${structuredData.endDate}`
      }
      if (structuredData.travelers) {
        userPrompt += `\nNumber of travelers: ${structuredData.travelers}`
      }
      if (structuredData.budget) {
        userPrompt += `\nBudget: ${structuredData.budget.currency} ${structuredData.budget.min}-${structuredData.budget.max}`
      }
      if (structuredData.interests && structuredData.interests.length > 0) {
        userPrompt += `\nInterests: ${structuredData.interests.join(', ')}`
      }
      if (structuredData.specialRequests) {
        userPrompt += `\nSpecial requests: ${structuredData.specialRequests}`
      }
    } else {
      // Build prompt from structured data
      userPrompt = `Create a detailed travel itinerary for ${structuredData.travelers || 1} traveler(s) to ${structuredData.destination || 'a destination of your choice'}.`
      
      if (structuredData.startDate && structuredData.endDate) {
        userPrompt += ` The trip is from ${structuredData.startDate} to ${structuredData.endDate}.`
      }
      
      if (structuredData.budget) {
        userPrompt += ` The budget is ${structuredData.budget.currency} ${structuredData.budget.min}-${structuredData.budget.max} total.`
      }
      
      if (structuredData.interests && structuredData.interests.length > 0) {
        userPrompt += ` The travelers are interested in: ${structuredData.interests.join(', ')}.`
      }
      
      if (structuredData.specialRequests) {
        userPrompt += ` Special requests: ${structuredData.specialRequests}`
      }
    }

    userPrompt += `

Please provide the itinerary in the following JSON format:
{
  "title": "Descriptive title for the trip",
  "destination": "Main destination",
  "duration": number of days,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "travelers": number of travelers,
  "totalBudget": {
    "min": minimum budget number,
    "max": maximum budget number,
    "currency": "USD"
  },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "title": "Day title",
      "description": "Brief day description",
      "meals": {
        "breakfast": { "name": "Restaurant name", "type": "cuisine type", "location": "address", "price": 15, "duration": 60 },
        "lunch": { "name": "Restaurant name", "type": "cuisine type", "location": "address", "price": 25, "duration": 90 },
        "dinner": { "name": "Restaurant name", "type": "cuisine type", "location": "address", "price": 40, "duration": 120 }
      },
      "activities": {
        "morning": { "name": "Activity name", "description": "Description", "location": "address", "duration": 180, "price": 50, "category": "category", "bookingRequired": true },
        "afternoon": { "name": "Activity name", "description": "Description", "location": "address", "duration": 120, "price": 30, "category": "category", "bookingRequired": false },
        "evening": { "name": "Activity name", "description": "Description", "location": "address", "duration": 90, "price": 20, "category": "category", "bookingRequired": false }
      },
      "accommodation": {
        "name": "Hotel name",
        "type": "Hotel/Hostel/Airbnb",
        "location": "address",
        "checkIn": "15:00",
        "checkOut": "11:00",
        "pricePerNight": 120
      },
      "transportation": [
        {
          "type": "flight/train/bus/car",
          "from": "location",
          "to": "location",
          "departureTime": "HH:MM",
          "arrivalTime": "HH:MM",
          "price": 50,
          "bookingInfo": "booking details"
        }
      ],
      "notes": ["Important notes for the day"]
    }
  ],
  "highlights": ["Trip highlight 1", "Trip highlight 2"],
  "tips": ["Travel tip 1", "Travel tip 2"],
  "packingList": ["Item 1", "Item 2"],
  "weatherInfo": {
    "season": "Season name",
    "averageTemp": "20-25°C",
    "description": "Weather description"
  }
}`

    // Call OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    const generatedItinerary = JSON.parse(completion.data.choices[0].message?.content || '{}') as GeneratedItinerary

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store the generated itinerary (optional)
    const { data: storedItinerary, error: storeError } = await supabase
      .from('generated_itineraries')
      .insert({
        request_data: { naturalLanguageInput, ...structuredData },
        generated_itinerary: generatedItinerary,
        model_used: 'gpt-4-turbo-preview',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (storeError) {
      console.error('Error storing itinerary:', storeError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        itinerary: generatedItinerary,
        generationId: storedItinerary?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error generating itinerary:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})