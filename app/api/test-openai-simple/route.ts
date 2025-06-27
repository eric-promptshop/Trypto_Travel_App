import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const keyLength = process.env.OPENAI_API_KEY?.length || 0
  const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 10) || 'not-set'
  
  // Simple test if we can call OpenAI
  let canCallOpenAI = false
  let openAIError = null
  
  if (hasOpenAIKey) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      canCallOpenAI = response.ok
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        openAIError = errorData.error?.message || `HTTP ${response.status}`
      }
    } catch (error) {
      openAIError = error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasOpenAIKey,
    keyLength,
    keyPrefix: keyPrefix + '...',
    canCallOpenAI,
    openAIError,
    timestamp: new Date().toISOString()
  })
}