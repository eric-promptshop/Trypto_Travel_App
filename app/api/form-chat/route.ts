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
  let message = ''
  let conversationHistory: Message[] = []
  let extractedData: any = {}
  
  try {
    const body = await request.json()
    message = body.message || ''
    conversationHistory = body.conversationHistory || []
    extractedData = body.extractedData || {}

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using smart fallback responses')
      return NextResponse.json({
        response: getSmartFallbackResponse(message, conversationHistory, extractedData),
        isAI: false,
        warning: 'OpenAI API key not configured',
        success: true
      })
    }
    
    // Validate API key format (allow service account keys which are longer)
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error('Invalid OpenAI API key format detected. Key should start with sk-')
      return NextResponse.json({
        response: getSmartFallbackResponse(message, conversationHistory, extractedData),
        isAI: false,
        warning: 'OpenAI API key appears to be invalid',
        debugInfo: 'API key should start with sk-',
        success: true
      })
    }

    // Convert conversation history to OpenAI format
    const messages = conversationHistory.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
    
    console.log('Processing messages:', messages.length, 'Extracted data:', extractedData)

    // Add system prompt for travel planning context
    const collectedInfo = extractedData ? `
      Already collected information:
      ${extractedData.destinations?.length ? `- Destinations: ${extractedData.destinations.join(', ')}` : ''}
      ${extractedData.travelDates?.startDate ? `- Travel dates: ${extractedData.travelDates.startDate} to ${extractedData.travelDates.endDate || 'not specified'}` : ''}
      ${extractedData.travelers?.adults ? `- Travelers: ${extractedData.travelers.adults} adults${extractedData.travelers.children ? `, ${extractedData.travelers.children} children` : ''}` : ''}
      ${extractedData.budget?.amount ? `- Budget: ${extractedData.budget.currency || '$'}${extractedData.budget.amount} ${extractedData.budget.perPerson ? 'per person' : 'total'}` : ''}
      ${extractedData.accommodation ? `- Accommodation: ${extractedData.accommodation}` : ''}
      ${extractedData.interests?.length ? `- Interests: ${extractedData.interests.join(', ')}` : ''}
      ${extractedData.specialRequirements ? `- Special requirements: ${extractedData.specialRequirements}` : ''}
    ` : ''
    
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

      ${collectedInfo ? `\nThe user has already provided the following information:\n${collectedInfo}\n\nDo not ask for information that has already been provided. Instead, acknowledge what you know and ask for missing details or offer to refine/expand on what they've shared.` : ''}

      Be conversational, ask follow-up questions about MISSING information only, and guide users naturally through the planning process. Keep responses concise and friendly. When you have enough information (at least destination, dates, and travelers), suggest they can proceed to view their itinerary or continue adding more details.
      
      IMPORTANT: If the user's message already contains trip information (destinations, dates, travelers, budget, etc.), acknowledge ALL of it in your response and ask only about missing details. Do not ask for information that was just provided.`
    }

    // Call OpenAI API
    const modelToUse = process.env.MODEL || 'gpt-3.5-turbo' // Use gpt-3.5-turbo as fallback
    console.log('Using model:', modelToUse)
    
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [systemPrompt, ...messages],
      max_tokens: parseInt(process.env.MAX_TOKENS || '500'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    })

    const response = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      response,
      isAI: true,
      success: true
    })

  } catch (error: any) {
    console.error('Form chat error:', error)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error status:', error.status)
    console.error('Error response:', error.response)
    
    // Provide more specific error messages
    let errorMessage = "I'm having trouble connecting right now. Let me help you plan your trip! What destination are you thinking about?"
    let debugInfo = error.message || ""
    let errorCode = error.code || error.status || ""
    
    if (error instanceof Error) {
      // Check for OpenAI specific errors
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        debugInfo = 'Invalid OpenAI API key'
        errorMessage = "I'm having trouble with my connection. While we fix this, tell me about your dream destination!"
      } else if (error.message.includes('429')) {
        debugInfo = 'OpenAI API rate limit exceeded'
        errorMessage = "I'm a bit busy right now. Let's take a moment - what destination are you considering?"
      } else if (error.message.includes('insufficient_quota') || error.message.includes('quota')) {
        debugInfo = 'OpenAI API quota exceeded'
        errorMessage = "I'm having some technical difficulties. But I'd still love to hear about where you want to go!"
      } else if (error.message.includes('model')) {
        debugInfo = `Model error: ${error.message}`
        errorMessage = "I'm having trouble with the AI model. Let me help you plan your trip manually!"
      }
    }
    
    // Log environment info for debugging
    console.error('Environment check:')
    console.error('- API Key exists:', !!process.env.OPENAI_API_KEY)
    console.error('- API Key length:', process.env.OPENAI_API_KEY?.length)
    console.error('- API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...')
    console.error('- Model:', process.env.MODEL || 'gpt-4o-mini')
    
    // Use smart fallback on error
    const fallbackResponse = getSmartFallbackResponse(message, conversationHistory, extractedData)
    
    // Return more detailed error info
    return NextResponse.json({
      response: fallbackResponse,
      isAI: false,
      error: error instanceof Error ? error.message : 'Failed to process chat',
      errorCode,
      debugInfo,
      success: true // Keep true to avoid breaking UI
    }, { status: 200 })
  }
}

function getSmartFallbackResponse(message: string, conversationHistory: Message[], extractedData: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Check what information we already have
  const hasDestination = extractedData?.destinations?.length > 0
  const hasDates = extractedData?.travelDates?.startDate
  const hasTravelers = extractedData?.travelers?.adults > 0
  const hasBudget = extractedData?.budget?.amount > 0
  const hasAccommodation = extractedData?.accommodation
  const hasInterests = extractedData?.interests?.length > 0
  
  // Initial greeting
  if (conversationHistory.length === 0 || (lowerMessage.includes('hello') || lowerMessage.includes('hi'))) {
    return "Hi there! I'm here to help you plan an amazing trip. What destination have you been dreaming about?"
  }
  
  // Context-aware responses based on what we already know
  if (!hasDestination) {
    return "I'd love to help plan your trip! Where are you thinking of going?"
  }
  
  if (hasDestination && !hasDates) {
    const dest = extractedData.destinations[0]
    return `${dest} sounds amazing! When are you planning to visit? Do you have specific dates in mind?`
  }
  
  if (hasDestination && hasDates && !hasTravelers) {
    return "Great! How many people will be joining you on this trip? Any children?"
  }
  
  if (hasDestination && hasDates && hasTravelers && !hasBudget) {
    return "Perfect! What's your approximate budget for this trip? This helps me suggest the best options for you."
  }
  
  if (hasDestination && hasDates && hasTravelers && hasBudget && !hasAccommodation) {
    return "Excellent! What type of accommodation do you prefer? Hotels, vacation rentals, or something else?"
  }
  
  if (hasDestination && hasDates && hasTravelers && hasBudget && hasAccommodation && !hasInterests) {
    return "Almost there! What activities or experiences are you most interested in during your trip?"
  }
  
  // If we have most information, suggest moving forward
  const completeness = extractedData?.completeness || 0
  if (completeness >= 70) {
    return "I have gathered great information about your trip! You can now click 'View Your Itinerary' to see your personalized travel plan, or tell me if there's anything else you'd like to add."
  }
  
  // Acknowledge specific inputs
  if (lowerMessage.includes('budget')) {
    return hasBudget ? 
      `Got it! Your budget of ${extractedData.budget.currency || '$'}${extractedData.budget.amount} will help me find the best options.` :
      "What's your approximate budget for this trip?"
  }
  
  if (lowerMessage.includes('date') || lowerMessage.includes('when')) {
    return hasDates ?
      `Perfect! I have your travel dates recorded.` :
      "When are you planning to travel? Please share your preferred dates."
  }
  
  // Default contextual response
  const missingInfo = []
  if (!hasDestination) missingInfo.push("destination")
  if (!hasDates) missingInfo.push("travel dates")
  if (!hasTravelers) missingInfo.push("number of travelers")
  if (!hasBudget) missingInfo.push("budget")
  if (!hasAccommodation) missingInfo.push("accommodation preference")
  if (!hasInterests) missingInfo.push("interests or activities")
  
  if (missingInfo.length > 0) {
    return `Thanks for that information! To complete your trip planning, I'll need to know about your ${missingInfo.slice(0, 2).join(' and ')}.`
  }
  
  return "That sounds wonderful! Is there anything specific you'd like to add to your trip plans?"
}