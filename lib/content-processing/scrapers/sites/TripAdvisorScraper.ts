import { BaseScraper } from '../base/BaseScraper';
import { ScraperConfig, ActivitySelectors, ExtractedActivity } from '../base/ScraperConfig';
import { Activity } from '../models/Activity';
import * as cheerio from 'cheerio';

export class TripAdvisorScraper extends BaseScraper<ExtractedActivity> {
  
  constructor() {
    const config: ScraperConfig = {
      name: 'TripAdvisor',
      baseUrl: 'https://www.tripadvisor.com',
      selectors: {
        container: '[data-test-target="HR_CC_CARD"]',
        title: '[data-test-target="experience-card-title"]',
        description: '[data-test-target="experience-card-description"]',
        price: '[data-test-target="price-from"]',
        rating: '[data-test-target="rating-circle"]',
        images: 'img[src*="media"]',
        duration: '[data-test-target="duration"]',
        highlights: '[data-test-target="highlights"] li',
        location: '[data-test-target="location"]',
        availability: '[data-test-target="availability"]',
        pagination: {
          nextButton: 'a[aria-label="Next page"]',
          currentPage: '.current.page'
        }
      } as ActivitySelectors,
      throttling: {
        requestsPerMinute: 20,
        concurrentRequests: 2,
        delayBetweenRequests: 3000,
        retryAttempts: 3,
        retryDelay: 2000,
        timeout: 30000
      },
      browser: {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        blockResources: ['image', 'stylesheet', 'font'],
        enableJavaScript: true,
        waitForSelector: '[data-test-target="HR_CC_CARD"]',
        waitTime: 2000
      },
      userAgent: {
        rotation: true,
        mobileRatio: 0.2
      },
      extraction: {
        maxPages: 5,
        extractImages: false,
        cleanText: true,
        extractMetadata: true
      },
      errorHandling: {
        skipOnError: true,
        logErrors: true,
        maxErrors: 10,
        notifyOnBlock: true
      }
    };

    super(config);
  }

  /**
   * Extract activities from the DOM using Cheerio
   */
  protected extractContentFromDOM($: cheerio.CheerioAPI): ExtractedActivity[] {
    const activities: ExtractedActivity[] = [];
    const selectors = this.config.selectors as ActivitySelectors;

    $(selectors.container || '[data-test-target="HR_CC_CARD"]').each((index, element) => {
      try {
        const $element = $(element);
        
        // Extract basic information
        const title = this.extractText($element, selectors.title);
        if (!title) return; // Skip if no title

        const url = this.extractUrl($element, 'a');
        if (!url) return; // Skip if no URL

        // Create activity instance
        const activity = new Activity({
          url: this.resolveUrl(url),
          title: title.trim(),
          description: this.extractText($element, selectors.description),
          price: this.extractPrice($element, selectors.price),
          rating: this.extractRating($element, selectors.rating),
          location: this.extractText($element, selectors.location),
          duration: this.extractText($element, selectors.duration),
          highlights: this.extractList($element, selectors.highlights),
          availability: this.extractList($element, selectors.availability),
          images: this.extractImages($element, selectors.images),
          category: 'activity',
          extractedAt: new Date()
        });

        // Extract additional metadata
        activity.metadata = {
          source: 'TripAdvisor',
          extractedFrom: this.config.baseUrl,
          selector: selectors.container,
          elementIndex: index
        };

        activities.push(activity);

      } catch (error) {
        this.logger.warn('Failed to extract activity', {
          index,
          error: (error as Error).message
        });
      }
    });

    this.logger.info(`Extracted ${activities.length} activities from page`);
    return activities;
  }

  /**
   * Extract text content from an element using a selector
   */
  private extractText($element: cheerio.Cheerio<any>, selector?: string): string | undefined {
    if (!selector) return undefined;
    
    const text = $element.find(selector).first().text().trim();
    return text || undefined;
  }

  /**
   * Extract URL from an element
   */
  private extractUrl($element: cheerio.Cheerio<any>, selector: string): string | undefined {
    const href = $element.find(selector).first().attr('href');
    return href || undefined;
  }

  /**
   * Extract and parse price information
   */
  private extractPrice($element: cheerio.Cheerio<any>, selector?: string): string | undefined {
    if (!selector) return undefined;
    
    const priceText = $element.find(selector).first().text().trim();
    if (!priceText) return undefined;

    // Clean up price text (remove "from", extra spaces, etc.)
    return priceText
      .replace(/^from\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract and parse rating
   */
  private extractRating($element: cheerio.Cheerio<any>, selector?: string): number | undefined {
    if (!selector) return undefined;
    
    // Try to extract from aria-label or data attributes
    const $rating = $element.find(selector).first();
    
    // Check aria-label for rating
    const ariaLabel = $rating.attr('aria-label');
    if (ariaLabel) {
      const match = ariaLabel.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    // Check data attributes
    const dataRating = $rating.attr('data-rating');
    if (dataRating) {
      return parseFloat(dataRating);
    }

    // Try to extract from text content
    const text = $rating.text().trim();
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }

    return undefined;
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
   * Extract image URLs
   */
  private extractImages($element: cheerio.Cheerio<any>, selector?: string): string[] {
    if (!selector) return [];
    
    const images: string[] = [];
    $element.find(selector).each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        images.push(this.resolveUrl(src));
      }
    });

    return images;
  }

  /**
   * Resolve relative URLs to absolute URLs
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    if (url.startsWith('/')) {
      return this.config.baseUrl + url;
    }
    
    return this.config.baseUrl + '/' + url;
  }

  /**
   * Scrape activities from a TripAdvisor destination page
   */
  async scrapeDestination(destinationUrl: string, maxPages: number = 3): Promise<ExtractedActivity[]> {
    const allActivities: ExtractedActivity[] = [];
    let currentPage = 1;
    let currentUrl = destinationUrl;

    while (currentPage <= maxPages) {
      try {
        this.logger.info(`Scraping page ${currentPage}`, { url: currentUrl });
        
        const result = await this.scrapeUrl(currentUrl);
        
        if (result.success && result.data) {
          allActivities.push(...result.data);
          this.logger.info(`Page ${currentPage} completed`, {
            activitiesFound: result.data.length,
            totalSoFar: allActivities.length
          });
        } else {
          this.logger.warn(`Page ${currentPage} failed`, {
            errors: result.errors
          });
        }

        // Find next page URL
        if (currentPage < maxPages) {
          const nextUrl = await this.findNextPageUrl(currentUrl);
          if (nextUrl) {
            currentUrl = nextUrl;
            currentPage++;
            
            // Add delay between pages
            await new Promise(resolve => setTimeout(resolve, this.config.throttling.delayBetweenRequests));
          } else {
            this.logger.info('No more pages found');
            break;
          }
        } else {
          break;
        }

      } catch (error) {
        this.logger.error(`Failed to scrape page ${currentPage}`, {
          url: currentUrl,
          error: (error as Error).message
        });
        break;
      }
    }

    this.logger.info('Destination scraping completed', {
      totalActivities: allActivities.length,
      pagesScraped: currentPage
    });

    return allActivities;
  }

  /**
   * Find the URL for the next page
   */
  private async findNextPageUrl(currentUrl: string): Promise<string | null> {
    try {
      const page = await this.navigateToUrl(currentUrl);
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const selectors = this.config.selectors as ActivitySelectors;
      const nextButton = $(selectors.pagination?.nextButton || 'a[aria-label="Next page"]').first();
      
      if (nextButton.length > 0) {
        const href = nextButton.attr('href');
        if (href) {
          await page.close();
          return this.resolveUrl(href);
        }
      }
      
      await page.close();
      return null;
    } catch (error) {
      this.logger.warn('Failed to find next page URL', {
        error: (error as Error).message
      });
      return null;
    }
  }
}

// Example usage configuration
export const TRIPADVISOR_CONFIG = {
  name: 'TripAdvisor Activities',
  description: 'Scrape activities and experiences from TripAdvisor',
  baseUrl: 'https://www.tripadvisor.com',
  exampleUrls: [
    'https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html',
    'https://www.tripadvisor.com/Attractions-g60763-Activities-New_York_City_New_York.html',
    'https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html'
  ],
  rateLimit: '20 requests per minute',
  respectsRobotsTxt: true
}; 