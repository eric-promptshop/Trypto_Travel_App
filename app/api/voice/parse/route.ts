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
- interests: Array of interests mentioned (e.g., ["culture", "food", "adventure", "relaxation", "nature", "shopping", "nightlife", "photography"])
- transportation: Preferred transportation methods
- specialRequests: Any special occasions or requirements

IMPORTANT DATE PARSING RULES:
- Today's date is ${new Date().toISOString().split('T')[0]}
- Current year is ${new Date().getFullYear()}
- If no year mentioned, use ${new Date().getFullYear()}
- "from X to Y" means startDate is X and endDate is Y
- "July 10th to July 19th" → startDate: "${new Date().getFullYear()}-07-10", endDate: "${new Date().getFullYear()}-07-19"
- "10 to 19 July" → startDate: "${new Date().getFullYear()}-07-10", endDate: "${new Date().getFullYear()}-07-19"
- "next week" → calculate from today's date
- "in 2 weeks" → start date is 14 days from today
- Common speech recognition errors: "10:00 to 19 July" likely means "10th to 19 July"

INTERESTS EXTRACTION:
Map user phrases to these exact interest values: culture, adventure, food, relaxation, nature, shopping, nightlife, photography
Examples:
- "we like museums and art" → ["culture"]
- "interested in food and wine" → ["food"]
- "want to see nature and go hiking" → ["nature", "adventure"]
- "love shopping and nightlife" → ["shopping", "nightlife"]
- "into photography" → ["photography"]
- "relaxing beach vacation" → ["relaxation"]
- "historical sites" → ["culture"]
- "local cuisine" → ["food"]
- "outdoor activities" → ["adventure"]
- "beaches" → ["relaxation"]

Return ONLY a JSON object with these fields. If a field is not mentioned, omit it from the response.

Examples:
- "with my wife" → travelers: 2
- "family of 4" → travelers: 4
- "$10,000 in total budget" → budget: "10000"
- "we like museums and good food" → interests: ["culture", "food"]`;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      );
    }


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
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(responseText);
    
    // Convert date strings to YYYY-MM-DD format
    if (parsed.startDate) {
      const date = new Date(parsed.startDate);
      if (!isNaN(date.getTime())) {
        parsed.startDate = date.toISOString().split('T')[0];
      } else {
        delete parsed.startDate;
      }
    }
    
    if (parsed.endDate) {
      const date = new Date(parsed.endDate);
      if (!isNaN(date.getTime())) {
        parsed.endDate = date.toISOString().split('T')[0];
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

    
    return NextResponse.json(parsed);
    
  } catch (error) {
    console.error('[Voice Parse API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse transcript', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}