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
    
    // Try multiple extraction strategies
    let tourData = this.extractToursGeneric($);
    
    // If generic extraction fails, try link-based extraction
    if (tourData.length === 0) {
      tourData = this.extractToursFromLinks($);
    }
    
    // If still no tours, try grid/list extraction
    if (tourData.length === 0) {
      tourData = this.extractToursFromGrid($);
    }
    
    // Remove duplicates based on title
    const uniqueTours = this.removeDuplicates(tourData);
    
    uniqueTours.forEach((tour, index) => {
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
    
    // Extended selectors for tour/product listings
    const possibleContainers = [
      // Specific tour selectors
      '.tour-item', '.tour-card', '.product-card', '.package-item',
      '[class*="tour"]', '[class*="package"]', '[class*="product"]',
      '[class*="trip"]', '[class*="itinerary"]', '[class*="destination"]',
      
      // Generic card/list selectors
      'article', '.card', '.item', '.listing-item',
      '.box', '.panel', '.module', '.widget',
      
      // Grid/flex containers
      '.grid-item', '.flex-item', '[class*="col-"]',
      
      // Link-based containers
      'a[href*="/tour"]', 'a[href*="/package"]', 'a[href*="/trip"]',
      'a[href*="/itinerary"]', 'a[href*="/destination"]'
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
    // Extended selectors for tour information
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5',
      '.title', '.tour-title', '.product-title', '.package-title',
      '[class*="title"]', '[class*="heading"]', '[class*="name"]',
      'a > span', 'a > div', 'a[href*="/"]'
    ];
    const descSelectors = [
      '.description', '.desc', '.summary', '.excerpt',
      '[class*="desc"]', '[class*="summary"]', '[class*="excerpt"]',
      'p', 'span'
    ];
    const priceSelectors = [
      '.price', '.cost', '.rate', '.fare',
      '[class*="price"]', '[class*="cost"]', '[class*="rate"]',
      '[class*="from"]', 'span:contains("$")', 'div:contains("$")',
      '[data-price]', '[data-cost]'
    ];
    const durationSelectors = [
      '.duration', '.days', '.nights', '.length',
      '[class*="duration"]', '[class*="days"]', '[class*="nights"]',
      '[class*="length"]', '[class*="time"]',
      'span:contains("day")', 'div:contains("day")',
      'span:contains("night")', 'div:contains("night")'
    ];
    const locationSelectors = [
      '.location', '.destination', '.place', '.region',
      '[class*="location"]', '[class*="destination"]', '[class*="place"]',
      '[class*="region"]', '[class*="country"]', '[class*="city"]'
    ];
    const imageSelectors = [
      'img', 'picture img', '.image img', '[class*="image"] img',
      '[class*="photo"] img', '[class*="thumbnail"] img',
      'img[src*="tour"]', 'img[src*="package"]', 'img[src*="trip"]'
    ];

    const tour: TourData = {
      title: '',
      description: '',
      location: '',
      duration: '',
      price: '',
      images: []
    };

    // Extract title (with text cleaning)
    for (const selector of titleSelectors) {
      const titleElem = element.find(selector).first();
      let title = titleElem.text().trim();
      
      // Clean up title
      title = title.replace(/\s+/g, ' ').trim();
      
      // Skip if title is too short or contains only numbers
      if (title && title.length > 3 && !/^\d+$/.test(title)) {
        tour.title = title;
        break;
      }
    }
    
    // If no title found, try to extract from href
    if (!tour.title) {
      const href = element.attr('href') || element.find('a').first().attr('href');
      if (href) {
        const titleFromHref = this.extractTitleFromUrl(href);
        if (titleFromHref) {
          tour.title = titleFromHref;
        }
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

    // Extract price (with better pattern matching)
    for (const selector of priceSelectors) {
      const priceElem = element.find(selector).first();
      let priceText = priceElem.text().trim();
      
      // Also check data attributes
      if (!priceText) {
        priceText = priceElem.attr('data-price') || priceElem.attr('data-cost') || '';
      }
      
      if (priceText && /\d/.test(priceText)) {
        tour.price = priceText;
        tour.currency = this.extractCurrency(priceText);
        break;
      }
    }
    
    // Look for price in the entire element text if not found
    if (!tour.price) {
      const fullText = element.text();
      const priceMatch = fullText.match(/(?:from\s*)?(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{2})?)/i);
      if (priceMatch) {
        tour.price = priceMatch[0];
        tour.currency = 'USD';
      }
    }

    // Extract duration (with pattern matching)
    for (const selector of durationSelectors) {
      const durationText = element.find(selector).first().text().trim();
      if (durationText) {
        // Look for duration patterns
        const durationMatch = durationText.match(/(\d+)\s*(days?|nights?|hours?|weeks?)/i);
        if (durationMatch) {
          tour.duration = durationMatch[0];
          break;
        }
      }
    }
    
    // Look for duration in the entire element text if not found
    if (!tour.duration) {
      const fullText = element.text();
      const durationMatch = fullText.match(/(\d+)\s*(days?|nights?|hours?|weeks?)(?:\s*\/\s*\d+\s*nights?)?/i);
      if (durationMatch) {
        tour.duration = durationMatch[0];
      }
    }

    // Extract location (with fallback to title/description)
    for (const selector of locationSelectors) {
      const location = element.find(selector).first().text().trim();
      if (location && location.length > 2) {
        tour.location = location;
        break;
      }
    }
    
    // If no location found, try to extract from title or description
    if (!tour.location) {
      tour.location = this.extractLocationFromText(tour.title + ' ' + tour.description);
    }

    // Extract images (with better filtering)
    const imageUrls = new Set<string>();
    
    imageSelectors.forEach(selector => {
      element.find(selector).each((_, img) => {
        const src = $(img).attr('src') || 
                   $(img).attr('data-src') || 
                   $(img).attr('data-lazy-src') ||
                   $(img).attr('data-original');
        
        if (src && this.isValidTourImage(src)) {
          imageUrls.add(this.resolveImageUrl(src));
        }
      });
    });
    
    // Also check background images
    element.find('[style*="background-image"]').each((_, elem) => {
      const style = $(elem).attr('style') || '';
      const match = style.match(/url\(['"]?([^'"\)]+)['"]?\)/i);
      if (match && match[1] && this.isValidTourImage(match[1])) {
        imageUrls.add(this.resolveImageUrl(match[1]));
      }
    });
    
    tour.images = Array.from(imageUrls).slice(0, 5);

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
  
  private extractToursFromLinks($: cheerio.CheerioAPI): TourData[] {
    const tours: TourData[] = [];
    const processedUrls = new Set<string>();
    
    // Find all links that might be tours
    const tourLinks = $('a[href*="/tour"], a[href*="/package"], a[href*="/trip"], a[href*="/itinerary"], a[href*="/destination"], a[href*="/travel"]');
    
    tourLinks.each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      
      // Skip if already processed
      if (!href || processedUrls.has(href)) return;
      processedUrls.add(href);
      
      // Extract tour data from link and its container
      const container = $link.parent();
      const tour: TourData = {
        title: '',
        description: '',
        location: '',
        duration: '',
        price: '',
        images: []
      };
      
      // Title from link text or nearby headings
      tour.title = $link.text().trim() || 
                  container.find('h1, h2, h3, h4').first().text().trim() ||
                  this.extractTitleFromUrl(href);
      
      // Clean up title
      tour.title = tour.title.replace(/\s+/g, ' ').trim();
      
      // Skip if no valid title
      if (!tour.title || tour.title.length < 3) return;
      
      // Extract other data from container
      const containerText = container.text();
      
      // Price
      const priceMatch = containerText.match(/(?:from\s*)?(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{2})?)/i);
      if (priceMatch) {
        tour.price = priceMatch[0];
        tour.currency = 'USD';
      }
      
      // Duration
      const durationMatch = containerText.match(/(\d+)\s*(days?|nights?|hours?|weeks?)(?:\s*\/\s*\d+\s*nights?)?/i);
      if (durationMatch) {
        tour.duration = durationMatch[0];
      }
      
      // Images
      container.find('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && this.isValidTourImage(src)) {
          tour.images?.push(this.resolveImageUrl(src));
        }
      });
      
      // Location
      tour.location = this.extractLocationFromText(containerText);
      
      if (tour.title) {
        tours.push(tour);
      }
    });
    
    return tours;
  }
  
  private extractToursFromGrid($: cheerio.CheerioAPI): TourData[] {
    const tours: TourData[] = [];
    
    // Look for grid or list containers
    const gridSelectors = [
      '.grid', '.row', '.products', '.tours', '.packages',
      '[class*="grid"]', '[class*="list"]', '[class*="items"]',
      'ul.tours', 'div.tours', 'section.tours'
    ];
    
    for (const gridSelector of gridSelectors) {
      const grid = $(gridSelector).first();
      if (grid.length === 0) continue;
      
      // Find items within the grid
      const items = grid.find('> *').filter((_, elem) => {
        const $elem = $(elem);
        // Must have some content
        return $elem.text().trim().length > 20;
      });
      
      if (items.length > 0) {
        items.each((_, item) => {
          const tour = this.extractTourFromElement($, $(item));
          if (tour && tour.title) {
            tours.push(tour);
          }
        });
        
        if (tours.length > 0) break;
      }
    }
    
    return tours;
  }
  
  private extractTitleFromUrl(url: string): string {
    // Extract title from URL path
    const match = url.match(/\/([^/]+?)(?:\.html?|\/)?$/i);
    if (match && match[1]) {
      // Convert URL slug to title
      return match[1]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();
    }
    return '';
  }
  
  private isValidTourImage(src: string): boolean {
    const invalidPatterns = [
      'placeholder', 'icon', 'logo', 'banner', 'sprite',
      'pixel', 'tracking', '1x1', 'blank', 'loading',
      'avatar', 'profile', 'user', '.svg'
    ];
    
    const lowercaseSrc = src.toLowerCase();
    return !invalidPatterns.some(pattern => lowercaseSrc.includes(pattern));
  }
  
  private removeDuplicates(tours: TourData[]): TourData[] {
    const seen = new Map<string, TourData>();
    
    tours.forEach(tour => {
      const key = tour.title.toLowerCase().replace(/\s+/g, '');
      if (!seen.has(key) || !seen.get(key)?.price) {
        // Prefer tours with price information
        seen.set(key, tour);
      }
    });
    
    return Array.from(seen.values());
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