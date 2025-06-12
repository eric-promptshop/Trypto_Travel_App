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
    const body = await request.json()
    const conversationHistory = body.messages || body.conversationHistory || []
    
    console.log('Extract request received:', {
      historyLength: conversationHistory.length,
      hasCurrentData: !!body.currentData
    })

    // If no OpenAI API key, use simple extraction
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key, using simple extraction')
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
      console.error('Parse error:', parseError)
      // Fallback to simple extraction
      extractedData = simpleExtraction(conversationHistory)
    }

    return NextResponse.json({ data: extractedData })

  } catch (error: any) {
    console.error('Extract form data error:', error)
    console.error('Error details:', error.message)
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
    /(?:to|visit|going to|planning|travel to|trip to|destination[s]?:?\s*)([\w\s,]+?)(?:\.|,|!|\?|for|from|$)/gi,
    /(paris|london|tokyo|new york|rome|barcelona|amsterdam|berlin|sydney|bangkok|peru|italy|japan|france|spain|thailand|mexico|greece|brazil|argentina|india|egypt|morocco|turkey|vietnam|bali|dubai|singapore|hong kong|seoul|beijing|shanghai|mumbai|delhi|cairo|istanbul|lisbon|prague|vienna|budapest|krakow|dublin|edinburgh|reykjavik|oslo|stockholm|copenhagen|helsinki|moscow|st petersburg|kiev|warsaw|athens|santorini|mykonos|crete|rhodes|cyprus|malta|sicily|sardinia|corsica|majorca|ibiza|tenerife|gran canaria|lanzarote|fuerteventura|madeira|azores|cape verde|seychelles|mauritius|maldives|sri lanka|nepal|bhutan|tibet|mongolia|south korea|taiwan|philippines|malaysia|indonesia|cambodia|laos|myanmar|bangladesh|pakistan|afghanistan|iran|iraq|jordan|lebanon|israel|palestine|saudi arabia|yemen|oman|qatar|kuwait|bahrain|uae|kenya|tanzania|uganda|rwanda|ethiopia|madagascar|south africa|namibia|botswana|zimbabwe|zambia|malawi|mozambique|angola|nigeria|ghana|senegal|morocco|tunisia|algeria|libya|sudan|chile|uruguay|paraguay|bolivia|ecuador|colombia|venezuela|guyana|suriname|costa rica|panama|nicaragua|honduras|guatemala|belize|el salvador|cuba|jamaica|dominican republic|puerto rico|haiti|barbados|trinidad|bahamas|cayman islands|virgin islands|aruba|curacao|st lucia|antigua|grenada|st vincent|dominica|martinique|guadeloupe|canada|usa|united states|america|alaska|hawaii|california|florida|new york|texas|nevada|arizona|colorado|washington|oregon|montana|wyoming|utah|new mexico|louisiana|georgia|north carolina|south carolina|virginia|massachusetts|pennsylvania|illinois|michigan|ohio|indiana|wisconsin|minnesota|iowa|missouri|arkansas|tennessee|kentucky|west virginia|alabama|mississippi|maine|vermont|new hampshire|rhode island|connecticut|new jersey|delaware|maryland|washington dc|australia|new zealand|fiji|samoa|tonga|vanuatu|papua new guinea|solomon islands|new caledonia|tahiti|cook islands|easter island|galapagos)/gi
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
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/gi,
    /(\d{1,2}\/\d{1,2}\/\d{4})/gi,
    /(\d{1,2}\/\d{1,2}\/\d{2})/gi,
    /((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)/gi,
    /(\d{1,2}(?:st|nd|rd|th)? (?:of )?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:,? \d{4})?)/gi,
    /((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4})/gi,
    /(?:in|during|for) ((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4})/gi,
    /(?:from|between|starting) ([\w\s,]+?) (?:to|until|through|-) ([\w\s,]+?)(?:\.|,|!|\?|$)/gi
  ]
  
  const dateMatches: string[] = []
  for (const pattern of datePatterns) {
    const matches = Array.from(allText.matchAll(pattern))
    for (const match of matches) {
      if (match[1]) dateMatches.push(match[1])
      if (match[2]) dateMatches.push(match[2])
    }
  }
  if (dateMatches.length > 0) {
    const travelDates: ExtractedData['travelDates'] = {
      flexible: allText.includes('flexible')
    }
    
    if (dateMatches[0]) {
      travelDates.startDate = dateMatches[0]
    }
    
    if (dateMatches[1]) {
      travelDates.endDate = dateMatches[1]
    }
    
    data.travelDates = travelDates
  }

  // Extract travelers
  const travelersPatterns = [
    /(\d+)\s*(?:people|person|adults?|travelers?|passengers?)/gi,
    /(\d+)\s*(?:of us|travelers)/gi,
    /(?:traveling with|party of|group of)\s*(\d+)/gi,
    /(?:me and|myself and)\s*(\d+)\s*(?:others?|friends?|family)/gi
  ]
  
  const childrenPattern = /(\d+)\s*(?:child|children|kids?)/gi
  
  let adultCount = 0
  for (const pattern of travelersPatterns) {
    const matches = allText.match(pattern)
    if (matches) {
      const num = parseInt(matches[0].match(/\d+/)?.[0] || '0')
      if (num > adultCount) adultCount = num
    }
  }
  
  // Default to 1 adult if we found destinations but no traveler count
  if (adultCount === 0 && destinations.length > 0) {
    adultCount = 1
  }
  
  if (adultCount > 0) {
    data.travelers = { adults: adultCount }
  } else if (destinations.length > 0) {
    // If we have a destination but no traveler count mentioned, assume 1 adult
    data.travelers = { adults: 1 }
  }
  
  const childMatch = allText.match(childrenPattern)
  if (childMatch && data.travelers) {
    const childCount = parseInt(childMatch[0].match(/\d+/)?.[0] || '0')
    data.travelers.children = childCount
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
  if (data.destinations && data.destinations.length > 0) fieldsCompleted++
  if (data.travelDates && data.travelDates.startDate) fieldsCompleted++
  if (data.travelers && data.travelers.adults && data.travelers.adults > 0) fieldsCompleted++
  if (data.budget && data.budget.amount && data.budget.amount > 0) fieldsCompleted++
  if (data.accommodation && data.accommodation.length > 0) fieldsCompleted++
  if (data.interests && data.interests.length > 0) fieldsCompleted++
  
  data.completeness = Math.round((fieldsCompleted / totalFields) * 100)
  
  console.log('Simple extraction - Fields completed:', fieldsCompleted, 'Total fields:', totalFields, 'Completeness:', data.completeness)

  return data
}