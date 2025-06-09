import { BaseScraper } from '../base/BaseScraper';
import { ScraperConfig, AccommodationSelectors, ExtractedAccommodation } from '../base/ScraperConfig';
import { Accommodation } from '../models/Accommodation';
import * as cheerio from 'cheerio';

export class BookingComScraper extends BaseScraper<ExtractedAccommodation> {
  
  constructor() {
    const config: ScraperConfig = {
      name: 'Booking.com',
      baseUrl: 'https://www.booking.com',
      selectors: {
        container: '[data-testid="property-card"]',
        title: '[data-testid="title"]',
        description: '[data-testid="property-card-description"]',
        price: '[data-testid="price-and-discounted-price"]',
        rating: '[data-testid="review-score-badge"]',
        images: 'img[data-testid="image"]',
        starRating: '[data-testid="rating-stars"]',
        amenities: '[data-testid="facility-highlight"]',
        checkIn: '[data-testid="checkin-time"]',
        checkOut: '[data-testid="checkout-time"]',
        availability: '[data-testid="availability"]',
        roomTypes: '[data-testid="room-option"]',
        policies: '[data-testid="policies"]',
        address: '[data-testid="address"]',
        location: '[data-testid="location"]',
        pagination: {
          nextButton: 'button[aria-label="Next page"]',
          currentPage: '[data-testid="page-number"][aria-current="page"]'
        }
      } as AccommodationSelectors,
      throttling: {
        requestsPerMinute: 15, // More conservative for Booking.com
        concurrentRequests: 1,
        delayBetweenRequests: 4000,
        retryAttempts: 3,
        retryDelay: 3000,
        timeout: 45000
      },
      browser: {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        blockResources: ['image', 'stylesheet', 'font'],
        enableJavaScript: true,
        waitForSelector: '[data-testid="property-card"]',
        waitTime: 3000
      },
      userAgent: {
        rotation: true,
        mobileRatio: 0.3 // Higher mobile ratio for Booking.com
      },
      extraction: {
        maxPages: 3,
        extractImages: false,
        cleanText: true,
        extractMetadata: true
      },
      errorHandling: {
        skipOnError: true,
        logErrors: true,
        maxErrors: 5,
        notifyOnBlock: true
      }
    };

    super(config);
  }

  /**
   * Extract accommodation data from Booking.com DOM
   */
  protected extractContentFromDOM($: cheerio.CheerioAPI): ExtractedAccommodation[] {
    const accommodations: ExtractedAccommodation[] = [];
    const selectors = this.config.selectors as AccommodationSelectors;

    $(selectors.container).each((index, element) => {
      try {
        const $element = $(element);
        
        // Extract basic information
        const title = this.extractText($element, selectors.title);
        const description = this.extractText($element, selectors.description);
        const priceText = this.extractText($element, selectors.price);
        const ratingText = this.extractText($element, selectors.rating);
        const location = this.extractText($element, selectors.location);
        const address = this.extractText($element, selectors.address);

        // Skip if no title found
        if (!title) {
          this.logger.warn('Skipping accommodation without title', { index });
          return;
        }

        // Extract price and currency
        const { price, currency } = this.parsePrice(priceText);
        
        // Extract rating
        const rating = this.parseRating(ratingText);
        
        // Extract star rating
        const starRating = this.parseStarRating($element, selectors.starRating);
        
        // Extract amenities
        const amenities = this.extractTextArray($element, selectors.amenities);
        
        // Extract room types
        const roomTypes = this.extractRoomTypes($element, selectors.roomTypes);
        
        // Extract policies
        const policies = this.extractTextArray($element, selectors.policies);
        
        // Extract images
        const images = this.extractImages($element, selectors.images);
        
        // Build the accommodation URL
        const url = this.buildAccommodationUrl($element);

        const accommodationData: {
          url: string;
          title: string;
          description?: string;
          price?: number;
          currency?: string;
          rating?: number;
          starRating?: number;
          location?: string;
          address?: string;
          amenities?: string[];
          roomTypes?: Array<{
            name: string;
            price?: string;
            capacity?: number;
            amenities?: string[];
          }>;
          policies?: string[];
          images?: string[];
          category?: string;
          tags?: string[];
          extractedAt?: Date;
          metadata?: Record<string, any>;
        } = {
          url: url || this.config.baseUrl,
          title: title.trim(),
          category: 'accommodation',
          tags: this.generateTags(title, amenities, starRating),
          extractedAt: new Date(),
          metadata: {
            source: 'booking.com',
            extractionIndex: index,
            hasRoomTypes: roomTypes.length > 0,
            amenityCount: amenities.length
          }
        };

        // Only add non-empty optional fields
        if (description) accommodationData.description = description.trim();
        if (price !== undefined) accommodationData.price = price;
        if (currency) accommodationData.currency = currency;
        if (rating !== undefined) accommodationData.rating = rating;
        if (starRating !== undefined) accommodationData.starRating = starRating;
        if (location) accommodationData.location = location.trim();
        if (address) accommodationData.address = address.trim();
        if (amenities.length > 0) accommodationData.amenities = amenities;
        if (roomTypes.length > 0) accommodationData.roomTypes = roomTypes;
        if (policies.length > 0) accommodationData.policies = policies;
        if (images.length > 0) accommodationData.images = images;

        const accommodation = new Accommodation(accommodationData);
        accommodations.push(accommodation);

      } catch (error) {
        this.logger.error('Error extracting accommodation', {
          index,
          error: (error as Error).message
        });
      }
    });

    this.logger.info('Extracted accommodations from Booking.com', {
      count: accommodations.length
    });

    return accommodations;
  }

  /**
   * Extract text content from element using selector
   */
  private extractText($parent: cheerio.Cheerio<any>, selector?: string): string {
    if (!selector) return '';
    return $parent.find(selector).first().text().trim();
  }

  /**
   * Extract array of text content from elements
   */
  private extractTextArray($parent: cheerio.Cheerio<any>, selector?: string): string[] {
    if (!selector) return [];
    const items: string[] = [];
    $parent.find(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text) items.push(text);
    });
    return items;
  }

  /**
   * Extract images from the accommodation card
   */
  private extractImages($parent: cheerio.Cheerio<any>, selector?: string): string[] {
    if (!selector) return [];
    const images: string[] = [];
    $parent.find(selector).each((_, element) => {
      const $el = $(element);
      const src = $el.attr('src') || $el.attr('data-src');
      if (src && !src.includes('placeholder')) {
        images.push(src);
      }
    });
    return images.slice(0, 5); // Limit to 5 images
  }

  /**
   * Parse price and currency from price text
   */
  private parsePrice(priceText: string): { price?: number; currency?: string } {
    if (!priceText) return {};

    // Match patterns like "$120", "€89", "£95", "USD 150"
    const priceMatch = priceText.match(/([€$£¥₹]|USD|EUR|GBP|JPY|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    
    if (priceMatch && priceMatch[1] && priceMatch[2]) {
      const currencySymbol = priceMatch[1];
      const priceValue = parseFloat(priceMatch[2].replace(/,/g, ''));
      
      // Convert currency symbols to codes
      const currencyMap: Record<string, string> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        '₹': 'INR'
      };
      
      const currency = currencyMap[currencySymbol] || currencySymbol.toUpperCase();
      
      return { price: priceValue, currency };
    }

    return {};
  }

  /**
   * Parse rating from rating text
   */
  private parseRating(ratingText: string): number | undefined {
    if (!ratingText) return undefined;

    const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
    if (ratingMatch && ratingMatch[1]) {
      const rating = parseFloat(ratingMatch[1]);
      // Booking.com uses 10-point scale, convert to 5-point
      return rating <= 10 ? (rating / 2) : rating;
    }

    return undefined;
  }

  /**
   * Parse star rating from star rating element
   */
  private parseStarRating($parent: cheerio.Cheerio<any>, selector?: string): number | undefined {
    if (!selector) return undefined;

    const $starElement = $parent.find(selector).first();
    const starText = $starElement.text();
    const starMatch = starText.match(/(\d+)/);
    
    if (starMatch) {
      return parseInt(starMatch[1]);
    }

    // Try to count star elements
    const starCount = $starElement.find('[class*="star"], [data-testid*="star"]').length;
    return starCount > 0 ? starCount : undefined;
  }

  /**
   * Extract room types information
   */
  private extractRoomTypes($parent: cheerio.Cheerio<any>, selector?: string): Array<{
    name: string;
    price?: string;
    capacity?: number;
    amenities?: string[];
  }> {
    if (!selector) return [];

    const roomTypes: Array<{
      name: string;
      price?: string;
      capacity?: number;
      amenities?: string[];
    }> = [];

    $parent.find(selector).each((_, element) => {
      const $room = $(element);
      const name = $room.find('[data-testid="room-name"]').text().trim();
      const priceText = $room.find('[data-testid="room-price"]').text().trim();
      const capacityText = $room.find('[data-testid="room-capacity"]').text().trim();
      const amenities = this.extractTextArray($room as any, '[data-testid="room-amenity"]');

      if (name) {
        const capacityMatch = capacityText.match(/(\d+)/);
        const capacity = capacityMatch ? parseInt(capacityMatch[1]) : undefined;

        const roomType: {
          name: string;
          price?: string;
          capacity?: number;
          amenities?: string[];
        } = { name };

        if (priceText) roomType.price = priceText;
        if (capacity !== undefined) roomType.capacity = capacity;
        if (amenities.length > 0) roomType.amenities = amenities;

        roomTypes.push(roomType);
      }
    });

    return roomTypes;
  }

  /**
   * Build accommodation URL from the element
   */
  private buildAccommodationUrl($element: cheerio.Cheerio<any>): string | undefined {
    const href = $element.find('a[data-testid="title-link"]').attr('href') ||
                 $element.find('a').first().attr('href');
    
    if (href) {
      return href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
    }

    return undefined;
  }

  /**
   * Generate relevant tags for the accommodation
   */
  private generateTags(title: string, amenities: string[], starRating?: number): string[] {
    const tags: string[] = [];

    // Add star rating tag
    if (starRating) {
      tags.push(`${starRating}-star`);
    }

    // Add property type tags based on title
    const titleLower = title.toLowerCase();
    if (titleLower.includes('hotel')) tags.push('hotel');
    if (titleLower.includes('apartment')) tags.push('apartment');
    if (titleLower.includes('resort')) tags.push('resort');
    if (titleLower.includes('villa')) tags.push('villa');
    if (titleLower.includes('hostel')) tags.push('hostel');

    // Add amenity-based tags
    const amenityTags = new Set<string>();
    amenities.forEach(amenity => {
      const amenityLower = amenity.toLowerCase();
      if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
        amenityTags.add('wifi');
      }
      if (amenityLower.includes('pool')) amenityTags.add('pool');
      if (amenityLower.includes('spa')) amenityTags.add('spa');
      if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
        amenityTags.add('fitness');
      }
      if (amenityLower.includes('parking')) amenityTags.add('parking');
      if (amenityLower.includes('breakfast')) amenityTags.add('breakfast');
      if (amenityLower.includes('beach')) amenityTags.add('beachfront');
    });

    tags.push(...Array.from(amenityTags));

    return tags;
  }
} 