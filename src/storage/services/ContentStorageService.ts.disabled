import { PrismaClient } from '@prisma/client';
import { NormalizedContent } from '../../normalizers/types';
import { ContentTagger } from '../../tagging/ContentTagger';
import { Deduplicator } from '../../normalizers/Deduplicator';
import { ContentRepository, ContentSearchOptions, ContentWithTags } from '../repositories/ContentRepository';
import { EmbeddingService } from '../ml/EmbeddingService';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { createHash } from 'crypto';

export interface StorageResult {
  success: boolean;
  contentId?: string;
  isDuplicate?: boolean;
  duplicateId?: string;
  error?: string;
}

export interface RecommendationOptions {
  contentId: string;
  limit?: number;
  minSimilarity?: number;
}

export class ContentStorageService {
  private prisma: PrismaClient;
  private contentRepo: ContentRepository;
  private contentTagger: ContentTagger;
  private deduplicator: Deduplicator;
  private embeddingService: EmbeddingService;

  constructor() {
    this.prisma = new PrismaClient();
    this.contentRepo = new ContentRepository(this.prisma);
    this.contentTagger = new ContentTagger();
    this.deduplicator = new Deduplicator();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Store normalized content with all processing
   */
  async storeContent(content: NormalizedContent): Promise<StorageResult> {
    try {
      // 1. Generate content hash for exact duplicate detection
      const contentHash = this.generateContentHash(content);
      
      // 2. Check for exact duplicates
      const exists = await this.contentRepo.contentExists(contentHash);
      if (exists) {
        return {
          success: true,
          isDuplicate: true,
          duplicateId: contentHash,
        };
      }
      
      // 3. Generate embedding for similarity search
      const embedding = await this.embeddingService.generateEmbedding(content);
      
      // 4. Check for near duplicates
      const nearDuplicate = await this.checkNearDuplicate(content, embedding);
      if (nearDuplicate) {
        return {
          success: true,
          isDuplicate: true,
          duplicateId: nearDuplicate,
        };
      }
      
      // 5. Tag the content
      const tagResult = await this.contentTagger.tagContent(content);
      
      // 6. Store in database
      const stored = await this.contentRepo.storeContent(
        content,
        tagResult,
        embedding,
        contentHash
      );
      
      // 7. The deduplicator already indexes content during checkAndStoreDuplicate
      // No need to manually index again
      
      return {
        success: true,
        contentId: (stored as any).id,
      };
    } catch (error) {
      console.error('Error storing content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store multiple content items in batch
   */
  async storeContentBatch(contents: NormalizedContent[]): Promise<StorageResult[]> {
    const results: StorageResult[] = [];
    
    // Process in smaller batches to avoid overloading
    const batchSize = 10;
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(content => this.storeContent(content))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Search content by various criteria
   */
  async searchContent(options: ContentSearchOptions): Promise<ContentWithTags[]> {
    return await this.contentRepo.searchContent(options);
  }

  /**
   * Get content recommendations based on similarity
   */
  async getRecommendations(options: RecommendationOptions): Promise<ContentWithTags[]> {
    // Get the source content
    const sourceContent = await this.contentRepo.getContentById(options.contentId);
    if (!sourceContent) {
      throw new Error('Content not found');
    }
    
    // ProcessedContent includes embedding as a property
    const processedContent = sourceContent as any;
    
    // Find similar content using vector similarity
    const similar = await this.contentRepo.findSimilar({
      embedding: processedContent.embedding,
      threshold: options.minSimilarity || 0.7,
      limit: options.limit || 10,
      excludeIds: [options.contentId],
    });
    
    return similar as ContentWithTags[];
  }

  /**
   * Update content tags based on feedback
   */
  async updateContentTags(contentId: string, feedback?: any): Promise<void> {
    const content = await this.contentRepo.getContentById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    
    // ProcessedContent stores the original content as a JSON field
    const processedContent = content as any;
    
    // Retag the content
    const newTags = await this.contentTagger.tagContent(processedContent.content as NormalizedContent);
    
    // Update in database
    await this.contentRepo.updateTags(contentId, newTags);
    
    // Add feedback if provided
    if (feedback) {
      await this.contentRepo.addFeedback(contentId, 'tag_update', feedback);
    }
  }

  /**
   * Add user feedback for content
   */
  async addFeedback(
    contentId: string,
    feedbackType: string,
    value: any,
    userId?: string
  ): Promise<void> {
    await this.contentRepo.addFeedback(contentId, feedbackType, value, userId);
  }

  /**
   * Get content analytics
   */
  async getAnalytics(date?: Date): Promise<any> {
    return await this.contentRepo.getAnalytics(date);
  }

  /**
   * Upload content file to Supabase Storage
   */
  async uploadContentFile(
    file: Buffer | Blob,
    filename: string,
    contentType: string
  ): Promise<string> {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from('content-documents')
      .upload(`documents/${Date.now()}-${filename}`, file, {
        contentType,
        cacheControl: '3600',
      });
    
    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('content-documents')
      .getPublicUrl(data.path);
    
    return publicUrl.publicUrl;
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(content: NormalizedContent): string {
    const text = this.extractDeduplicationText(content);
    return createHash('sha256').update(text).digest('hex');
  }

  /**
   * Extract text for deduplication
   */
  private extractDeduplicationText(content: NormalizedContent): string {
    const parts: string[] = [];
    
    if ('title' in content && content.title) parts.push(content.title);
    if ('name' in content && content.name) parts.push(content.name);
    if ('description' in content && content.description) parts.push(content.description);
    
    return parts.join(' ').toLowerCase().trim();
  }

  /**
   * Check for near duplicates using embeddings
   */
  private async checkNearDuplicate(
    content: NormalizedContent,
    embedding: number[]
  ): Promise<string | null> {
    const similar = await this.contentRepo.findSimilar({
      embedding,
      threshold: 0.95, // Very high similarity for duplicates
      limit: 1,
    });
    
    if (similar.length > 0) {
      // The ProcessedContent stores the original content as JSON
      const processedContent = similar[0] as any;
      
      // Use the deduplicator's checkAndStoreDuplicate method to verify
      const contentWithId = { ...content, id: 'temp-id' };
      const deduplicationResult = this.deduplicator.checkAndStoreDuplicate(contentWithId, 0.9);
      
      if (deduplicationResult.isDuplicate && deduplicationResult.similarityScore && deduplicationResult.similarityScore >= 0.9) {
        return similar[0].id;
      }
    }
    
    return null;
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 