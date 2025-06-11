import { ContentTag } from './ContentTagger';
import { NormalizedContent } from '../normalizers/types';

/**
 * Calculate confidence scores for content tags
 */
export class ConfidenceScorer {
  /**
   * Calculate confidence score for a tag
   */
  calculateConfidence(tag: ContentTag, content: NormalizedContent): number {
    let score = 0;
    const factors: number[] = [];

    // Factor 1: Keyword match strength (0-0.3)
    factors.push(this.calculateKeywordMatchScore(tag, content));

    // Factor 2: Entity match strength (0-0.2)
    factors.push(this.calculateEntityMatchScore(tag, content));

    // Factor 3: Category appropriateness (0-0.2)
    factors.push(this.calculateCategoryScore(tag, content));

    // Factor 4: Hierarchical depth (0-0.15)
    factors.push(this.calculateHierarchyScore(tag));

    // Factor 5: Attribute completeness (0-0.15)
    factors.push(this.calculateAttributeScore(tag));

    // Sum all factors
    score = factors.reduce((sum, factor) => sum + factor, 0);

    // Apply a base confidence if we have some matches
    if (score > 0) {
      score = Math.max(0.5, score); // Ensure minimum 0.5 confidence for any match
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatchScore(tag: ContentTag, content: NormalizedContent): number {
    if (!tag.keywords || tag.keywords.length === 0) {
      return 0;
    }

    const contentText = this.getContentText(content).toLowerCase();
    const matchedKeywords = tag.keywords.filter(keyword => 
      contentText.includes(keyword.toLowerCase())
    );

    const matchRatio = matchedKeywords.length / tag.keywords.length;
    return matchRatio * 0.3; // Max 0.3 points
  }

  /**
   * Calculate entity match score
   */
  private calculateEntityMatchScore(tag: ContentTag, content: NormalizedContent): number {
    let score = 0;

    // Check location entities
    if (tag.entities.locations && tag.entities.locations.length > 0) {
      if ('country' in content || 'region' in content || 'city' in content) {
        score += 0.1;
      }
    }

    // Check organization entities
    if (tag.entities.organizations && tag.entities.organizations.length > 0) {
      if ('provider' in content || 'airline' in content) {
        score += 0.1;
      }
    }

    return Math.min(0.2, score); // Max 0.2 points
  }

  /**
   * Calculate category appropriateness score
   */
  private calculateCategoryScore(tag: ContentTag, content: NormalizedContent): number {
    // Check if tag category matches content type
    const categoryMap: Record<string, string[]> = {
      'destination': ['destination'],
      'activity': ['activity'],
      'accommodation': ['accommodation'],
      'transportation': ['transportation'],
      'dining': ['restaurant', 'food'],
      'shopping': ['shopping', 'market'],
      'practical_info': ['info', 'tips', 'guide'],
      'itinerary': ['itinerary', 'plan']
    };

    const expectedTypes = categoryMap[tag.category] || [];
    if (expectedTypes.includes(content.type)) {
      return 0.2; // Full category match
    }

    // Partial credit for related types
    if (this.areRelatedTypes(tag.category, content.type)) {
      return 0.1;
    }

    return 0;
  }

  /**
   * Calculate hierarchy depth score
   */
  private calculateHierarchyScore(tag: ContentTag): number {
    const depth = tag.hierarchicalPath.length;
    
    // More specific tags (deeper hierarchy) get higher scores
    if (depth >= 3) return 0.15;
    if (depth === 2) return 0.10;
    if (depth === 1) return 0.05;
    
    return 0;
  }

  /**
   * Calculate attribute completeness score
   */
  private calculateAttributeScore(tag: ContentTag): number {
    let filledAttributes = 0;
    const totalPossibleAttributes = 5; // price, duration, difficulty, suitability, season

    if (tag.attributes.priceRange) filledAttributes++;
    if (tag.attributes.duration) filledAttributes++;
    if (tag.attributes.difficulty) filledAttributes++;
    if (tag.attributes.suitability && tag.attributes.suitability.length > 0) filledAttributes++;
    if (tag.attributes.season && tag.attributes.season.length > 0) filledAttributes++;

    const ratio = filledAttributes / totalPossibleAttributes;
    return ratio * 0.15; // Max 0.15 points
  }

  /**
   * Get content text for analysis
   */
  private getContentText(content: NormalizedContent): string {
    const textParts: string[] = [];

    // Add common text fields
    if ('name' in content && content.name) textParts.push(content.name);
    if ('title' in content && content.title) textParts.push(content.title);
    if ('description' in content && content.description) textParts.push(content.description);
    if ('text' in content && content.text) textParts.push(content.text);

    // Add type-specific fields
    if ('activityType' in content && content.activityType) {
      textParts.push(content.activityType);
    }
    if ('accommodationType' in content && content.accommodationType) {
      textParts.push(content.accommodationType);
    }

    return textParts.join(' ');
  }

  /**
   * Get content type boost multiplier
   */
  private getContentTypeBoost(contentType: string): number {
    // Some content types have higher confidence by default
    const boosts: Record<string, number> = {
      'destination': 1.1,
      'accommodation': 1.1,
      'activity': 1.0,
      'transportation': 1.0,
      'itinerary': 1.2, // Itineraries are usually well-structured
      'generic': 0.8
    };

    return boosts[contentType] || 1.0;
  }

  /**
   * Check if types are related
   */
  private areRelatedTypes(category: string, contentType: string): boolean {
    const relations: Record<string, string[]> = {
      'destination': ['generic', 'info'],
      'activity': ['tour', 'experience'],
      'accommodation': ['hotel', 'lodging'],
      'transportation': ['transfer', 'transport'],
      'dining': ['food', 'restaurant'],
      'practical_info': ['generic', 'guide', 'tips']
    };

    const relatedTypes = relations[category] || [];
    return relatedTypes.includes(contentType);
  }

  /**
   * Calculate confidence for a batch of tags
   */
  calculateBatchConfidence(tags: ContentTag[], content: NormalizedContent): ContentTag[] {
    return tags.map(tag => ({
      ...tag,
      confidence: this.calculateConfidence(tag, content)
    }));
  }

  /**
   * Get confidence explanation
   */
  explainConfidence(tag: ContentTag, content: NormalizedContent): {
    totalScore: number;
    breakdown: Record<string, number>;
    explanation: string;
  } {
    const breakdown = {
      keywordMatch: this.calculateKeywordMatchScore(tag, content),
      entityMatch: this.calculateEntityMatchScore(tag, content),
      categoryMatch: this.calculateCategoryScore(tag, content),
      hierarchyDepth: this.calculateHierarchyScore(tag),
      attributeCompleteness: this.calculateAttributeScore(tag)
    };

    const contentTypeBoost = this.getContentTypeBoost(content.type);
    const rawScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const totalScore = rawScore * contentTypeBoost;

    let explanation = `Base score: ${rawScore.toFixed(2)}, `;
    explanation += `Content type boost: ${contentTypeBoost}, `;
    explanation += `Final score: ${totalScore.toFixed(2)}`;

    return {
      totalScore,
      breakdown,
      explanation
    };
  }
} 