import { v4 as uuidv4 } from 'uuid';
import { 
  RawContent, 
  NormalizedContent, 
  NormalizedDestination,
  NormalizedActivity,
  NormalizedAccommodation,
  TransportationMode
} from './types';
import { EntityRecognizer } from './EntityRecognizer';
import { DateNormalizer } from './DateNormalizer';
import { PriceNormalizer } from './PriceNormalizer';

export class WebContentTransformer {
  private entityRecognizer: EntityRecognizer;
  private dateNormalizer: DateNormalizer;
  private priceNormalizer: PriceNormalizer;

  constructor(
    entityRecognizer?: EntityRecognizer,
    dateNormalizer?: DateNormalizer,
    priceNormalizer?: PriceNormalizer
  ) {
    this.entityRecognizer = entityRecognizer || new EntityRecognizer();
    this.dateNormalizer = dateNormalizer || new DateNormalizer();
    this.priceNormalizer = priceNormalizer || new PriceNormalizer();
  }

  /**
   * Transform raw web content into normalized content
   */
  public async transform(rawContent: RawContent): Promise<NormalizedContent | null> {
    if (rawContent.contentType !== 'html') {
      console.warn(`WebContentTransformer received non-HTML content: ${rawContent.contentType}`);
      return null;
    }

    try {
      // Determine content type from metadata or content analysis
      const contentType = this.detectContentType(rawContent);

      switch (contentType) {
        case 'destination':
          return this.transformToDestination(rawContent);
        case 'activity':
          return this.transformToActivity(rawContent);
        case 'accommodation':
          return this.transformToAccommodation(rawContent);
        case 'itinerary':
          return this.transformToItinerary(rawContent);
        default:
          return this.transformToGeneric(rawContent);
      }
    } catch (error) {
      console.error('Error transforming web content:', error);
      return null;
    }
  }

  /**
   * Detect the type of content based on metadata and text analysis
   */
  private detectContentType(rawContent: RawContent): string {
    const metadata = rawContent.metadata || {};
    const text = rawContent.rawText.toLowerCase();

    // Check metadata hints first
    if (metadata.contentType) {
      return metadata.contentType;
    }

    // Simple heuristics based on content
    if (metadata.pageType === 'hotel' || text.includes('check-in') && text.includes('check-out')) {
      return 'accommodation';
    }
    
    if (metadata.pageType === 'activity' || text.includes('duration') && text.includes('book now')) {
      return 'activity';
    }
    
    if (metadata.pageType === 'destination' || text.includes('things to do') && text.includes('getting there')) {
      return 'destination';
    }
    
    if (text.includes('day 1') && text.includes('day 2') || text.includes('itinerary')) {
      return 'itinerary';
    }

    return 'generic';
  }

  /**
   * Transform to destination content
   */
  private transformToDestination(rawContent: RawContent): NormalizedDestination {
    const metadata = rawContent.metadata || {};
    const entities = this.entityRecognizer.extractEntities(rawContent.rawText, { type: 'destination' }) as Partial<NormalizedDestination>;

    const destination: NormalizedDestination = {
      id: uuidv4(),
      source: rawContent.sourceUrl || rawContent.id,
      originalContentType: 'web',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'destination',
      name: metadata.title || entities.name || 'Unknown Destination',
      country: metadata.country || this.extractCountryCode(rawContent.rawText),
      ...(metadata.description && { description: metadata.description }),
      ...(metadata.coordinates && { coordinates: metadata.coordinates }),
      ...(metadata.images && { images: metadata.images }),
      confidence: this.calculateConfidence(metadata, entities)
    };

    // Extract additional fields from text if available
    const address = this.entityRecognizer.extractAddress(rawContent.rawText);
    if (Object.keys(address).length > 0) {
      destination.address = { ...address, country: destination.country };
    }

    return destination;
  }

  /**
   * Transform to activity content
   */
  private transformToActivity(rawContent: RawContent): NormalizedActivity {
    const metadata = rawContent.metadata || {};
    const entities = this.entityRecognizer.extractEntities(rawContent.rawText, { type: 'activity' }) as Partial<NormalizedActivity>;

    // Extract price information
    const priceText = metadata.price || this.extractPriceText(rawContent.rawText);
    const price = priceText ? this.priceNormalizer.normalizePrice(priceText) : undefined;

    // Extract duration
    const durationText = metadata.duration || this.extractDurationText(rawContent.rawText);
    const duration = durationText ? this.dateNormalizer.normalizeDuration(durationText) : undefined;

    const activity: NormalizedActivity = {
      id: uuidv4(),
      source: rawContent.sourceUrl || rawContent.id,
      originalContentType: 'web',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'activity',
      name: metadata.title || entities.name || 'Unknown Activity',
      ...(metadata.description && { description: metadata.description }),
      ...(entities.activityType && { activityType: entities.activityType }),
      ...(price && { price }),
      ...(duration && { duration: `${duration.value} ${duration.unit}` }),
      ...(metadata.rating && { rating: parseFloat(metadata.rating) }),
      ...(metadata.reviewsCount && { reviewsCount: parseInt(metadata.reviewsCount) }),
      ...(metadata.images && { images: metadata.images }),
      ...(metadata.bookingUrl && { bookingUrl: metadata.bookingUrl }),
      confidence: this.calculateConfidence(metadata, entities)
    };

    // Extract operating hours if available
    const operatingHours = this.extractOperatingHours(rawContent.rawText);
    if (operatingHours.length > 0) {
      activity.operatingHours = operatingHours;
    }

    return activity;
  }

  /**
   * Transform to accommodation content
   */
  private transformToAccommodation(rawContent: RawContent): NormalizedAccommodation {
    const metadata = rawContent.metadata || {};
    
    // Extract price range
    const priceRangeText = metadata.priceRange || this.extractPriceRangeText(rawContent.rawText);
    const priceRange = priceRangeText ? this.priceNormalizer.extractPriceRange(priceRangeText) : undefined;

    // Extract address
    const address = this.entityRecognizer.extractAddress(metadata.address || rawContent.rawText);
    const country = metadata.country || this.extractCountryCode(rawContent.rawText);

    const accommodation: NormalizedAccommodation = {
      id: uuidv4(),
      source: rawContent.sourceUrl || rawContent.id,
      originalContentType: 'web',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'accommodation',
      name: metadata.title || 'Unknown Accommodation',
      address: {
        ...address,
        country: country || 'Unknown'
      },
      ...(metadata.description && { description: metadata.description }),
      ...(metadata.accommodationType && { accommodationType: metadata.accommodationType }),
      ...(priceRange && { priceRange }),
      ...(metadata.rating && { rating: parseFloat(metadata.rating) }),
      ...(metadata.amenities && { amenities: metadata.amenities }),
      ...(metadata.images && { images: metadata.images }),
      ...(metadata.bookingUrl && { bookingUrl: metadata.bookingUrl }),
      ...(metadata.coordinates && { coordinates: metadata.coordinates }),
      confidence: this.calculateConfidence(metadata, {})
    };

    // Extract check-in/out times
    const checkInTime = this.extractCheckInTime(rawContent.rawText);
    const checkOutTime = this.extractCheckOutTime(rawContent.rawText);
    if (checkInTime) accommodation.checkInTime = checkInTime;
    if (checkOutTime) accommodation.checkOutTime = checkOutTime;

    return accommodation;
  }

  /**
   * Transform to itinerary content
   */
  private transformToItinerary(rawContent: RawContent): NormalizedContent {
    // Complex transformation for itineraries
    // This would need more sophisticated parsing
    return {
      id: uuidv4(),
      source: rawContent.sourceUrl || rawContent.id,
      originalContentType: 'web',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'itinerary',
      title: rawContent.metadata?.title || 'Web Itinerary',
      dailyPlans: [] // Would need proper parsing logic
    };
  }

  /**
   * Transform to generic content
   */
  private transformToGeneric(rawContent: RawContent): NormalizedContent {
    return {
      id: uuidv4(),
      source: rawContent.sourceUrl || rawContent.id,
      originalContentType: 'web',
      extractionDate: rawContent.extractedDate,
      processingDate: new Date().toISOString(),
      type: 'generic',
      title: rawContent.metadata?.title || 'Web Content',
      text: rawContent.rawText
    };
  }

  /**
   * Helper methods for extraction
   */
  private extractCountryCode(text: string): string {
    // Simple country extraction - would need more sophisticated logic
    const countryPatterns: Record<string, string> = {
      'united states': 'US',
      'usa': 'US',
      'america': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
      'england': 'GB',
      'france': 'FR',
      'germany': 'DE',
      'italy': 'IT',
      'spain': 'ES',
      'japan': 'JP',
      'china': 'CN',
      'australia': 'AU',
      'canada': 'CA'
    };

    const lowerText = text.toLowerCase();
    for (const [pattern, code] of Object.entries(countryPatterns)) {
      if (lowerText.includes(pattern)) {
        return code;
      }
    }

    return 'Unknown';
  }

  private extractPriceText(text: string): string | null {
    const priceMatch = text.match(/[$€£¥]\s*\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s*(?:USD|EUR|GBP|JPY)/);
    return priceMatch ? priceMatch[0] : null;
  }

  private extractPriceRangeText(text: string): string | null {
    const rangeMatch = text.match(/[$€£¥]\s*\d+(?:[.,]\d{2})?\s*[-–]\s*\d+(?:[.,]\d{2})?/);
    return rangeMatch ? rangeMatch[0] : null;
  }

  private extractDurationText(text: string): string | null {
    const durationMatch = text.match(/\d+(?:\.\d+)?\s*(?:hours?|hrs?|days?|minutes?|mins?)/i);
    return durationMatch ? durationMatch[0] : null;
  }

  private extractCheckInTime(text: string): string | null {
    const checkInMatch = text.match(/check[- ]?in:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (checkInMatch && checkInMatch[1]) {
      return this.dateNormalizer.normalizeTime(checkInMatch[1]);
    }
    return null;
  }

  private extractCheckOutTime(text: string): string | null {
    const checkOutMatch = text.match(/check[- ]?out:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (checkOutMatch && checkOutMatch[1]) {
      return this.dateNormalizer.normalizeTime(checkOutMatch[1]);
    }
    return null;
  }

  private extractOperatingHours(text: string): Array<{ dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Daily'; opens?: string; closes?: string }> {
    // Simple operating hours extraction - would need more sophisticated parsing
    const hours: Array<{ dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Daily'; opens?: string; closes?: string }> = [];
    
    const hoursMatch = text.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|daily):\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi);
    
    if (hoursMatch) {
      hoursMatch.forEach(match => {
        const parts = match.split(/:\s*/);
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const dayPart = parts[0].toLowerCase();
          const dayMapping: Record<string, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Daily'> = {
            'monday': 'Monday',
            'tuesday': 'Tuesday',
            'wednesday': 'Wednesday',
            'thursday': 'Thursday',
            'friday': 'Friday',
            'saturday': 'Saturday',
            'sunday': 'Sunday',
            'daily': 'Daily'
          };
          
          const dayOfWeek = dayMapping[dayPart];
          if (dayOfWeek) {
            const times = parts[1].split(/\s*[-–]\s*/);
            if (times.length === 2 && times[0] && times[1]) {
              const opens = this.dateNormalizer.normalizeTime(times[0]);
              const closes = this.dateNormalizer.normalizeTime(times[1]);
              if (opens && closes) {
                hours.push({ dayOfWeek, opens, closes });
              }
            }
          }
        }
      });
    }

    return hours;
  }

  private calculateConfidence(metadata: any, entities: any): number {
    // Simple confidence calculation based on available fields
    let score = 0;
    let total = 0;

    const importantFields = ['title', 'description', 'price', 'rating', 'address', 'coordinates'];
    
    importantFields.forEach(field => {
      total += 1;
      if (metadata[field] || entities[field]) {
        score += 1;
      }
    });

    return total > 0 ? score / total : 0.5;
  }
} 