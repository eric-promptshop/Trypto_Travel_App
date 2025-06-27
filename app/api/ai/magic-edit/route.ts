import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/api-auth'
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'

const magicEditRequestSchema = z.object({
  message: z.string().min(1),
  itinerary: z.any(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
})

async function handleMagicEdit(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validation = magicEditRequestSchema.safeParse(body)
      
    
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.')
        }))
      )
    }
    
    const { message, itinerary, conversationHistory = [] } = validation.data
    
    // Process the magic edit request
    const response = await processMagicEditRequest(message, itinerary, conversationHistory)
    
    return createSuccessResponse(response)
    
    } catch (error) {
      console.error('Error processing magic edit:', error)
      return createErrorResponse(
        'Failed to process magic edit request',
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
  max: 10, // 10 requests per 5 minutes
  message: 'Too many magic edit requests. Please wait before trying again.',
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
})(handleMagicEdit)

async function processMagicEditRequest(
  message: string, 
  itinerary: any, 
  conversationHistory: Array<{role: string, content: string}>
) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        response: getFallbackMagicEditResponse(message),
        suggestions: [
          "Try a different approach",
          "Be more specific",
          "Ask for tour recommendations"
        ]
      }
    }

    // Use OpenAI to understand the request and generate changes
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const systemPrompt = `You are a Magic Edit assistant for travel itineraries. You help users refine their travel plans through natural language.

Given a user's request and their current itinerary, analyze what they want to change and provide:
1. A helpful response explaining what you understand and what changes you'll make
2. Suggestions for follow-up requests
3. Specific itinerary changes (if applicable)

Current itinerary context:
${JSON.stringify(itinerary, null, 2)}

Respond in JSON format:
{
  "response": "Your helpful explanation",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "itineraryChanges": [
    {
      "type": "add|remove|modify|reorder",
      "target": "activity-id or day-id", 
      "description": "what changed",
      "data": {}
    }
  ]
}

Focus on understanding intent like:
- "Add more cultural activities" → find and suggest cultural tours/activities
- "Make it more budget-friendly" → suggest free/cheaper alternatives
- "Less crowded places" → suggest alternatives to popular attractions
- "More food experiences" → suggest food tours, cooking classes, local markets`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4), // Last 4 messages for context
      { role: 'user', content: message }
    ]

    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    })

    let responseText = completion.choices[0]?.message?.content || ''
    
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(responseText)
      return {
        response: jsonResponse.response || responseText,
        suggestions: jsonResponse.suggestions || [],
        itineraryChanges: jsonResponse.itineraryChanges || []
      }
    } catch {
      // If not JSON, treat as plain text response
      return {
        response: responseText,
        suggestions: [
          "Add more activities",
          "Adjust timing", 
          "Change locations",
          "Make it more budget-friendly"
        ]
      }
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      response: getFallbackMagicEditResponse(message),
      suggestions: [
        "Try rephrasing your request",
        "Be more specific about what you want to change",
        "Ask for recommendations"
      ]
    }
  }
}

function getFallbackMagicEditResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('cultural') || lowerMessage.includes('culture')) {
    return "I'd love to help you add more cultural experiences! Consider visiting local museums, historical sites, art galleries, or cultural festivals. Would you like me to suggest specific cultural activities for your destination?"
  }
  
  if (lowerMessage.includes('food') || lowerMessage.includes('culinary') || lowerMessage.includes('restaurant')) {
    return "Great idea to add more food experiences! I can suggest local food tours, cooking classes, famous restaurants, or traditional markets. What type of food experiences are you most interested in?"
  }
  
  if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('free')) {
    return "I can help make your itinerary more budget-friendly! Consider free walking tours, public parks, free museums on certain days, local markets, and public transportation. Would you like specific budget alternatives?"
  }
  
  if (lowerMessage.includes('relax') || lowerMessage.includes('slower') || lowerMessage.includes('less busy')) {
    return "I understand you want a more relaxed pace. I can suggest adding more leisure time, spa activities, parks, and reducing the number of activities per day. Which days would you like to make more relaxing?"
  }
  
  if (lowerMessage.includes('more time') || lowerMessage.includes('longer')) {
    return "I can help you spend more time at your favorite activities or locations. Which specific places or activities would you like to extend?"
  }
  
  return `I understand you want to modify your itinerary. While I'm currently running in demo mode, I can suggest several approaches for your request. Could you be more specific about what you'd like to change?`
}

export async function GET() {
  return NextResponse.json({
    status: 'Magic Edit API is running',
    capabilities: [
      'Natural language itinerary modifications',
      'Activity suggestions and replacements', 
      'Schedule optimization',
      'Budget-friendly alternatives',
      'Cultural and food recommendations'
    ]
  })
} 