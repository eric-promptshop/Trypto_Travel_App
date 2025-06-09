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

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using fallback responses')
      return NextResponse.json({
        fallbackResponse: getFallbackResponse(message, conversationHistory),
        warning: 'OpenAI API key not configured'
      })
    }

    // Convert conversation history to OpenAI format
    const messages = conversationHistory.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Add system prompt for travel planning context
    const systemPrompt = {
      role: 'system',
      content: `You are a friendly and knowledgeable travel planning assistant. Help users plan their trips by gathering information about:
      - Destination(s)
      - Travel dates (start and end date, flexibility)
      - Number of travelers (adults, children)
      - Budget (amount, currency, per person or total)
      - Accommodation preferences
      - Interests and activities
      - Special requirements

      Be conversational, ask follow-up questions, and guide users naturally through the planning process. Keep responses concise and friendly.`
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [systemPrompt, ...messages],
      max_tokens: parseInt(process.env.MAX_TOKENS || '500'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    })

    const response = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      response,
      success: true
    })

  } catch (error) {
    console.error('Form chat error:', error)
    
    // Return fallback response on error
    return NextResponse.json({
      fallbackResponse: "I'm having trouble connecting right now. Let me help you plan your trip! What destination are you thinking about?",
      error: error instanceof Error ? error.message : 'Failed to process chat'
    }, { status: 200 }) // Return 200 to avoid breaking the UI
  }
}

function getFallbackResponse(message: string, conversationHistory: Message[]): string {
  const lowerMessage = message.toLowerCase()
  
  // Simple pattern matching for common travel planning topics
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || conversationHistory.length === 1) {
    return "Hi there! I'm here to help you plan an amazing trip. What destination have you been dreaming about?"
  }
  
  if (lowerMessage.includes('paris') || lowerMessage.includes('france')) {
    return "Paris is wonderful! The city of lights has so much to offer. When are you thinking of visiting?"
  }
  
  if (lowerMessage.includes('tokyo') || lowerMessage.includes('japan')) {
    return "Tokyo is an incredible destination! From modern technology to ancient temples. What time of year are you planning to go?"
  }
  
  if (lowerMessage.includes('budget')) {
    return "Let's talk about your budget. What's your approximate budget per person for this trip?"
  }
  
  if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation')) {
    return "For accommodation, are you looking for hotels, Airbnb, hostels, or something specific?"
  }
  
  if (lowerMessage.includes('date') || lowerMessage.includes('when')) {
    return "What dates are you planning to travel? And are your dates flexible?"
  }
  
  if (lowerMessage.includes('people') || lowerMessage.includes('travelers')) {
    return "How many people will be traveling? Any children?"
  }
  
  // Default response
  return "That sounds interesting! Can you tell me more about what you're looking for in your trip?"
}