import { TripAdvisorScraper } from '../lib/content-processing/scrapers/sites/TripAdvisorScraper';
import { ScraperLogger } from '../lib/content-processing/scrapers/utils/ScraperLogger';

async function testScraper() {
  const logger = new ScraperLogger('TestScript');
  
  try {
    logger.info('Starting scraper test...');
    
    // Initialize the TripAdvisor scraper
    const scraper = new TripAdvisorScraper();
    
    // Test URL (Paris activities)
    const testUrl = 'https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html';
    
    logger.info('Testing single URL scraping...');
    const result = await scraper.scrapeUrl(testUrl);
    
    if (result.success) {
      logger.info(`Scraping successful!`, {
        itemsFound: result.metadata.itemsFound,
        processingTime: `${result.metadata.processingTime}ms`,
        url: result.metadata.url
      });
      
      // Display first few activities
      if (result.data && result.data.length > 0) {
        logger.info(`Sample activities extracted:`);
        result.data.slice(0, 3).forEach((activity, index) => {
          console.log(`\n${index + 1}. ${activity.title}`);
          console.log(`   URL: ${activity.url}`);
          console.log(`   Price: ${activity.price || 'N/A'}`);
          console.log(`   Rating: ${activity.rating || 'N/A'}`);
          console.log(`   Location: ${activity.location || 'N/A'}`);
          console.log(`   Duration: ${activity.duration || 'N/A'}`);
        });
      }
    } else {
      logger.error('Scraping failed', { errors: result.errors });
    }
    
    // Test rate limiter stats
    const rateLimiter = scraper.getRateLimiter();
    const stats = rateLimiter.getStats();
    logger.info('Rate limiter stats', stats);
    
    // Clean up
    await scraper.dispose();
    logger.info('Test completed successfully');
    
  } catch (error) {
    logger.error('Test failed', { error: (error as Error).message });
    process.exit(1);
  }
}

// Run the test
testScraper().then(() => {
  console.log('\n✅ Web scraping framework test completed');
  process.exit(0);
}); 