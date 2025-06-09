import { BaseScraper } from '../base/BaseScraper';
import { ScraperConfig, ActivitySelectors, ExtractedActivity } from '../base/ScraperConfig';
import { Activity } from '../models/Activity';
import * as cheerio from 'cheerio';

export class GetYourGuideScraper extends BaseScraper<ExtractedActivity> {
  
  constructor() {
    const config: ScraperConfig = {
      name: 'GetYourGuide',
      baseUrl: 'https://www.getyourguide.com',
      selectors: {
        container: '[data-test-id="tour-card"]',
        title: '[data-test-id="tour-title"]',
        description: '[data-test-id="tour-description"]',
        price: '[data-test-id="price"]',
        rating: '[data-test-id="rating"]',
        images: 'img[data-test-id="tour-image"]',
        duration: '[data-test-id="duration"]',
        highlights: '[data-test-id="highlights"] li',
        location: '[data-test-id="location"]',
        availability: '[data-test-id="availability"]',
        includes: '[data-test-id="includes"] li',
        excludes: '[data-test-id="excludes"] li',
        meetingPoint: '[data-test-id="meeting-point"]',
        cancelPolicy: '[data-test-id="cancellation"]',
        groupSize: '[data-test-id="group-size"]',
        pagination: {
          nextButton: 'button[aria-label="Next page"]',
          currentPage: '.pagination__page--current'
        }
      } as ActivitySelectors,
      throttling: {
        requestsPerMinute: 18,
        concurrentRequests: 2,
        delayBetweenRequests: 3500,
        retryAttempts: 3,
        retryDelay: 2500,
        timeout: 35000
      },
      browser: {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        blockResources: ['image', 'stylesheet', 'font'],
        enableJavaScript: true,
        waitForSelector: '[data-test-id="tour-card"]',
        waitTime: 2500
      },
      userAgent: {
        rotation: true,
        mobileRatio: 0.25
      },
      extraction: {
        maxPages: 4,
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
   * Extract activity data from GetYourGuide DOM
   */
  protected extractContentFromDOM($: cheerio.CheerioAPI): ExtractedActivity[] {
    const activities: ExtractedActivity[] = [];
    const selectors = this.config.selectors as ActivitySelectors;

    $(selectors.container).each((index, element) => {
      try {
        const $element = $(element);
        
        // Extract basic information
        const title = this.extractText($element, selectors.title);
        const description = this.extractText($element, selectors.description);
        const priceText = this.extractText($element, selectors.price);
        const ratingText = this.extractText($element, selectors.rating);
        const duration = this.extractText($element, selectors.duration);
        const location = this.extractText($element, selectors.location);

        // Skip if no title found
        if (!title) {
          this.logger.warn('Skipping activity without title', { index });
          return;
        }

        // Extract structured data
        const { price, currency } = this.parsePrice(priceText || '');
        const rating = this.parseRating(ratingText || '');
        const highlights = this.extractList($element, selectors.highlights);
        const includes = this.extractList($element, selectors.includes);
        const excludes = this.extractList($element, selectors.excludes);
        const images = this.extractImages($element, selectors.images);
        const meetingPoint = this.extractText($element, selectors.meetingPoint);
        const cancelPolicy = this.extractText($element, selectors.cancelPolicy);
        const groupSize = this.parseGroupSize($element, selectors.groupSize);
        const availability = this.extractList($element, selectors.availability);

        // Build the activity URL
        const url = this.buildActivityUrl($element);

        const activity = new Activity({
          url: url || this.config.baseUrl,
          title: title.trim(),
          description: description?.trim(),
          price,
          currency,
          rating,
          duration: duration?.trim(),
          location: location?.trim(),
          highlights,
          includes,
          excludes,
          meetingPoint: meetingPoint?.trim(),
          cancelPolicy: cancelPolicy?.trim(),
          groupSize,
          availability,
          images,
          category: 'activity',
          tags: this.generateTags(title, highlights, duration),
          extractedAt: new Date(),
          metadata: {
            source: 'getyourguide.com',
            extractionIndex: index,
            hasHighlights: highlights.length > 0,
            hasIncludes: includes.length > 0
          }
        });

        activities.push(activity);

      } catch (error) {
        this.logger.error('Error extracting activity', {
          index,
          error: (error as Error).message
        });
      }
    });

    this.logger.info('Extracted activities from GetYourGuide', {
      count: activities.length
    });

    return activities;
  }

  /**
   * Extract text content from element using selector
   */
  private extractText($parent: cheerio.Cheerio<any>, selector?: string): string | undefined {
    if (!selector) return undefined;
    const text = $parent.find(selector).first().text().trim();
    return text || undefined;
  }

  /**
   * Extract list of items from elements
   */
  private extractList($element: cheerio.Cheerio<any>, selector?: string): string[] {
    if (!selector) return [];
    
    const items: string[] = [];
    $element.find(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        items.push(text);
      }
    });
    
    return items;
  }

  /**
   * Extract images from the activity card
   */
  private extractImages($parent: cheerio.Cheerio<any>, selector?: string): string[] {
    if (!selector) return [];
    
    const images: string[] = [];
    $parent.find(selector).each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
      
      if (src && !src.includes('placeholder') && !src.includes('blank')) {
        // Handle relative URLs
        const imageUrl = src.startsWith('http') ? src : `${this.config.baseUrl}${src}`;
        images.push(imageUrl);
      }
    });
    
    return images.slice(0, 5); // Limit to 5 images
  }

  /**
   * Parse price and currency from price text
   */
  private parsePrice(priceText: string): { price?: number; currency?: string } {
    if (!priceText) return {};

    // Match patterns like "From $45", "€32", "£25.99", "US$89"
    const priceMatch = priceText.match(/(?:from\s+)?([€$£¥₹]|US\$|USD|EUR|GBP|JPY|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    
    if (priceMatch && priceMatch[1] && priceMatch[2]) {
      const currencySymbol = priceMatch[1];
      const priceValue = parseFloat(priceMatch[2].replace(/,/g, ''));
      
      // Convert currency symbols to codes
      const currencyMap: Record<string, string> = {
        '$': 'USD',
        'US$': 'USD',
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
   * Parse rating from rating text or elements
   */
  private parseRating(ratingText: string): number | undefined {
    if (!ratingText) return undefined;

    // Try to extract rating from text like "4.5 stars" or "4.5/5"
    const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
    if (ratingMatch) {
      const rating = parseFloat(ratingMatch[1]);
      return rating <= 5 ? rating : rating / 2; // Normalize to 5-point scale
    }

    return undefined;
  }

  /**
   * Parse group size information
   */
  private parseGroupSize($element: cheerio.Cheerio<any>, selector?: string): { min?: number; max?: number } | undefined {
    if (!selector) return undefined;

    const groupText = $element.find(selector).first().text().trim();
    if (!groupText) return undefined;

    // Parse patterns like "1-12 people", "Up to 8", "Min 2 people", "Max 15 guests"
    const rangeMatch = groupText.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      return {
        min: parseInt(rangeMatch[1]),
        max: parseInt(rangeMatch[2])
      };
    }

    const maxMatch = groupText.match(/(?:up to|max(?:imum)?)\s*(\d+)/i);
    if (maxMatch) {
      return { max: parseInt(maxMatch[1]) };
    }

    const minMatch = groupText.match(/(?:min(?:imum)?)\s*(\d+)/i);
    if (minMatch) {
      return { min: parseInt(minMatch[1]) };
    }

    const singleMatch = groupText.match(/(\d+)/);
    if (singleMatch) {
      const number = parseInt(singleMatch[1]);
      return { max: number };
    }

    return undefined;
  }

  /**
   * Build activity URL from the element
   */
  private buildActivityUrl($element: cheerio.Cheerio<any>): string | undefined {
    // Try different possible link selectors
    const href = $element.find('a[data-test-id="tour-link"]').attr('href') ||
                 $element.find('a[href*="/activity/"]').attr('href') ||
                 $element.find('a').first().attr('href');
    
    if (href) {
      return href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
    }

    return undefined;
  }

  /**
   * Generate relevant tags for the activity
   */
  private generateTags(title: string, highlights: string[], duration?: string): string[] {
    const tags: string[] = [];

    // Add duration-based tags
    if (duration) {
      const durationLower = duration.toLowerCase();
      if (durationLower.includes('hour')) {
        const hourMatch = durationLower.match(/(\d+)\s*hour/);
        if (hourMatch) {
          const hours = parseInt(hourMatch[1]);
          if (hours <= 2) tags.push('short-duration');
          else if (hours <= 4) tags.push('half-day');
          else if (hours <= 8) tags.push('full-day');
          else tags.push('multi-day');
        }
      }
      if (durationLower.includes('day')) {
        const dayMatch = durationLower.match(/(\d+)\s*day/);
        if (dayMatch) {
          const days = parseInt(dayMatch[1]);
          if (days === 1) tags.push('full-day');
          else tags.push('multi-day');
        }
      }
    }

    // Add activity type tags based on title and highlights
    const combinedText = `${title} ${highlights.join(' ')}`.toLowerCase();
    
    if (combinedText.includes('museum') || combinedText.includes('gallery')) tags.push('museum');
    if (combinedText.includes('tour') || combinedText.includes('walking')) tags.push('tour');
    if (combinedText.includes('food') || combinedText.includes('culinary') || combinedText.includes('cooking')) tags.push('food');
    if (combinedText.includes('outdoor') || combinedText.includes('hiking') || combinedText.includes('nature')) tags.push('outdoor');
    if (combinedText.includes('water') || combinedText.includes('boat') || combinedText.includes('cruise')) tags.push('water-activity');
    if (combinedText.includes('adventure') || combinedText.includes('extreme')) tags.push('adventure');
    if (combinedText.includes('culture') || combinedText.includes('historic') || combinedText.includes('heritage')) tags.push('cultural');
    if (combinedText.includes('skip') && combinedText.includes('line')) tags.push('skip-the-line');
    if (combinedText.includes('private')) tags.push('private');
    if (combinedText.includes('group')) tags.push('group');

    return tags;
  }
} 