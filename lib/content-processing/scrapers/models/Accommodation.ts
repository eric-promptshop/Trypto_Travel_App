import { ExtractedAccommodation } from '../base/ScraperConfig';

export interface AccommodationDetails {
  propertyType?: 'hotel' | 'apartment' | 'hostel' | 'guesthouse' | 'resort' | 'villa' | 'other';
  chainName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  distanceToCenter?: string;
  distanceToAirport?: string;
  parkingAvailable?: boolean;
  wifiAvailable?: boolean;
  petPolicy?: string;
  languagesSpoken?: string[];
  paymentMethods?: string[];
  accessibility?: {
    wheelchairAccessible: boolean;
    elevatorAccess: boolean;
    accessibleBathroom: boolean;
    hearingImpaired: boolean;
    visuallyImpaired: boolean;
  };
}

export class Accommodation implements ExtractedAccommodation {
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
  
  // Accommodation-specific properties
  starRating?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  roomTypes?: Array<{
    name: string;
    price?: string;
    capacity?: number;
    amenities?: string[];
  }>;
  policies?: string[];
  address?: string;
  nearbyAttractions?: string[];
  
  // Extended details
  details?: AccommodationDetails;

  constructor(data: Partial<ExtractedAccommodation> & { url: string; title: string }) {
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
    this.category = data.category || 'accommodation';
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.extractedAt = data.extractedAt || new Date();
    
    // Accommodation-specific
    this.starRating = data.starRating;
    this.amenities = data.amenities || [];
    this.checkIn = data.checkIn;
    this.checkOut = data.checkOut;
    this.roomTypes = data.roomTypes || [];
    this.policies = data.policies || [];
    this.address = data.address;
    this.nearbyAttractions = data.nearbyAttractions || [];
  }

  /**
   * Add an amenity to the accommodation
   */
  addAmenity(amenity: string): void {
    if (!this.amenities) {
      this.amenities = [];
    }
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
    }
  }

  /**
   * Add a room type to the accommodation
   */
  addRoomType(roomType: {
    name: string;
    price?: string;
    capacity?: number;
    amenities?: string[];
  }): void {
    if (!this.roomTypes) {
      this.roomTypes = [];
    }
    this.roomTypes.push(roomType);
  }

  /**
   * Add a policy to the accommodation
   */
  addPolicy(policy: string): void {
    if (!this.policies) {
      this.policies = [];
    }
    if (!this.policies.includes(policy)) {
      this.policies.push(policy);
    }
  }

  /**
   * Add a nearby attraction
   */
  addNearbyAttraction(attraction: string): void {
    if (!this.nearbyAttractions) {
      this.nearbyAttractions = [];
    }
    if (!this.nearbyAttractions.includes(attraction)) {
      this.nearbyAttractions.push(attraction);
    }
  }

  /**
   * Set accommodation details
   */
  setDetails(details: AccommodationDetails): void {
    this.details = details;
  }

  /**
   * Check if accommodation has a specific amenity
   */
  hasAmenity(amenity: string): boolean {
    return this.amenities?.includes(amenity) || false;
  }

  /**
   * Get room types that can accommodate a specific number of guests
   */
  getRoomTypesForCapacity(guests: number): Array<{
    name: string;
    price?: string;
    capacity?: number;
    amenities?: string[];
  }> {
    if (!this.roomTypes) return [];
    
    return this.roomTypes.filter(room => 
      !room.capacity || room.capacity >= guests
    );
  }

  /**
   * Get the property type
   */
  getPropertyType(): string {
    return this.details?.propertyType || 'hotel';
  }

  /**
   * Check if the accommodation has sufficient information
   */
  isComplete(): boolean {
    return !!(
      this.title &&
      this.description &&
      this.location &&
      this.rating &&
      this.amenities?.length
    );
  }

  /**
   * Get star rating display
   */
  getStarRatingDisplay(): string {
    if (!this.starRating) return 'No rating';
    return `${this.starRating} star${this.starRating > 1 ? 's' : ''}`;
  }

  /**
   * Get a summary of the accommodation
   */
  getSummary(): string {
    const parts = [this.title];
    
    if (this.starRating) {
      parts.push(`${this.starRating}-star`);
    }
    
    if (this.location) {
      parts.push(`in ${this.location}`);
    }
    
    if (this.rating) {
      parts.push(`rated ${this.rating}/5`);
    }

    if (this.price) {
      const priceStr = typeof this.price === 'number' ? this.price.toString() : this.price;
      parts.push(`from ${this.currency || ''}${priceStr}`);
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
      starRating: this.starRating,
      amenities: this.amenities,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      roomTypes: this.roomTypes,
      policies: this.policies,
      address: this.address,
      nearbyAttractions: this.nearbyAttractions,
      details: this.details
    };
  }
} 