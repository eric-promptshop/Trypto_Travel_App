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
}

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

export function parseVoiceTranscript(transcript: string): ParsedFields {
  const lowerText = transcript.toLowerCase();
  const parsedTokens: ParsedToken[] = [];
  const unparsedTokens: string[] = [];

  // Destination parsing with improved patterns
  const destPatterns = [
    { pattern: /(?:we're going to|going to|travel to|trip to|visit|visiting)\s+([a-z\s]+?)(?:\s+for|\s+from|\s+in|\s+on|$)/i, confidence: 0.9 },
    { pattern: /(?:destination is|headed to|heading to)\s+([a-z\s]+?)(?:\s+|$)/i, confidence: 0.95 },
    { pattern: /^([a-z\s]+?)\s+(?:for|from|in)/i, confidence: 0.7 },
  ];
  
  for (const { pattern, confidence } of destPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const destination = match[1].trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      parsedTokens.push({ field: 'destination', value: destination, confidence, raw: match[0] });
      break;
    }
  }

  // Date parsing with natural language support
  const datePatterns = [
    // "from July 10th to July 18th"
    /from\s+([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|until|till)\s+([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    // "July 10 to 18"
    /([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|until|till|-)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    // "next week/month"
    /next\s+(week|month)/i,
    // "in July", "this July"
    /(?:in|this|next)\s+([a-z]+)(?:\s+(\d{4}))?/i,
  ];

  for (const pattern of datePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (match[0].includes('next week')) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else if (match[0].includes('next month')) {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1);
        startDate.setDate(1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (match[1] && MONTHS[match[1]]) {
        const year = new Date().getFullYear();
        const month = MONTHS[match[1]];
        
        if (match[2] && match[3] && match[4]) {
          // "from July 10th to July 18th"
          startDate = new Date(year, month, parseInt(match[2]));
          const endMonth = MONTHS[match[3]] ?? month;
          endDate = new Date(year, endMonth, parseInt(match[4]));
        } else if (match[2] && match[3]) {
          // "July 10 to 18"
          startDate = new Date(year, month, parseInt(match[2]));
          endDate = new Date(year, month, parseInt(match[3]));
        } else if (match[2]) {
          // "in July 2024"
          const targetYear = parseInt(match[2]) || year;
          startDate = new Date(targetYear, month, 1);
          endDate = new Date(targetYear, month + 1, 0);
        } else {
          // "in July"
          startDate = new Date(year, month, 1);
          endDate = new Date(year, month + 1, 0);
        }
      }

      if (startDate && endDate) {
        // Ensure dates are in the future
        const today = new Date();
        if (startDate < today) {
          startDate.setFullYear(startDate.getFullYear() + 1);
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        parsedTokens.push({ field: 'startDate', value: startDate, confidence: 0.85, raw: match[0] });
        parsedTokens.push({ field: 'endDate', value: endDate, confidence: 0.85, raw: match[0] });
      }
      break;
    }
  }

  // Duration-based date parsing
  if (!parsedTokens.find(t => t.field === 'startDate')) {
    const daysMatch = lowerText.match(/(\d+)\s*(?:days?|nights?)/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      parsedTokens.push({ field: 'startDate', value: startDate, confidence: 0.7, raw: daysMatch[0] });
      parsedTokens.push({ field: 'endDate', value: endDate, confidence: 0.7, raw: daysMatch[0] });
    }
  }

  // Travelers parsing with improved patterns
  const travelerPatterns = [
    { pattern: /(\d+)\s*(?:of us|people|person|travelers?|adults?)/i, confidence: 0.95 },
    { pattern: /(?:party of|group of)\s*(\d+)/i, confidence: 0.9 },
    { pattern: /(?:there(?:'s| is|'ll be| will be))\s*(\d+)/i, confidence: 0.85 },
  ];

  for (const { pattern, confidence } of travelerPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      parsedTokens.push({ field: 'travelers', value: parseInt(match[1]), confidence, raw: match[0] });
      break;
    }
  }

  // Named group parsing
  if (!parsedTokens.find(t => t.field === 'travelers')) {
    if (lowerText.includes('family')) {
      parsedTokens.push({ field: 'travelers', value: 4, confidence: 0.7, raw: 'family' });
    } else if (lowerText.includes('couple')) {
      parsedTokens.push({ field: 'travelers', value: 2, confidence: 0.9, raw: 'couple' });
    } else if (lowerText.includes('solo') || lowerText.includes('alone') || lowerText.includes('myself')) {
      parsedTokens.push({ field: 'travelers', value: 1, confidence: 0.9, raw: 'solo' });
    }
  }

  // Budget parsing with better patterns
  const budgetPatterns = [
    { pattern: /budget\s*(?:is|of)?\s*\$?(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(?:dollars?)?(?:\s*(?:per|each|a)\s*person)?/i, confidence: 0.95 },
    { pattern: /\$(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(?:per|each|a)\s*person/i, confidence: 0.9 },
    { pattern: /(\d{1,3}(?:,?\d{3})*)\s*dollars?\s*(?:per|each|a)\s*person/i, confidence: 0.9 },
    { pattern: /(?:fifteen|twenty|thirty|forty|fifty)\s*hundred\s*(?:dollars?)?\s*(?:per|each|a)\s*person/i, confidence: 0.85 },
  ];

  // Number word to digit conversion
  const numberWords: Record<string, number> = {
    'fifteen': 15, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50
  };

  for (const { pattern, confidence } of budgetPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let budget: string;
      if (match[1]) {
        budget = match[1].replace(/,/g, '');
      } else {
        // Handle word numbers
        const wordMatch = match[0].match(/(fifteen|twenty|thirty|forty|fifty)\s*hundred/i);
        if (wordMatch) {
          const num = numberWords[wordMatch[1].toLowerCase()];
          budget = (num * 100).toString();
        } else {
          continue;
        }
      }
      parsedTokens.push({ field: 'budget', value: budget, confidence, raw: match[0] });
      break;
    }
  }

  // Accommodation parsing
  const accommodations: Record<string, { keywords: string[], confidence: number }> = {
    hotel: { keywords: ['hotel', 'hotels'], confidence: 0.95 },
    airbnb: { keywords: ['airbnb', 'vacation rental', 'vrbo'], confidence: 0.9 },
    hostel: { keywords: ['hostel', 'hostels'], confidence: 0.95 },
    resort: { keywords: ['resort', 'resorts', 'all-inclusive'], confidence: 0.9 },
  };

  for (const [accType, { keywords, confidence }] of Object.entries(accommodations)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      parsedTokens.push({ field: 'accommodation', value: accType, confidence, raw: accType });
      break;
    }
  }

  // Interests parsing with confidence
  const interestMap: Record<string, { keywords: string[], confidence: number }> = {
    culture: { keywords: ['culture', 'cultural', 'museum', 'museums', 'history', 'historical', 'art', 'temple', 'temples'], confidence: 0.9 },
    adventure: { keywords: ['adventure', 'hiking', 'outdoor', 'outdoors', 'trekking', 'climbing'], confidence: 0.85 },
    food: { keywords: ['food', 'foodie', 'restaurant', 'restaurants', 'cuisine', 'dining', 'culinary'], confidence: 0.9 },
    relaxation: { keywords: ['relax', 'relaxation', 'spa', 'beach', 'beaches', 'wellness'], confidence: 0.85 },
    nature: { keywords: ['nature', 'park', 'parks', 'wildlife', 'scenery', 'landscape'], confidence: 0.85 },
    shopping: { keywords: ['shopping', 'shop', 'market', 'markets', 'boutique'], confidence: 0.9 },
    nightlife: { keywords: ['nightlife', 'bar', 'bars', 'club', 'clubs', 'party'], confidence: 0.9 },
    photography: { keywords: ['photo', 'photos', 'photography', 'instagram', 'pictures'], confidence: 0.85 },
  };

  const interests: string[] = [];
  for (const [interest, { keywords, confidence }] of Object.entries(interestMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      interests.push(interest);
      const matchedKeyword = keywords.find(kw => lowerText.includes(kw));
      parsedTokens.push({ field: 'interests', value: [interest], confidence, raw: matchedKeyword || interest });
    }
  }

  // Transportation parsing
  const transportMap: Record<string, { keywords: string[], confidence: number }> = {
    'flights': { keywords: ['flight', 'flights', 'fly', 'flying', 'plane'], confidence: 0.9 },
    'car-rental': { keywords: ['car', 'rental car', 'rent a car', 'drive', 'driving'], confidence: 0.85 },
    'public-transport': { keywords: ['public transport', 'public transit', 'subway', 'metro', 'bus', 'train'], confidence: 0.85 },
    'walking': { keywords: ['walk', 'walking', 'on foot'], confidence: 0.8 },
  };

  const transportation: string[] = [];
  for (const [transport, { keywords, confidence }] of Object.entries(transportMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      transportation.push(transport);
      const matchedKeyword = keywords.find(kw => lowerText.includes(kw));
      parsedTokens.push({ field: 'transportation', value: [transport], confidence, raw: matchedKeyword || transport });
    }
  }

  // Apply confidence threshold and merge results
  const parsed: ParsedFields = {};
  const CONFIDENCE_THRESHOLD = 0.6;
  
  parsedTokens.forEach(token => {
    if (token.confidence >= CONFIDENCE_THRESHOLD) {
      if (token.field === 'interests' || token.field === 'transportation') {
        // Merge array values
        if (!parsed[token.field]) {
          parsed[token.field] = [];
        }
        (parsed[token.field] as string[]).push(...(token.value as string[]));
      } else {
        parsed[token.field] = token.value;
      }
    } else {
      console.debug('UNPARSED (low confidence)', token.raw, `confidence: ${token.confidence}`);
      unparsedTokens.push(token.raw);
    }
  });

  // Remove duplicates from arrays
  if (parsed.interests) {
    parsed.interests = [...new Set(parsed.interests)];
  }
  if (parsed.transportation) {
    parsed.transportation = [...new Set(parsed.transportation)];
  }

  // Log unparsed portions of the transcript
  const usedTokens = parsedTokens.map(t => t.raw);
  const words = transcript.split(/\s+/);
  words.forEach(word => {
    if (!usedTokens.some(token => token.toLowerCase().includes(word.toLowerCase()))) {
      if (word.length > 3 && !['with', 'from', 'will', 'there', 'want'].includes(word.toLowerCase())) {
        console.debug('UNPARSED', word);
      }
    }
  });

  // Store full transcript as special requests only if we couldn't parse much
  if (Object.keys(parsed).length < 3) {
    parsed.specialRequests = transcript;
  }

  return parsed;
}