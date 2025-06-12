import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  const results: any = {}
  
  const models = [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0125',
    'gpt-4',
    'gpt-4-turbo-preview',
    'gpt-4o',
    'gpt-4o-mini'
  ]
  
  for (const model of models) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      })
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "OK" in one word.' }
        ],
        max_tokens: 10,
      })
      
      results[model] = {
        success: true,
        response: completion.choices[0]?.message?.content,
      }
    } catch (error: any) {
      results[model] = {
        success: false,
        error: error.message,
        code: error.code || error.status
      }
    }
  }
  
  return NextResponse.json({
    apiKeyExists: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY?.length,
    results
  })
}