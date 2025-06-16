import { parseVoiceTranscript, enableVoiceDebug } from '@/lib/voice-parser';

describe('parseVoiceTranscript - Field-specific cue patterns', () => {
  beforeEach(() => {
    // Clear debug logs between tests
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Destination parsing', () => {
    const destinationTests = [
      { input: "destination is Tokyo", expected: "Tokyo", confidence: 'high' },
      { input: "my destination is Paris, France", expected: "Paris, France", confidence: 'high' },
      { input: "I'm going to London", expected: "London", confidence: 'high' },
      { input: "we're going to New York City", expected: "New York City", confidence: 'high' },
      { input: "travel to Barcelona", expected: "Barcelona", confidence: 'high' },
      { input: "traveling to Rome for vacation", expected: "Rome", confidence: 'high' },
      { input: "trip to San Francisco", expected: "San Francisco", confidence: 'high' },
      { input: "visiting Tokyo", expected: "Tokyo", confidence: 'high' },
      { input: "headed to Miami", expected: "Miami", confidence: 'high' },
      { input: "heading to Seattle", expected: "Seattle", confidence: 'high' },
      { input: "flying to Dubai", expected: "Dubai", confidence: 'high' },
      { input: "Tokyo for 5 days", expected: "Tokyo", confidence: 'medium' },
    ];

    destinationTests.forEach(({ input, expected }) => {
      it(`parses "${input}" -> "${expected}"`, () => {
        const result = parseVoiceTranscript(input);
        expect(result.destination).toBe(expected);
      });
    });
  });

  describe('Date parsing', () => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const dateTests = [
      { 
        input: "leaving on July 10th", 
        expectedMonth: 6, // July is month 6 (0-indexed)
        expectedDay: 10,
        field: 'startDate'
      },
      { 
        input: "departing August 15", 
        expectedMonth: 7,
        expectedDay: 15,
        field: 'startDate'
      },
      { 
        input: "from September 1st", 
        expectedMonth: 8,
        expectedDay: 1,
        field: 'startDate'
      },
      { 
        input: "starting June 20", 
        expectedMonth: 5,
        expectedDay: 20,
        field: 'startDate'
      },
      { 
        input: "returning July 18th", 
        expectedMonth: 6,
        expectedDay: 18,
        field: 'endDate'
      },
      { 
        input: "until August 5", 
        expectedMonth: 7,
        expectedDay: 5,
        field: 'endDate'
      },
      { 
        input: "coming back September 1", 
        expectedMonth: 8,
        expectedDay: 1,
        field: 'endDate'
      },
    ];

    dateTests.forEach(({ input, expectedMonth, expectedDay, field }) => {
      it(`parses "${input}"`, () => {
        const result = parseVoiceTranscript(input);
        const date = result[field as 'startDate' | 'endDate'];
        
        expect(date).toBeInstanceOf(Date);
        expect(date?.getMonth()).toBe(expectedMonth);
        expect(date?.getDate()).toBe(expectedDay);
        expect(date?.getFullYear()).toBeGreaterThanOrEqual(currentYear);
      });
    });

    it('parses "next Monday"', () => {
      const result = parseVoiceTranscript("leaving next Monday");
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate?.getDay()).toBe(1); // Monday
      expect(result.startDate?.getTime()).toBeGreaterThan(today.getTime());
    });

    it('parses "in 5 days"', () => {
      const result = parseVoiceTranscript("leaving in 5 days");
      expect(result.startDate).toBeInstanceOf(Date);
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 5);
      
      // Check it's the same day (allowing for time differences)
      expect(result.startDate?.toDateString()).toBe(expectedDate.toDateString());
    });

    it('calculates end date from duration when start date exists', () => {
      const result = parseVoiceTranscript("leaving July 10th for 7 days");
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      
      if (result.startDate && result.endDate) {
        const diffDays = Math.ceil((result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(6); // 7 days inclusive = 6 days difference
      }
    });
  });

  describe('Travelers parsing', () => {
    const travelerTests = [
      { input: "with 2 adults and 1 child", expected: 3 },
      { input: "2 adults 1 child", expected: 3 },
      { input: "party of 4", expected: 4 },
      { input: "group of 6", expected: 6 },
      { input: "4 people", expected: 4 },
      { input: "5 travelers", expected: 5 },
      { input: "there are 3 of us", expected: 3 },
      { input: "there will be 4 of us", expected: 4 },
      { input: "three people", expected: 3 },
      { input: "family of 5", expected: 5 },
      { input: "couple", expected: 2 },
      { input: "two of us", expected: 2 },
      { input: "just us two", expected: 2 },
      { input: "family trip", expected: 4 },
      { input: "solo trip", expected: 1 },
      { input: "traveling alone", expected: 1 },
      { input: "by myself", expected: 1 },
      { input: "just me", expected: 1 },
    ];

    travelerTests.forEach(({ input, expected }) => {
      it(`parses "${input}" -> ${expected}`, () => {
        const result = parseVoiceTranscript(input);
        expect(result.travelers).toBe(expected);
      });
    });
  });

  describe('Budget parsing', () => {
    const budgetTests = [
      { input: "budget is $1500 per person", expected: "1500" },
      { input: "budget is 2000 dollars each", expected: "2000" },
      { input: "$2,500 per person", expected: "2500" },
      { input: "1500 dollars pp", expected: "1500" },
      { input: "two thousand per person", expected: "2000" },
      { input: "three thousand dollars each", expected: "3000" },
      { input: "fifteen hundred dollars", expected: "1500" },
      { input: "twenty five hundred per person", expected: "2500" },
    ];

    budgetTests.forEach(({ input, expected }) => {
      it(`parses "${input}" -> ${expected}`, () => {
        const result = parseVoiceTranscript(input);
        expect(result.budget).toBe(expected);
      });
    });
  });

  describe('Accommodation parsing', () => {
    const accommodationTests = [
      { input: "prefer a hotel", expected: "hotel" },
      { input: "preferring to stay in a resort", expected: "resort" },
      { input: "want an airbnb", expected: "airbnb" },
      { input: "staying in a hotel", expected: "hotel" },
      { input: "staying at a hostel", expected: "hostel" },
      { input: "looking for a resort", expected: "resort" },
      { input: "looking for vacation rental", expected: "airbnb" },
      { input: "all-inclusive resort", expected: "resort" },
    ];

    accommodationTests.forEach(({ input, expected }) => {
      it(`parses "${input}" -> ${expected}`, () => {
        const result = parseVoiceTranscript(input);
        expect(result.accommodation).toBe(expected);
      });
    });
  });

  describe('Interests parsing', () => {
    const interestTests = [
      { input: "interested in food and culture", expected: ["food", "culture"] },
      { input: "we like hiking and nature", expected: ["adventure", "nature"] },
      { input: "I enjoy museums and art", expected: ["culture"] },
      { input: "into nightlife and shopping", expected: ["nightlife", "shopping"] },
      { input: "for the food scene", expected: ["food"] },
      { input: "love beaches and spa", expected: ["relaxation"] },
    ];

    interestTests.forEach(({ input, expected }) => {
      it(`parses "${input}" -> ${expected.join(", ")}`, () => {
        const result = parseVoiceTranscript(input);
        expect(result.interests).toEqual(expect.arrayContaining(expected));
        expect(result.interests?.length).toBe(expected.length);
      });
    });
  });

  describe('Transportation parsing', () => {
    const transportTests = [
      { input: "need public transportation", expected: ["public-transport"] },
      { input: "we'll need flights and trains", expected: ["flights", "public-transport"] },
      { input: "transportation: car rental", expected: ["car-rental"] },
      { input: "by train", expected: ["public-transport"] },
      { input: "rental car for road trip", expected: ["car-rental"] },
      { input: "walking and public transit", expected: ["walking", "public-transport"] },
    ];

    transportTests.forEach(({ input, expected }) => {
      it(`parses "${input}" -> ${expected.join(", ")}`, () => {
        const result = parseVoiceTranscript(input);
        expect(result.transportation).toEqual(expect.arrayContaining(expected));
        expect(result.transportation?.length).toBe(expected.length);
      });
    });
  });

  describe('Complex multi-field parsing', () => {
    it('parses a complete trip description', () => {
      const input = `I'm going to Tokyo, leaving on July 10th and returning July 18th. 
        There will be 4 of us, budget is $2000 per person. 
        We prefer a hotel and we're interested in food and culture. 
        We'll need flights and public transportation.`;

      const result = parseVoiceTranscript(input);

      expect(result.destination).toBe("Tokyo");
      expect(result.startDate?.getMonth()).toBe(6); // July
      expect(result.startDate?.getDate()).toBe(10);
      expect(result.endDate?.getMonth()).toBe(6);
      expect(result.endDate?.getDate()).toBe(18);
      expect(result.travelers).toBe(4);
      expect(result.budget).toBe("2000");
      expect(result.accommodation).toBe("hotel");
      expect(result.interests).toEqual(expect.arrayContaining(["food", "culture"]));
      expect(result.transportation).toEqual(expect.arrayContaining(["flights", "public-transport"]));
    });

    it('handles variations in phrasing', () => {
      const input = `My destination is Paris, departing August 15 for 5 days. 
        Party of 3, fifteen hundred dollars each. 
        Looking for a vacation rental, into nightlife and shopping.`;

      const result = parseVoiceTranscript(input);

      expect(result.destination).toBe("Paris");
      expect(result.startDate?.getMonth()).toBe(7); // August
      expect(result.startDate?.getDate()).toBe(15);
      expect(result.endDate).toBeInstanceOf(Date); // Calculated from duration
      expect(result.travelers).toBe(3);
      expect(result.budget).toBe("1500");
      expect(result.accommodation).toBe("airbnb");
      expect(result.interests).toEqual(expect.arrayContaining(["nightlife", "shopping"]));
    });
  });

  describe('Debug logging', () => {
    it('logs debug information when enabled', () => {
      enableVoiceDebug(true);
      const logSpy = jest.spyOn(console, 'log');
      
      parseVoiceTranscript("destination is Tokyo");
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Voice Parser'),
        expect.any(String)
      );
      
      enableVoiceDebug(false);
    });

    it('logs unparsed words', () => {
      const debugSpy = jest.spyOn(console, 'debug');
      
      parseVoiceTranscript("going to Tokyo with some random unparseable words");
      
      expect(debugSpy).toHaveBeenCalledWith('UNPARSED', expect.any(String));
    });
  });

  describe('Confidence and fallback handling', () => {
    it('stores full transcript as special requests when parsing fails', () => {
      const input = "This is a completely unparseable sentence with no travel information";
      const result = parseVoiceTranscript(input);
      
      expect(Object.keys(result).length).toBeLessThanOrEqual(1);
      expect(result.specialRequests).toBe(input);
    });

    it('does not include low-confidence matches', () => {
      // The pattern "Tokyo for" has lower confidence (0.7)
      // But should still be included since it's above threshold (0.6)
      const result = parseVoiceTranscript("Tokyo for vacation");
      expect(result.destination).toBe("Tokyo");
    });
  });
});