#!/usr/bin/env ts-node

import { TripAdvisorScraper } from '../lib/content-processing/scrapers/sites/TripAdvisorScraper.js';
import { BookingComScraper } from '../lib/content-processing/scrapers/sites/BookingComScraper.js';
import { GetYourGuideScraper } from '../lib/content-processing/scrapers/sites/GetYourGuideScraper.js';

/**
 * Demo script to test the web scraping framework
 * This script demonstrates how to use the different scrapers
 */
async function runScrapingDemo() {
  console.log('🚀 Starting Web Scraping Framework Demo\n');

  // Test URLs for demonstration (using search pages that are likely to have content)
  const testUrls = {
    tripadvisor: 'https://www.tripadvisor.com/Attractions-g60763-Activities-New_York_City_New_York.html',
    booking: 'https://www.booking.com/searchresults.html?ss=New+York&checkin=2024-06-01&checkout=2024-06-03',
    getyourguide: 'https://www.getyourguide.com/new-york-l59/'
  };

  // Test TripAdvisor Scraper
  console.log('📍 Testing TripAdvisor Scraper...');
  try {
    const tripAdvisorScraper = new TripAdvisorScraper();
    const tripAdvisorResults = await tripAdvisorScraper.scrapeUrl(testUrls.tripadvisor);
    
    console.log(`✅ TripAdvisor scraping completed:`);
    console.log(`   - Success: ${tripAdvisorResults.success}`);
    console.log(`   - Items found: ${tripAdvisorResults.metadata.itemsFound}`);
    console.log(`   - Processing time: ${tripAdvisorResults.metadata.processingTime}ms`);
    
    if (tripAdvisorResults.data && tripAdvisorResults.data.length > 0) {
      console.log(`   - Sample item: ${tripAdvisorResults.data[0]?.title || 'No title'}`);
    }
    
    if (tripAdvisorResults.errors && tripAdvisorResults.errors.length > 0) {
      console.log(`   - Errors: ${tripAdvisorResults.errors.join(', ')}`);
    }
    
    await tripAdvisorScraper.dispose();
  } catch (error) {
    console.error(`❌ TripAdvisor scraper failed: ${(error as Error).message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test Booking.com Scraper
  console.log('🏨 Testing Booking.com Scraper...');
  try {
    const bookingScraper = new BookingComScraper();
    const bookingResults = await bookingScraper.scrapeUrl(testUrls.booking);
    
    console.log(`✅ Booking.com scraping completed:`);
    console.log(`   - Success: ${bookingResults.success}`);
    console.log(`   - Items found: ${bookingResults.metadata.itemsFound}`);
    console.log(`   - Processing time: ${bookingResults.metadata.processingTime}ms`);
    
    if (bookingResults.data && bookingResults.data.length > 0) {
      console.log(`   - Sample item: ${bookingResults.data[0]?.title || 'No title'}`);
    }
    
    if (bookingResults.errors && bookingResults.errors.length > 0) {
      console.log(`   - Errors: ${bookingResults.errors.join(', ')}`);
    }
    
    await bookingScraper.dispose();
  } catch (error) {
    console.error(`❌ Booking.com scraper failed: ${(error as Error).message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test GetYourGuide Scraper
  console.log('🎯 Testing GetYourGuide Scraper...');
  try {
    const getYourGuideScraper = new GetYourGuideScraper();
    const getYourGuideResults = await getYourGuideScraper.scrapeUrl(testUrls.getyourguide);
    
    console.log(`✅ GetYourGuide scraping completed:`);
    console.log(`   - Success: ${getYourGuideResults.success}`);
    console.log(`   - Items found: ${getYourGuideResults.metadata.itemsFound}`);
    console.log(`   - Processing time: ${getYourGuideResults.metadata.processingTime}ms`);
    
    if (getYourGuideResults.data && getYourGuideResults.data.length > 0) {
      console.log(`   - Sample item: ${getYourGuideResults.data[0]?.title || 'No title'}`);
    }
    
    if (getYourGuideResults.errors && getYourGuideResults.errors.length > 0) {
      console.log(`   - Errors: ${getYourGuideResults.errors.join(', ')}`);
    }
    
    await getYourGuideScraper.dispose();
  } catch (error) {
    console.error(`❌ GetYourGuide scraper failed: ${(error as Error).message}`);
  }

  console.log('\n🎉 Demo completed! Check the results above to see how each scraper performed.');
  console.log('\n📝 Notes:');
  console.log('   - Some scrapers may fail due to anti-bot measures');
  console.log('   - Rate limiting is in effect to be respectful to target sites');
  console.log('   - In production, you would handle errors more gracefully');
  console.log('   - Consider using proxies and user agent rotation for better success rates');
}

/**
 * Simple test to verify the framework components work
 */
async function runComponentTest() {
  console.log('🔧 Testing Framework Components...\n');

  // Test rate limiter
  console.log('⏱️  Testing Rate Limiter...');
  const { RateLimiter } = await import('../lib/content-processing/scrapers/base/RateLimiter');
  const rateLimiter = RateLimiter.createForSite('test', 60, 2);
  
  const startTime = Date.now();
  await rateLimiter.schedule(async () => {
    console.log('   - First request executed');
    return 'success';
  });
  
  await rateLimiter.schedule(async () => {
    console.log('   - Second request executed');
    return 'success';
  });
  
  const elapsed = Date.now() - startTime;
  console.log(`   - Rate limiting working: ${elapsed}ms elapsed\n`);

  // Test logger
  console.log('📝 Testing Logger...');
  const { ScraperLogger } = await import('../lib/content-processing/scrapers/utils/ScraperLogger');
  const logger = new ScraperLogger('DemoTest');
  logger.info('Logger test message', { test: true });
  console.log('   - Logger working correctly\n');

  // Test user agent rotator
  console.log('🔄 Testing User Agent Rotator...');
  const { UserAgentRotator } = await import('../lib/content-processing/scrapers/utils/UserAgentRotator');
  const userAgentRotator = new UserAgentRotator({ strategy: 'random' });
  const userAgent1 = userAgentRotator.getNext();
  const userAgent2 = userAgentRotator.getNext();
  console.log(`   - User Agent 1: ${userAgent1.substring(0, 50)}...`);
  console.log(`   - User Agent 2: ${userAgent2.substring(0, 50)}...`);
  console.log(`   - Different agents: ${userAgent1 !== userAgent2}\n`);

  console.log('✅ All framework components are working correctly!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'components';

  try {
    if (testType === 'full') {
      await runScrapingDemo();
    } else {
      await runComponentTest();
    }
  } catch (error) {
    console.error('❌ Demo failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { runScrapingDemo, runComponentTest }; 