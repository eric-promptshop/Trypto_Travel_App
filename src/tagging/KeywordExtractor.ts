/**
 * Keyword extraction for travel content tagging
 */

export interface ExtractedKeyword {
  term: string;
  frequency: number;
  relevance: number;
}

export class KeywordExtractor {
  private stopWords: Set<string>;
  
  constructor() {
    // Common English stop words
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'the', 'this', 'these', 'they',
      'but', 'if', 'or', 'because', 'as', 'what', 'which', 'this',
      'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'would',
      'i', 'you', 'he', 'she', 'we', 'they', 'them', 'their', 'our'
    ]);
  }

  /**
   * Extract keywords from text
   */
  async extract(text: string): Promise<string[]> {
    if (!text || text.trim() === '') {
      return [];
    }

    // Clean and tokenize
    const tokens = this.tokenize(text);
    
    // Remove stop words
    const filtered = tokens.filter(token => !this.stopWords.has(token.toLowerCase()));
    
    // Calculate term frequency
    const termFrequency = this.calculateTermFrequency(filtered);
    
    // Extract n-grams
    const bigrams = this.extractBigrams(filtered);
    const trigrams = this.extractTrigrams(filtered);
    
    // Combine and rank keywords
    const keywords = this.rankKeywords(termFrequency, bigrams, trigrams);
    
    // Return top keywords
    return keywords.slice(0, 20).map(k => k.term);
  }

  /**
   * Extract keywords with detailed information
   */
  async extractWithDetails(text: string): Promise<ExtractedKeyword[]> {
    if (!text || text.trim() === '') {
      return [];
    }

    const tokens = this.tokenize(text);
    const filtered = tokens.filter(token => !this.stopWords.has(token.toLowerCase()));
    const termFrequency = this.calculateTermFrequency(filtered);
    const bigrams = this.extractBigrams(filtered);
    const trigrams = this.extractTrigrams(filtered);
    
    return this.rankKeywords(termFrequency, bigrams, trigrams).slice(0, 30);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    // Remove punctuation and split by whitespace
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2); // Filter out very short words
  }

  /**
   * Calculate term frequency
   */
  private calculateTermFrequency(tokens: string[]): Map<string, number> {
    const frequency = new Map<string, number>();
    
    for (const token of tokens) {
      frequency.set(token, (frequency.get(token) || 0) + 1);
    }
    
    return frequency;
  }

  /**
   * Extract bigrams (two-word phrases)
   */
  private extractBigrams(tokens: string[]): Map<string, number> {
    const bigrams = new Map<string, number>();
    
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    
    return bigrams;
  }

  /**
   * Extract trigrams (three-word phrases)
   */
  private extractTrigrams(tokens: string[]): Map<string, number> {
    const trigrams = new Map<string, number>();
    
    for (let i = 0; i < tokens.length - 2; i++) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1);
    }
    
    return trigrams;
  }

  /**
   * Rank keywords by relevance
   */
  private rankKeywords(
    termFrequency: Map<string, number>,
    bigrams: Map<string, number>,
    trigrams: Map<string, number>
  ): ExtractedKeyword[] {
    const keywords: ExtractedKeyword[] = [];
    
    // Add single terms
    termFrequency.forEach((freq, term) => {
      keywords.push({
        term,
        frequency: freq,
        relevance: freq * 1.0 // Base relevance
      });
    });
    
    // Add bigrams with higher relevance
    bigrams.forEach((freq, bigram) => {
      if (freq > 1) { // Only include bigrams that appear more than once
        keywords.push({
          term: bigram,
          frequency: freq,
          relevance: freq * 1.5 // Higher relevance for phrases
        });
      }
    });
    
    // Add trigrams with even higher relevance
    trigrams.forEach((freq, trigram) => {
      if (freq > 1) {
        keywords.push({
          term: trigram,
          frequency: freq,
          relevance: freq * 2.0 // Highest relevance for longer phrases
        });
      }
    });
    
    // Sort by relevance
    return keywords.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Add custom stop words
   */
  addStopWords(words: string[]): void {
    words.forEach(word => this.stopWords.add(word.toLowerCase()));
  }

  /**
   * Remove stop words
   */
  removeStopWords(words: string[]): void {
    words.forEach(word => this.stopWords.delete(word.toLowerCase()));
  }

  /**
   * Extract travel-specific keywords
   */
  extractTravelKeywords(text: string): string[] {
    const travelPatterns = [
      /\b(hotel|hostel|resort|motel|lodge|b&b|guesthouse)\b/gi,
      /\b(flight|airline|airport|terminal)\b/gi,
      /\b(tour|excursion|trip|journey|travel|vacation|holiday)\b/gi,
      /\b(beach|mountain|city|island|desert|forest|lake|river)\b/gi,
      /\b(restaurant|cafe|bar|dining|cuisine|food)\b/gi,
      /\b(museum|gallery|monument|landmark|attraction)\b/gi,
      /\b(activity|adventure|experience|sightseeing)\b/gi,
      /\b(transport|transportation|bus|train|taxi|car|bike)\b/gi
    ];
    
    const keywords = new Set<string>();
    
    travelPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase()));
      }
    });
    
    return Array.from(keywords);
  }
} 