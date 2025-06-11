# Website Scanning Implementation Guide

## Overview

The website scanning feature for tour operator onboarding has been successfully implemented using the existing Puppeteer and Cheerio infrastructure. This feature allows tour operators to automatically import their tour content by scanning their existing websites.

## Architecture

### 1. Technology Stack
- **Puppeteer**: Headless browser automation for JavaScript-rendered content
- **Cheerio**: HTML parsing and DOM manipulation
- **Bottleneck**: Rate limiting to prevent blocking
- **TypeScript**: Full type safety throughout

### 2. Key Components

#### Scraper Infrastructure
```
/lib/content-processing/scrapers/
├── base/
│   ├── BaseScraper.ts       # Abstract base class
│   ├── RateLimiter.ts       # Rate limiting logic
│   └── ScraperConfig.ts     # Configuration types
├── sites/
│   ├── TripAdvisorScraper.ts    # TripAdvisor implementation
│   ├── BookingComScraper.ts     # Booking.com implementation
│   └── GetYourGuideScraper.ts   # GetYourGuide implementation
├── models/
│   ├── Activity.ts          # Tour/activity data model
│   ├── Accommodation.ts     # Hotel data model
│   └── Destination.ts       # Location data model
└── scraper-manager.ts       # Scraper orchestration
```

#### API Endpoint
- **POST /api/content/scan**: Main scanning endpoint
- **GET /api/content/scan-demo**: Demo endpoint showing capabilities

#### UI Integration
- **content-import-screen.tsx**: Updated to use real scanning API
- Progress tracking with meaningful messages
- Fallback to sample data on error

### 3. How It Works

1. **URL Detection**: The system automatically detects the type of website:
   - TripAdvisor → Uses TripAdvisorScraper
   - Booking.com → Uses BookingComScraper
   - GetYourGuide → Uses GetYourGuideScraper
   - Other sites → Uses generic scraper

2. **Scraping Process**:
   ```typescript
   // 1. Initialize appropriate scraper
   const scraper = getScraperForUrl(websiteUrl);
   
   // 2. Scrape with rate limiting
   const result = await scraper.scrapeUrl(url);
   
   // 3. Convert to standard format
   const tours = result.data.map(activity => activityToTour(activity));
   
   // 4. Clean up resources
   await scraper.dispose();
   ```

3. **Data Extraction**: Each scraper extracts:
   - Tour/activity names and descriptions
   - Pricing information
   - Duration and schedules
   - Location details
   - Images and media
   - Inclusions/exclusions
   - Availability information

4. **Rate Limiting**: Prevents blocking:
   - TripAdvisor: 20 requests/minute
   - Booking.com: 15 requests/minute
   - GetYourGuide: 18 requests/minute
   - Generic sites: 10 requests/minute

### 4. UI Flow

1. Tour operator enters company website in profile step
2. Clicks "Automatic Website Scan" in content import step
3. Real-time progress updates show scanning stages:
   - "Connecting to website..."
   - "Analyzing page structure..."
   - "Extracting tour information..."
   - "Processing activity data..."
4. Results displayed in searchable table
5. Tours can be enabled/disabled before import

### 5. Error Handling

- **Network errors**: Falls back to sample data
- **Parsing errors**: Continues with partial results
- **Rate limiting**: Automatic retry with backoff
- **Timeout**: 30-second timeout per page

## Usage Examples

### Basic Scanning
```typescript
// API Request
POST /api/content/scan
{
  "websiteUrl": "https://www.adventuretours.com",
  "tenantId": "tour-operator-123",
  "scanDepth": 10
}

// Response
{
  "data": {
    "tours": [
      {
        "id": "activity-12345",
        "name": "Machu Picchu Classic Trek",
        "destination": "Peru",
        "duration": "4 days",
        "price": 650,
        "status": "enabled"
      }
    ],
    "summary": {
      "totalFound": 23,
      "destinations": ["Peru", "Brazil", "Chile"],
      "priceRange": { "min": 350, "max": 2500 }
    }
  }
}
```

### Programmatic Usage
```typescript
import { DefaultScraperManager } from '@/lib/content-processing/scrapers/scraper-manager';

const manager = new DefaultScraperManager();
const scraper = manager.getScraper('https://www.tripadvisor.com/...');

try {
  const result = await scraper.scrapeUrl(url);
  if (result.success) {
    // Process result.data
  }
} finally {
  await manager.disposeAll();
}
```

## Performance Considerations

1. **Resource Optimization**:
   - Blocks unnecessary resources (images, stylesheets, fonts)
   - Parallel processing where possible
   - Caching for repeated requests

2. **Scalability**:
   - Can be moved to background job queue
   - Supports distributed scraping
   - Database persistence for results

3. **Monitoring**:
   - Detailed logging throughout process
   - Success/failure metrics
   - Performance tracking

## Security Considerations

1. **Rate Limiting**: Prevents overwhelming target sites
2. **User Agent Rotation**: Mimics real browsers
3. **Proxy Support**: Available for IP rotation
4. **Sandboxed Execution**: Puppeteer runs in isolated environment

## Future Enhancements

1. **Background Processing**:
   - Implement job queue (Bull/BullMQ)
   - WebSocket progress updates
   - Scheduled re-scanning

2. **Advanced Extraction**:
   - Machine learning for better content detection
   - Natural language processing for descriptions
   - Image analysis for tour categorization

3. **More Scrapers**:
   - Viator
   - Expedia
   - Custom website templates
   - PDF/Document parsing

4. **User Features**:
   - Manual content editing after import
   - Bulk operations
   - Content enrichment with AI

## Troubleshooting

### Common Issues

1. **"No tours found"**:
   - Check if website has JavaScript-rendered content
   - Verify URL is accessible
   - Check for bot protection (Cloudflare, etc.)

2. **Slow scanning**:
   - Normal for JavaScript-heavy sites
   - Consider reducing scan depth
   - Check rate limiting settings

3. **Incomplete data**:
   - Some sites may have anti-scraping measures
   - Content might be behind login
   - Dynamic pricing may not be captured

### Debug Mode

Enable debug logging:
```javascript
// In the API endpoint
console.log('Scraping URL:', url);
console.log('Scraper config:', scraper.config);
console.log('Result:', result);
```

## Conclusion

The website scanning feature provides tour operators with a powerful way to quickly import their existing content into the platform. The implementation leverages battle-tested scraping infrastructure while providing a smooth user experience with proper error handling and fallbacks.