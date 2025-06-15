export interface ParsedFields {
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  budget?: string;
  accommodation?: string;
  interests?: string[];
  specialRequests?: string;
}

export function parseVoiceTranscript(transcript: string): ParsedFields {
  const lowerText = transcript.toLowerCase();
  const parsed: ParsedFields = {};

  // Destination
  const destPatterns = [
    /(?:to|visit|going to|travel to|trip to)\s+([a-z\s]+?)(?:\s+for|\s+in|\s+next|\s+with|\s+from|$)/i,
    /(?:destination is|headed to)\s+([a-z\s]+?)(?:\s+|$)/i,
  ];
  
  for (const pattern of destPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      parsed.destination = match[1].trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      break;
    }
  }

  // Travelers
  const travelersMatch = lowerText.match(/(\d+)\s*(?:people|person|travelers?|adults?)/i);
  if (travelersMatch) {
    parsed.travelers = parseInt(travelersMatch[1]);
  } else if (lowerText.includes('family')) {
    parsed.travelers = 4;
  } else if (lowerText.includes('couple')) {
    parsed.travelers = 2;
  } else if (lowerText.includes('solo')) {
    parsed.travelers = 1;
  }

  // Duration & Dates
  const daysMatch = lowerText.match(/(\d+)\s*(?:days?|nights?)/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    parsed.startDate = startDate;
    parsed.endDate = endDate;
  }

  // Budget
  const budgetMatch = lowerText.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (budgetMatch) {
    parsed.budget = budgetMatch[1].replace(/,/g, '');
  }

  // Accommodation
  const accommodations = ['hotel', 'airbnb', 'hostel', 'resort'];
  for (const acc of accommodations) {
    if (lowerText.includes(acc)) {
      parsed.accommodation = acc;
      break;
    }
  }

  // Interests
  const interestMap = {
    culture: ['culture', 'museum', 'history', 'art'],
    adventure: ['adventure', 'hiking', 'outdoor'],
    food: ['food', 'restaurant', 'cuisine'],
    relaxation: ['relax', 'spa', 'beach'],
    nature: ['nature', 'park', 'wildlife'],
    shopping: ['shopping', 'market'],
    nightlife: ['nightlife', 'bar', 'club'],
    photography: ['photo', 'instagram'],
  };

  parsed.interests = [];
  for (const [interest, keywords] of Object.entries(interestMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      parsed.interests.push(interest);
    }
  }

  parsed.specialRequests = transcript;

  return parsed;
}