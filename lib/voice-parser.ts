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

interface ParsedToken {
  field: keyof ParsedFields;
  value: any;
  confidence: number;
  raw: string;
  pattern?: string;
}

interface FieldParser {
  field: keyof ParsedFields;
  patterns: Array<{
    regex: RegExp;
    confidence: number;
    extractor: (match: RegExpMatchArray) => any;
    description: string;
  }>;
}

// Debug logging utility
const debugLog = (category: string, ...args: any[]) => {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('debug-voice')) {
    console.log(`[Voice Parser - ${category}]`, ...args);
  }
};

// Month names for date parsing
const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

// Number words for parsing
const NUMBER_WORDS: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50
};

// Field-specific parsers with voice cue patterns
const FIELD_PARSERS: FieldParser[] = [
  // DESTINATION PARSER
  {
    field: 'destination',
    patterns: [
      {
        regex: /(?:destination is|my destination is)\s+([a-z\s,]+?)(?:\.|,|$)/i,
        confidence: 0.98,
        description: '"destination is Tokyo"',
        extractor: (match) => match[1].trim()
      },
      {
        regex: /(?:i'm going to|we're going to|going to)\s+([a-z\s,]+?)(?:\s+(?:for|from|on|leaving|departing)|[,.]|$)/i,
        confidence: 0.95,
        description: '"I\'m going to Paris"',
        extractor: (match) => match[1].trim()
      },
      {
        regex: /(?:travel to|traveling to|trip to|visiting|visit)\s+([a-z\s,]+?)(?:\s+(?:for|from|on)|[,.]|$)/i,
        confidence: 0.92,
        description: '"travel to London"',
        extractor: (match) => match[1].trim()
      },
      {
        regex: /(?:headed to|heading to|flying to)\s+([a-z\s,]+?)(?:\s+|[,.]|$)/i,
        confidence: 0.90,
        description: '"heading to Rome"',
        extractor: (match) => match[1].trim()
      },
      {
        regex: /^([a-z\s]+?)(?:\s+(?:for|from|on|in)\s+)/i,
        confidence: 0.70,
        description: '"Tokyo for 5 days"',
        extractor: (match) => match[1].trim()
      }
    ]
  },

  // DATE PARSER
  {
    field: 'startDate',
    patterns: [
      {
        regex: /leaving\s+(?:on\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i,
        confidence: 0.95,
        description: '"leaving on July 10th"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /departing\s+(?:on\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        confidence: 0.93,
        description: '"departing July 15"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /from\s+([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        confidence: 0.90,
        description: '"from August 1st"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /starting\s+(?:on\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        confidence: 0.88,
        description: '"starting June 20"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        confidence: 0.85,
        description: '"next Monday"',
        extractor: (match) => {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = days.indexOf(match[1].toLowerCase());
          const today = new Date();
          const currentDay = today.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7;
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + daysToAdd);
          return nextDate;
        }
      },
      {
        regex: /in\s+(\d+)\s+days?/i,
        confidence: 0.80,
        description: '"in 5 days"',
        extractor: (match) => {
          const days = parseInt(match[1]);
          const date = new Date();
          date.setDate(date.getDate() + days);
          return date;
        }
      }
    ]
  },

  // END DATE PARSER
  {
    field: 'endDate',
    patterns: [
      {
        regex: /returning\s+(?:on\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        confidence: 0.95,
        description: '"returning July 18th"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /(?:to|until|till)\s+([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        confidence: 0.90,
        description: '"until August 5"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /coming back\s+(?:on\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        confidence: 0.88,
        description: '"coming back September 1"',
        extractor: (match) => {
          const month = MONTHS[match[1].toLowerCase()];
          if (month === undefined) return null;
          const day = parseInt(match[2]);
          const year = new Date().getFullYear();
          return new Date(year, month, day);
        }
      },
      {
        regex: /for\s+(\d+)\s+(?:days?|nights?)/i,
        confidence: 0.85,
        description: '"for 7 days"',
        extractor: (match, context) => {
          // This needs the startDate to calculate
          if (context.startDate) {
            const days = parseInt(match[1]);
            const endDate = new Date(context.startDate);
            endDate.setDate(endDate.getDate() + days - 1);
            return endDate;
          }
          return null;
        }
      }
    ]
  },

  // TRAVELERS PARSER
  {
    field: 'travelers',
    patterns: [
      {
        regex: /with\s+(\d+)\s+adults?\s+and\s+(\d+)\s+(?:children|child|kids?)/i,
        confidence: 0.98,
        description: '"with 2 adults and 1 child"',
        extractor: (match) => parseInt(match[1]) + parseInt(match[2])
      },
      {
        regex: /(\d+)\s+adults?\s+(?:and\s+)?(\d+)\s+(?:children|child|kids?)/i,
        confidence: 0.95,
        description: '"2 adults 1 child"',
        extractor: (match) => parseInt(match[1]) + parseInt(match[2])
      },
      {
        regex: /party of\s+(\d+)/i,
        confidence: 0.95,
        description: '"party of 4"',
        extractor: (match) => parseInt(match[1])
      },
      {
        regex: /group of\s+(\d+)/i,
        confidence: 0.93,
        description: '"group of 6"',
        extractor: (match) => parseInt(match[1])
      },
      {
        regex: /(\d+)\s+(?:of us|people|persons?|travelers?|adults?)/i,
        confidence: 0.90,
        description: '"4 people"',
        extractor: (match) => parseInt(match[1])
      },
      {
        regex: /there(?:'s|'re| is| are| will be)\s+(\d+)\s+(?:of us)?/i,
        confidence: 0.88,
        description: '"there are 3 of us"',
        extractor: (match) => parseInt(match[1])
      },
      {
        regex: /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:people|persons?|of us)/i,
        confidence: 0.85,
        description: '"three people"',
        extractor: (match) => NUMBER_WORDS[match[1].toLowerCase()] || 0
      },
      {
        regex: /family of\s+(\d+)/i,
        confidence: 0.90,
        description: '"family of 5"',
        extractor: (match) => parseInt(match[1])
      },
      {
        regex: /\b(couple|two of us|just us two)\b/i,
        confidence: 0.92,
        description: '"couple"',
        extractor: () => 2
      },
      {
        regex: /\b(family|family trip|family vacation)\b/i,
        confidence: 0.75,
        description: '"family trip"',
        extractor: () => 4
      },
      {
        regex: /\b(solo|alone|by myself|just me)\b/i,
        confidence: 0.95,
        description: '"solo trip"',
        extractor: () => 1
      }
    ]
  },

  // BUDGET PARSER
  {
    field: 'budget',
    patterns: [
      {
        regex: /budget\s+(?:is\s+)?(?:around\s+)?\$?(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(?:dollars?)?\s*(?:per\s+person|each|pp)/i,
        confidence: 0.95,
        description: '"budget is $1500 per person"',
        extractor: (match) => match[1].replace(/,/g, '')
      },
      {
        regex: /\$(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(?:per\s+person|each|pp)/i,
        confidence: 0.92,
        description: '"$2000 per person"',
        extractor: (match) => match[1].replace(/,/g, '')
      },
      {
        regex: /(\d{1,3}(?:,?\d{3})*)\s*dollars?\s*(?:per\s+person|each|pp)/i,
        confidence: 0.90,
        description: '"1500 dollars each"',
        extractor: (match) => match[1].replace(/,/g, '')
      },
      {
        regex: /(one|two|three|four|five|ten|fifteen|twenty|thirty|forty|fifty)\s+thousand\s*(?:dollars?)?\s*(?:per\s+person|each|pp)?/i,
        confidence: 0.88,
        description: '"two thousand per person"',
        extractor: (match) => {
          const num = NUMBER_WORDS[match[1].toLowerCase()] || 0;
          return (num * 1000).toString();
        }
      },
      {
        regex: /(fifteen|twenty|thirty|forty|fifty)\s+hundred\s*(?:dollars?)?\s*(?:per\s+person|each|pp)?/i,
        confidence: 0.85,
        description: '"fifteen hundred dollars"',
        extractor: (match) => {
          const num = NUMBER_WORDS[match[1].toLowerCase()] || 0;
          return (num * 100).toString();
        }
      }
    ]
  },

  // ACCOMMODATION PARSER
  {
    field: 'accommodation',
    patterns: [
      {
        regex: /(?:prefer|preferring|want|wanting)\s+(?:a\s+)?(?:to stay in\s+)?(?:a\s+)?(hotel|airbnb|hostel|resort)/i,
        confidence: 0.95,
        description: '"prefer a hotel"',
        extractor: (match) => match[1].toLowerCase()
      },
      {
        regex: /stay(?:ing)?\s+(?:in|at)\s+(?:a\s+)?(hotel|airbnb|hostel|resort|vacation rental)/i,
        confidence: 0.92,
        description: '"staying in a hotel"',
        extractor: (match) => {
          const acc = match[1].toLowerCase();
          return acc === 'vacation rental' ? 'airbnb' : acc;
        }
      },
      {
        regex: /looking for\s+(?:a\s+)?(hotel|airbnb|hostel|resort|vacation rental)/i,
        confidence: 0.90,
        description: '"looking for a resort"',
        extractor: (match) => {
          const acc = match[1].toLowerCase();
          return acc === 'vacation rental' ? 'airbnb' : acc;
        }
      },
      {
        regex: /\b(hotel|airbnb|hostel|resort|all[- ]inclusive)\b/i,
        confidence: 0.80,
        description: '"hotel"',
        extractor: (match) => {
          const acc = match[1].toLowerCase();
          return acc.includes('inclusive') ? 'resort' : acc;
        }
      }
    ]
  },

  // INTERESTS PARSER
  {
    field: 'interests',
    patterns: [
      {
        regex: /interested\s+in\s+([a-z\s,]+?)(?:\.|$)/i,
        confidence: 0.95,
        description: '"interested in food and culture"',
        extractor: (match) => extractInterests(match[1])
      },
      {
        regex: /(?:we|i)\s+(?:like|love|enjoy)\s+([a-z\s,]+?)(?:\.|$)/i,
        confidence: 0.90,
        description: '"we like hiking and nature"',
        extractor: (match) => extractInterests(match[1])
      },
      {
        regex: /(?:into|really into)\s+([a-z\s,]+?)(?:\.|$)/i,
        confidence: 0.88,
        description: '"into nightlife and shopping"',
        extractor: (match) => extractInterests(match[1])
      },
      {
        regex: /for\s+(?:the\s+)?([a-z\s,]+?)\s+(?:scene|activities|experiences)/i,
        confidence: 0.85,
        description: '"for the food scene"',
        extractor: (match) => extractInterests(match[1])
      }
    ]
  },

  // TRANSPORTATION PARSER
  {
    field: 'transportation',
    patterns: [
      {
        regex: /(?:need|want|require)\s+([a-z\s,]+?)\s+(?:transportation|transport)/i,
        confidence: 0.92,
        description: '"need public transportation"',
        extractor: (match) => extractTransportation(match[1])
      },
      {
        regex: /(?:we'll|will)\s+(?:need|take|use)\s+([a-z\s,]+?)(?:\.|$)/i,
        confidence: 0.88,
        description: '"we\'ll need flights and trains"',
        extractor: (match) => extractTransportation(match[1])
      },
      {
        regex: /(?:transportation|transport):\s*([a-z\s,]+?)(?:\.|$)/i,
        confidence: 0.85,
        description: '"transportation: car rental"',
        extractor: (match) => extractTransportation(match[1])
      },
      {
        regex: /(?:by\s+)?(flights?|rental car|public (?:transport|transit)|train|walking)/i,
        confidence: 0.80,
        description: '"by train"',
        extractor: (match) => extractTransportation(match[1])
      }
    ]
  }
];

// Helper function to extract interests
function extractInterests(text: string): string[] {
  const interestMap: Record<string, string[]> = {
    culture: ['culture', 'cultural', 'museum', 'museums', 'history', 'historical', 'art', 'arts', 'temple', 'temples', 'heritage'],
    adventure: ['adventure', 'adventurous', 'hiking', 'hike', 'outdoor', 'outdoors', 'trekking', 'climbing', 'sports'],
    food: ['food', 'foodie', 'restaurant', 'restaurants', 'cuisine', 'dining', 'culinary', 'eat', 'eating'],
    relaxation: ['relax', 'relaxation', 'relaxing', 'spa', 'massage', 'beach', 'beaches', 'wellness', 'peaceful'],
    nature: ['nature', 'natural', 'park', 'parks', 'wildlife', 'scenery', 'landscape', 'mountains', 'forest'],
    shopping: ['shopping', 'shop', 'shops', 'market', 'markets', 'boutique', 'mall', 'stores'],
    nightlife: ['nightlife', 'night life', 'bar', 'bars', 'club', 'clubs', 'party', 'parties', 'dancing'],
    photography: ['photo', 'photos', 'photography', 'instagram', 'pictures', 'scenic', 'photogenic']
  };

  const found = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const [interest, keywords] of Object.entries(interestMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      found.add(interest);
    }
  }

  return Array.from(found);
}

// Helper function to extract transportation
function extractTransportation(text: string): string[] {
  const transportMap: Record<string, string[]> = {
    'flights': ['flight', 'flights', 'fly', 'flying', 'plane', 'planes', 'air travel'],
    'car-rental': ['car', 'rental car', 'rent a car', 'drive', 'driving', 'road trip'],
    'public-transport': ['public transport', 'public transit', 'subway', 'metro', 'bus', 'buses', 'train', 'trains', 'tram'],
    'walking': ['walk', 'walking', 'on foot', 'by foot']
  };

  const found = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const [transport, keywords] of Object.entries(transportMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      found.add(transport);
    }
  }

  return Array.from(found);
}

// Helper to format parsed values
function formatParsedValue(field: keyof ParsedFields, value: any): any {
  if (field === 'destination' && typeof value === 'string') {
    // Capitalize destination properly
    return value.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return value;
}

// Main parsing function
export function parseVoiceTranscript(transcript: string): ParsedFields {
  debugLog('Input', `Parsing transcript: "${transcript}"`);
  
  const parsedTokens: ParsedToken[] = [];
  const usedCharRanges: Array<[number, number]> = [];
  const context: Partial<ParsedFields> = {};

  // Process each field parser
  for (const fieldParser of FIELD_PARSERS) {
    debugLog('Field', `Processing field: ${fieldParser.field}`);
    
    for (const pattern of fieldParser.patterns) {
      const matches = Array.from(transcript.matchAll(new RegExp(pattern.regex, 'gi')));
      
      for (const match of matches) {
        if (!match.index) continue;
        
        // Check if this text was already used
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const isOverlapping = usedCharRanges.some(([start, end]) => 
          (matchStart >= start && matchStart < end) || 
          (matchEnd > start && matchEnd <= end)
        );
        
        if (isOverlapping) {
          debugLog('Skip', `Skipping overlapping match: "${match[0]}"`);
          continue;
        }
        
        try {
          // Extract value with context
          const value = pattern.extractor(match, context);
          
          if (value !== null && value !== undefined) {
            const formattedValue = formatParsedValue(fieldParser.field, value);
            
            parsedTokens.push({
              field: fieldParser.field,
              value: formattedValue,
              confidence: pattern.confidence,
              raw: match[0],
              pattern: pattern.description
            });
            
            usedCharRanges.push([matchStart, matchEnd]);
            
            // Update context for dependent fields
            if (fieldParser.field === 'startDate' && value instanceof Date) {
              context.startDate = value;
            }
            
            debugLog('Match', 
              `Field: ${fieldParser.field}`,
              `Pattern: ${pattern.description}`,
              `Matched: "${match[0]}"`,
              `Value: ${formattedValue}`,
              `Confidence: ${pattern.confidence}`
            );
            
            // For non-array fields, take the first high-confidence match
            if (!['interests', 'transportation'].includes(fieldParser.field)) {
              break;
            }
          }
        } catch (error) {
          debugLog('Error', `Error extracting value: ${error}`);
        }
      }
    }
  }

  // Apply confidence threshold and merge results
  const parsed: ParsedFields = {};
  const CONFIDENCE_THRESHOLD = 0.6;
  
  // Group tokens by field
  const tokensByField = new Map<keyof ParsedFields, ParsedToken[]>();
  for (const token of parsedTokens) {
    if (!tokensByField.has(token.field)) {
      tokensByField.set(token.field, []);
    }
    tokensByField.get(token.field)!.push(token);
  }
  
  // Process each field's tokens
  for (const [field, tokens] of tokensByField) {
    // Sort by confidence
    tokens.sort((a, b) => b.confidence - a.confidence);
    
    if (field === 'interests' || field === 'transportation') {
      // For array fields, merge all high-confidence values
      const values = new Set<string>();
      for (const token of tokens) {
        if (token.confidence >= CONFIDENCE_THRESHOLD) {
          (token.value as string[]).forEach(v => values.add(v));
        }
      }
      if (values.size > 0) {
        parsed[field] = Array.from(values);
      }
    } else {
      // For single-value fields, take the highest confidence value
      const bestToken = tokens[0];
      if (bestToken && bestToken.confidence >= CONFIDENCE_THRESHOLD) {
        parsed[field] = bestToken.value;
      } else if (bestToken) {
        debugLog('LowConfidence', 
          `Field: ${field}`,
          `Value: ${bestToken.value}`,
          `Confidence: ${bestToken.confidence} (below threshold)`
        );
      }
    }
  }
  
  // Log summary
  debugLog('Summary', 'Parsed fields:', parsed);
  
  // Log unparsed portions
  const allUsedText = usedCharRanges
    .sort((a, b) => a[0] - b[0])
    .map(([start, end]) => transcript.substring(start, end))
    .join(' | ');
  
  debugLog('Used', `Matched text: "${allUsedText}"`);
  
  // Find completely unparsed words (excluding common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'with', 'from', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'will', 'would', 
    'could', 'should', 'may', 'might', 'must', 'can', 'there', 'here', 'this', 'that', 
    'these', 'those', 'we', 'i', 'you', 'he', 'she', 'it', 'they', 'our', 'my', 'your']);
  
  const words = transcript.split(/\s+/);
  const unparsedWords: string[] = [];
  
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    if (cleanWord.length > 2 && !commonWords.has(cleanWord)) {
      // Check if this word is part of any used range
      let isUsed = false;
      const wordIndex = transcript.toLowerCase().indexOf(cleanWord);
      if (wordIndex >= 0) {
        isUsed = usedCharRanges.some(([start, end]) => 
          wordIndex >= start && wordIndex < end
        );
      }
      if (!isUsed) {
        unparsedWords.push(word);
        console.debug('UNPARSED', word);
      }
    }
  }
  
  if (unparsedWords.length > 0) {
    debugLog('Unparsed', `Words not matched: ${unparsedWords.join(', ')}`);
  }
  
  // Store full transcript as special requests only if we couldn't parse much
  if (Object.keys(parsed).length < 3 && transcript.length > 20) {
    parsed.specialRequests = transcript;
    debugLog('Fallback', 'Storing full transcript as special requests due to low parse rate');
  }
  
  return parsed;
}

// Export debug control function
export function enableVoiceDebug(enable: boolean = true) {
  if (typeof window !== 'undefined') {
    if (enable) {
      window.localStorage.setItem('debug-voice', 'true');
      console.log('Voice parser debugging enabled');
    } else {
      window.localStorage.removeItem('debug-voice');
      console.log('Voice parser debugging disabled');
    }
  }
}