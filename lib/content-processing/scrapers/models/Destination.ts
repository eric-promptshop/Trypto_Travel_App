import { ExtractedDestination } from '../base/ScraperConfig';

export interface DestinationDetails {
  overview?: string;
  bestTimeToVisit?: string;
  averageDuration?: string;
  weather?: {
    seasons: Array<{
      name: string;
      months: string[];
      temperature: string;
      rainfall: string;
      description: string;
    }>;
  };
  transportation?: {
    airport?: string;
    publicTransport?: string[];
    recommendations?: string[];
  };
  costLevel?: 'budget' | 'mid-range' | 'luxury';
  language?: string[];
  currency?: string;
  timeZone?: string;
}

export class Destination implements ExtractedDestination {
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
  
  // Destination-specific properties
  attractions?: string[];
  overview?: string;
  bestTimeToVisit?: string;
  weather?: Record<string, any>;
  transportation?: string[];
  tips?: string[];
  nearbyDestinations?: string[];
  
  // Extended details
  details?: DestinationDetails;

  constructor(data: Partial<ExtractedDestination> & { url: string; title: string }) {
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
    this.category = data.category || 'destination';
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.extractedAt = data.extractedAt || new Date();
    
    // Destination-specific
    this.attractions = data.attractions || [];
    this.overview = data.overview;
    this.bestTimeToVisit = data.bestTimeToVisit;
    this.weather = data.weather;
    this.transportation = data.transportation || [];
    this.tips = data.tips || [];
    this.nearbyDestinations = data.nearbyDestinations || [];
  }

  /**
   * Add an attraction to the destination
   */
  addAttraction(attraction: string): void {
    if (!this.attractions) {
      this.attractions = [];
    }
    if (!this.attractions.includes(attraction)) {
      this.attractions.push(attraction);
    }
  }

  /**
   * Add a tip to the destination
   */
  addTip(tip: string): void {
    if (!this.tips) {
      this.tips = [];
    }
    if (!this.tips.includes(tip)) {
      this.tips.push(tip);
    }
  }

  /**
   * Set weather information
   */
  setWeatherInfo(weather: DestinationDetails['weather']): void {
    if (!this.details) {
      this.details = {};
    }
    this.details.weather = weather;
    this.weather = weather;
  }

  /**
   * Set transportation information
   */
  setTransportationInfo(transport: DestinationDetails['transportation']): void {
    if (!this.details) {
      this.details = {};
    }
    this.details.transportation = transport;
    this.transportation = transport?.recommendations || [];
  }

  /**
   * Check if the destination has sufficient information
   */
  isComplete(): boolean {
    return !!(
      this.title &&
      this.description &&
      this.location &&
      this.attractions?.length &&
      this.overview
    );
  }

  /**
   * Get a summary of the destination
   */
  getSummary(): string {
    const parts = [this.title];
    
    if (this.location) {
      parts.push(`located in ${this.location}`);
    }
    
    if (this.attractions?.length) {
      parts.push(`featuring ${this.attractions.length} attractions`);
    }
    
    if (this.rating) {
      parts.push(`rated ${this.rating}/5`);
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
      attractions: this.attractions,
      overview: this.overview,
      bestTimeToVisit: this.bestTimeToVisit,
      weather: this.weather,
      transportation: this.transportation,
      tips: this.tips,
      nearbyDestinations: this.nearbyDestinations,
      details: this.details
    };
  }
} 