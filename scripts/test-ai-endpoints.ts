#!/usr/bin/env node
/**
 * Test script for AI endpoints
 * Run with: npx tsx scripts/test-ai-endpoints.ts
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  status: 'pass' | 'fail';
  message: string;
  response?: any;
  error?: any;
}

const results: TestResult[] = [];

// Test form-chat endpoint
async function testFormChat() {
  console.log('\n🔍 Testing /api/form-chat...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/form-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I want to visit Peru and Brazil',
        conversationHistory: [
          {
            id: '1',
            content: 'Hi! I want to plan a trip.',
            role: 'user',
            timestamp: new Date()
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      if (data.response || data.fallbackResponse) {
        results.push({
          endpoint: '/api/form-chat',
          status: 'pass',
          message: data.warning || 'Successfully received response',
          response: data
        });
      } else {
        results.push({
          endpoint: '/api/form-chat',
          status: 'fail',
          message: 'No response content received',
          response: data
        });
      }
    } else {
      results.push({
        endpoint: '/api/form-chat',
        status: 'fail',
        message: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
        error: data
      });
    }
  } catch (error) {
    console.error('Error:', error);
    results.push({
      endpoint: '/api/form-chat',
      status: 'fail',
      message: 'Failed to connect to endpoint',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Test extract-form-data endpoint
async function testExtractFormData() {
  console.log('\n🔍 Testing /api/extract-form-data...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/extract-form-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: [
          {
            id: '1',
            content: 'I want to visit Peru and Brazil',
            role: 'user',
            timestamp: new Date()
          },
          {
            id: '2',
            content: 'Great! When are you planning to travel?',
            role: 'assistant',
            timestamp: new Date()
          },
          {
            id: '3',
            content: 'Next month, for about 2 weeks. My budget is around $3000 per person.',
            role: 'user',
            timestamp: new Date()
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.data) {
      results.push({
        endpoint: '/api/extract-form-data',
        status: 'pass',
        message: 'Successfully extracted form data',
        response: data
      });
    } else {
      results.push({
        endpoint: '/api/extract-form-data',
        status: 'fail',
        message: `Failed to extract data: ${data.error || 'Unknown error'}`,
        error: data
      });
    }
  } catch (error) {
    console.error('Error:', error);
    results.push({
      endpoint: '/api/extract-form-data',
      status: 'fail',
      message: 'Failed to connect to endpoint',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Test trips-ai/generate endpoint
async function testTripsAIGenerate() {
  console.log('\n🔍 Testing /api/trips-ai/generate...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/trips-ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Peru',
        dates: {
          from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        travelers: 2,
        budget: [2000, 3000],
        interests: ['culture', 'adventure', 'food']
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      results.push({
        endpoint: '/api/trips-ai/generate',
        status: 'pass',
        message: `Successfully generated itinerary in ${data.generationTime}ms`,
        response: data
      });
    } else {
      results.push({
        endpoint: '/api/trips-ai/generate',
        status: 'fail',
        message: `Failed to generate itinerary: ${data.error || 'Unknown error'}`,
        error: data
      });
    }
  } catch (error) {
    console.error('Error:', error);
    results.push({
      endpoint: '/api/trips-ai/generate',
      status: 'fail',
      message: 'Failed to connect to endpoint',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Check OpenAI configuration
function checkOpenAIConfig() {
  console.log('\n🔍 Checking OpenAI configuration...');
  
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.MODEL || 'gpt-4o-mini';
  const maxTokens = process.env.MAX_TOKENS || '4000';
  const temperature = process.env.TEMPERATURE || '0.7';
  
  console.log('OPENAI_API_KEY:', hasApiKey ? '✅ Configured' : '❌ Not configured');
  console.log('MODEL:', model);
  console.log('MAX_TOKENS:', maxTokens);
  console.log('TEMPERATURE:', temperature);
  
  if (!hasApiKey) {
    console.log('\n⚠️  Warning: OpenAI API key is not configured.');
    console.log('The endpoints will work but will return fallback responses.');
    console.log('To use AI features, set OPENAI_API_KEY in your .env.local file.');
  }
  
  results.push({
    endpoint: 'OpenAI Configuration',
    status: hasApiKey ? 'pass' : 'fail',
    message: hasApiKey ? 'OpenAI API key is configured' : 'OpenAI API key is not configured',
    response: { hasApiKey, model, maxTokens, temperature }
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting AI Endpoint Tests...');
  console.log('Base URL:', BASE_URL);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  checkOpenAIConfig();
  await testFormChat();
  await testExtractFormData();
  await testTripsAIGenerate();
  
  // Summary
  console.log('\n\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}: ${result.message}`);
  });
  
  console.log('\nTotal:', results.length);
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  
  if (failed === 0) {
    console.log('\n✨ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run tests
runTests().catch(console.error);