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
          waitUntil: ['domcontentloaded', 'networkidle2'], // Wait for network to be idle
          timeout: this.config.throttling.timeout
        });

        if (!response) {
          throw new Error(`No response received from ${url}`);
        }

        const status = response.status();
        this.logger.info('Page response received', { url, status });

        if (!response.ok() && status !== 304) { // 304 is not an error
          throw new Error(`HTTP ${status}: Failed to load ${url}`);
        }

        // Wait for specific selector if configured
        if (this.config.browser?.waitForSelector) {
          this.logger.debug('Waiting for selector', { selector: this.config.browser.waitForSelector });
          await targetPage.waitForSelector(this.config.browser.waitForSelector, {
            timeout: this.config.browser.waitTime || 5000
          });
        }

        // Additional wait time if configured
        const waitTime = this.config.browser?.waitTime;
        if (waitTime && waitTime > 0) {
          this.logger.debug(`Waiting additional ${waitTime}ms for content to load`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Log page metrics for debugging
        const metrics = await targetPage.metrics();
        this.logger.debug('Page metrics', {
          url,
          timestamp: metrics.Timestamp,
          documents: metrics.Documents,
          frames: metrics.Frames,
          jsEventListeners: metrics.JSEventListeners,
          nodes: metrics.Nodes,
          layoutCount: metrics.LayoutCount,
          jsHeapUsedSize: metrics.JSHeapUsedSize
        });

        return targetPage;
      } catch (error) {
        this.logger.error('Navigation failed', { url, error: (error as Error).message, stack: (error as Error).stack });
        
        // Take a screenshot for debugging if navigation fails
        try {
          const screenshot = await targetPage.screenshot({ encoding: 'base64' });
          this.logger.debug('Failed page screenshot captured', { url, screenshotLength: screenshot.length });
        } catch (screenshotError) {
          this.logger.debug('Could not capture screenshot', { error: (screenshotError as Error).message });
        }
        
        throw error;
      }
    });
  }

  /**
   * Extract content from a page using Cheerio
   */
  protected async extractWithCheerio(html: string): Promise<T[]> {
    this.logger.debug('Loading HTML into Cheerio', { htmlLength: html.length });
    const $ = cheerio.load(html);
    
    // Log basic page structure for debugging
    const titleText = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content');
    this.logger.debug('Page metadata', { title: titleText, description: metaDescription });
    
    return this.extractContentFromDOM($);
  }

  /**
   * Extract content directly from a Puppeteer page
   */
  protected async extractWithPuppeteer(page: Page): Promise<T[]> {
    // Try to wait for common content indicators
    try {
      await Promise.race([
        page.waitForSelector('article', { timeout: 5000 }),
        page.waitForSelector('.tour', { timeout: 5000 }),
        page.waitForSelector('.product', { timeout: 5000 }),
        page.waitForSelector('.card', { timeout: 5000 }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Fallback timeout
      ]);
    } catch (e) {
      this.logger.debug('Content wait timeout reached, proceeding with extraction');
    }
    
    // Scroll to load lazy content
    await this.scrollPage(page);
    
    const html = await page.content();
    return this.extractWithCheerio(html);
  }
  
  /**
   * Scroll the page to trigger lazy loading
   */
  protected async scrollPage(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        const distance = 100;
        const delay = 100;
        const maxScrolls = 20;
        let scrolls = 0;
        
        while (scrolls < maxScrolls) {
          const scrollHeight = document.body.scrollHeight;
          const currentScroll = window.scrollY + window.innerHeight;
          
          if (currentScroll >= scrollHeight - 50) {
            break;
          }
          
          window.scrollBy(0, distance);
          await new Promise(resolve => setTimeout(resolve, delay));
          scrolls++;
        }
        
        // Scroll back to top
        window.scrollTo(0, 0);
      });
      
      // Wait a bit for any lazy-loaded content to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      this.logger.debug('Error during page scroll', { error: (error as Error).message });
    }
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

    let page: Page | null = null;

    try {
      this.logger.logScrapingStart(url, this.config);

      page = await this.navigateToUrl(url);
      
      // Log current URL (in case of redirects)
      const currentUrl = page.url();
      if (currentUrl !== url) {
        this.logger.info('Page redirected', { originalUrl: url, currentUrl });
      }
      
      const extractedData = await this.extractWithPuppeteer(page);

      result.success = true;
      result.data = extractedData;
      result.metadata.itemsFound = extractedData.length;

      this.logger.logScrapingComplete(url, extractedData.length, Date.now() - startTime);

    } catch (error) {
      const errorMessage = (error as Error).message;
      result.errors = [errorMessage];
      this.logger.logScrapingError(url, error as Error);
      
      // Add more context to the error
      if (error instanceof Error && error.name === 'TimeoutError') {
        result.errors.push('The page took too long to load. The website might be slow or blocking automated access.');
      }
    } finally {
      // Always close the page to free resources
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          this.logger.warn('Failed to close page', { error: (closeError as Error).message });
        }
      }
      
      result.metadata.processingTime = Date.now() - startTime;
      this.logger.info('Scraping result summary', {
        url,
        success: result.success,
        itemsFound: result.metadata.itemsFound,
        processingTimeMs: result.metadata.processingTime,
        errors: result.errors
      });
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