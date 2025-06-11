import { NormalizationPipeline } from '../NormalizationPipeline';
import { RawContent, NormalizedItinerary } from '../../normalizers/types';

describe('NormalizationPipeline', () => {
  let pipeline: NormalizationPipeline;

  beforeEach(() => {
    pipeline = new NormalizationPipeline();
  });

  describe('Web Content Normalization', () => {
    it('should normalize web content for a destination', async () => {
      const rawWebContent: RawContent = {
        id: 'web-1',
        sourceUrl: 'https://example.com/paris',
        contentType: 'html',
        rawText: 'Paris, France is a beautiful city. Things to do include visiting the Eiffel Tower.',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: {
          title: 'Paris Travel Guide',
          country: 'France',
          description: 'Discover the beauty of Paris',
          coordinates: { lat: 48.8566, lng: 2.3522 }
        }
      };

      const result = await pipeline.normalize(rawWebContent, 'web');
      
      expect(result.errors).toHaveLength(0);
      expect(result.content).toHaveLength(1);
      
      const content = result.content[0];
      expect(content).toBeDefined();
      if (!content) return;
      
      expect(content.type).toBe('destination');
      expect(content).toMatchObject({
        name: 'Paris Travel Guide',
        country: 'France',
        description: 'Discover the beauty of Paris',
        coordinates: { lat: 48.8566, lng: 2.3522 }
      });
    });

    it('should normalize web content for an activity', async () => {
      const rawWebContent: RawContent = {
        id: 'web-2',
        sourceUrl: 'https://example.com/eiffel-tower-tour',
        contentType: 'html',
        rawText: 'Eiffel Tower Skip-the-Line Tour. Duration: 2 hours. Price: €50 per person. Book now!',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: {
          title: 'Eiffel Tower Tour',
          pageType: 'activity',
          price: '€50',
          duration: '2 hours',
          rating: '4.5'
        }
      };

      const result = await pipeline.normalize(rawWebContent, 'web');
      
      expect(result.errors).toHaveLength(0);
      expect(result.content).toHaveLength(1);
      
      const content = result.content[0];
      expect(content).toBeDefined();
      if (!content) return;
      
      expect(content.type).toBe('activity');
      expect(content).toMatchObject({
        name: 'Eiffel Tower Tour',
        price: {
          amount: 50,
          currency: 'EUR',
          type: 'per_person'
        },
        duration: '2 hours',
        rating: 4.5
      });
    });

    it('should normalize web content for accommodation', async () => {
      const rawWebContent: RawContent = {
        id: 'web-3',
        sourceUrl: 'https://example.com/hotel-paris',
        contentType: 'html',
        rawText: 'Hotel Paris Central. Check-in: 3:00 PM, Check-out: 11:00 AM. Luxury hotel in the heart of Paris.',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: {
          title: 'Hotel Paris Central',
          pageType: 'hotel',
          accommodationType: 'hotel',
          address: '123 Champs-Élysées, Paris, France',
          priceRange: '€200-€500',
          rating: '4.8'
        }
      };

      const result = await pipeline.normalize(rawWebContent, 'web');
      
      expect(result.errors).toHaveLength(0);
      expect(result.content).toHaveLength(1);
      
      const content = result.content[0];
      expect(content).toBeDefined();
      if (!content) return;
      
      expect(content.type).toBe('accommodation');
      expect(content).toMatchObject({
        name: 'Hotel Paris Central',
        accommodationType: 'hotel',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        rating: 4.8
      });
    });
  });

  describe('Document Content Normalization', () => {
    it('should normalize document content as an itinerary', async () => {
      const rawDocContent: RawContent = {
        id: 'doc-1',
        filePath: '/documents/paris-itinerary.pdf',
        contentType: 'pdf_text',
        rawText: `Paris 5-Day Itinerary
        
Day 1: Arrival and Eiffel Tower
- 10:00 AM - Arrive at Charles de Gaulle Airport
- 2:00 PM - Check in to Hotel Paris Central
- 4:00 PM - Visit Eiffel Tower (2 hours)
- 7:00 PM - Dinner at a local bistro

Day 2: Museums and Art
- 9:00 AM - Visit the Louvre Museum
- 2:00 PM - Lunch at museum cafe
- 4:00 PM - Walk through Tuileries Garden`,
        extractedDate: '2024-01-01T10:00:00Z'
      };

      const result = await pipeline.normalize(rawDocContent, 'document');
      
      expect(result.errors).toHaveLength(0);
      expect(result.content).toHaveLength(1);
      
      const content = result.content[0];
      expect(content).toBeDefined();
      if (!content) return;
      
      expect(content.type).toBe('itinerary');
      
      const itinerary = content as NormalizedItinerary;
      expect(itinerary.title).toBe('Paris 5-Day Itinerary');
      expect(itinerary.dailyPlans).toBeDefined();
      expect(itinerary.dailyPlans).toHaveLength(2);
      expect(itinerary.dailyPlans[0]).toMatchObject({
        day: 1,
        title: 'Arrival and Eiffel Tower'
      });
    });

    it('should handle generic document content', async () => {
      const rawDocContent: RawContent = {
        id: 'doc-2',
        filePath: '/documents/travel-tips.docx',
        contentType: 'docx_text',
        rawText: 'General travel tips for Europe...',
        extractedDate: '2024-01-01T10:00:00Z'
      };

      const result = await pipeline.normalize(rawDocContent, 'document');
      
      expect(result.errors).toHaveLength(0);
      expect(result.content).toHaveLength(1);
      
      const content = result.content[0];
      expect(content).toBeDefined();
      if (!content) return;
      
      expect(content.type).toBe('generic');
    });
  });

  describe('Validation', () => {
    it('should validate content and report errors', async () => {
      const invalidContent: RawContent = {
        id: 'invalid-1',
        sourceUrl: 'https://example.com/invalid',
        contentType: 'html',
        rawText: 'Some content',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: {
          title: '', // Empty title
          pageType: 'destination',
          country: 'Unknown' // Invalid country
        }
      };

      const result = await pipeline.normalize(invalidContent, 'web', { validateOutput: true });
      
      expect(result.content).toHaveLength(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('name is required'))).toBe(true);
      expect(result.errors.some(e => e.includes('Valid country code is required'))).toBe(true);
    });

    it('should validate coordinates range', async () => {
      const invalidCoords: RawContent = {
        id: 'invalid-coords',
        sourceUrl: 'https://example.com/place',
        contentType: 'html',
        rawText: 'A place with invalid coordinates',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: {
          title: 'Invalid Place',
          pageType: 'destination',
          country: 'US',
          coordinates: { lat: 200, lng: -300 } // Invalid coordinates
        }
      };

      const result = await pipeline.normalize(invalidCoords, 'web', { validateOutput: true });
      
      expect(result.errors.some(e => e.includes('Invalid latitude'))).toBe(true);
      expect(result.errors.some(e => e.includes('Invalid longitude'))).toBe(true);
    });
  });

  describe('Deduplication', () => {
    it('should detect exact duplicates', async () => {
      const content1: RawContent = {
        id: 'dup-1',
        sourceUrl: 'https://example.com/paris1',
        contentType: 'html',
        rawText: 'Paris is the capital of France',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: { title: 'Paris Guide' }
      };

      const content2: RawContent = {
        id: 'dup-2',
        sourceUrl: 'https://example.com/paris2',
        contentType: 'html',
        rawText: 'Paris is the capital of France', // Same text
        extractedDate: '2024-01-01T11:00:00Z',
        metadata: { title: 'Paris Guide' } // Same title
      };

      const result1 = await pipeline.normalize(content1, 'web', { enableDeduplication: true });
      expect(result1.content).toHaveLength(1);
      expect(result1.duplicatesRemoved).toBe(0);

      const result2 = await pipeline.normalize(content2, 'web', { enableDeduplication: true });
      expect(result2.content).toHaveLength(0);
      expect(result2.duplicatesRemoved).toBe(1);
    });

    it('should detect near duplicates with threshold', async () => {
      const content1: RawContent = {
        id: 'near-1',
        sourceUrl: 'https://example.com/hotel1',
        contentType: 'html',
        rawText: 'Hotel Paris Central is a luxury hotel in the heart of Paris with excellent amenities',
        extractedDate: '2024-01-01T10:00:00Z',
        metadata: { 
          title: 'Hotel Paris Central',
          pageType: 'hotel'
        }
      };

      const content2: RawContent = {
        id: 'near-2',
        sourceUrl: 'https://example.com/hotel2',
        contentType: 'html',
        rawText: 'Hotel Paris Central is a luxurious hotel located in central Paris with great facilities',
        extractedDate: '2024-01-01T11:00:00Z',
        metadata: { 
          title: 'Hotel Paris Central',
          pageType: 'hotel'
        }
      };

      // Clear any previous deduplication data
      pipeline.clearDeduplicationIndex();

      const result1 = await pipeline.normalize(content1, 'web', { 
        enableDeduplication: true,
        deduplicationThreshold: 0.7 // Lower threshold to catch near duplicates
      });
      expect(result1.content).toHaveLength(1);

      const result2 = await pipeline.normalize(content2, 'web', { 
        enableDeduplication: true,
        deduplicationThreshold: 0.7
      });
      expect(result2.duplicatesRemoved).toBe(1);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple items in batch', async () => {
      const contents: RawContent[] = [
        {
          id: 'batch-1',
          sourceUrl: 'https://example.com/1',
          contentType: 'html',
          rawText: 'Content 1',
          extractedDate: '2024-01-01T10:00:00Z',
          metadata: { title: 'Item 1' }
        },
        {
          id: 'batch-2',
          sourceUrl: 'https://example.com/2',
          contentType: 'html',
          rawText: 'Content 2',
          extractedDate: '2024-01-01T10:00:00Z',
          metadata: { title: 'Item 2' }
        },
        {
          id: 'batch-3',
          sourceUrl: 'https://example.com/3',
          contentType: 'html',
          rawText: 'Content 3',
          extractedDate: '2024-01-01T10:00:00Z',
          metadata: { title: 'Item 3' }
        }
      ];

      const result = await pipeline.normalizeBatch(contents, 'web', { batchSize: 2 });
      
      expect(result.content).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors in batch processing', async () => {
      const contents: RawContent[] = [
        {
          id: 'batch-good',
          sourceUrl: 'https://example.com/good',
          contentType: 'html',
          rawText: 'Good content',
          extractedDate: '2024-01-01T10:00:00Z',
          metadata: { title: 'Good Item' }
        },
        {
          id: 'batch-bad',
          sourceUrl: 'https://example.com/bad',
          contentType: 'invalid' as any, // Invalid content type
          rawText: 'Bad content',
          extractedDate: '2024-01-01T10:00:00Z'
        }
      ];

      const result = await pipeline.normalizeBatch(contents, 'web');
      
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported source types', async () => {
      const content: RawContent = {
        id: 'test-1',
        rawText: 'Some content',
        contentType: 'html',
        extractedDate: '2024-01-01T10:00:00Z'
      };

      const result = await pipeline.normalize(content, 'invalid' as any);
      
      expect(result.content).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unsupported source type');
    });

    it('should handle transformer failures gracefully', async () => {
      const content: RawContent = {
        id: 'fail-1',
        contentType: 'pdf_text', // Document type
        rawText: 'Some content',
        extractedDate: '2024-01-01T10:00:00Z'
      };

      // Try to process as web content (mismatch)
      const result = await pipeline.normalize(content, 'web');
      
      expect(result.content).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    it('should correctly categorize content by type', async () => {
      const contents: RawContent[] = [
        {
          id: 'cat-1',
          sourceUrl: 'https://example.com/dest',
          contentType: 'html',
          rawText: 'A destination',
          extractedDate: '2024-01-01T10:00:00Z',
          metadata: { title: 'Paris', pageType: 'destination' }
        },
        {
          id: 'cat-2',
          sourceUrl: 'https://example.com/activity',
          contentType: 'html',
          rawText: 'An activity',
          extractedDate: '2024-01-01T10:00:00Z',
          metadata: { title: 'Tour', pageType: 'activity' }
        },
        {
          id: 'cat-3',
          filePath: '/doc.pdf',
          contentType: 'pdf_text',
          rawText: 'Day 1: Travel itinerary',
          extractedDate: '2024-01-01T10:00:00Z'
        }
      ];

      const result = await pipeline.normalizeBatch(contents, 'web');
      const categorized = pipeline.getContentByType(result);
      
      expect(categorized.destinations.length).toBeGreaterThanOrEqual(1);
      expect(categorized.activities.length).toBeGreaterThanOrEqual(1);
    });
  });
}); 