import crypto from 'crypto';
import { NormalizedContent } from './types';

export interface DeduplicationResult {
  isDuplicate: boolean;
  similarityScore?: number;
  matchedContentId?: string;
}

export class Deduplicator {
  private contentHashes: Map<string, string> = new Map(); // hash -> contentId
  private contentFingerprints: Map<string, Set<number>> = new Map(); // contentId -> MinHash fingerprint
  private shingleSize: number = 3; // Size of word shingles for MinHash
  private numHashes: number = 128; // Number of hash functions for MinHash

  /**
   * Generate a SHA-256 hash for exact duplicate detection
   */
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
  }

  /**
   * Generate shingles (n-grams) from text
   */
  private generateShingles(text: string, n: number = 3): Set<string> {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const shingles = new Set<string>();
    
    for (let i = 0; i <= words.length - n; i++) {
      shingles.add(words.slice(i, i + n).join(' '));
    }
    
    return shingles;
  }

  /**
   * Simple hash function for MinHash
   */
  private hashFunction(str: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate MinHash signature for a set of shingles
   */
  private generateMinHash(shingles: Set<string>): Set<number> {
    const signature = new Set<number>();
    
    for (let i = 0; i < this.numHashes; i++) {
      let minHash = Infinity;
      
      for (const shingle of shingles) {
        const hash = this.hashFunction(shingle, i);
        if (hash < minHash) {
          minHash = hash;
        }
      }
      
      signature.add(minHash);
    }
    
    return signature;
  }

  /**
   * Calculate Jaccard similarity between two MinHash signatures
   */
  private calculateJaccardSimilarity(sig1: Set<number>, sig2: Set<number>): number {
    let matches = 0;
    const sig1Array = Array.from(sig1);
    const sig2Array = Array.from(sig2);
    
    for (let i = 0; i < Math.min(sig1Array.length, sig2Array.length); i++) {
      if (sig1Array[i] === sig2Array[i]) {
        matches++;
      }
    }
    
    return matches / this.numHashes;
  }

  /**
   * Check if content is a duplicate and store it if not
   */
  public checkAndStoreDuplicate(
    content: NormalizedContent,
    similarityThreshold: number = 0.8
  ): DeduplicationResult {
    const contentText = this.extractContentText(content);
    
    // Step 1: Check for exact duplicates using hash
    const contentHash = this.generateHash(contentText);
    if (this.contentHashes.has(contentHash)) {
      const matchedId = this.contentHashes.get(contentHash);
      if (matchedId) {
        return {
          isDuplicate: true,
          similarityScore: 1.0,
          matchedContentId: matchedId
        };
      }
    }
    
    // Step 2: Check for near-duplicates using MinHash
    const shingles = this.generateShingles(contentText, this.shingleSize);
    const minHashSignature = this.generateMinHash(shingles);
    
    let bestMatch: { id: string; score: number } | null = null;
    
    for (const [existingId, existingSignature] of this.contentFingerprints) {
      const similarity = this.calculateJaccardSimilarity(minHashSignature, existingSignature);
      
      if (similarity >= similarityThreshold) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = { id: existingId, score: similarity };
        }
      }
    }
    
    if (bestMatch) {
      return {
        isDuplicate: true,
        similarityScore: bestMatch.score,
        matchedContentId: bestMatch.id
      };
    }
    
    // Not a duplicate - store it
    this.contentHashes.set(contentHash, content.id);
    this.contentFingerprints.set(content.id, minHashSignature);
    
    return {
      isDuplicate: false
    };
  }

  /**
   * Extract relevant text from normalized content for deduplication
   */
  private extractContentText(content: NormalizedContent): string {
    const textParts: string[] = [];
    
    // Add common fields
    if ('name' in content && content.name) {
      textParts.push(content.name);
    }
    if ('title' in content && content.title) {
      textParts.push(content.title);
    }
    if ('description' in content && content.description) {
      textParts.push(content.description);
    }
    if ('text' in content && content.text) {
      textParts.push(content.text);
    }
    
    // Add type-specific fields
    switch (content.type) {
      case 'destination':
        if (content.country) textParts.push(content.country);
        if (content.region) textParts.push(content.region);
        break;
        
      case 'activity':
        if (content.activityType) textParts.push(content.activityType);
        if (content.locationName) textParts.push(content.locationName);
        break;
        
      case 'accommodation':
        if (content.accommodationType) textParts.push(content.accommodationType);
        if (content.address?.city) textParts.push(content.address.city);
        break;
        
      case 'transportation':
        if (content.mode) textParts.push(content.mode);
        if (content.provider) textParts.push(content.provider);
        if (content.departureLocation?.name) textParts.push(content.departureLocation.name);
        if (content.arrivalLocation?.name) textParts.push(content.arrivalLocation.name);
        break;
        
      case 'itinerary':
        if (content.dailyPlans) {
          content.dailyPlans.forEach(day => {
            if (day.title) textParts.push(day.title);
            if (day.description) textParts.push(day.description);
          });
        }
        break;
    }
    
    return textParts.join(' ');
  }

  /**
   * Remove a content item from the deduplication index
   */
  public removeContent(contentId: string): void {
    // Find and remove the hash
    for (const [hash, id] of this.contentHashes) {
      if (id === contentId) {
        this.contentHashes.delete(hash);
        break;
      }
    }
    
    // Remove the fingerprint
    this.contentFingerprints.delete(contentId);
  }

  /**
   * Clear all stored deduplication data
   */
  public clear(): void {
    this.contentHashes.clear();
    this.contentFingerprints.clear();
  }

  /**
   * Get statistics about stored content
   */
  public getStats(): { totalContent: number; uniqueHashes: number } {
    return {
      totalContent: this.contentFingerprints.size,
      uniqueHashes: this.contentHashes.size
    };
  }
} 