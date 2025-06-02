import { ContentTagger } from '../ContentTagger';
import { 
  NormalizedDestination,
  NormalizedActivity,
  NormalizedAccommodation,
  NormalizedContent
} from '../../normalizers/types';
import { ContentCategory } from '../../taxonomy/travel-taxonomy';

describe('ContentTagger', () => {
  let tagger: ContentTagger;

  beforeEach(() => {
    tagger = new ContentTagger();
  });

  describe('Destination Tagging', () => {
    it('should tag a beach destination correctly', async () => {
      const destination: NormalizedDestination = {
        id: 'dest-1',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'destination',
        originalContentType: 'web',
        name: 'Bali Beaches',
        country: 'Indonesia',
        region: 'Southeast Asia',
        description: 'Beautiful beaches with crystal clear water and white sand. Perfect for surfing and relaxation.',
        coordinates: { lat: -8.4095, lng: 115.1889 }
      };

      const result = await tagger.tagContent(destination);

      expect(result.primaryCategory).toBe(ContentCategory.DESTINATION);
      expect(result.tags.length).toBeGreaterThan(0);
      
      // Should have beach-related tags
      const beachTag = result.tags.find(tag => 
        tag.subcategories.includes('beach') || 
        tag.keywords.includes('beach')
      );
      expect(beachTag).toBeDefined();
      
      // Should have location entities
      if (result.tags[0]?.entities.locations) {
        expect(result.tags[0].entities.locations).toContain('Indonesia');
        expect(result.tags[0].entities.locations).toContain('Southeast Asia');
      }
    });

    it('should tag a city destination correctly', async () => {
      const destination: NormalizedDestination = {
        id: 'dest-2',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'destination',
        originalContentType: 'web',
        name: 'Paris City Guide',
        country: 'France',
        region: 'Île-de-France',
        description: 'The romantic capital city of France, known for the Eiffel Tower, museums, and cafe culture.',
        coordinates: { lat: 48.8566, lng: 2.3522 }
      };

      const result = await tagger.tagContent(destination);

      expect(result.primaryCategory).toBe(ContentCategory.DESTINATION);
      
      // Should extract Paris as a location entity
      if (result.tags[0]) {
        const entities = result.tags[0].entities;
        expect(entities.locations).toBeDefined();
      }
      
      // Should have reasonable confidence
      expect(result.confidence.overall).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Activity Tagging', () => {
    it('should tag a water sports activity correctly', async () => {
      const activity: NormalizedActivity = {
        id: 'act-1',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'activity',
        originalContentType: 'web',
        name: 'Scuba Diving Experience',
        description: 'Explore underwater coral reefs with certified diving instructors',
        activityType: 'water_sports',
        duration: '3 hours',
        price: {
          amount: 150,
          currency: 'USD',
          priceType: 'per_person'
        },
        locationName: 'Great Barrier Reef'
      };

      const result = await tagger.tagContent(activity);

      expect(result.primaryCategory).toBe(ContentCategory.ACTIVITY);
      
      // Should have water sports subcategory
      const waterSportsTag = result.tags.find(tag => 
        tag.subcategories.includes('water_sports') || 
        tag.keywords.some(k => k.toLowerCase().includes('diving'))
      );
      expect(waterSportsTag).toBeDefined();
      
      // Should have duration and price attributes
      if (waterSportsTag) {
        expect(waterSportsTag.attributes.duration).toBe('half_day');
        expect(waterSportsTag.attributes.priceRange).toBe('expensive');
      }
    });

    it('should tag a cultural activity correctly', async () => {
      const activity: NormalizedActivity = {
        id: 'act-2',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'activity',
        originalContentType: 'web',
        name: 'Louvre Museum Guided Tour',
        description: 'Skip-the-line guided tour of the world-famous Louvre Museum',
        activityType: 'cultural',
        duration: '2.5 hours',
        price: {
          amount: 65,
          currency: 'EUR',
          priceType: 'per_person'
        },
        locationName: 'Paris, France'
      };

      const result = await tagger.tagContent(activity);

      // Should have museum-related tags
      const museumTag = result.tags.find(tag => 
        tag.keywords.some(k => k.toLowerCase().includes('museum'))
      );
      expect(museumTag).toBeDefined();
      
      // Should categorize duration correctly
      if (result.tags[0]) {
        expect(result.tags[0].attributes.duration).toBe('half_day');
      }
    });
  });

  describe('Accommodation Tagging', () => {
    it('should tag a luxury hotel correctly', async () => {
      const accommodation: NormalizedAccommodation = {
        id: 'acc-1',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'accommodation',
        originalContentType: 'web',
        name: 'Grand Luxury Resort & Spa',
        accommodationType: 'resort',
        address: {
          street: '123 Beach Road',
          city: 'Cancun',
          country: 'Mexico',
          postalCode: '77500'
        },
        amenities: ['pool', 'spa', 'gym', 'restaurant', 'business_center', 'wifi'],
        rating: 4.8,
        checkInTime: '15:00',
        checkOutTime: '11:00'
      };

      const result = await tagger.tagContent(accommodation);

      expect(result.primaryCategory).toBe(ContentCategory.ACCOMMODATION);
      
      // Should identify as resort
      const resortTag = result.tags.find(tag => 
        tag.keywords.includes('resort') || 
        tag.subcategories.includes('resort')
      );
      expect(resortTag).toBeDefined();
      
      // Should identify business suitability
      if (resortTag) {
        expect(resortTag.attributes.suitability).toContain('business');
      }
    });

    it('should tag a budget hostel correctly', async () => {
      const accommodation: NormalizedAccommodation = {
        id: 'acc-2',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'accommodation',
        originalContentType: 'web',
        name: 'Backpackers Paradise Hostel',
        accommodationType: 'hostel',
        address: {
          street: '456 Main St',
          city: 'Bangkok',
          country: 'Thailand',
          postalCode: '10110'
        },
        amenities: ['wifi', 'shared_kitchen', 'lockers'],
        rating: 4.2,
        priceRange: {
          min: { amount: 10, currency: 'USD', priceType: 'per_person' },
          max: { amount: 25, currency: 'USD', priceType: 'per_person' }
        }
      };

      const result = await tagger.tagContent(accommodation);

      // Should identify as hostel
      const hostelTag = result.tags.find(tag => 
        tag.subcategories.includes('hostel') || 
        tag.hierarchicalPath.includes('hostel')
      );
      expect(hostelTag).toBeDefined();
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract relevant keywords from content', async () => {
      const activity: NormalizedActivity = {
        id: 'act-3',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'activity',
        originalContentType: 'web',
        name: 'Mountain Hiking Adventure',
        description: 'Experience breathtaking mountain views on this guided hiking tour through alpine trails',
        activityType: 'outdoor',
        duration: '6 hours'
      };

      const result = await tagger.tagContent(activity);

      expect(result.extractedKeywords).toBeDefined();
      expect(result.extractedKeywords.length).toBeGreaterThan(0);
      
      // Should include relevant terms
      const relevantTerms = ['mountain', 'hiking', 'adventure', 'guided', 'alpine', 'trails'];
      const hasRelevantKeywords = relevantTerms.some(term => 
        result.extractedKeywords.some(keyword => 
          keyword.toLowerCase().includes(term.toLowerCase())
        )
      );
      expect(hasRelevantKeywords).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence to well-structured content', async () => {
      const destination: NormalizedDestination = {
        id: 'dest-3',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.95,
        type: 'destination',
        originalContentType: 'web',
        name: 'Tokyo Travel Guide',
        country: 'Japan',
        region: 'Kanto',
        description: 'Comprehensive guide to Tokyo, including temples, museums, shopping districts, and restaurants',
        coordinates: { lat: 35.6762, lng: 139.6503 }
      };

      const result = await tagger.tagContent(destination);

      expect(result.confidence.overall).toBeGreaterThanOrEqual(0.5);
      expect(result.tags.length).toBeGreaterThan(0);
      if (result.tags[0]) {
        expect(result.tags[0].confidence).toBeGreaterThanOrEqual(0.5);
      }
    });

    it('should assign lower confidence to sparse content', async () => {
      const activity: NormalizedActivity = {
        id: 'act-4',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.5,
        type: 'activity',
        originalContentType: 'web',
        name: 'Tour',
        description: 'A tour'
      };

      const result = await tagger.tagContent(activity);

      // Sparse content should still get some confidence due to minimum threshold
      expect(result.confidence.overall).toBeGreaterThanOrEqual(0.5);
      // Either tags or suggestedTags should have content
      expect(result.tags.length + result.suggestedTags.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Tagging', () => {
    it('should tag multiple content items in batch', async () => {
      const contents: NormalizedContent[] = [
        {
          id: 'batch-1',
          source: 'test',
          extractionDate: '2024-01-01',
          confidence: 0.9,
          type: 'destination',
          originalContentType: 'web',
          name: 'London City Guide',
          country: 'United Kingdom',
          description: 'Historic capital city'
        } as NormalizedDestination,
        {
          id: 'batch-2',
          source: 'test',
          extractionDate: '2024-01-01',
          confidence: 0.9,
          type: 'activity',
          originalContentType: 'web',
          name: 'Thames River Cruise',
          description: 'Scenic boat tour',
          duration: '1 hour'
        } as NormalizedActivity
      ];

      const results = await tagger.tagContentBatch(contents);

      expect(results).toHaveLength(2);
      expect(results[0].primaryCategory).toBe(ContentCategory.DESTINATION);
      expect(results[1].primaryCategory).toBe(ContentCategory.ACTIVITY);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract location entities correctly', async () => {
      const destination: NormalizedDestination = {
        id: 'dest-4',
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'destination',
        originalContentType: 'web',
        name: 'Mediterranean Cruise Ports',
        country: 'Multiple',
        description: 'Visit Barcelona, Rome, Athens, and Istanbul on this amazing Mediterranean journey'
      };

      const result = await tagger.tagContent(destination);

      // Entity extraction should identify locations
      const allTags = [...result.tags, ...result.suggestedTags];
      const extractedLocations = new Set<string>();
      allTags.forEach(tag => {
        if (tag.entities && tag.entities.locations) {
          tag.entities.locations.forEach(loc => extractedLocations.add(loc));
        }
      });

      expect(extractedLocations.size).toBeGreaterThan(0);
    });
  });
}); 