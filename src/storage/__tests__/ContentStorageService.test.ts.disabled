import { ContentStorageService } from '../services/ContentStorageService';
import { NormalizedDestination, NormalizedActivity } from '../../normalizers/types';
import { ContentType } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $disconnect: jest.fn(),
    processedContent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contentTag: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    contentFeedback: {
      create: jest.fn(),
    },
    contentAnalytics: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    ContentType,
  };
});

jest.mock('../../../lib/supabase', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'documents/test.pdf' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.com/documents/test.pdf' },
        }),
      }),
    },
    rpc: jest.fn(),
  }),
  supabaseAdmin: {
    rpc: jest.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  },
}));

jest.mock('../../tagging/ContentTagger');
jest.mock('../../normalizers/Deduplicator');
jest.mock('../ml/EmbeddingService');

describe('ContentStorageService', () => {
  let service: ContentStorageService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContentStorageService();
  });
  
  afterEach(async () => {
    await service.close();
  });

  describe('storeContent', () => {
    const mockDestination: NormalizedDestination = {
      id: 'dest-1',
      source: 'test-source',
      extractionDate: '2024-01-01',
      confidence: 0.9,
      type: 'destination',
      originalContentType: 'web',
      name: 'Bali, Indonesia',
      country: 'Indonesia',
      region: 'Southeast Asia',
      description: 'Beautiful tropical island',
      coordinates: { lat: -8.4095, lng: 115.1889 },
    };

    it('should store new content successfully', async () => {
      // Mock repository responses
      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.contentExists = jest.fn().mockResolvedValue(false);
      mockContentRepo.prototype.storeContent = jest.fn().mockResolvedValue({
        id: 'stored-123',
        ...mockDestination,
      });
      mockContentRepo.prototype.findSimilar = jest.fn().mockResolvedValue([]);

      // Mock embedding service
      const mockEmbeddingService = jest.requireMock('../ml/EmbeddingService').EmbeddingService;
      mockEmbeddingService.prototype.generateEmbedding = jest.fn().mockResolvedValue(new Array(1536).fill(0));

      // Mock tagger
      const mockContentTagger = jest.requireMock('../../tagging/ContentTagger').ContentTagger;
      mockContentTagger.prototype.tagContent = jest.fn().mockResolvedValue({
        primaryCategory: 'DESTINATION',
        tags: [{
          category: 'DESTINATION',
          subcategories: ['beach'],
          keywords: ['tropical', 'island'],
          confidence: 0.8,
        }],
        suggestedTags: [],
        confidence: { overall: 0.8, byCategory: { DESTINATION: 0.8 } },
      });

      // Mock deduplicator
      const mockDeduplicator = jest.requireMock('../../normalizers/Deduplicator').Deduplicator;
      mockDeduplicator.prototype.checkAndStoreDuplicate = jest.fn().mockReturnValue({
        isDuplicate: false,
      });

      const result = await service.storeContent(mockDestination);

      expect(result).toEqual({
        success: true,
        contentId: 'stored-123',
      });
    });

    it('should detect exact duplicates', async () => {
      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.contentExists = jest.fn().mockResolvedValue(true);

      const result = await service.storeContent(mockDestination);

      expect(result).toEqual({
        success: true,
        isDuplicate: true,
        duplicateId: expect.any(String),
      });
    });

    it('should detect near duplicates', async () => {
      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.contentExists = jest.fn().mockResolvedValue(false);
      mockContentRepo.prototype.findSimilar = jest.fn().mockResolvedValue([
        { id: 'similar-123', content: mockDestination },
      ]);

      const mockEmbeddingService = jest.requireMock('../ml/EmbeddingService').EmbeddingService;
      mockEmbeddingService.prototype.generateEmbedding = jest.fn().mockResolvedValue(new Array(1536).fill(0));

      const mockDeduplicator = jest.requireMock('../../normalizers/Deduplicator').Deduplicator;
      mockDeduplicator.prototype.checkAndStoreDuplicate = jest.fn().mockReturnValue({
        isDuplicate: true,
        similarityScore: 0.95,
      });

      const result = await service.storeContent(mockDestination);

      expect(result).toEqual({
        success: true,
        isDuplicate: true,
        duplicateId: 'similar-123',
      });
    });

    it('should handle errors gracefully', async () => {
      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.contentExists = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await service.storeContent(mockDestination);

      expect(result).toEqual({
        success: false,
        error: 'Database error',
      });
    });
  });

  describe('storeContentBatch', () => {
    it('should process content in batches', async () => {
      const contents = Array(25).fill(null).map((_, i) => ({
        id: `content-${i}`,
        source: 'test',
        extractionDate: '2024-01-01',
        confidence: 0.9,
        type: 'activity',
        originalContentType: 'web',
        name: `Activity ${i}`,
        description: 'Test activity',
        activityType: 'tour',
      }));

      // Mock successful storage for all
      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.contentExists = jest.fn().mockResolvedValue(false);
      mockContentRepo.prototype.storeContent = jest.fn().mockImplementation((content) => ({
        id: `stored-${content.id}`,
        ...content,
      }));
      mockContentRepo.prototype.findSimilar = jest.fn().mockResolvedValue([]);

      const mockEmbeddingService = jest.requireMock('../ml/EmbeddingService').EmbeddingService;
      mockEmbeddingService.prototype.generateEmbedding = jest.fn().mockResolvedValue(new Array(300).fill(0));

      const mockContentTagger = jest.requireMock('../../tagging/ContentTagger').ContentTagger;
      mockContentTagger.prototype.tagContent = jest.fn().mockResolvedValue({
        primaryCategory: 'ACTIVITY',
        tags: [],
        suggestedTags: [],
        confidence: { overall: 0.7, byCategory: {} },
      });

      const mockDeduplicator = jest.requireMock('../../normalizers/Deduplicator').Deduplicator;
      mockDeduplicator.prototype.checkAndStoreDuplicate = jest.fn().mockReturnValue({
        isDuplicate: false,
      });

      const results = await service.storeContentBatch(contents as any);

      expect(results).toHaveLength(25);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('searchContent', () => {
    it('should search content by criteria', async () => {
      const mockResults = [
        { id: 'content-1', title: 'Test 1', tags: [] },
        { id: 'content-2', title: 'Test 2', tags: [] },
      ];

      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.searchContent = jest.fn().mockResolvedValue(mockResults);

      const results = await service.searchContent({
        contentType: ContentType.DESTINATION,
        categories: ['beach'],
        limit: 10,
      });

      expect(results).toEqual(mockResults);
      expect(mockContentRepo.prototype.searchContent).toHaveBeenCalledWith({
        contentType: ContentType.DESTINATION,
        categories: ['beach'],
        limit: 10,
      });
    });
  });

  describe('getRecommendations', () => {
    it('should get content recommendations', async () => {
      const sourceContent = {
        id: 'source-123',
        embedding: new Array(1536).fill(0),
        content: { type: 'destination' },
      };

      const similarContent = [
        { id: 'similar-1', title: 'Similar 1' },
        { id: 'similar-2', title: 'Similar 2' },
      ];

      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.getContentById = jest.fn().mockResolvedValue(sourceContent);
      mockContentRepo.prototype.findSimilar = jest.fn().mockResolvedValue(similarContent);

      const results = await service.getRecommendations({
        contentId: 'source-123',
        limit: 5,
      });

      expect(results).toEqual(similarContent);
      expect(mockContentRepo.prototype.findSimilar).toHaveBeenCalledWith({
        embedding: sourceContent.embedding,
        threshold: 0.7,
        limit: 5,
        excludeIds: ['source-123'],
      });
    });

    it('should throw error if content not found', async () => {
      const mockContentRepo = jest.requireMock('../repositories/ContentRepository').ContentRepository;
      mockContentRepo.prototype.getContentById = jest.fn().mockResolvedValue(null);

      await expect(service.getRecommendations({
        contentId: 'non-existent',
      })).rejects.toThrow('Content not found');
    });
  });

  describe('uploadContentFile', () => {
    it('should upload file to Supabase Storage', async () => {
      const file = Buffer.from('test file content');
      const filename = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await service.uploadContentFile(file, filename, contentType);

      expect(result).toBe('https://storage.supabase.com/documents/test.pdf');
    });
  });
}); 