import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ScraperConfig, ScrapingResult, ExtractedContent } from './ScraperConfig';
import { RateLimiter } from './RateLimiter';
import { ScraperLogger } from '../utils/ScraperLogger';

export abstract class BaseScraper<T extends ExtractedContent = ExtractedContent> {
  protected config: ScraperConfig;
  protected rateLimiter: RateLimiter;
  protected logger: ScraperLogger;
  protected browser?: Browser;
  protected currentPage?: Page;

  constructor(config: ScraperConfig) {
    this.config = config;
    this.logger = new ScraperLogger(`Scraper:${config.name}`);
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      maxConcurrent: config.throttling.concurrentRequests,
      minTime: Math.ceil(60000 / config.throttling.requestsPerMinute),
      maxRetries: config.throttling.retryAttempts,
      retryDelay: config.throttling.retryDelay,
      reservoir: config.throttling.requestsPerMinute,
      reservoirRefreshInterval: 60 * 1000,
      reservoirRefreshAmount: config.throttling.requestsPerMinute
    }, this.logger);
  }

  /**
   * Initialize the browser instance
   */
  protected async initializeBrowser(): Promise<void> {
    if (this.browser) {
      return;
    }

    this.logger.info('Initializing browser', { headless: this.config.browser?.headless });

    this.browser = await puppeteer.launch({
      headless: this.config.browser?.headless ?? true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }

  /**
   * Create a new page with configured settings
   */
  protected async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }

    const page = await this.browser.newPage();

    // Set viewport
    if (this.config.browser?.viewport) {
      await page.setViewport(this.config.browser.viewport);
    }

    // Block resources to improve performance
    if (this.config.browser?.blockResources?.length) {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (this.config.browser?.blockResources?.includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
    }

    // Set user agent if configured
    if (this.config.userAgent?.list?.length) {
      const userAgent = this.getRandomUserAgent();
      await page.setUserAgent(userAgent);
    }

    return page;
  }

  /**
   * Navigate to a URL with rate limiting and error handling
   */
  protected async navigateToUrl(url: string, page?: Page): Promise<Page> {
    const targetPage = page || await this.createPage();

    return this.rateLimiter.schedule(async () => {
      this.logger.info('Navigating to URL', { url });

      try {
        const response = await targetPage.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.throttling.timeout
        });

        if (!response || !response.ok()) {
          throw new Error(`HTTP ${response?.status()}: Failed to load ${url}`);
        }

        // Wait for specific selector if configured
        if (this.config.browser?.waitForSelector) {
          await targetPage.waitForSelector(this.config.browser.waitForSelector, {
            timeout: this.config.browser.waitTime || 5000
          });
        }

        // Additional wait time if configured
        const waitTime = this.config.browser?.waitTime;
        if (waitTime && waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        return targetPage;
      } catch (error) {
        this.logger.error('Navigation failed', { url, error: (error as Error).message });
        throw error;
      }
    });
  }

  /**
   * Extract content from a page using Cheerio
   */
  protected async extractWithCheerio(html: string): Promise<T[]> {
    const $ = cheerio.load(html);
    return this.extractContentFromDOM($);
  }

  /**
   * Extract content directly from a Puppeteer page
   */
  protected async extractWithPuppeteer(page: Page): Promise<T[]> {
    const html = await page.content();
    return this.extractWithCheerio(html);
  }

  /**
   * Abstract method to be implemented by site-specific scrapers
   */
  protected abstract extractContentFromDOM($: cheerio.CheerioAPI): T[];

  /**
   * Scrape a single URL
   */
  async scrapeUrl(url: string): Promise<ScrapingResult<T>> {
    const startTime = Date.now();
    const result: ScrapingResult<T> = {
      success: false,
      data: [],
      errors: [],
      metadata: {
        url,
        timestamp: new Date(),
        itemsFound: 0,
        processingTime: 0,
        pagesCrawled: 1
      }
    };

    try {
      this.logger.logScrapingStart(url, this.config);

      const page = await this.navigateToUrl(url);
      const extractedData = await this.extractWithPuppeteer(page);

      result.success = true;
      result.data = extractedData;
      result.metadata.itemsFound = extractedData.length;

      await page.close();

      this.logger.logScrapingComplete(url, extractedData.length, Date.now() - startTime);

    } catch (error) {
      const errorMessage = (error as Error).message;
      result.errors = [errorMessage];
      this.logger.logScrapingError(url, error as Error);
    } finally {
      result.metadata.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeUrls(urls: string[]): Promise<ScrapingResult<T>[]> {
    const results: ScrapingResult<T>[] = [];

    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url);
        results.push(result);

        // Add delay between requests
        if (this.config.throttling.delayBetweenRequests > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.throttling.delayBetweenRequests));
        }
      } catch (error) {
        this.logger.error('Failed to scrape URL', { url, error: (error as Error).message });
        results.push({
          success: false,
          errors: [(error as Error).message],
          metadata: {
            url,
            timestamp: new Date(),
            itemsFound: 0,
            processingTime: 0,
            pagesCrawled: 0
          }
        });
      }
    }

    return results;
  }

  /**
   * Get a random user agent from the configured list
   */
  protected getRandomUserAgent(): string {
    const userAgents = this.config.userAgent?.list || [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)] as string;
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.currentPage) {
      await this.currentPage.close();
    }
    if (this.browser) {
      await this.browser.close();
      delete this.browser;
    }
    this.logger.info('Scraper disposed');
  }

  /**
   * Get the rate limiter instance
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Get the logger instance
   */
  getLogger(): ScraperLogger {
    return this.logger;
  }
} 