import { v4 as uuidv4 } from 'uuid';
import { 
  RawContent, 
  NormalizedContent, 
  NormalizedItinerary,
  NormalizedActivity,
  DailyItinerary,
  ItineraryItem,
  BaseNormalizedContent
} from './types';
import { DateNormalizer } from './DateNormalizer';
import { PriceNormalizer } from './PriceNormalizer';

export class DocumentContentTransformer {
  private dateNormalizer: DateNormalizer;
  private priceNormalizer: PriceNormalizer;

  constructor(
    dateNormalizer?: DateNormalizer,
    priceNormalizer?: PriceNormalizer
  ) {
    this.dateNormalizer = dateNormalizer || new DateNormalizer();
    this.priceNormalizer = priceNormalizer || new PriceNormalizer();
  }

  /**
   * Transform raw document content into normalized content
   */
  public async transform(rawContent: RawContent): Promise<NormalizedContent | null> {
    if (rawContent.contentType !== 'pdf_text' && rawContent.contentType !== 'docx_text') {
      console.warn(`DocumentContentTransformer received unexpected content type: ${rawContent.contentType}`);
      return null;
    }

    try {
      // Most travel documents are itineraries
      const isItinerary = this.detectItinerary(rawContent.rawText);
      
      if (isItinerary) {
        return this.transformToItinerary(rawContent);
      } else {
        return this.transformToGeneric(rawContent);
      }
    } catch (error) {
      console.error('Error transforming document content:', error);
      return null;
    }
  }

  /**
   * Detect if document contains an itinerary
   */
  private detectItinerary(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Look for itinerary indicators
    const itineraryKeywords = [
      'itinerary',
      'day 1',
      'day one',
      'first day',
      'schedule',
      'travel plan',
      'trip overview'
    ];

    const hasKeywords = itineraryKeywords.some(keyword => lowerText.includes(keyword));
    
    // Check for day patterns
    const dayPattern = /day\s*\d+|day\s+(?:one|two|three|four|five|six|seven|eight|nine|ten)/gi;
    const dayMatches = text.match(dayPattern);
    
    return hasKeywords || (dayMatches !== null && dayMatches.length >= 2);
  }

  /**
   * Transform document to itinerary
   */
  private transformToItinerary(rawContent: RawContent): NormalizedItinerary {
    const metadata = rawContent.metadata || {};
    
    // Extract title
    const title = this.extractTitle(rawContent.rawText) || metadata.title || 'Travel Itinerary';
    
    // Extract date range
    const dateRanges = this.dateNormalizer.extractDateRange(rawContent.rawText);
    const startDate = dateRanges.length > 0 && dateRanges[0] ? dateRanges[0].start : undefined;
    const endDate = dateRanges.length > 0 && dateRanges[0] ? dateRanges[0].end : undefined;
    
    // Extract daily plans
    const dailyPlans = this.extractDailyPlans(rawContent.rawText);
    
    // Calculate total price if mentioned
    const totalPriceText = this.extractTotalPrice(rawContent.rawText);
    const totalPrice = totalPriceText ? this.priceNormalizer.normalizePrice(totalPriceText) : undefined;

    const itinerary: NormalizedItinerary = {
      id: uuidv4(),
      source: rawContent.filePath || rawContent.id,
      originalContentType: rawContent.contentType === 'pdf_text' ? 'pdf' : 'docx',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'itinerary',
      title,
      dailyPlans,
      durationDays: dailyPlans.length,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(totalPrice && { totalPrice }),
      ...(metadata.description && { description: metadata.description })
    };

    return itinerary;
  }

  /**
   * Extract daily plans from itinerary text
   */
  private extractDailyPlans(text: string): DailyItinerary[] {
    const dailyPlans: DailyItinerary[] = [];
    
    // Split by day markers
    const dayPattern = /(?:^|\n)(?:day\s*(\d+)|day\s+(one|two|three|four|five|six|seven|eight|nine|ten))(?:\s*[-:])?\s*([^\n]*)/gim;
    const sections = text.split(dayPattern);
    
    let currentDay = 0;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Check if this is a day number
      if (section && (section.match(/^\d+$/) || this.wordToNumber(section) !== null)) {
        currentDay = section.match(/^\d+$/) ? parseInt(section) : this.wordToNumber(section)!;
        
        // Get the title (next section after day number)
        const dayTitle = sections[i + 1]?.trim() || `Day ${currentDay}`;
        
        // Get the content (section after title)
        const dayContent = sections[i + 2] || '';
        
        // Extract items from day content
        const items = this.extractItineraryItems(dayContent);
        
        dailyPlans.push({
          day: currentDay,
          title: dayTitle,
          items
        });
        
        i += 2; // Skip processed sections
      }
    }

    // If no days found, try alternative parsing
    if (dailyPlans.length === 0) {
      const alternativePlans = this.extractAlternativeDailyPlans(text);
      return alternativePlans;
    }

    return dailyPlans.sort((a, b) => a.day - b.day);
  }

  /**
   * Alternative method to extract daily plans
   */
  private extractAlternativeDailyPlans(text: string): DailyItinerary[] {
    const plans: DailyItinerary[] = [];
    const lines = text.split('\n');
    
    let currentDay = 0;
    let currentItems: ItineraryItem[] = [];
    let currentTitle = '';
    
    for (const line of lines) {
      const dayMatch = line.match(/^\s*day\s*(\d+)(?:\s*[-:])?(.*)$/i);
      
      if (dayMatch) {
        // Save previous day if exists
        if (currentDay > 0) {
          plans.push({
            day: currentDay,
            title: currentTitle || `Day ${currentDay}`,
            items: currentItems
          });
        }
        
        // Start new day
        currentDay = parseInt(dayMatch[1]);
        currentTitle = dayMatch[2] ? dayMatch[2].trim() : '';
        currentItems = [];
      } else if (currentDay > 0 && line.trim()) {
        // Parse line as potential activity
        const item = this.parseItineraryLine(line);
        if (item) {
          currentItems.push(item);
        }
      }
    }
    
    // Save last day
    if (currentDay > 0) {
      plans.push({
        day: currentDay,
        title: currentTitle || `Day ${currentDay}`,
        items: currentItems
      });
    }
    
    return plans;
  }

  /**
   * Extract itinerary items from day content
   */
  private extractItineraryItems(content: string): ItineraryItem[] {
    const items: ItineraryItem[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const item = this.parseItineraryLine(line);
      if (item) {
        items.push(item);
      }
    }
    
    return items;
  }

  /**
   * Parse a single line into an itinerary item
   */
  private parseItineraryLine(line: string): ItineraryItem | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Extract time if present
    const timeMatch = trimmed.match(/^(\d{1,2}:\d{2}(?:\s*(?:am|pm)?)?)\s*[-–]?\s*/i);
    const startTime = timeMatch && timeMatch[1] ? this.dateNormalizer.normalizeTime(timeMatch[1]) : undefined;
    
    // Remove time from line for further processing
    const withoutTime = timeMatch ? trimmed.substring(timeMatch[0].length) : trimmed;
    
    // Create basic item
    const item: ItineraryItem = {
      ...(startTime && { startTime }),
      notes: withoutTime
    };

    // Try to extract activity details
    const activityMatch = withoutTime.match(/^([^(]+)(?:\(([^)]+)\))?/);
    if (activityMatch && activityMatch[1]) {
      const activityName = activityMatch[1].trim();
      const duration = activityMatch[2]?.trim();
      
      if (activityName) {
        // Create a partial activity object - it should match Omit<NormalizedActivity, keyof BaseNormalizedContent>
        // This means we need all NormalizedActivity fields except the base content fields
        type ActivityWithoutBase = Omit<NormalizedActivity, keyof BaseNormalizedContent>;
        
        const activity: ActivityWithoutBase = {
          name: activityName,
          type: 'activity' as const
        };
        
        if (duration) {
          const normalizedDuration = this.dateNormalizer.normalizeDuration(duration);
          if (normalizedDuration) {
            activity.duration = `${normalizedDuration.value} ${normalizedDuration.unit}`;
          }
        }
        
        item.activity = activity;
      }
    }

    return item;
  }

  /**
   * Transform to generic content
   */
  private transformToGeneric(rawContent: RawContent): NormalizedContent {
    return {
      id: uuidv4(),
      source: rawContent.filePath || rawContent.id,
      originalContentType: rawContent.contentType === 'pdf_text' ? 'pdf' : 'docx',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'generic',
      title: this.extractTitle(rawContent.rawText) || 'Document Content',
      text: rawContent.rawText
    };
  }

  /**
   * Helper methods
   */
  private extractTitle(text: string): string | null {
    // Look for title patterns
    const lines = text.split('\n');
    
    // First non-empty line is often the title
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 5 && trimmed.length < 100) {
        // Basic heuristic: not too short, not too long
        return trimmed;
      }
    }
    
    return null;
  }

  private extractTotalPrice(text: string): string | null {
    const totalMatch = text.match(/(?:total|grand total|total cost|total price)[:=\s]*([₹₽₺฿₱₪₩$€£¥]\s*[\d,]+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP))/i);
    return totalMatch && totalMatch[1] ? totalMatch[1] : null;
  }

  private wordToNumber(word: string): number | null {
    const wordNumbers: Record<string, number> = {
      'one': 1,
      'two': 2,
      'three': 3,
      'four': 4,
      'five': 5,
      'six': 6,
      'seven': 7,
      'eight': 8,
      'nine': 9,
      'ten': 10,
      'eleven': 11,
      'twelve': 12,
      'thirteen': 13,
      'fourteen': 14,
      'fifteen': 15,
      'sixteen': 16,
      'seventeen': 17,
      'eighteen': 18,
      'nineteen': 19,
      'twenty': 20
    };
    
    return wordNumbers[word.toLowerCase()] || null;
  }
} 