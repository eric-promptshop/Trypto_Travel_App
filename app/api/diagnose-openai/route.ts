import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiKey: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length,
      prefix: process.env.OPENAI_API_KEY?.substring(0, 20) + '...',
      startsWithSk: process.env.OPENAI_API_KEY?.startsWith('sk-') || false
    },
    modelConfig: {
      model: process.env.MODEL || 'not set',
      maxTokens: process.env.MAX_TOKENS || 'not set',
      temperature: process.env.TEMPERATURE || 'not set'
    }
  }
  
  // Test 1: Direct API call
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })
    
    diagnostics.directApiCall = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      diagnostics.directApiCall.error = errorData
    }
  } catch (error: any) {
    diagnostics.directApiCall = {
      success: false,
      error: error.message
    }
  }
  
  // Test 2: OpenAI SDK initialization
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
    
    diagnostics.sdkInit = { success: true }
    
    // Test 3: Simple completion
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "test"' }],
        max_tokens: 5
      })
      
      diagnostics.completion = {
        success: true,
        model: completion.model,
        response: completion.choices[0]?.message?.content
      }
    } catch (error: any) {
      diagnostics.completion = {
        success: false,
        error: error.message,
        type: error.constructor.name,
        code: error.code,
        status: error.status
      }
    }
  } catch (error: any) {
    diagnostics.sdkInit = {
      success: false,
      error: error.message
    }
  }
  
  return NextResponse.json(diagnostics)
}