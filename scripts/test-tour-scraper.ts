#!/usr/bin/env node
import { TourOperatorScraper } from '../lib/content-processing/scrapers/sites/TourOperatorScraper';

async function testScraper(url: string) {
  console.log(`\n🔍 Testing TourOperatorScraper with: ${url}\n`);
  
  const scraper = new TourOperatorScraper();
  
  try {
    const result = await scraper.scrapeUrl(url);
    
    if (result.success && result.data) {
      console.log(`✅ Successfully scraped ${result.data.length} tours\n`);
      
      result.data.forEach((tour, index) => {
        console.log(`Tour ${index + 1}:`);
        console.log(`  Title: ${tour.title}`);
        console.log(`  Location: ${tour.location}`);
        console.log(`  Duration: ${tour.duration}`);
        console.log(`  Price: $${tour.price} ${tour.currency}`);
        console.log(`  Images: ${tour.images?.length || 0} found`);
        console.log(`  Description: ${tour.description?.substring(0, 100)}...`);
        console.log('');
      });
      
      console.log(`Summary:`);
      console.log(`  Total tours found: ${result.data.length}`);
      console.log(`  Processing time: ${result.metadata.processingTime}ms`);
    } else {
      console.log('❌ No tours found or scraping failed');
      if (result.errors?.length) {
        console.log('Errors:', result.errors);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.dispose();
  }
}

// Test with different URLs
const testUrls = process.argv.slice(2);

if (testUrls.length === 0) {
  console.log('Usage: npx tsx scripts/test-tour-scraper.ts <url1> [url2] [url3]...');
  console.log('Example: npx tsx scripts/test-tour-scraper.ts https://www.peruforless.com/');
  process.exit(1);
}

(async () => {
  for (const url of testUrls) {
    await testScraper(url);
  }
})();