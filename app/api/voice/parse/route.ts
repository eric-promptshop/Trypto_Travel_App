import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for parsing travel details
const SYSTEM_PROMPT = `You are a travel assistant that extracts structured information from natural language.
Extract the following information from the user's speech:
- destination: The place they want to visit (city, country, or region)
- startDate: When they want to start their trip (format: YYYY-MM-DD)
- endDate: When they want to end their trip (format: YYYY-MM-DD)
- travelers: Number of people traveling (as a number)
- budget: Their budget amount (just the number, no currency symbols or commas)
- accommodation: Type of accommodation (hotel, airbnb, hostel, resort)
- interests: List of interests or activities
- transportation: Preferred transportation methods
- specialRequests: Any special occasions or requirements

Return ONLY a JSON object with these fields. If a field is not mentioned, omit it from the response.
For dates, use the current year (${new Date().getFullYear()}) if no year is specified.
Today's date is ${new Date().toISOString().split('T')[0]}.

Examples:
- "with my wife" means 2 travelers
- "family of 4" means 4 travelers
- "just me" or "solo" means 1 traveler
- "10:00 to 19 July" means July 10 to July 19 (the 10:00 is a misheard date, not a time)
- "$10,000 in total" means budget is 10000
- "really nice hotel" means accommodation is hotel`;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      );
    }

    console.log('[Voice Parse API] Parsing transcript:', transcript);

    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript }
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    console.log('[Voice Parse API] AI response:', responseText);
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(responseText);
    
    // Convert date strings to ensure they're valid
    if (parsed.startDate) {
      const date = new Date(parsed.startDate);
      if (!isNaN(date.getTime())) {
        parsed.startDate = date.toISOString();
      } else {
        delete parsed.startDate;
      }
    }
    
    if (parsed.endDate) {
      const date = new Date(parsed.endDate);
      if (!isNaN(date.getTime())) {
        parsed.endDate = date.toISOString();
      } else {
        delete parsed.endDate;
      }
    }
    
    // Ensure travelers is a number
    if (parsed.travelers) {
      parsed.travelers = parseInt(parsed.travelers);
    }
    
    // Ensure budget is a string without formatting
    if (parsed.budget) {
      parsed.budget = parsed.budget.toString().replace(/[^0-9]/g, '');
    }

    console.log('[Voice Parse API] Processed result:', parsed);
    
    return NextResponse.json(parsed);
    
  } catch (error) {
    console.error('[Voice Parse API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse transcript', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}