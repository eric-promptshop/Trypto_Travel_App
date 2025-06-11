import { OpenAI } from 'openai';
import { NormalizedContent } from '../../normalizers/types';
import { TFIDFVectorizer } from './TFIDFVectorizer';

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private tfidfVectorizer: TFIDFVectorizer;
  private useOpenAI: boolean = false;

  constructor() {
    // Initialize TF-IDF as fallback
    this.tfidfVectorizer = new TFIDFVectorizer();
    
    // Check if OpenAI is configured
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.useOpenAI = true;
    }
  }

  /**
   * Generate embedding for content
   */
  async generateEmbedding(
    content: NormalizedContent,
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    const text = this.extractTextForEmbedding(content);
    
    if (this.useOpenAI && this.openai) {
      try {
        return await this.generateOpenAIEmbedding(text, options);
      } catch (error) {
        console.warn('OpenAI embedding failed, falling back to TF-IDF:', error);
      }
    }
    
    // Fallback to TF-IDF
    return this.generateTFIDFEmbedding(text);
  }

  /**
   * Generate embeddings for multiple content items
   */
  async generateBatchEmbeddings(
    contents: NormalizedContent[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    const texts = contents.map(content => this.extractTextForEmbedding(content));
    
    if (this.useOpenAI && this.openai) {
      try {
        // OpenAI supports batch embeddings
        return await this.generateOpenAIBatchEmbeddings(texts, options);
      } catch (error) {
        console.warn('OpenAI batch embedding failed, falling back to TF-IDF:', error);
      }
    }
    
    // Fallback to TF-IDF
    return texts.map(text => this.generateTFIDFEmbedding(text));
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }
    
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Extract text from content for embedding
   */
  private extractTextForEmbedding(content: NormalizedContent): string {
    const textParts: string[] = [];
    
    // Common fields with priority
    if ('title' in content && content.title) {
      textParts.push(content.title);
    }
    if ('name' in content && content.name) {
      textParts.push(content.name);
    }
    if ('description' in content && content.description) {
      textParts.push(content.description);
    }
    
    // Type-specific important fields
    if (content.type === 'destination' && 'country' in content) {
      const dest = content as any;
      if (dest.country) textParts.push(dest.country);
      if (dest.region) textParts.push(dest.region);
    }
    
    if (content.type === 'activity' && 'activityType' in content) {
      const activity = content as any;
      if (activity.activityType) textParts.push(activity.activityType);
      if (activity.locationName) textParts.push(activity.locationName);
    }
    
    if (content.type === 'accommodation' && 'accommodationType' in content) {
      const accommodation = content as any;
      if (accommodation.accommodationType) textParts.push(accommodation.accommodationType);
      if (accommodation.location) textParts.push(accommodation.location);
    }
    
    return textParts.join('. ');
  }

  /**
   * Generate OpenAI embedding
   */
  private async generateOpenAIEmbedding(
    text: string,
    options: EmbeddingOptions
  ): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    const response = await this.openai.embeddings.create({
      model: options.model || 'text-embedding-ada-002',
      input: text,
    });
    
    return response.data[0].embedding;
  }

  /**
   * Generate OpenAI batch embeddings
   */
  private async generateOpenAIBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions
  ): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    // OpenAI has a limit, so batch if necessary
    const batchSize = 100;
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.openai.embeddings.create({
        model: options.model || 'text-embedding-ada-002',
        input: batch,
      });
      
      embeddings.push(...response.data.map(item => item.embedding));
    }
    
    return embeddings;
  }

  /**
   * Generate TF-IDF embedding as fallback
   */
  private generateTFIDFEmbedding(text: string): number[] {
    // This returns a fixed-size embedding
    return this.tfidfVectorizer.transform(text);
  }

  /**
   * Get embedding dimension
   */
  getEmbeddingDimension(): number {
    if (this.useOpenAI) {
      return 1536; // OpenAI ada-002 dimension
    }
    return this.tfidfVectorizer.getDimension();
  }
} 