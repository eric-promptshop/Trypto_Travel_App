#!/usr/bin/env ts-node

import fetch from 'node-fetch';

async function testExtraction() {
  const testMessages = [
    {
      message: "I want to plan a trip to Paris from March 15 to March 22, 2025 for 2 adults and 1 child with a budget of $5000 total",
      expected: {
        destinations: ["Paris"],
        dates: true,
        travelers: true,
        budget: true
      }
    },
    {
      message: "Planning a vacation to Tokyo and Kyoto in Japan for 4 people in May 2025, interested in temples, food tours, and hiking",
      expected: {
        destinations: ["Tokyo", "Kyoto", "Japan"],
        dates: true,
        travelers: true,
        interests: true
      }
    }
  ];

  for (const test of testMessages) {
    console.log('\n📋 Testing:', test.message);
    
    const response = await fetch('http://localhost:3000/api/extract-form-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: [
          { id: '1', content: test.message, role: 'user', timestamp: new Date() }
        ]
      })
    });
    
    const result = await response.json();
    console.log('📊 Extracted:', JSON.stringify(result.data, null, 2));
    console.log('✅ Completeness:', result.data.completeness + '%');
  }
}

testExtraction().catch(console.error);