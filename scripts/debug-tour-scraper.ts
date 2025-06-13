#!/usr/bin/env node
import { TourOperatorScraper } from '../lib/content-processing/scrapers/sites/TourOperatorScraper';

// Enable debug logging
process.env.DEBUG = 'true';

async function debugScraper(url: string) {
  console.log(`\n🔍 DEBUG: Testing TourOperatorScraper with: ${url}\n`);
  
  const scraper = new TourOperatorScraper();
  
  try {
    console.time('Scraping duration');
    const result = await scraper.scrapeUrl(url);
    console.timeEnd('Scraping duration');
    
    console.log('\n📊 RESULT SUMMARY:');
    console.log('Success:', result.success);
    console.log('Items found:', result.metadata?.itemsFound || 0);
    console.log('Processing time:', result.metadata?.processingTime, 'ms');
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error}`);
      });
    }
    
    if (result.success && result.data) {
      console.log(`\n✅ Successfully scraped ${result.data.length} tours\n`);
      
      result.data.forEach((tour, index) => {
        console.log(`\n📦 Tour ${index + 1}:`);
        console.log(`  Title: ${tour.title}`);
        console.log(`  Location: ${tour.location}`);
        console.log(`  Duration: ${tour.duration}`);
        console.log(`  Price: $${tour.price} ${tour.currency}`);
        console.log(`  Images: ${tour.images?.length || 0} found`);
        if (tour.images && tour.images.length > 0) {
          console.log(`    First image: ${tour.images[0]}`);
        }
        console.log(`  Description: ${tour.description?.substring(0, 100)}${tour.description && tour.description.length > 100 ? '...' : ''}`);
      });
      
      // Show unique destinations
      const destinations = [...new Set(result.data.map(t => t.location))];
      console.log(`\n🌍 Unique destinations (${destinations.length}):`);
      destinations.forEach(dest => console.log(`  - ${dest}`));
      
      // Show price range
      const prices = result.data.map(t => t.price).filter(p => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        console.log(`\n💰 Price range: $${minPrice} - $${maxPrice}`);
      }
    } else {
      console.log('\n❌ No tours found or scraping failed');
    }
    
    // Export logger stats
    const logger = scraper.getLogger();
    const stats = logger.getStats();
    console.log('\n📈 Logger Statistics:');
    console.log('  Total logs:', stats.totalLogs);
    console.log('  Logs by level:', stats.logsByLevel);
    console.log('  Total events:', stats.totalEvents);
    console.log('  Events by type:', stats.eventsByType);
    
    // Show recent errors and warnings
    const recentErrors = logger.getRecentLogs(10, 'error');
    if (recentErrors.length > 0) {
      console.log('\n🚨 Recent Errors:');
      recentErrors.forEach(log => {
        console.log(`  [${log.timestamp.toISOString()}] ${log.message}`);
        if (log.context) {
          console.log('    Context:', log.context);
        }
      });
    }
    
    const recentWarnings = logger.getRecentLogs(10, 'warn');
    if (recentWarnings.length > 0) {
      console.log('\n⚠️  Recent Warnings:');
      recentWarnings.forEach(log => {
        console.log(`  [${log.timestamp.toISOString()}] ${log.message}`);
        if (log.context) {
          console.log('    Context:', log.context);
        }
      });
    }
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    console.error('Stack trace:', (error as Error).stack);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await scraper.dispose();
    console.log('✅ Scraper disposed');
  }
}

// Test with provided URL or default
const testUrl = process.argv[2];

if (!testUrl) {
  console.log('Usage: npx tsx scripts/debug-tour-scraper.ts <url>');
  console.log('Example: npx tsx scripts/debug-tour-scraper.ts https://www.peruforless.com/');
  process.exit(1);
}

(async () => {
  await debugScraper(testUrl);
  process.exit(0);
})();