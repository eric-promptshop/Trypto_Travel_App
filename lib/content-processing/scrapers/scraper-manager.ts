import { TripAdvisorScraper } from './sites/TripAdvisorScraper';
import { BookingComScraper } from './sites/BookingComScraper';
import { GetYourGuideScraper } from './sites/GetYourGuideScraper';
import { BaseScraper } from './base/BaseScraper';
import type { Activity } from './models/Activity';
import type { Accommodation } from './models/Accommodation';

export interface ScraperManager {
  getScraper(url: string): BaseScraper<Activity | Accommodation>;
  disposeAll(): Promise<void>;
}

/**
 * Manages scraper instances and determines which scraper to use for a given URL
 */
export class DefaultScraperManager implements ScraperManager {
  private scrapers: Map<string, BaseScraper<any>> = new Map();
  
  /**
   * Get the appropriate scraper for a URL
   */
  getScraper(url: string): BaseScraper<Activity | Accommodation> {
    const hostname = new URL(url).hostname.toLowerCase();
    const key = this.getScraperKey(hostname);
    
    // Return existing scraper if available
    if (this.scrapers.has(key)) {
      return this.scrapers.get(key)!;
    }
    
    // Create new scraper based on hostname
    let scraper: BaseScraper<any>;
    
    if (hostname.includes('tripadvisor')) {
      scraper = new TripAdvisorScraper();
    } else if (hostname.includes('booking.com')) {
      scraper = new BookingComScraper();
    } else if (hostname.includes('getyourguide')) {
      scraper = new GetYourGuideScraper();
    } else {
      // Default to TripAdvisor scraper for generic websites
      // In production, you might want a GenericWebsiteScraper
      scraper = new TripAdvisorScraper();
    }
    
    this.scrapers.set(key, scraper);
    return scraper;
  }
  
  /**
   * Dispose all scraper instances
   */
  async disposeAll(): Promise<void> {
    const disposePromises = Array.from(this.scrapers.values()).map(
      scraper => scraper.dispose().catch(err => {
        console.error('Error disposing scraper:', err);
      })
    );
    
    await Promise.all(disposePromises);
    this.scrapers.clear();
  }
  
  /**
   * Get a unique key for a hostname
   */
  private getScraperKey(hostname: string): string {
    if (hostname.includes('tripadvisor')) return 'tripadvisor';
    if (hostname.includes('booking.com')) return 'booking';
    if (hostname.includes('getyourguide')) return 'getyourguide';
    return 'generic';
  }
}

/**
 * Scraper configuration for different environments
 */
export const scraperConfig = {
  development: {
    headless: true,
    slowMo: 100, // Slow down actions for debugging
    devtools: false,
    maxConcurrent: 1,
    retryAttempts: 2,
  },
  production: {
    headless: true,
    slowMo: 0,
    devtools: false,
    maxConcurrent: 3,
    retryAttempts: 3,
  },
};

/**
 * Get scraper configuration based on environment
 */
export function getScraperConfig() {
  const env = process.env.NODE_ENV || 'development';
  return scraperConfig[env as keyof typeof scraperConfig] || scraperConfig.development;
}