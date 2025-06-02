import { PrismaClient, ContentType as PrismaContentType, ProcessedContent, ContentTag, Prisma } from '@prisma/client';
import { supabaseAdmin } from '../../../lib/supabase';
import { NormalizedContent } from '../../normalizers/types';
import { TagResult } from '../../tagging/ContentTagger';

export interface ContentSearchOptions {
  contentType?: PrismaContentType;
  categories?: string[];
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  limit?: number;
  offset?: number;
}

export interface SimilaritySearchOptions {
  embedding: number[];
  threshold?: number;
  limit?: number;
  excludeIds?: string[];
}

export interface ContentWithTags extends ProcessedContent {
  tags: ContentTag[];
}

export class ContentRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Store processed content with tags
   */
  async storeContent(
    content: NormalizedContent,
    tagResult: TagResult,
    embedding: number[],
    contentHash: string
  ): Promise<ContentWithTags> {
    const contentType = this.mapContentType(content.type);
    
    // Prepare the content data
    const contentData: Prisma.ProcessedContentCreateInput = {
      contentType,
      source: content.source,
      sourceType: content.originalContentType,
      extractionDate: new Date(content.extractionDate),
      title: this.extractTitle(content),
      description: this.extractDescription(content),
      content: content as any, // Store full normalized content as JSON
      embedding,
      confidence: tagResult.confidence.overall,
      primaryCategory: tagResult.primaryCategory,
      entities: tagResult.tags[0]?.entities || null,
      contentHash,
      metadata: this.extractMetadata(content),
    };

    // Create content and tags in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the processed content
      const processedContent = await tx.processedContent.create({
        data: contentData,
      });

      // Create tags
      const tagData: Prisma.ContentTagCreateManyInput[] = tagResult.tags.map(tag => ({
        contentId: processedContent.id,
        category: tag.category,
        subcategories: tag.subcategories,
        keywords: tag.keywords,
        confidence: tag.confidence,
      }));

      await tx.contentTag.createMany({
        data: tagData,
      });

      // Fetch and return with tags
      return await tx.processedContent.findUnique({
        where: { id: processedContent.id },
        include: { tags: true },
      }) as ContentWithTags;
    });
  }

  /**
   * Check if content already exists
   */
  async contentExists(contentHash: string): Promise<boolean> {
    const existing = await this.prisma.processedContent.findFirst({
      where: { contentHash },
      select: { id: true },
    });
    return !!existing;
  }

  /**
   * Find similar content using vector similarity
   */
  async findSimilar(options: SimilaritySearchOptions): Promise<ProcessedContent[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    // Use the custom function for vector similarity search
    const { data, error } = await supabaseAdmin.rpc('match_content_by_embedding', {
      query_embedding: options.embedding,
      match_threshold: options.threshold || 0.7,
      match_count: options.limit || 10,
    });

    if (error) {
      throw new Error(`Similarity search failed: ${error.message}`);
    }

    // Filter out excluded IDs if provided
    let results = data || [];
    if (options.excludeIds && options.excludeIds.length > 0) {
      results = results.filter((item: any) => !options.excludeIds?.includes(item.id));
    }

    // Fetch full content details
    const ids = results.map((r: any) => r.id);
    return await this.prisma.processedContent.findMany({
      where: { id: { in: ids } },
      include: { tags: true },
    });
  }

  /**
   * Search content by various criteria
   */
  async searchContent(options: ContentSearchOptions): Promise<ContentWithTags[]> {
    const where: Prisma.ProcessedContentWhereInput = {};

    if (options.contentType) {
      where.contentType = options.contentType;
    }

    if (options.categories && options.categories.length > 0) {
      where.primaryCategory = { in: options.categories };
    }

    if (options.tags && options.tags.length > 0) {
      where.tags = {
        some: {
          OR: [
            { category: { in: options.tags } },
            { keywords: { hasAny: options.tags } },
          ],
        },
      };
    }

    if (options.dateRange) {
      where.processedAt = {
        gte: options.dateRange.start,
        lte: options.dateRange.end,
      };
    }

    return await this.prisma.processedContent.findMany({
      where,
      include: { tags: true },
      take: options.limit || 50,
      skip: options.offset || 0,
      orderBy: { processedAt: 'desc' },
    });
  }

  /**
   * Get content by ID
   */
  async getContentById(id: string): Promise<ContentWithTags | null> {
    return await this.prisma.processedContent.findUnique({
      where: { id },
      include: { tags: true },
    });
  }

  /**
   * Update content tags
   */
  async updateTags(contentId: string, newTags: TagResult): Promise<ContentWithTags> {
    return await this.prisma.$transaction(async (tx) => {
      // Delete existing tags
      await tx.contentTag.deleteMany({
        where: { contentId },
      });

      // Create new tags
      const tagData: Prisma.ContentTagCreateManyInput[] = newTags.tags.map(tag => ({
        contentId,
        category: tag.category,
        subcategories: tag.subcategories,
        keywords: tag.keywords,
        confidence: tag.confidence,
      }));

      await tx.contentTag.createMany({
        data: tagData,
      });

      // Update primary category and confidence
      await tx.processedContent.update({
        where: { id: contentId },
        data: {
          primaryCategory: newTags.primaryCategory,
          confidence: newTags.confidence.overall,
          entities: newTags.tags[0]?.entities || null,
        },
      });

      // Return updated content
      return await tx.processedContent.findUnique({
        where: { id: contentId },
        include: { tags: true },
      }) as ContentWithTags;
    });
  }

  /**
   * Add content feedback
   */
  async addFeedback(
    contentId: string,
    feedbackType: string,
    value: any,
    userId?: string
  ): Promise<void> {
    await this.prisma.contentFeedback.create({
      data: {
        contentId,
        feedbackType,
        value,
        userId,
      },
    });
  }

  /**
   * Get content analytics
   */
  async getAnalytics(date?: Date): Promise<any> {
    const targetDate = date || new Date();
    return await this.prisma.contentAnalytics.findMany({
      where: {
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { contentType: 'asc' },
    });
  }

  /**
   * Helper: Map content type
   */
  private mapContentType(type: string): PrismaContentType {
    const mapping: Record<string, PrismaContentType> = {
      destination: PrismaContentType.DESTINATION,
      activity: PrismaContentType.ACTIVITY,
      accommodation: PrismaContentType.ACCOMMODATION,
      transportation: PrismaContentType.TRANSPORTATION,
      itinerary: PrismaContentType.ITINERARY,
      dining: PrismaContentType.DINING,
      shopping: PrismaContentType.SHOPPING,
      practical: PrismaContentType.PRACTICAL_INFO,
    };
    return mapping[type] || PrismaContentType.GENERIC;
  }

  /**
   * Helper: Extract title from content
   */
  private extractTitle(content: NormalizedContent): string {
    if ('name' in content && content.name) return content.name;
    if ('title' in content && content.title) return content.title;
    return 'Untitled Content';
  }

  /**
   * Helper: Extract description
   */
  private extractDescription(content: NormalizedContent): string | null {
    if ('description' in content && content.description) return content.description;
    if ('summary' in content && content.summary) return content.summary;
    return null;
  }

  /**
   * Helper: Extract metadata
   */
  private extractMetadata(content: NormalizedContent): any {
    const metadata: any = {};
    
    if ('location' in content) metadata.location = content.location;
    if ('price' in content) metadata.price = content.price;
    if ('duration' in content) metadata.duration = content.duration;
    if ('coordinates' in content) metadata.coordinates = content.coordinates;
    
    return Object.keys(metadata).length > 0 ? metadata : null;
  }
} 