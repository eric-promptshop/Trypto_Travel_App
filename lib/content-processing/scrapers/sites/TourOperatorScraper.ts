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
        timeout: 45000, // Increased timeout to 45 seconds
        delayBetweenRequests: 2000
      },
      selectors: {
        container: '', // Will be dynamically determined
        title: '',
        description: '',
        price: '',
        location: '',
        duration: '',
        images: ''
      },
      browser: {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        blockResources: ['font', 'media'],
        waitTime: 5000, // Increased wait time to ensure content loads
        enableJavaScript: true
      },
      userAgent: {
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
    
    this.logger.info('Starting DOM extraction');
    
    // Log page structure for debugging
    const pageTitle = $('title').text();
    const h1Count = $('h1').length;
    const linkCount = $('a').length;
    const imgCount = $('img').length;
    
    this.logger.info('Page structure analysis', {
      pageTitle,
      h1Count,
      linkCount,
      imgCount,
      htmlLength: $.html().length
    });
    
    // Try multiple extraction strategies
    let tourData = this.extractToursGeneric($);
    this.logger.info(`Generic extraction found ${tourData.length} tours`);
    
    // If generic extraction fails, try link-based extraction
    if (tourData.length === 0) {
      this.logger.info('Trying link-based extraction');
      tourData = this.extractToursFromLinks($);
      this.logger.info(`Link-based extraction found ${tourData.length} tours`);
    }
    
    // If still no tours, try grid/list extraction
    if (tourData.length === 0) {
      this.logger.info('Trying grid/list extraction');
      tourData = this.extractToursFromGrid($);
      this.logger.info(`Grid/list extraction found ${tourData.length} tours`);
    }
    
    // If still no tours, try structured data extraction
    if (tourData.length === 0) {
      this.logger.info('Trying structured data extraction');
      tourData = this.extractFromPageStructure($);
      this.logger.info(`Structured data extraction found ${tourData.length} tours`);
    }
    
    // Filter out tours that don't look like actual tours
    const validTours = tourData.filter(tour => {
      // Must have a price OR duration to be considered a valid tour
      const hasPrice = tour.price && tour.price !== ',' && tour.price !== '';
      const hasDuration = tour.duration && tour.duration.length > 0;
      const hasDescription = tour.description && tour.description.length > 50;
      const hasImages = tour.images && tour.images.length > 0;
      
      // Must have at least 2 of the 4 indicators
      const indicators = [hasPrice, hasDuration, hasDescription, hasImages].filter(Boolean).length;
      
      return indicators >= 2;
    });
    
    // Remove duplicates based on title
    const uniqueTours = this.removeDuplicates(validTours);
    this.logger.info(`After deduplication: ${uniqueTours.length} unique tours`);
    
    uniqueTours.forEach((tour, index) => {
      this.logger.debug(`Processing tour ${index + 1}:`, {
        title: tour.title,
        location: tour.location,
        price: tour.price,
        duration: tour.duration
      });
      
      // Clean up the title - often contains duration and price info
      let cleanTitle = tour.title;
      
      // First, try to extract structured tour data if title contains duration and price
      const structuredMatch = cleanTitle.match(/^(.+?)(\d+\s*(?:days?|nights?))\s*(?:from\s*)?\$([\d,]+)(.*)$/i);
      if (structuredMatch) {
        cleanTitle = structuredMatch[1].trim();
        if (!tour.duration || tour.duration === 'Varies') {
          tour.duration = structuredMatch[2];
        }
        if (!tour.price || tour.price === '') {
          tour.price = structuredMatch[3];
        }
        
        // The rest might contain destination info
        const remainingText = structuredMatch[4];
        if (remainingText) {
          const destinations = (remainingText.match(/(Cusco|Lima|Machu Picchu|Sacred Valley|Inca Trail|Arequipa|Titicaca|Amazon|Nazca|Colca Canyon)/gi) || []);
          if (destinations.length > 0 && tour.location === 'Various Locations') {
            // Remove duplicates and clean up
            const uniqueDestinations = [...new Set(destinations.map(d => d.replace(/Canyon/i, '')))]
              .map(d => d.trim());
            tour.location = uniqueDestinations.join(', ');
          }
        }
      } else {
        // Fallback to individual extraction
        // Extract duration from title if not already set
        if (!tour.duration || tour.duration === 'Varies') {
          const durationInTitle = cleanTitle.match(/(\d+\s*(?:days?|nights?|hours?))/i);
          if (durationInTitle) {
            tour.duration = durationInTitle[1];
            cleanTitle = cleanTitle.replace(durationInTitle[0], '').trim();
          }
        }
        
        // Extract price from title if not already set
        if (!tour.price || tour.price === '') {
          const priceInTitle = cleanTitle.match(/(?:from\s*)?\$([\d,]+)/i);
          if (priceInTitle) {
            tour.price = priceInTitle[1];
            cleanTitle = cleanTitle.replace(priceInTitle[0], '').trim();
          }
        }
        
        // Remove "from" if it's hanging at the end
        cleanTitle = cleanTitle.replace(/\s*from\s*$/i, '').trim();
        
        // Extract destination info that might be appended
        const destinationMatch = cleanTitle.match(/^(.+?)(?:Cusco|Lima|Machu Picchu|Sacred Valley|Inca Trail|Arequipa|Titicaca|Amazon|Nazca|Colca)(.*)$/i);
        if (destinationMatch) {
          cleanTitle = destinationMatch[1].trim();
          // Use the destination info to improve location
          const destinations = (destinationMatch[0].match(/(Cusco|Lima|Machu Picchu|Sacred Valley|Inca Trail|Arequipa|Titicaca|Amazon|Nazca|Colca)/gi) || []);
          if (destinations.length > 0 && tour.location === 'Various Locations') {
            tour.location = destinations.join(', ');
          }
        }
      }
      
      const activity = new Activity({
        id: `tour-${Date.now()}-${index}`,
        url: '', // Will be set in scrapeUrl
        title: cleanTitle,
        description: tour.description || '',
        location: tour.location || 'Various Locations',
        price: this.parsePrice(tour.price),
        currency: tour.currency || 'USD',
        duration: tour.duration || 'Varies',
        images: tour.images || [],
        highlights: tour.highlights || [],
        includes: tour.includes || [],
        excludes: tour.excludes || []
      });
      
      activities.push(activity);
    });

    this.logger.info(`Total activities extracted: ${activities.length}`);
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
      
      // Common tour listing patterns
      '.tour', '.tours-list-item', '.trip-tile', '.package-tile',
      '.tour-list-item', '.tour-listing', '.tour-box', '.tour-wrapper',
      '.trip-card', '.travel-package', '.vacation-package',
      
      // Generic card/list selectors
      'article', '.card', '.item', '.listing-item',
      '.box', '.panel', '.module', '.widget',
      
      // Grid/flex containers
      '.grid-item', '.flex-item', '[class*="col-"]',
      
      // Link-based containers
      'a[href*="/tour"]', 'a[href*="/package"]', 'a[href*="/trip"]',
      'a[href*="/itinerary"]', 'a[href*="/destination"]', 'a[href*="/travel"]',
      
      // List items
      'li[class*="tour"]', 'li[class*="trip"]', 'li[class*="package"]',
      '.list-item', 'ul > li', 'ol > li',
      
      // Divs with tour-related classes
      'div[class*="result"]', 'div[class*="offer"]', 'div[class*="deal"]'
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
        } else {
          this.logger.debug(`No tours found with selector: ${selector}`);
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

  private extractTourFromElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): TourData {
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
      
      // Skip if title is too short, contains only numbers, or looks like navigation/footer text
      const skipPatterns = [
        /^\d+$/,  // Only numbers
        /^(about|contact|blog|news|faq|terms|privacy|copyright|menu|navigation)/i,
        /^(follow us|connect|subscribe|newsletter|sign up|log in)/i,
        /^(home|back|next|previous|close|search)/i,
        /^[A-Z\s]{2,}$/,  // All caps (likely navigation)
        /^(our|the|your|my|we|us|them)\s/i  // Starts with generic pronouns
      ];
      
      if (title && title.length > 3 && title.length < 200 && 
          !skipPatterns.some(pattern => pattern.test(title))) {
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

  private extractImagesFromContent(element: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
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
   * Fallback extraction method for heavily JavaScript-based sites
   */
  private extractToursFallback($: cheerio.CheerioAPI): TourData[] {
    const tours: TourData[] = [];
    
    // Look for any heading that might be a tour title
    const headings = $('h1, h2, h3, h4').filter((_, elem) => {
      const text = $(elem).text().trim();
      // Basic heuristic: tour titles often contain certain keywords or are reasonably long
      return text.length > 10 && text.length < 100 && 
             !text.match(/^(menu|navigation|footer|header|cookie|privacy|terms)/i);
    });
    
    headings.each((_, heading) => {
      const $heading = $(heading);
      const title = $heading.text().trim();
      
      // Look for related content near the heading
      const parent = $heading.parent();
      const nextSiblings = $heading.nextAll().slice(0, 5);
      const container = $heading.closest('article, section, div[class*="tour"], div[class*="package"], div[class*="trip"]');
      
      // Extract description from nearby paragraphs
      let description = '';
      container.find('p').slice(0, 3).each((_, p) => {
        const text = $(p).text().trim();
        if (text.length > 20) {
          description += text + ' ';
        }
      });
      
      // Look for price in the container
      const containerText = container.text();
      const priceMatch = containerText.match(/(?:from\s*)?(?:USD\s*)?\$\s*([\d,]+(?:\.\d{2})?)/i);
      
      // Look for duration
      const durationMatch = containerText.match(/(\d+)\s*(days?|nights?|hours?)/i);
      
      // Look for images in the container
      const images: string[] = [];
      container.find('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && this.isValidTourImage(src)) {
          images.push(this.resolveImageUrl(src));
        }
      });
      
      if (title && (description || priceMatch || durationMatch || images.length > 0)) {
        tours.push({
          title,
          description: description.trim(),
          location: this.extractLocationFromText(title + ' ' + description),
          duration: durationMatch ? durationMatch[0] : '',
          price: priceMatch ? priceMatch[1] : '',
          currency: 'USD',
          images: images.slice(0, 3)
        });
      }
    });
    
    return tours;
  }

  /**
   * Override scrapeUrl to handle relative URLs in images and add better error handling
   */
  async scrapeUrl(url: string): Promise<any> {
    this.logger.info(`Starting to scrape URL: ${url}`);
    
    try {
      const result = await super.scrapeUrl(url);
      
      // Post-process to fix relative image URLs and set activity URL
      if (result.success && result.data) {
        const baseUrl = new URL(url);
        result.data.forEach((activity: Activity) => {
          // Set the URL if not already set
          if (!activity.url) {
            activity.url = url;
          }
          
          // Fix relative image URLs
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
        
        this.logger.info(`Successfully scraped ${result.data.length} activities from ${url}`);
      } else {
        this.logger.warn(`Scraping completed but no data found for ${url}`);
        if (result.errors && result.errors.length > 0) {
          this.logger.error('Scraping errors:', { errors: result.errors });
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to scrape ${url}:`, { error: (error as Error).message });
      throw error;
    }
  }
}