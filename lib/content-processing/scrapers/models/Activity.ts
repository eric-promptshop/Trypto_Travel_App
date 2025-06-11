import { ExtractedActivity } from '../base/ScraperConfig';

export interface ActivityDetails {
  providerId?: string;
  bookingUrl?: string;
  ageRestrictions?: {
    minAge?: number;
    maxAge?: number;
    requirements?: string[];
  };
  physicalRequirements?: string[];
  seasonality?: {
    bestMonths: string[];
    availableMonths: string[];
    weatherDependency: boolean;
  };
  equipment?: {
    included: string[];
    required: string[];
    recommended: string[];
  };
  accessibility?: {
    wheelchairAccessible: boolean;
    mobilityLevel: 'easy' | 'moderate' | 'challenging' | 'difficult';
    specialNeeds: string[];
  };
}

export class Activity implements ExtractedActivity {
  id?: string;
  url: string;
  title: string;
  description?: string;
  price?: string | number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  location?: string;
  coordinates?: { lat: number; lng: number };
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  extractedAt: Date;
  
  // Activity-specific properties
  duration?: string;
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  meetingPoint?: string;
  cancelPolicy?: string;
  availability?: string[];
  groupSize?: { min?: number; max?: number };
  difficulty?: string;
  
  // Extended details
  details?: ActivityDetails;

  constructor(data: Partial<ExtractedActivity> & { url: string; title: string }) {
    this.id = data.id;
    this.url = data.url;
    this.title = data.title;
    this.description = data.description;
    this.price = data.price;
    this.currency = data.currency;
    this.rating = data.rating;
    this.reviewCount = data.reviewCount;
    this.images = data.images || [];
    this.location = data.location;
    this.coordinates = data.coordinates;
    this.category = data.category || 'activity';
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.extractedAt = data.extractedAt || new Date();
    
    // Activity-specific
    this.duration = data.duration;
    this.highlights = data.highlights || [];
    this.includes = data.includes || [];
    this.excludes = data.excludes || [];
    this.meetingPoint = data.meetingPoint;
    this.cancelPolicy = data.cancelPolicy;
    this.availability = data.availability || [];
    this.groupSize = data.groupSize;
    this.difficulty = data.difficulty;
  }

  /**
   * Add a highlight to the activity
   */
  addHighlight(highlight: string): void {
    if (!this.highlights) {
      this.highlights = [];
    }
    if (!this.highlights.includes(highlight)) {
      this.highlights.push(highlight);
    }
  }

  /**
   * Add an included item to the activity
   */
  addInclude(include: string): void {
    if (!this.includes) {
      this.includes = [];
    }
    if (!this.includes.includes(include)) {
      this.includes.push(include);
    }
  }

  /**
   * Add an excluded item to the activity
   */
  addExclude(exclude: string): void {
    if (!this.excludes) {
      this.excludes = [];
    }
    if (!this.excludes.includes(exclude)) {
      this.excludes.push(exclude);
    }
  }

  /**
   * Set group size constraints
   */
  setGroupSize(min?: number, max?: number): void {
    this.groupSize = {
      min: min,
      max: max
    };
  }

  /**
   * Set accessibility information
   */
  setAccessibilityInfo(accessibility: ActivityDetails['accessibility']): void {
    if (!this.details) {
      this.details = {};
    }
    this.details.accessibility = accessibility;
  }

  /**
   * Set equipment information
   */
  setEquipmentInfo(equipment: ActivityDetails['equipment']): void {
    if (!this.details) {
      this.details = {};
    }
    this.details.equipment = equipment;
  }

  /**
   * Check if activity is suitable for a specific group size
   */
  isValidForGroupSize(size: number): boolean {
    if (!this.groupSize) return true;
    
    const validMin = !this.groupSize.min || size >= this.groupSize.min;
    const validMax = !this.groupSize.max || size <= this.groupSize.max;
    
    return validMin && validMax;
  }

  /**
   * Get difficulty level as a number (1-5)
   */
  getDifficultyLevel(): number {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'moderate': 2,
      'medium': 3,
      'challenging': 4,
      'difficult': 5,
      'hard': 5
    };

    if (!this.difficulty) return 0;
    
    const normalized = this.difficulty.toLowerCase();
    return difficultyMap[normalized] || 0;
  }

  /**
   * Check if the activity has sufficient information
   */
  isComplete(): boolean {
    return !!(
      this.title &&
      this.description &&
      this.duration &&
      this.location &&
      this.price
    );
  }

  /**
   * Get a summary of the activity
   */
  getSummary(): string {
    const parts = [this.title];
    
    if (this.duration) {
      parts.push(`duration: ${this.duration}`);
    }
    
    if (this.difficulty) {
      parts.push(`difficulty: ${this.difficulty}`);
    }
    
    if (this.rating) {
      parts.push(`rated ${this.rating}/5`);
    }

    if (this.price) {
      const priceStr = typeof this.price === 'number' ? this.price.toString() : this.price;
      parts.push(`price: ${this.currency || ''}${priceStr}`);
    }

    return parts.join(', ');
  }

  /**
   * Convert to a plain object for storage
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      url: this.url,
      title: this.title,
      description: this.description,
      price: this.price,
      currency: this.currency,
      rating: this.rating,
      reviewCount: this.reviewCount,
      images: this.images,
      location: this.location,
      coordinates: this.coordinates,
      category: this.category,
      tags: this.tags,
      metadata: this.metadata,
      extractedAt: this.extractedAt,
      duration: this.duration,
      highlights: this.highlights,
      includes: this.includes,
      excludes: this.excludes,
      meetingPoint: this.meetingPoint,
      cancelPolicy: this.cancelPolicy,
      availability: this.availability,
      groupSize: this.groupSize,
      difficulty: this.difficulty,
      details: this.details
    };
  }
} 