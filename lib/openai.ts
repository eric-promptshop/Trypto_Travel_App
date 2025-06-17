import OpenAI from 'openai'

// Only initialize OpenAI if API key is available
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

// Export a helper for creating completions with default settings
export async function createCompletion(messages: any[], options?: any) {
  if (!openai) {
    throw new Error('OpenAI is not configured')
  }
  
  return openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    messages,
    temperature: 0.7,
    max_tokens: 500,
    ...options
  })
}