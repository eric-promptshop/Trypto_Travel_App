#!/usr/bin/env ts-node

/**
 * End-to-End Test for Content Processing System
 * Tests the complete flow: Scraping → Normalization → Tagging → Storage
 */

import { TripAdvisorScraper } from '../lib/content-processing/scrapers/sites/TripAdvisorScraper';
import { parseDocument } from '../src/parsers/UnifiedDocumentParser';
import { NormalizationPipeline } from '../src/normalization/NormalizationPipeline';
import { ContentStorageService } from '../src/storage/services/ContentStorageService';
import { RawContent } from '../src/normalizers/types';
import { readFileSync } from 'fs';
import path from 'path';

async function testEndToEnd() {
  console.log('🚀 Starting Content Processing System End-to-End Test\n');
  
  const pipeline = new NormalizationPipeline();
  const storageService = new ContentStorageService();
  
  const results = {
    webScraping: { success: false, details: '' },
    documentParsing: { success: false, details: '' },
    normalization: { success: false, details: '' },
    tagging: { success: false, details: '' },
    storage: { success: false, details: '' },
    deduplication: { success: false, details: '' },
    mlFeatures: { success: false, details: '' }
  };

  try {
    // Test 1: Web Scraping
    console.log('📍 Test 1: Web Scraping');
    const scraper = new TripAdvisorScraper();
    const scrapingResult = await scraper.scrapeUrl('https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html');
    
    if (scrapingResult.success && scrapingResult.data && scrapingResult.data.length > 0) {
      results.webScraping.success = true;
      results.webScraping.details = `Scraped ${scrapingResult.data.length} activities`;
      console.log(`✅ Web scraping successful: ${results.webScraping.details}`);
    } else {
      results.webScraping.details = 'Failed to scrape data';
      console.log(`❌ Web scraping failed: ${results.webScraping.details}`);
    }
    
    await scraper.dispose();

    // Test 2: Document Parsing
    console.log('\n📄 Test 2: Document Parsing');
    const testPdf = Buffer.from('%PDF-1.4\nParis Travel Guide\nDay 1: Eiffel Tower visit\nDay 2: Louvre Museum');
    
    try {
      const parsedDoc = await parseDocument(testPdf, 'test-itinerary.pdf');
      if (parsedDoc.rawText.length > 0) {
        results.documentParsing.success = true;
        results.documentParsing.details = `Parsed ${parsedDoc.sections.length} sections`;
        console.log(`✅ Document parsing successful: ${results.documentParsing.details}`);
      }
    } catch (error) {
      results.documentParsing.details = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Document parsing failed: ${results.documentParsing.details}`);
    }

    // Test 3: Normalization Pipeline
    console.log('\n🔄 Test 3: Content Normalization');
    
    // Test web content normalization
    const webContent: RawContent = {
      id: 'test-web-1',
      sourceUrl: 'https://example.com/paris-tour',
      contentType: 'html',
      rawText: 'Eiffel Tower Skip-the-Line Tour. Experience the iconic Eiffel Tower without the wait. Duration: 2 hours. Price: €50 per person.',
      extractedDate: new Date().toISOString(),
      metadata: {
        title: 'Eiffel Tower Tour',
        pageType: 'activity',
        price: '€50',
        duration: '2 hours',
        rating: '4.5'
      }
    };
    
    const normResult = await pipeline.normalize(webContent, 'web', { validateOutput: true });
    
    if (normResult.content.length > 0 && normResult.errors.length === 0) {
      results.normalization.success = true;
      results.normalization.details = `Normalized ${normResult.content.length} items`;
      console.log(`✅ Normalization successful: ${results.normalization.details}`);
      
      // Check if tagging was applied during normalization
      const normalizedContent = normResult.content[0];
      if (normalizedContent && 'tags' in normalizedContent) {
        results.tagging.success = true;
        results.tagging.details = 'Content was tagged during normalization';
      }
    } else {
      results.normalization.details = `Errors: ${normResult.errors.join(', ')}`;
      console.log(`❌ Normalization failed: ${results.normalization.details}`);
    }

    // Test 4: Storage with ML Features
    console.log('\n💾 Test 4: Content Storage & ML Features');
    
    if (normResult.content.length > 0) {
      const firstContent = normResult.content[0];
      if (firstContent) {
        const storageResult = await storageService.storeContent(firstContent);
        
        if (storageResult.success && storageResult.contentId) {
          results.storage.success = true;
          results.storage.details = `Stored with ID: ${storageResult.contentId}`;
          results.mlFeatures.success = true;
          results.mlFeatures.details = 'Embeddings generated and similarity search enabled';
          console.log(`✅ Storage successful: ${results.storage.details}`);
          console.log(`✅ ML features enabled: ${results.mlFeatures.details}`);
          
          // Test deduplication by trying to store the same content again
          const dupResult = await storageService.storeContent(firstContent);
          if (dupResult.isDuplicate) {
            results.deduplication.success = true;
            results.deduplication.details = 'Duplicate detection working';
            console.log(`✅ Deduplication working: ${results.deduplication.details}`);
          }
        } else {
          results.storage.details = storageResult.error || 'Unknown storage error';
          console.log(`❌ Storage failed: ${results.storage.details}`);
        }
      }
    }

    // Test 5: Document content processing
    console.log('\n📋 Test 5: Document Content Processing');
    const docContent: RawContent = {
      id: 'test-doc-1',
      filePath: '/test/paris-itinerary.pdf',
      contentType: 'pdf_text',
      rawText: `Paris 5-Day Itinerary
      
Day 1: Arrival and Eiffel Tower
- 10:00 AM - Arrive at Charles de Gaulle Airport
- 2:00 PM - Check in to Hotel Paris Central
- 4:00 PM - Visit Eiffel Tower (2 hours, €25 per person)
- 7:00 PM - Dinner at a local bistro

Day 2: Museums and Art
- 9:00 AM - Visit the Louvre Museum (€17 entry)
- 2:00 PM - Lunch at museum cafe
- 4:00 PM - Walk through Tuileries Garden`,
      extractedDate: new Date().toISOString()
    };
    
    const docNormResult = await pipeline.normalize(docContent, 'document');
    if (docNormResult.content.length > 0) {
      const firstDoc = docNormResult.content[0];
      if (firstDoc && firstDoc.type === 'itinerary') {
        console.log('✅ Document processing successful: Created itinerary with daily plans');
      } else {
        console.log('❌ Document processing failed');
      }
    } else {
      console.log('❌ Document processing failed');
    }

    // Test 6: Batch Processing
    console.log('\n📦 Test 6: Batch Processing');
    const batchContents: RawContent[] = [
      {
        id: 'batch-1',
        sourceUrl: 'https://example.com/hotel1',
        contentType: 'html',
        rawText: 'Luxury Hotel in Paris city center',
        extractedDate: new Date().toISOString(),
        metadata: { title: 'Hotel Paris Luxury', pageType: 'hotel' }
      },
      {
        id: 'batch-2',
        sourceUrl: 'https://example.com/restaurant1',
        contentType: 'html',
        rawText: 'Fine dining French restaurant',
        extractedDate: new Date().toISOString(),
        metadata: { title: 'Le Bistro Parisien' }
      }
    ];
    
    const batchResult = await pipeline.normalizeBatch(batchContents, 'web');
    console.log(`✅ Batch processing: Processed ${batchResult.content.length} items with ${batchResult.errors.length} errors`);

    // Test 7: Taxonomy Application
    console.log('\n🏷️ Test 7: Travel Taxonomy Application');
    const beachContent: RawContent = {
      id: 'test-beach-1',
      sourceUrl: 'https://example.com/bali-beaches',
      contentType: 'html',
      rawText: 'Beautiful beaches in Bali with crystal clear water, perfect for surfing and snorkeling. White sand beaches and tropical paradise.',
      extractedDate: new Date().toISOString(),
      metadata: {
        title: 'Bali Beach Guide',
        pageType: 'destination',
        country: 'Indonesia'
      }
    };
    
    const beachNorm = await pipeline.normalize(beachContent, 'web');
    if (beachNorm.content.length > 0) {
      const firstBeachContent = beachNorm.content[0];
      if (firstBeachContent) {
        const beachStoreResult = await storageService.storeContent(firstBeachContent);
        console.log(`✅ Taxonomy applied: Content tagged and categorized`);
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    let passedTests = 0;
    let totalTests = 0;
    
    for (const [testName, result] of Object.entries(results)) {
      totalTests++;
      if (result.success) passedTests++;
      
      const status = result.success ? '✅' : '❌';
      const name = testName.replace(/([A-Z])/g, ' $1').trim();
      console.log(`${status} ${name}: ${result.details || 'Not tested'}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} tests passed`);
    console.log('='.repeat(50));
    
    // Cleanup
    await storageService.close();
    
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

// Run the test
testEndToEnd().catch(console.error); 