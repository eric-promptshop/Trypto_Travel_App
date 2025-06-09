import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ExtractedData {
  destinations?: string[]
  travelDates?: {
    startDate?: string
    endDate?: string
    flexible?: boolean
  }
  travelers?: {
    adults?: number
    children?: number
  }
  budget?: {
    amount?: number
    currency?: string
    perPerson?: boolean
  }
  accommodation?: string
  interests?: string[]
  specialRequirements?: string
  completeness?: number
}

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory } = await request.json()

    // If no OpenAI API key, use simple extraction
    if (!process.env.OPENAI_API_KEY) {
      const extractedData = simpleExtraction(conversationHistory)
      return NextResponse.json({ data: extractedData })
    }

    // Prepare conversation for extraction
    const conversationText = conversationHistory
      .map((msg: Message) => `${msg.role}: ${msg.content}`)
      .join('\n')

    // Create extraction prompt
    const extractionPrompt = `Extract travel planning information from this conversation and return ONLY a JSON object with the following structure:
{
  "destinations": ["array of destination names mentioned"],
  "travelDates": {
    "startDate": "YYYY-MM-DD format if mentioned",
    "endDate": "YYYY-MM-DD format if mentioned", 
    "flexible": true/false
  },
  "travelers": {
    "adults": number,
    "children": number
  },
  "budget": {
    "amount": number,
    "currency": "USD/EUR/etc",
    "perPerson": true/false
  },
  "accommodation": "hotel/airbnb/hostel/etc",
  "interests": ["array of mentioned interests"],
  "specialRequirements": "any special needs mentioned",
  "completeness": percentage (0-100) of how complete the travel information is
}

Only include fields that were explicitly mentioned. Calculate completeness based on how many key fields have been provided.

Conversation:
${conversationText}`

    // Call OpenAI API for extraction
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON extractor. Extract travel information from conversations and return only valid JSON.'
        },
        {
          role: 'user',
          content: extractionPrompt
        }
      ],
      max_tokens: parseInt(process.env.MAX_TOKENS || '1000'),
      temperature: 0.1, // Low temperature for consistent extraction
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    
    // Parse the JSON response
    let extractedData: ExtractedData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText
      extractedData = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText)
      // Fallback to simple extraction
      extractedData = simpleExtraction(conversationHistory)
    }

    return NextResponse.json({ data: extractedData })

  } catch (error) {
    console.error('Extract form data error:', error)
    // Fallback to simple extraction on error
    const extractedData = simpleExtraction([])
    return NextResponse.json({ data: extractedData })
  }
}

// Simple extraction without AI
function simpleExtraction(conversationHistory: Message[]): ExtractedData {
  const allText = conversationHistory
    .map(msg => msg.content.toLowerCase())
    .join(' ')

  const data: ExtractedData = {}

  // Extract destinations
  const destinations: string[] = []
  const destinationPatterns = [
    /(?:to|visit|going to|planning|destination[s]?:?\s*)([\w\s,]+?)(?:\.|,|!|\?|$)/gi,
    /(paris|london|tokyo|new york|rome|barcelona|amsterdam|berlin|sydney|bangkok)/gi
  ]
  
  for (const pattern of destinationPatterns) {
    const matches = allText.matchAll(pattern)
    for (const match of matches) {
      const dest = match[1]?.trim()
      if (dest && !destinations.includes(dest)) {
        destinations.push(dest)
      }
    }
  }
  if (destinations.length > 0) data.destinations = destinations

  // Extract dates
  const datePattern = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)/gi
  const dateMatches = Array.from(allText.matchAll(datePattern))
  if (dateMatches.length > 0) {
    const travelDates: ExtractedData['travelDates'] = {
      flexible: allText.includes('flexible')
    }
    
    if (dateMatches[0]?.[0]) {
      travelDates.startDate = dateMatches[0][0]
    }
    
    if (dateMatches[1]?.[0]) {
      travelDates.endDate = dateMatches[1][0]
    }
    
    data.travelDates = travelDates
  }

  // Extract travelers
  const travelersPattern = /(\d+)\s*(?:people|person|adult|traveler|passenger)/gi
  const childrenPattern = /(\d+)\s*(?:child|children|kid)/gi
  
  const adultMatch = allText.match(travelersPattern)
  if (adultMatch) {
    data.travelers = { adults: parseInt(adultMatch[0]) || 1 }
  }
  
  const childMatch = allText.match(childrenPattern)
  if (childMatch && data.travelers) {
    data.travelers.children = parseInt(childMatch[0]) || 0
  }

  // Extract budget
  const budgetPattern = /(?:\$|€|£|¥)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollar|euro|pound|yen|usd|eur|gbp|jpy)/gi
  const budgetMatch = allText.match(budgetPattern)
  if (budgetMatch) {
    const amount = parseFloat(budgetMatch[0].replace(/[$€£¥,]/g, ''))
    data.budget = {
      amount,
      currency: 'USD', // Default
      perPerson: allText.includes('per person') || allText.includes('each')
    }
  }

  // Extract accommodation
  const accommodationTypes = ['hotel', 'airbnb', 'hostel', 'resort', 'apartment', 'villa']
  for (const type of accommodationTypes) {
    if (allText.includes(type)) {
      data.accommodation = type
      break
    }
  }

  // Extract interests
  const interestKeywords = [
    'beach', 'mountain', 'city', 'culture', 'food', 'adventure', 'relaxation',
    'shopping', 'nightlife', 'history', 'art', 'nature', 'hiking', 'diving',
    'skiing', 'surfing', 'museums', 'architecture', 'photography', 'wildlife'
  ]
  const interests = interestKeywords.filter(interest => allText.includes(interest))
  if (interests.length > 0) data.interests = interests

  // Calculate completeness
  let fieldsCompleted = 0
  const totalFields = 6
  if (data.destinations?.length) fieldsCompleted++
  if (data.travelDates?.startDate) fieldsCompleted++
  if (data.travelers?.adults) fieldsCompleted++
  if (data.budget?.amount) fieldsCompleted++
  if (data.accommodation) fieldsCompleted++
  if (data.interests?.length) fieldsCompleted++
  
  data.completeness = Math.round((fieldsCompleted / totalFields) * 100)

  return data
}