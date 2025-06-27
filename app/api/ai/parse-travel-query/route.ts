import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const queryRequestSchema = z.object({
  query: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = queryRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const { query } = validation.data
    
    // Parse the natural language query to extract travel parameters
    const parsedData = await parseNaturalLanguageQuery(query)
    
    return NextResponse.json(parsedData)
    
  } catch (error) {
    console.error('Error parsing travel query:', error)
    return NextResponse.json(
      { error: 'Failed to parse travel query' },
      { status: 500 }
    )
  }
}

async function parseNaturalLanguageQuery(query: string) {
  try {
    // First try AI parsing if OpenAI is available
    if (process.env.OPENAI_API_KEY) {
      return await parseWithAI(query)
    }
    
    // Fallback to pattern-based parsing
    return parseWithPatterns(query)
    
  } catch (error) {
    console.error('AI parsing failed, falling back to patterns:', error)
    return parseWithPatterns(query)
  }
}

async function parseWithAI(query: string) {
  const systemPrompt = `You are a travel query parser. Extract structured information from natural language travel queries.

Extract these fields when mentioned:
- destination: The place they want to visit
- duration: Number of days/nights (convert weeks/months to days)
- travelers: Number of people traveling
- startDate: When they want to start (format: YYYY-MM-DD, use current year if not specified)
- interests: List of activities/interests mentioned
- budget: Any budget information mentioned
- travelStyle: Adventure, luxury, budget, family, etc.

Today's date: ${new Date().toISOString().split('T')[0]}

Return ONLY a JSON object with the extracted fields. If a field isn't mentioned, omit it.

Examples:
"7 days in Japan with temples and food" -> {"destination": "Japan", "duration": 7, "interests": ["temples", "food"]}
"Family trip to Costa Rica" -> {"destination": "Costa Rica", "travelStyle": "family"}
"2 week adventure in Peru for 4 people" -> {"destination": "Peru", "duration": 14, "travelers": 4, "travelStyle": "adventure"}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    throw new Error('OpenAI API request failed')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  return JSON.parse(content)
}

function parseWithPatterns(query: string): any {
  const result: any = {}
  const lowerQuery = query.toLowerCase()
  
  // Extract destination (common patterns)
  const destinationPatterns = [
    /(?:to|in|visit|going to|traveling to)\s+([a-z\s]+?)(?:\s|$|for|with|,)/i,
    /^([a-z\s]+?)\s+(?:trip|vacation|travel|journey)/i,
    /(?:^|\s)([a-z\s]{2,})\s+(?:adventure|experience|tour)/i
  ]
  
  for (const pattern of destinationPatterns) {
    const match = query.match(pattern)
    if (match && match[1]) {
      const destination = match[1].trim()
      // Filter out common words that aren't destinations
      const excludeWords = ['family', 'solo', 'budget', 'luxury', 'adventure', 'romantic', 'business']
      if (!excludeWords.some(word => destination.toLowerCase().includes(word))) {
        result.destination = destination.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        break
      }
    }
  }
  
  // Extract duration
  const durationPatterns = [
    /(\d+)\s*(?:day|days)/i,
    /(\d+)\s*(?:night|nights)/i,
    /(\d+)\s*(?:week|weeks)/i,
    /(\d+)\s*(?:month|months)/i
  ]
  
  for (const pattern of durationPatterns) {
    const match = query.match(pattern)
    if (match) {
      let days = parseInt(match[1])
      if (pattern.source.includes('week')) days *= 7
      if (pattern.source.includes('month')) days *= 30
      result.duration = days
      break
    }
  }
  
  // Extract number of travelers
  const travelerPatterns = [
    /(\d+)\s*(?:people|person|travelers|travellers|pax)/i,
    /(?:for|with)\s*(\d+)/i,
    /party\s*of\s*(\d+)/i,
    /group\s*of\s*(\d+)/i
  ]
  
  for (const pattern of travelerPatterns) {
    const match = query.match(pattern)
    if (match) {
      result.travelers = parseInt(match[1])
      break
    }
  }
  
  // Extract travel style
  const styles = ['family', 'solo', 'luxury', 'budget', 'adventure', 'romantic', 'business', 'backpacking']
  for (const style of styles) {
    if (lowerQuery.includes(style)) {
      result.travelStyle = style
      break
    }
  }
  
  // Extract interests (common travel activities)
  const interests = []
  const interestKeywords = [
    'temples', 'food', 'culture', 'history', 'museums', 'art', 'nature', 
    'hiking', 'beaches', 'nightlife', 'shopping', 'architecture', 'wildlife',
    'photography', 'adventure', 'relaxation', 'spa', 'wine', 'local cuisine',
    'festivals', 'music', 'dancing', 'sports', 'diving', 'skiing', 'surfing'
  ]
  
  for (const interest of interestKeywords) {
    if (lowerQuery.includes(interest)) {
      interests.push(interest)
    }
  }
  
  if (interests.length > 0) {
    result.interests = interests
  }
  
  // Extract budget if mentioned
  const budgetPattern = /\$?([\d,]+)\s*(?:budget|dollars?|usd|per person)?/i
  const budgetMatch = query.match(budgetPattern)
  if (budgetMatch) {
    result.budget = parseInt(budgetMatch[1].replace(/,/g, ''))
  }
  
  // Set defaults if nothing found
  if (!result.destination) {
    result.destination = 'Amazing Destination'
  }
  
  if (!result.duration) {
    result.duration = 7
  }
  
  if (!result.travelers) {
    result.travelers = 2
  }
  
  // Generate start date (next month for demo)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 1)
  result.startDate = startDate.toISOString().split('T')[0]
  
  return result
} 