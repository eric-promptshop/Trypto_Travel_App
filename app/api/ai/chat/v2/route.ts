import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Dynamic import to handle missing API key gracefully
let openai: any
try {
  const openaiModule = require('@/lib/openai')
  openai = openaiModule.openai
} catch (error) {
  console.warn('OpenAI not configured:', error)
}

const chatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    destination: z.string().optional(),
    currentDay: z.any().optional(),
    previousMessages: z.array(z.any()).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      // Return a mock response with recommendations for demo
      const mockResponse = {
        content: `I'd be happy to help you explore Paris! Here are some must-visit attractions:

**Eiffel Tower** - The iconic symbol of Paris offers breathtaking views of the city. Visit early morning or late evening to avoid crowds.

**Louvre Museum** - Home to thousands of works of art including the Mona Lisa. Book tickets online to skip the queues.

**Musée Rodin** - A beautiful museum dedicated to the sculptor Auguste Rodin, featuring his famous works in a charming garden setting.`,
        recommendations: [
          {
            id: 'rec-1',
            type: 'place',
            name: 'Eiffel Tower',
            description: 'Iconic iron lattice tower offering panoramic views of Paris from its observation decks.',
            openingHours: '9:30 AM - 11:45 PM',
            price: '€25-35',
            priceLevel: 3,
            rating: 4.7,
            location: {
              lat: 48.8584,
              lng: 2.2945,
              address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris'
            },
            category: 'attraction'
          },
          {
            id: 'rec-2',
            type: 'place',
            name: 'Louvre Museum',
            description: 'World\'s largest art museum housing thousands of works including the Mona Lisa.',
            openingHours: '9:00 AM - 6:00 PM',
            price: '€17',
            priceLevel: 2,
            rating: 4.8,
            location: {
              lat: 48.8606,
              lng: 2.3376,
              address: 'Rue de Rivoli, 75001 Paris'
            },
            category: 'activity'
          },
          {
            id: 'rec-3',
            type: 'place',
            name: 'Musée Rodin',
            description: 'Beautiful museum showcasing Rodin\'s sculptures in an elegant mansion with gardens.',
            openingHours: '10:00 AM - 6:30 PM',
            price: '€13',
            priceLevel: 2,
            rating: 4.6,
            location: {
              lat: 48.8553,
              lng: 2.3165,
              address: '77 Rue de Varenne, 75007 Paris'
            },
            category: 'activity'
          }
        ]
      }
      
      return NextResponse.json(mockResponse)
    }

    const body = await request.json()
    const validation = chatRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const { message, context } = validation.data
    
    // Build system prompt with structured output instructions
    const systemPrompt = `You are TripNav AI, a friendly and knowledgeable travel assistant. 
    You provide personalized travel recommendations and answer questions about destinations.
    
    When recommending specific places to visit, structure your response to include:
    - Clear recommendations with names and descriptions
    - Opening hours, price ranges, and ratings when available
    - Why each place is worth visiting
    
    Current context:
    - Destination: ${context?.destination || 'Not specified'}
    - User is planning a trip
    
    Keep responses concise but informative. Use markdown for formatting.
    Be conversational, helpful, and enthusiastic about travel!`
    
    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt }
    ]
    
    // Add previous messages for context (last 4)
    if (context?.previousMessages) {
      context.previousMessages.slice(-4).forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      })
    }
    
    // Add current message
    messages.push({ role: 'user' as const, content: message })
    
    // Get AI response
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages,
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.MAX_TOKENS || '500')
    })
    
    const aiContent = completion.choices[0]?.message?.content || ''
    
    // Extract recommendations from the AI response
    const recommendations = extractRecommendationsFromContent(aiContent, context?.destination)
    
    return NextResponse.json({
      content: aiContent,
      recommendations
    })
    
  } catch (error) {
    console.error('[AI Chat API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}

// Helper function to extract structured recommendations from AI content
function extractRecommendationsFromContent(content: string, destination?: string): any[] {
  const recommendations: any[] = []
  
  // Look for recommendation patterns
  // This is simplified - in production you'd use more sophisticated NLP
  const lines = content.split('\n')
  let currentRec: any = null
  
  lines.forEach(line => {
    // Check for place names (usually in bold or as headers)
    const placeMatch = line.match(/\*\*([^*]+)\*\*|^#+\s+(.+)/)
    if (placeMatch) {
      if (currentRec) {
        recommendations.push(currentRec)
      }
      currentRec = {
        id: `rec-${Date.now()}-${Math.random()}`,
        type: 'place',
        name: placeMatch[1] || placeMatch[2],
        description: '',
        category: 'attraction'
      }
    } else if (currentRec && line.trim()) {
      // Add to description
      currentRec.description += line.trim() + ' '
      
      // Extract additional info
      if (line.includes('€') || line.includes('$')) {
        const priceMatch = line.match(/[€$]\s*(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)/i)
        if (priceMatch) {
          currentRec.price = priceMatch[0]
          currentRec.priceLevel = priceMatch[1].includes('-') ? 3 : 2
        }
      }
      
      if (line.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/)) {
        const hoursMatch = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i)
        if (hoursMatch) {
          currentRec.openingHours = hoursMatch[1]
        }
      }
    }
  })
  
  if (currentRec) {
    recommendations.push(currentRec)
  }
  
  // Clean up and add default values
  return recommendations
    .filter(rec => rec.name && rec.name.length < 50)
    .map(rec => ({
      ...rec,
      description: rec.description.trim().substring(0, 160),
      openingHours: rec.openingHours || '9:00 AM - 6:00 PM',
      price: rec.price || '€10-20',
      priceLevel: rec.priceLevel || 2,
      rating: 4.5 + Math.random() * 0.4, // Demo ratings
      location: {
        lat: 48.8566 + (Math.random() - 0.5) * 0.1,
        lng: 2.3522 + (Math.random() - 0.5) * 0.1,
        address: destination || 'Paris, France'
      }
    }))
}