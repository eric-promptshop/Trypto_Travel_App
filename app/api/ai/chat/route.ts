import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

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
      // Return a mock response for demo purposes
      return new Response(
        'I apologize, but the AI service is not configured yet. To enable AI features, please add your OpenAI API key to the environment variables. For now, you can use the category buttons below to explore places!',
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      )
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
    
    // Build system prompt
    const systemPrompt = `You are TripNav AI, a friendly and knowledgeable travel assistant. 
    You provide personalized travel recommendations and answer questions about destinations.
    
    Keep responses concise but informative. Use markdown for formatting.
    When suggesting places, include:
    - Why it's worth visiting
    - Best time to go
    - Approximate cost
    - Local tips
    
    Current context:
    - Destination: ${context?.destination || 'Not specified'}
    - User is planning a trip
    
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
    
    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages,
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.MAX_TOKENS || '500'),
      stream: true
    })
    
    // Return streaming response
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })
    
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
    
  } catch (error) {
    console.error('[AI Chat API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}