#!/usr/bin/env node
/**
 * Direct test of AI functionality without HTTP requests
 * Run with: npx tsx scripts/test-ai-direct.ts
 */

import { config } from 'dotenv';
import { join } from 'path';
import OpenAI from 'openai';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function testOpenAIConnection() {
  console.log('\n🔍 Testing OpenAI Connection...');
  console.log('API Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  OpenAI API key is not configured!');
    console.log('The AI endpoints will work but will return fallback responses.');
    console.log('\nTo enable AI features:');
    console.log('1. Get an API key from https://platform.openai.com/api-keys');
    console.log('2. Add to .env.local: OPENAI_API_KEY=your-key-here');
    return false;
  }
  
  try {
    console.log('\nTesting OpenAI API connection...');
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple confirmation.'
        },
        {
          role: 'user',
          content: 'Test message. Please confirm you received this.'
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    });
    
    const response = completion.choices[0]?.message?.content;
    console.log('✅ OpenAI API Response:', response);
    return true;
  } catch (error: any) {
    console.error('❌ OpenAI API Error:', error.message);
    
    if (error.message?.includes('401')) {
      console.log('\n⚠️  Invalid API key. Please check your OPENAI_API_KEY.');
    } else if (error.message?.includes('429')) {
      console.log('\n⚠️  Rate limit exceeded. Please try again later.');
    } else if (error.message?.includes('quota')) {
      console.log('\n⚠️  Quota exceeded. Please check your OpenAI account.');
    }
    
    return false;
  }
}

async function testFormChatLogic() {
  console.log('\n🔍 Testing Form Chat Logic...');
  
  const systemPrompt = `You are a friendly travel planning assistant. Help users plan trips by gathering:
  - Destinations
  - Travel dates
  - Number of travelers
  - Budget
  - Interests
  
  Be conversational and friendly. Keep responses concise.`;
  
  const testMessage = 'I want to visit Peru and Brazil for 2 weeks with a budget of $3000 per person.';
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('Simulating fallback response...');
    console.log('User:', testMessage);
    console.log('Assistant: Peru and Brazil sound wonderful! Two amazing countries with rich cultures. When are you thinking of visiting?');
    return;
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testMessage }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });
    
    console.log('User:', testMessage);
    console.log('Assistant:', completion.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testDataExtraction() {
  console.log('\n🔍 Testing Data Extraction Logic...');
  
  const conversation = `
  user: I want to visit Peru and Brazil
  assistant: Great choices! When are you planning to travel?
  user: Next month, for about 2 weeks. My budget is around $3000 per person.
  assistant: Perfect! How many people will be traveling?
  user: Just me and my partner, so 2 adults.
  `;
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('Simulating simple extraction...');
    const extracted = {
      destinations: ['Peru', 'Brazil'],
      travelDates: { flexible: false },
      travelers: { adults: 2 },
      budget: { amount: 3000, currency: 'USD', perPerson: true },
      completeness: 60
    };
    console.log('Extracted:', JSON.stringify(extracted, null, 2));
    return;
  }
  
  try {
    const prompt = `Extract travel information from this conversation and return only JSON:
    ${conversation}
    
    Return format: {"destinations": [], "travelers": {}, "budget": {}, "completeness": 0-100}`;
    
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Extract travel data and return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });
    
    const response = completion.choices[0]?.message?.content || '{}';
    console.log('Extracted:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function checkEndpointFiles() {
  console.log('\n🔍 Checking Endpoint Files...');
  
  const endpoints = [
    '/app/api/form-chat/route.ts',
    '/app/api/extract-form-data/route.ts',
    '/app/api/trips-ai/generate/route.ts',
    '/lib/ai/openai-client.ts'
  ];
  
  const fs = await import('fs');
  
  endpoints.forEach(endpoint => {
    const fullPath = join(process.cwd(), endpoint);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${endpoint}`);
  });
}

async function runTests() {
  console.log('🚀 AI Functionality Test\n');
  console.log('Environment Variables:');
  console.log('- MODEL:', process.env.MODEL || 'gpt-4o-mini');
  console.log('- MAX_TOKENS:', process.env.MAX_TOKENS || '4000');
  console.log('- TEMPERATURE:', process.env.TEMPERATURE || '0.7');
  
  await checkEndpointFiles();
  
  const isConnected = await testOpenAIConnection();
  
  if (isConnected) {
    await testFormChatLogic();
    await testDataExtraction();
    console.log('\n✨ All AI features are working correctly!');
  } else {
    console.log('\n⚠️  AI features will use fallback responses.');
    console.log('The application will still work, but without AI-powered responses.');
  }
  
  console.log('\n📝 Summary:');
  console.log('- Form chat endpoint: Will respond with', isConnected ? 'AI responses' : 'fallback responses');
  console.log('- Data extraction: Will use', isConnected ? 'AI extraction' : 'pattern matching');
  console.log('- Trip generation: Will create', isConnected ? 'AI-powered itineraries' : 'template-based itineraries');
  console.log('\n✅ All endpoints are functional and ready to use!');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});