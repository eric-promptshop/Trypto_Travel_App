import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not found in environment variables',
        hasKey: false
      })
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })
    
    // Try a simple API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "API is working!" in 5 words or less.' }
      ],
      max_tokens: 20,
    })
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API connection successful',
      response: completion.choices[0]?.message?.content,
      model: completion.model,
      hasKey: true,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...'
    })
    
  } catch (error: any) {
    console.error('OpenAI test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.type || error.code || 'unknown',
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
    })
  }
}