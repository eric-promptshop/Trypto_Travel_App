import { WebContentTransformer } from '../normalizers/WebContentTransformer';
import { DocumentContentTransformer } from '../normalizers/DocumentContentTransformer';
import { Deduplicator } from '../normalizers/Deduplicator';
import { EntityRecognizer } from '../normalizers/EntityRecognizer';
import { DateNormalizer } from '../normalizers/DateNormalizer';
import { PriceNormalizer } from '../normalizers/PriceNormalizer';
import { 
  RawContent, 
  NormalizedContent,
  NormalizedDestination,
  NormalizedActivity,
  NormalizedAccommodation,
  NormalizedItinerary
} from '../normalizers/types';

export type SourceType = 'web' | 'document';

export interface NormalizationOptions {
  enableDeduplication?: boolean;
  deduplicationThreshold?: number;
  validateOutput?: boolean;
  batchSize?: number;
}

export interface NormalizationResult {
  content: NormalizedContent[];
  errors: string[];
  duplicatesRemoved: number;
}

export interface ValidationError {
  contentId: string;
  field: string;
  message: string;
}

export class NormalizationPipeline {
  private webTransformer: WebContentTransformer;
  private docTransformer: DocumentContentTransformer;
  private deduplicator: Deduplicator;
  private entityRecognizer: EntityRecognizer;
  private dateNormalizer: DateNormalizer;
  private priceNormalizer: PriceNormalizer;

  constructor() {
    // Initialize shared components
    this.entityRecognizer = new EntityRecognizer();
    this.dateNormalizer = new DateNormalizer();
    this.priceNormalizer = new PriceNormalizer();
    
    // Initialize transformers with shared components
    this.webTransformer = new WebContentTransformer(
      this.entityRecognizer,
      this.dateNormalizer,
      this.priceNormalizer
    );
    
    this.docTransformer = new DocumentContentTransformer(
      this.dateNormalizer,
      this.priceNormalizer
    );
    
    this.deduplicator = new Deduplicator();
  }

  /**
   * Normalize a single piece of content
   */
  async normalize(
    input: RawContent, 
    sourceType: SourceType,
    options: NormalizationOptions = {}
  ): Promise<NormalizationResult> {
    const result: NormalizationResult = {
      content: [],
      errors: [],
      duplicatesRemoved: 0
    };

    try {
      // Transform based on source type
      let normalized: NormalizedContent | null = null;
      
      if (sourceType === 'web') {
        normalized = await this.webTransformer.transform(input);
      } else if (sourceType === 'document') {
        normalized = await this.docTransformer.transform(input);
      } else {
        throw new Error(`Unsupported source type: ${sourceType}`);
      }

      if (!normalized) {
        result.errors.push(`Failed to transform content from ${input.id || 'unknown source'}`);
        return result;
      }

      // Check for duplicates if enabled
      if (options.enableDeduplication) {
        const deduplicationResult = this.deduplicator.checkAndStoreDuplicate(
          normalized,
          options.deduplicationThreshold
        );
        
        if (deduplicationResult.isDuplicate) {
          result.duplicatesRemoved = 1;
          return result;
        }
      }

      // Validate if enabled
      if (options.validateOutput) {
        const validationErrors = this.validateContent(normalized);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors.map(e => 
            `Validation error in ${e.contentId}: ${e.field} - ${e.message}`
          ));
        }
      }

      result.content.push(normalized);
    } catch (error) {
      result.errors.push(`Pipeline error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Normalize multiple pieces of content in batch
   */
  async normalizeBatch(
    inputs: RawContent[],
    sourceType: SourceType,
    options: NormalizationOptions = {}
  ): Promise<NormalizationResult> {
    const batchSize = options.batchSize || 10;
    const allResults: NormalizationResult = {
      content: [],
      errors: [],
      duplicatesRemoved: 0
    };

    // Process in batches to avoid memory issues
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(input => this.normalize(input, sourceType, options))
      );

      // Aggregate results
      for (const result of batchResults) {
        allResults.content.push(...result.content);
        allResults.errors.push(...result.errors);
        allResults.duplicatesRemoved += result.duplicatesRemoved;
      }
    }

    return allResults;
  }

  /**
   * Validate normalized content
   */
  private validateContent(content: NormalizedContent): ValidationError[] {
    const errors: ValidationError[] = [];

    // Common validations
    if (!content.id) {
      errors.push({ contentId: content.id || 'unknown', field: 'id', message: 'Missing ID' });
    }

    if (!content.source) {
      errors.push({ contentId: content.id, field: 'source', message: 'Missing source' });
    }

    if (!content.extractionDate) {
      errors.push({ contentId: content.id, field: 'extractionDate', message: 'Missing extraction date' });
    }

    // Type-specific validations
    switch (content.type) {
      case 'destination':
        this.validateDestination(content as NormalizedDestination, errors);
        break;
      case 'activity':
        this.validateActivity(content as NormalizedActivity, errors);
        break;
      case 'accommodation':
        this.validateAccommodation(content as NormalizedAccommodation, errors);
        break;
      case 'itinerary':
        this.validateItinerary(content as NormalizedItinerary, errors);
        break;
    }

    return errors;
  }

  private validateDestination(dest: NormalizedDestination, errors: ValidationError[]): void {
    if (!dest.name || dest.name.trim() === '') {
      errors.push({ contentId: dest.id, field: 'name', message: 'Destination name is required' });
    }

    if (!dest.country || dest.country === 'Unknown') {
      errors.push({ contentId: dest.id, field: 'country', message: 'Valid country code is required' });
    }

    if (dest.coordinates) {
      if (typeof dest.coordinates.lat !== 'number' || 
          dest.coordinates.lat < -90 || dest.coordinates.lat > 90) {
        errors.push({ contentId: dest.id, field: 'coordinates.lat', message: 'Invalid latitude' });
      }
      if (typeof dest.coordinates.lng !== 'number' || 
          dest.coordinates.lng < -180 || dest.coordinates.lng > 180) {
        errors.push({ contentId: dest.id, field: 'coordinates.lng', message: 'Invalid longitude' });
      }
    }
  }

  private validateActivity(activity: NormalizedActivity, errors: ValidationError[]): void {
    if (!activity.name || activity.name.trim() === '') {
      errors.push({ contentId: activity.id, field: 'name', message: 'Activity name is required' });
    }

    if (activity.price) {
      if (activity.price.amount < 0) {
        errors.push({ contentId: activity.id, field: 'price.amount', message: 'Price cannot be negative' });
      }
      if (!activity.price.currency || !/^[A-Z]{3}$/.test(activity.price.currency)) {
        errors.push({ contentId: activity.id, field: 'price.currency', message: 'Invalid currency code' });
      }
    }

    if (activity.duration) {
      const durationMatch = activity.duration.match(/^(\d+(?:\.\d+)?)\s*(hours?|minutes?|days?)$/);
      if (!durationMatch) {
        errors.push({ contentId: activity.id, field: 'duration', message: 'Invalid duration format' });
      }
    }

    if (activity.rating !== undefined) {
      if (activity.rating < 0 || activity.rating > 5) {
        errors.push({ contentId: activity.id, field: 'rating', message: 'Rating must be between 0 and 5' });
      }
    }
  }

  private validateAccommodation(acc: NormalizedAccommodation, errors: ValidationError[]): void {
    if (!acc.name || acc.name.trim() === '') {
      errors.push({ contentId: acc.id, field: 'name', message: 'Accommodation name is required' });
    }

    if (!acc.address || !acc.address.country) {
      errors.push({ contentId: acc.id, field: 'address.country', message: 'Country is required' });
    }

    if (acc.checkInTime) {
      const timeMatch = acc.checkInTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (!timeMatch) {
        errors.push({ contentId: acc.id, field: 'checkInTime', message: 'Invalid check-in time format' });
      }
    }

    if (acc.checkOutTime) {
      const timeMatch = acc.checkOutTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (!timeMatch) {
        errors.push({ contentId: acc.id, field: 'checkOutTime', message: 'Invalid check-out time format' });
      }
    }

    if (acc.priceRange) {
      if (acc.priceRange.min && acc.priceRange.max && acc.priceRange.min.amount > acc.priceRange.max.amount) {
        errors.push({ contentId: acc.id, field: 'priceRange', message: 'Min price cannot exceed max price' });
      }
    }
  }

  private validateItinerary(itinerary: NormalizedItinerary, errors: ValidationError[]): void {
    if (!itinerary.title || itinerary.title.trim() === '') {
      errors.push({ contentId: itinerary.id, field: 'title', message: 'Itinerary title is required' });
    }

    if (!itinerary.dailyPlans || itinerary.dailyPlans.length === 0) {
      errors.push({ contentId: itinerary.id, field: 'dailyPlans', message: 'At least one daily plan is required' });
    }

    if (itinerary.startDate && itinerary.endDate) {
      const start = new Date(itinerary.startDate);
      const end = new Date(itinerary.endDate);
      if (start > end) {
        errors.push({ contentId: itinerary.id, field: 'dates', message: 'Start date cannot be after end date' });
      }
    }

    // Validate daily plans
    itinerary.dailyPlans?.forEach((plan, index) => {
      if (!plan.day || plan.day < 1) {
        errors.push({ 
          contentId: itinerary.id, 
          field: `dailyPlans[${index}].day`, 
          message: 'Day number must be positive' 
        });
      }
    });
  }

  /**
   * Get content by type from a batch result
   */
  getContentByType(result: NormalizationResult): {
    destinations: NormalizedDestination[];
    activities: NormalizedActivity[];
    accommodations: NormalizedAccommodation[];
    itineraries: NormalizedItinerary[];
  } {
    const destinations: NormalizedDestination[] = [];
    const activities: NormalizedActivity[] = [];
    const accommodations: NormalizedAccommodation[] = [];
    const itineraries: NormalizedItinerary[] = [];

    for (const content of result.content) {
      switch (content.type) {
        case 'destination':
          destinations.push(content as NormalizedDestination);
          break;
        case 'activity':
          activities.push(content as NormalizedActivity);
          break;
        case 'accommodation':
          accommodations.push(content as NormalizedAccommodation);
          break;
        case 'itinerary':
          itineraries.push(content as NormalizedItinerary);
          break;
      }
    }

    return { destinations, activities, accommodations, itineraries };
  }

  /**
   * Clear the deduplication index
   */
  clearDeduplicationIndex(): void {
    this.deduplicator = new Deduplicator();
  }
} 