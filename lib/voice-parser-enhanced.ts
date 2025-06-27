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

// Enhanced logging
const log = (category: string, ...args: any[]) => {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('debug-voice')) {
  }
};

// Parse destination with multiple patterns
function parseDestination(text: string): string | undefined {
  log('Destination', 'Parsing:', text);
  
  // Common patterns for destinations
  const patterns = [
    // "I want to go to Paris", "We want to go to Rome"
    /(?:i|we)\s+want\s+to\s+go\s+to\s+([A-Za-z\s]+?)(?:\s+(?:from|for|on|in|,)|$)/i,
    // "I'm going to Tokyo", "We're going to London"
    /(?:i'm|we're)\s+going\s+to\s+([A-Za-z\s]+?)(?:\s+(?:from|for|on|in|,)|$)/i,
    // "Going to New York"
    /going\s+to\s+([A-Za-z\s]+?)(?:\s+(?:from|for|on|in|next|,)|$)/i,
    // "I'm heading to Brazil Sao Paulo"
    /(?:i'm|we're)\s+heading\s+to\s+([A-Za-z\s]+?)(?:\s+(?:from|for|on|in|,)|$)/i,
    // "Trip to Miami", "Travel to Barcelona", "Vacation to Hawaii"
    /(?:trip|travel|vacation|holiday)\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+(?:from|for|on|in|starting)|$)/i,
    // "Planning a trip to Italy"
    /planning\s+(?:a|our)\s+(?:trip|vacation|holiday)\s+to\s+([A-Za-z\s]+?)(?:\s*,|\s+(?:from|for|on|in)|$)/i,
    // Just the destination at the beginning: "Paris from July..."
    /^([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:from|in|on)\s+/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const destination = match[1].trim();
      log('Destination', 'Found:', destination, 'Pattern:', pattern);
      return destination;
    }
  }
  
  return undefined;
}

// Parse dates with better patterns
function parseDates(text: string): { startDate?: Date; endDate?: Date } {
  log('Dates', 'Parsing:', text);
  const result: { startDate?: Date; endDate?: Date } = {};
  const currentYear = new Date().getFullYear();
  
  // Pattern 1: "from July 15th to July 22nd" or "from July 15 to July 22"
  let match = text.match(/from\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|through|until)\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
  if (match) {
    const month1 = MONTHS[match[1].toLowerCase()];
    const month2 = MONTHS[match[3].toLowerCase()];
    if (month1 !== undefined && month2 !== undefined) {
      result.startDate = new Date(currentYear, month1, parseInt(match[2]));
      result.endDate = new Date(currentYear, month2, parseInt(match[4]));
      log('Dates', 'Found date range:', result);
      return result;
    }
  }
  
  // Pattern 2: "from 10:00 to 19 July" (time confused as date)
  match = text.match(/from\s+(\d{1,2})(?::00)?\s+to\s+(\d{1,2})\s+([A-Za-z]+)/i);
  if (match) {
    const month = MONTHS[match[3].toLowerCase()];
    if (month !== undefined) {
      result.startDate = new Date(currentYear, month, parseInt(match[1]));
      result.endDate = new Date(currentYear, month, parseInt(match[2]));
      log('Dates', 'Found time-style date range:', result);
      return result;
    }
  }
  
  // Pattern 3: "July 5-12" or "July 5 - 12"
  match = text.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*[-–]\s*(\d{1,2})(?:st|nd|rd|th)?/i);
  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    if (month !== undefined) {
      result.startDate = new Date(currentYear, month, parseInt(match[2]));
      result.endDate = new Date(currentYear, month, parseInt(match[3]));
      log('Dates', 'Found hyphenated date range:', result);
      return result;
    }
  }
  
  // Pattern 4: "leaving August 5th returning August 12th"
  match = text.match(/leaving\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+returning\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
  if (match) {
    const month1 = MONTHS[match[1].toLowerCase()];
    const month2 = MONTHS[match[3].toLowerCase()];
    if (month1 !== undefined && month2 !== undefined) {
      result.startDate = new Date(currentYear, month1, parseInt(match[2]));
      result.endDate = new Date(currentYear, month2, parseInt(match[4]));
      log('Dates', 'Found leaving/returning dates:', result);
      return result;
    }
  }
  
  // Pattern 5: Simple date ranges "June 10 to June 17"
  match = text.match(/([A-Za-z]+)\s+(\d{1,2})\s+to\s+([A-Za-z]+)\s+(\d{1,2})/i);
  if (match) {
    const month1 = MONTHS[match[1].toLowerCase()];
    const month2 = MONTHS[match[3].toLowerCase()];
    if (month1 !== undefined && month2 !== undefined) {
      result.startDate = new Date(currentYear, month1, parseInt(match[2]));
      result.endDate = new Date(currentYear, month2, parseInt(match[4]));
      log('Dates', 'Found simple date range:', result);
      return result;
    }
  }
  
  // Pattern 6: "April 15 through April 25"
  match = text.match(/([A-Za-z]+)\s+(\d{1,2})\s+through\s+([A-Za-z]+)\s+(\d{1,2})/i);
  if (match) {
    const month1 = MONTHS[match[1].toLowerCase()];
    const month2 = MONTHS[match[3].toLowerCase()];
    if (month1 !== undefined && month2 !== undefined) {
      result.startDate = new Date(currentYear, month1, parseInt(match[2]));
      result.endDate = new Date(currentYear, month2, parseInt(match[4]));
      log('Dates', 'Found through date range:', result);
      return result;
    }
  }
  
  // Pattern 7: Relative dates "next week for 5 days"
  match = text.match(/next\s+week\s+for\s+(\d+)\s+days?/i);
  if (match) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    result.startDate = nextWeek;
    result.endDate = new Date(nextWeek);
    result.endDate.setDate(result.endDate.getDate() + parseInt(match[1]) - 1);
    log('Dates', 'Found relative dates:', result);
    return result;
  }
  
  // Pattern 8: "for 5 days" with context
  match = text.match(/for\s+(\d+)\s+days?/i);
  if (match && result.startDate) {
    result.endDate = new Date(result.startDate);
    result.endDate.setDate(result.endDate.getDate() + parseInt(match[1]) - 1);
    log('Dates', 'Added duration to start date:', result);
  }
  
  return result;
}

// Parse number of travelers
function parseTravelers(text: string): number | undefined {
  log('Travelers', 'Parsing:', text);
  
  // Direct number patterns
  let match = text.match(/(\d+)\s+(?:people|persons?|travelers?|adults?)/i);
  if (match) {
    const count = parseInt(match[1]);
    log('Travelers', 'Found direct number:', count);
    return count;
  }
  
  // "X adults and Y children"
  match = text.match(/(\d+)\s+adults?\s+(?:and\s+)?(\d+)\s+(?:children|child|kids?)/i);
  if (match) {
    const count = parseInt(match[1]) + parseInt(match[2]);
    log('Travelers', 'Found adults + children:', count);
    return count;
  }
  
  // Family patterns
  match = text.match(/family\s+of\s+(\d+)/i);
  if (match) {
    const count = parseInt(match[1]);
    log('Travelers', 'Found family of:', count);
    return count;
  }
  
  // Party/group patterns
  match = text.match(/(?:party|group)\s+of\s+(\d+)/i);
  if (match) {
    const count = parseInt(match[1]);
    log('Travelers', 'Found party/group of:', count);
    return count;
  }
  
  // Special patterns
  if (/with\s+my\s+(?:wife|husband|partner|spouse|boyfriend|girlfriend)/.test(text) || 
      /\b(?:couple|two of us|just us two)\b/i.test(text)) {
    log('Travelers', 'Found couple pattern');
    return 2;
  }
  
  if (/\b(?:solo|alone|by myself|just me)\b/i.test(text)) {
    log('Travelers', 'Found solo pattern');
    return 1;
  }
  
  if (/\bfamily\b/i.test(text) && !/family of/i.test(text)) {
    log('Travelers', 'Found generic family, defaulting to 4');
    return 4;
  }
  
  return undefined;
}

// Parse budget
function parseBudget(text: string): string | undefined {
  log('Budget', 'Parsing:', text);
  
  // Pattern for total budget with various phrasings
  let match = text.match(/(?:have|budget\s+(?:is|of)?|total\s+budget|spend)\s*\$?([\d,]+)(?:\s+(?:in\s+)?(?:total|dollars?|budget))?/i);
  if (match) {
    const amount = match[1].replace(/,/g, '');
    log('Budget', 'Found total budget:', amount);
    return amount;
  }
  
  // Pattern for "keep it under X"
  match = text.match(/keep\s+it\s+under\s+\$?([\d,]+)/i);
  if (match) {
    const amount = match[1].replace(/,/g, '');
    log('Budget', 'Found max budget:', amount);
    return amount;
  }
  
  // Pattern for per person budget
  match = text.match(/\$?([\d,]+)\s*(?:per\s+person|each|pp)/i);
  if (match) {
    const amount = match[1].replace(/,/g, '');
    log('Budget', 'Found per person budget:', amount);
    return amount;
  }
  
  return undefined;
}

// Main parsing function
export function parseVoiceTranscript(transcript: string): ParsedFields {
  log('Main', 'Parsing transcript:', transcript);
  
  const result: ParsedFields = {};
  
  // Parse each field
  result.destination = parseDestination(transcript);
  
  const dates = parseDates(transcript);
  if (dates.startDate) result.startDate = dates.startDate;
  if (dates.endDate) result.endDate = dates.endDate;
  
  result.travelers = parseTravelers(transcript);
  result.budget = parseBudget(transcript);
  
  // Parse accommodation
  if (/stay\s+in\s+a\s+(?:really\s+)?(?:nice|luxury|good)\s+hotel/i.test(transcript) ||
      /hotel/i.test(transcript)) {
    result.accommodation = 'hotel';
  }
  
  // Parse special requests
  if (/honeymoon/i.test(transcript)) {
    result.specialRequests = 'honeymoon trip';
  } else if (/anniversary/i.test(transcript)) {
    result.specialRequests = 'anniversary trip';
  }
  
  // If we couldn't parse much, store the full transcript
  const parsedFieldCount = Object.keys(result).filter(k => k !== 'specialRequests').length;
  if (parsedFieldCount < 3 && transcript.length > 20) {
    result.specialRequests = transcript;
    log('Main', 'Low parse rate, storing full transcript as special requests');
  }
  
  log('Main', 'Final result:', result);
  return result;
}

// Export debug control
export function enableVoiceDebug(enable: boolean = true) {
  if (typeof window !== 'undefined') {
    if (enable) {
      window.localStorage.setItem('debug-voice', 'true');
    } else {
      window.localStorage.removeItem('debug-voice');
    }
  }
}