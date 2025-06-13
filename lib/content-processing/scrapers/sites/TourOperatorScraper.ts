import { BaseScraper } from '../base/BaseScraper';
import { ScraperConfig } from '../base/ScraperConfig';
import { Activity } from '../models/Activity';
import * as cheerio from 'cheerio';

interface TourData {
  title: string;
  description?: string;
  location?: string;
  duration?: string;
  price?: number | string;
  currency?: string;
  images?: string[];
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
}

export class TourOperatorScraper extends BaseScraper<Activity> {
  constructor() {
    const config: ScraperConfig = {
      name: 'TourOperatorScraper',
      baseUrl: '',
      throttling: {
        concurrentRequests: 2,
        requestsPerMinute: 30,
        retryAttempts: 3,
        retryDelay: 5000,
        timeout: 30000,
        delayBetweenRequests: 2000
      },
      selectors: {
        container: '', // Will be dynamically determined
        title: '',
        description: '',
        price: '',
        location: '',
        duration: '',
        image: ''
      },
      browser: {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        blockResources: ['font', 'media'],
        waitTime: 2000
      },
      userAgent: {
        rotate: true,
        list: [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      }
    };
    super(config);
  }

  protected extractContentFromDOM($: cheerio.CheerioAPI): Activity[] {
    const activities: Activity[] = [];
    
    // Try to identify tours from common patterns
    const tourData = this.extractToursGeneric($);
    
    tourData.forEach((tour, index) => {
      const activity = new Activity(
        `tour-${Date.now()}-${index}`,
        tour.title,
        tour.description || '',
        tour.location || 'Various Locations',
        this.parsePrice(tour.price),
        tour.currency || 'USD',
        tour.duration || 'Varies',
        tour.images || [],
        tour.highlights || [],
        tour.includes || [],
        tour.excludes || []
      );
      
      activities.push(activity);
    });

    return activities;
  }

  private extractToursGeneric($: cheerio.CheerioAPI): TourData[] {
    const tours: TourData[] = [];
    
    // Common selectors for tour/product listings
    const possibleContainers = [
      '.tour-item', '.tour-card', '.product-card', '.package-item',
      '[class*="tour"]', '[class*="package"]', '[class*="product"]',
      'article', '.card', '.item', '.listing-item'
    ];
    
    // Try each container selector to find tour items
    for (const selector of possibleContainers) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, element) => {
          const tour = this.extractTourFromElement($, $(element));
          if (tour && tour.title) {
            tours.push(tour);
          }
        });
        
        // If we found tours with this selector, stop looking
        if (tours.length > 0) {
          this.logger.info(`Found ${tours.length} tours using selector: ${selector}`);
          break;
        }
      }
    }
    
    // If no tours found with containers, try to extract from page structure
    if (tours.length === 0) {
      const pageData = this.extractFromPageStructure($);
      if (pageData.length > 0) {
        tours.push(...pageData);
      }
    }

    return tours;
  }

  private extractTourFromElement($: cheerio.CheerioAPI, element: cheerio.Cheerio): TourData {
    // Common selectors for tour information
    const titleSelectors = ['h2', 'h3', 'h4', '.title', '.tour-title', '.product-title', '[class*="title"]', 'a'];
    const descSelectors = ['.description', '.desc', '.summary', 'p', '[class*="desc"]'];
    const priceSelectors = ['.price', '.cost', '[class*="price"]', '[class*="cost"]'];
    const durationSelectors = ['.duration', '.days', '[class*="duration"]', '[class*="days"]'];
    const locationSelectors = ['.location', '.destination', '[class*="location"]', '[class*="destination"]'];
    const imageSelectors = ['img', '.image img', '[class*="image"] img'];

    const tour: TourData = {
      title: '',
      description: '',
      location: '',
      duration: '',
      price: '',
      images: []
    };

    // Extract title
    for (const selector of titleSelectors) {
      const title = element.find(selector).first().text().trim();
      if (title) {
        tour.title = title;
        break;
      }
    }

    // Extract description
    for (const selector of descSelectors) {
      const desc = element.find(selector).first().text().trim();
      if (desc && desc.length > 20) {
        tour.description = desc;
        break;
      }
    }

    // Extract price
    for (const selector of priceSelectors) {
      const priceText = element.find(selector).first().text().trim();
      if (priceText) {
        tour.price = priceText;
        tour.currency = this.extractCurrency(priceText);
        break;
      }
    }

    // Extract duration
    for (const selector of durationSelectors) {
      const duration = element.find(selector).first().text().trim();
      if (duration) {
        tour.duration = duration;
        break;
      }
    }

    // Extract location
    for (const selector of locationSelectors) {
      const location = element.find(selector).first().text().trim();
      if (location) {
        tour.location = location;
        break;
      }
    }

    // Extract images
    element.find('img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('icon')) {
        tour.images?.push(this.resolveImageUrl(src));
      }
    });

    return tour;
  }

  private extractFromPageStructure($: cheerio.CheerioAPI): TourData[] {
    const tours: TourData[] = [];
    
    // Look for structured data
    const ldJsonScripts = $('script[type="application/ld+json"]');
    ldJsonScripts.each((_, script) => {
      try {
        const data = JSON.parse($(script).html() || '{}');
        if (data['@type'] === 'Product' || data['@type'] === 'TouristTrip' || data['@type'] === 'Event') {
          tours.push({
            title: data.name || '',
            description: data.description || '',
            location: data.location?.name || '',
            price: data.offers?.price || '',
            currency: data.offers?.priceCurrency || 'USD',
            images: data.image ? [data.image] : []
          });
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    // If no structured data, look for main content
    if (tours.length === 0) {
      const mainContent = $('main, #main, .main-content, [role="main"]').first();
      if (mainContent.length > 0) {
        const title = mainContent.find('h1').first().text().trim();
        const description = mainContent.find('p').first().text().trim();
        
        if (title) {
          tours.push({
            title,
            description,
            location: this.extractLocationFromText(title + ' ' + description),
            images: this.extractImagesFromContent(mainContent, $)
          });
        }
      }
    }

    return tours;
  }

  private parsePrice(priceText: string | number | undefined): number {
    if (typeof priceText === 'number') return priceText;
    if (!priceText) return 0;
    
    // Extract numeric value from price text
    const match = priceText.toString().match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  private extractCurrency(priceText: string): string {
    // Common currency symbols and codes
    if (priceText.includes('$')) return 'USD';
    if (priceText.includes('€')) return 'EUR';
    if (priceText.includes('£')) return 'GBP';
    if (priceText.includes('¥')) return 'JPY';
    if (priceText.includes('₹')) return 'INR';
    
    // Look for currency codes
    const currencyMatch = priceText.match(/[A-Z]{3}/);
    if (currencyMatch) return currencyMatch[0];
    
    return 'USD'; // Default
  }

  private extractLocationFromText(text: string): string {
    // Common location patterns
    const patterns = [
      /(?:in|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:tour|trip|package|adventure)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return 'Various Locations';
  }

  private extractImagesFromContent(element: cheerio.Cheerio, $: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    
    element.find('img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('icon') && !src.includes('logo')) {
        images.push(this.resolveImageUrl(src));
      }
    });
    
    return images.slice(0, 5); // Limit to 5 images
  }

  private resolveImageUrl(src: string): string {
    // If it's already a full URL, return it
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // If it starts with //, add https:
    if (src.startsWith('//')) {
      return 'https:' + src;
    }
    
    // For relative URLs, we'll need the base URL from the page being scraped
    // This will be handled in the actual scraping process
    return src;
  }

  /**
   * Override scrapeUrl to handle relative URLs in images
   */
  async scrapeUrl(url: string): Promise<any> {
    const result = await super.scrapeUrl(url);
    
    // Post-process to fix relative image URLs
    if (result.success && result.data) {
      const baseUrl = new URL(url);
      result.data.forEach((activity: Activity) => {
        if (activity.images) {
          activity.images = activity.images.map(img => {
            if (!img.startsWith('http') && !img.startsWith('//')) {
              // Resolve relative URL
              return new URL(img, baseUrl.origin).href;
            }
            return img;
          });
        }
      });
    }
    
    return result;
  }
}