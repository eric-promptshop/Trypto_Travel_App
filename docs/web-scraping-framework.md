# Web Scraping Framework Documentation

## Overview

The web scraping framework for the Travel Itinerary Builder has been fully implemented with a robust, scalable architecture that respects rate limits and handles errors gracefully. The framework is built using TypeScript, Puppeteer, and Cheerio, providing both dynamic and static content extraction capabilities.

## Architecture

### Core Components

1. **Base Scraper (`BaseScraper.ts`)**
   - Abstract base class providing common functionality for all scrapers
   - Handles browser initialization, page navigation, and content extraction
   - Integrates rate limiting and error handling
   - Supports both Puppeteer (dynamic) and Cheerio (static) extraction

2. **Rate Limiter (`RateLimiter.ts`)**
   - Bottleneck-based implementation for request throttling
   - Configurable concurrent requests and minimum time between requests
   - Reservoir-based quotas with automatic refresh
   - Exponential backoff with jitter for retries
   - HTTP status code-aware retry logic

3. **Configuration System (`ScraperConfig.ts`)**
   - Comprehensive interfaces for scraper configuration
   - Site-specific selectors and extraction rules
   - Throttling, proxy, and user agent settings
   - Browser configuration options

### Utility Classes

- **ScraperLogger**: Dedicated logging system for scraper operations
- **UserAgentRotator**: Randomizes user agents to avoid detection
- **ProxyRotator**: Manages proxy rotation for high-volume scraping

### Site-Specific Scrapers

1. **TripAdvisorScraper**
   - Extracts activities and experiences from TripAdvisor
   - Supports pagination and multi-page scraping
   - Handles dynamic content loading

2. **BookingComScraper**
   - Extracts accommodation information
   - Handles price variations and availability

3. **GetYourGuideScraper**
   - Extracts tour and activity information
   - Supports multi-language content

## Key Features

### Rate Limiting
- Requests per minute configuration
- Concurrent request control
- Automatic request queuing
- Reservoir-based quota management

### Error Handling
- Retry mechanisms with exponential backoff
- HTTP status code-based retry decisions
- CAPTCHA detection and notification
- Graceful failure recovery

### Performance Optimizations
- Resource blocking (images, stylesheets, fonts)
- Connection pooling for browser instances
- Selective DOM parsing
- Memory-efficient stream processing

### Data Extraction
- Destinations, activities, accommodations, and prices
- Rating and review information
- Location and coordinate data
- Image URLs and metadata

## Usage Example

```typescript
import { TripAdvisorScraper } from './scrapers/sites/TripAdvisorScraper';

// Initialize scraper
const scraper = new TripAdvisorScraper();

// Scrape a single URL
const result = await scraper.scrapeUrl('https://www.tripadvisor.com/...');

if (result.success) {
  console.log(`Found ${result.data.length} activities`);
  result.data.forEach(activity => {
    console.log(`- ${activity.title}: ${activity.price}`);
  });
}

// Clean up resources
await scraper.dispose();
```

## Configuration Options

### Throttling Configuration
```typescript
{
  requestsPerMinute: 20,
  concurrentRequests: 2,
  delayBetweenRequests: 3000,
  retryAttempts: 3,
  retryDelay: 2000,
  timeout: 30000
}
```

### Browser Configuration
```typescript
{
  headless: true,
  viewport: { width: 1920, height: 1080 },
  blockResources: ['image', 'stylesheet', 'font'],
  enableJavaScript: true,
  waitForSelector: '[data-test-target="HR_CC_CARD"]',
  waitTime: 2000
}
```

## Testing

The framework includes:
- Unit tests for core components
- Integration tests with mock servers
- Performance benchmarking tools
- Manual testing scripts

Run tests with:
```bash
npm test __tests__/content-processing/scrapers
```

## Best Practices

1. **Respect Rate Limits**: Always configure appropriate rate limits for each site
2. **Monitor Performance**: Use the built-in logging and statistics
3. **Handle Failures Gracefully**: Implement appropriate error handling
4. **Rotate User Agents**: Use the UserAgentRotator to avoid detection
5. **Test Regularly**: Sites change their structure; regular testing is essential

## Maintenance

- Monitor scraper success rates
- Update selectors when sites change their structure
- Review and update rate limits based on site policies
- Keep dependencies updated for security and performance

## Future Enhancements

- Machine learning-based selector detection
- Distributed scraping capabilities
- Real-time monitoring dashboard
- Advanced CAPTCHA solving integration
- GraphQL API for scraper management 