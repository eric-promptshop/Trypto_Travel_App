import * as cheerio from 'cheerio';
import { Activity } from './models/Activity';

interface SimpleTourData {
  title: string;
  description?: string;
  location?: string;
  duration?: string;
  price?: string;
  currency?: string;
  images?: string[];
}

export class SimpleFetchScraper {
  private logger = {
    error: (msg: string, data?: any) => console.error(`[SimpleFetchScraper] ${msg}`, data || ''),
  };

  async scrapeUrl(url: string): Promise<{ success: boolean; data?: Activity[]; errors?: string[] }> {
    try {
      this.logger.info('Starting simple fetch scrape', { url });
      
      // Fetch the page HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      this.logger.info('Fetched HTML', { length: html.length });

      // Parse with Cheerio
      const $ = cheerio.load(html);
      
      // Extract tours
      const tours = this.extractTours($, url);
      
      this.logger.info('Extraction complete', { toursFound: tours.length });

      return {
        success: true,
        data: tours
      };
    } catch (error) {
      this.logger.error('Scraping failed', { error: (error as Error).message });
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private extractTours($: cheerio.CheerioAPI, pageUrl: string): Activity[] {
    const activities: Activity[] = [];
    const processedTitles = new Set<string>();

    // Common patterns for Peru For Less and similar tour operator sites
    const tourPatterns = [
      // Direct tour listings
      'a[href*="/tours/"], a[href*="/packages/"], a[href*="/trips/"]',
      // Tour cards and items
      '.tour-item, .tour-card, .package-item, .trip-item',
      '[class*="tour-"], [class*="package-"], [class*="trip-"]',
      // Table-based listings (common on older sites)
      'table tr:has(td a[href*="/"])',
      // List-based tours
      'ul li:has(a[href*="/"]), ol li:has(a[href*="/"])',
      // Generic product cards
      '.product, .item, .card',
      // Links with tour-related text
      'a:contains("days"), a:contains("nights"), a:contains("tour"), a:contains("package")'
    ];

    // Try each pattern
    for (const pattern of tourPatterns) {
      try {
        $(pattern).each((_, element) => {
          const tour = this.extractTourFromElement($, $(element), pageUrl);
          if (tour && tour.title && !processedTitles.has(tour.title)) {
            processedTitles.add(tour.title);
            
            const activity = new Activity({
              id: `tour-${Date.now()}-${activities.length}`,
              url: pageUrl,
              title: tour.title,
              description: tour.description || '',
              location: tour.location || 'Peru',
              price: tour.price || '',
              currency: tour.currency || 'USD',
              duration: tour.duration || 'Varies',
              images: tour.images || []
            });
            
            activities.push(activity);
          }
        });
      } catch (e) {
        this.logger.debug('Pattern failed', { pattern, error: (e as Error).message });
      }
    }

    // If no tours found with patterns, try extracting from page structure
    if (activities.length === 0) {
      this.logger.info('No tours found with patterns, trying page structure extraction');
      
      // Look for any links that might be tours
      $('a').each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        // Check if this looks like a tour link
        if (href && text && text.length > 10 && text.length < 200) {
          // Look for duration patterns in the text
          const hasDuration = /\d+\s*(days?|nights?|hours?)/.test(text);
          const hasPrice = /\$\s*[\d,]+/.test(text);
          const hasLocation = /(Machu Picchu|Cusco|Lima|Amazon|Sacred Valley|Inca Trail)/i.test(text);
          
          if (hasDuration || hasPrice || hasLocation) {
            if (!processedTitles.has(text)) {
              processedTitles.add(text);
              
              // Extract components from the text
              const durationMatch = text.match(/(\d+\s*(?:days?|nights?|hours?))/i);
              const priceMatch = text.match(/\$\s*([\d,]+)/);
              
              // Clean title by removing duration and price
              let cleanTitle = text;
              if (durationMatch) cleanTitle = cleanTitle.replace(durationMatch[0], '');
              if (priceMatch) cleanTitle = cleanTitle.replace(priceMatch[0], '');
              cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
              
              const activity = new Activity({
                id: `tour-${Date.now()}-${activities.length}`,
                url: pageUrl,
                title: cleanTitle || text,
                description: '',
                location: this.extractLocation(text),
                price: priceMatch ? priceMatch[1] : '',
                currency: 'USD',
                duration: durationMatch ? durationMatch[1] : 'Varies',
                images: []
              });
              
              activities.push(activity);
            }
          }
        }
      });
    }

    // Special handling for Peru For Less site structure
    if (pageUrl.includes('peruforless.com')) {
      this.logger.info('Applying Peru For Less specific extraction');
      
      // First check if we're on the main page - redirect to tours page
      if (!pageUrl.includes('/tours') && !pageUrl.includes('/peru-tours')) {
        this.logger.info('Main page detected, would normally scan /tours page');
        // Note: In real implementation, we'd scan the tours page
      }
      
      // Look for table-based tour listings (common on Peru For Less)
      $('table').each((_, table) => {
        const $table = $(table);
        
        // Check if this table contains tour data
        $table.find('tr').each((_, row) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          if (cells.length >= 2) {
            // Look for tour links in the row
            const $link = $row.find('a[href*="/tours/"], a[href*="/peru-tours/"]').first();
            if ($link.length > 0) {
              const fullText = $row.text().trim();
              const linkText = $link.text().trim();
              
              // Extract tour details from row
              const durationMatch = fullText.match(/(\d+\s*(?:days?|nights?))/i);
              const priceMatch = fullText.match(/\$\s*([\d,]+)/);
              
              if (linkText && !processedTitles.has(linkText)) {
                processedTitles.add(linkText);
                
                const activity = new Activity({
                  id: `tour-${Date.now()}-${activities.length}`,
                  url: pageUrl,
                  title: linkText,
                  description: '',
                  location: this.extractLocation(fullText),
                  price: priceMatch ? priceMatch[1] : '',
                  currency: 'USD',
                  duration: durationMatch ? durationMatch[1] : 'Varies',
                  images: []
                });
                
                activities.push(activity);
              }
            }
          }
        });
      });
      
      // Also look for div-based tour listings
      $('.tour-item, .package-item, .trip-item, [class*="tour-box"]').each((_, element) => {
        const $element = $(element);
        const title = $element.find('a').first().text().trim() || 
                     $element.find('.title, h3, h4').first().text().trim();
        
        if (title && !processedTitles.has(title)) {
          processedTitles.add(title);
          
          const fullText = $element.text();
          const durationMatch = fullText.match(/(\d+\s*(?:days?|nights?))/i);
          const priceMatch = fullText.match(/\$\s*([\d,]+)/);
          
          const activity = new Activity({
            id: `tour-${Date.now()}-${activities.length}`,
            url: pageUrl,
            title: title,
            description: $element.find('.description, .summary, p').first().text().trim(),
            location: this.extractLocation(fullText),
            price: priceMatch ? priceMatch[1] : '',
            currency: 'USD',
            duration: durationMatch ? durationMatch[1] : 'Varies',
            images: []
          });
          
          activities.push(activity);
        }
      });
    }

    this.logger.info('Tour extraction complete', { 
      totalFound: activities.length,
      titles: activities.slice(0, 5).map(a => a.title)
    });

    return activities;
  }

  private extractTourFromElement($: cheerio.CheerioAPI, $element: cheerio.Cheerio<cheerio.Element>, pageUrl: string): SimpleTourData | null {
    const text = $element.text().trim();
    
    // Skip if too short or looks like navigation
    if (!text || text.length < 10 || /^(home|about|contact|blog)/i.test(text)) {
      return null;
    }

    const tour: SimpleTourData = {
      title: '',
      description: '',
      location: '',
      duration: '',
      price: '',
      currency: 'USD',
      images: []
    };

    // Extract title
    tour.title = $element.find('h1, h2, h3, h4, a').first().text().trim() || 
                 $element.find('.title, .tour-title').text().trim() ||
                 text.split('\n')[0].trim();

    // Extract duration
    const durationMatch = text.match(/(\d+\s*(?:days?|nights?|hours?))/i);
    if (durationMatch) {
      tour.duration = durationMatch[1];
    }

    // Extract price
    const priceMatch = text.match(/(?:from\s*)?\$\s*([\d,]+)/i);
    if (priceMatch) {
      tour.price = priceMatch[1];
    }

    // Extract location
    tour.location = this.extractLocation(text);

    // Extract images
    $element.find('img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('logo')) {
        tour.images?.push(this.resolveImageUrl(src, pageUrl));
      }
    });

    return tour;
  }

  private extractLocation(text: string): string {
    const locations = [
      'Machu Picchu', 'Cusco', 'Lima', 'Sacred Valley', 'Inca Trail',
      'Amazon', 'Arequipa', 'Lake Titicaca', 'Nazca', 'Colca Canyon',
      'Peru', 'Puno', 'Huacachina', 'Paracas', 'Iquitos'
    ];

    const foundLocations: string[] = [];
    for (const location of locations) {
      if (new RegExp(location, 'i').test(text)) {
        foundLocations.push(location);
      }
    }

    return foundLocations.length > 0 ? foundLocations.join(', ') : 'Peru';
  }

  private resolveImageUrl(src: string, baseUrl: string): string {
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    if (src.startsWith('//')) {
      return 'https:' + src;
    }
    
    try {
      const base = new URL(baseUrl);
      return new URL(src, base.origin).href;
    } catch {
      return src;
    }
  }
}