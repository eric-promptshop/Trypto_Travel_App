import OpenAI from 'openai';

export interface ParsedFields {
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  budget?: string;
  accommodation?: string;
  interests?: string[];
  transportation?: string[];
  specialRequests?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For client-side usage
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
Today's date is ${new Date().toISOString().split('T')[0]}.`;

// Enhanced logging
const log = (category: string, ...args: any[]) => {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('debug-voice')) {
    console.log(`[VoiceParser-AI-${category}]`, ...args);
  }
};

// Parse voice transcript using OpenAI
export async function parseVoiceTranscript(transcript: string): Promise<ParsedFields> {
  log('Main', 'Parsing transcript with AI:', transcript);
  
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript }
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    log('AI', 'Raw response:', responseText);
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(responseText);
    log('AI', 'Parsed JSON:', parsed);
    
    // Convert date strings to Date objects
    const result: ParsedFields = {};
    
    if (parsed.destination) result.destination = parsed.destination;
    if (parsed.startDate) {
      result.startDate = new Date(parsed.startDate);
      log('AI', 'Converted startDate:', parsed.startDate, '->', result.startDate);
    }
    if (parsed.endDate) {
      result.endDate = new Date(parsed.endDate);
      log('AI', 'Converted endDate:', parsed.endDate, '->', result.endDate);
    }
    if (parsed.travelers) result.travelers = parseInt(parsed.travelers);
    if (parsed.budget) result.budget = parsed.budget.toString();
    if (parsed.accommodation) result.accommodation = parsed.accommodation;
    if (parsed.interests) result.interests = parsed.interests;
    if (parsed.transportation) result.transportation = parsed.transportation;
    if (parsed.specialRequests) result.specialRequests = parsed.specialRequests;
    
    log('Main', 'Final result:', result);
    return result;
    
  } catch (error) {
    console.error('[VoiceParser-AI] Error:', error);
    
    // Fallback to basic parsing if AI fails
    log('Main', 'Falling back to basic parsing');
    return fallbackParse(transcript);
  }
}

// Simple fallback parser for when AI is unavailable
function fallbackParse(transcript: string): ParsedFields {
  const result: ParsedFields = {};
  
  // Store the full transcript as special requests
  result.specialRequests = transcript;
  
  // Try to extract basic number of travelers
  const travelersMatch = transcript.match(/(\d+)\s+(?:people|persons?|travelers?)/i);
  if (travelersMatch) {
    result.travelers = parseInt(travelersMatch[1]);
  }
  
  return result;
}

// Export debug control
export function enableVoiceDebug(enable: boolean = true) {
  if (typeof window !== 'undefined') {
    if (enable) {
      window.localStorage.setItem('debug-voice', 'true');
      console.log('Voice parser AI debugging enabled');
    } else {
      window.localStorage.removeItem('debug-voice');
      console.log('Voice parser AI debugging disabled');
    }
  }
}