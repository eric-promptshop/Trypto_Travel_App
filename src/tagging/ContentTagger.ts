import { 
  NormalizedContent,
  NormalizedDestination,
  NormalizedActivity,
  NormalizedAccommodation,
  NormalizedTransportation
} from '../normalizers/types';
import { 
  TravelTaxonomy, 
  ContentCategory,
  TaxonomyNode
} from '../taxonomy/travel-taxonomy';
import { KeywordExtractor } from './KeywordExtractor';
import { EntityTagger } from './EntityTagger';
import { ConfidenceScorer } from './ConfidenceScorer';

export interface ContentTag {
  category: ContentCategory;
  subcategories: string[];
  keywords: string[];
  entities: {
    locations?: string[];
    attractions?: string[];
    organizations?: string[];
  };
  attributes: {
    priceRange?: string;
    duration?: string;
    difficulty?: string;
    suitability?: string[];
    season?: string[];
  };
  confidence: number;
  hierarchicalPath: string[];
}

export interface TagResult {
  primaryCategory: ContentCategory;
  tags: ContentTag[];
  suggestedTags: ContentTag[];
  confidence: {
    overall: number;
    byCategory: Record<string, number>;
  };
}

export class ContentTagger {
  private keywordExtractor: KeywordExtractor;
  private entityTagger: EntityTagger;
  private confidenceScorer: ConfidenceScorer;

  constructor() {
    this.keywordExtractor = new KeywordExtractor();
    this.entityTagger = new EntityTagger();
    this.confidenceScorer = new ConfidenceScorer();
  }

  /**
   * Tag normalized content with taxonomy categories
   */
  async tagContent(content: NormalizedContent): Promise<TagResult> {
    // Determine primary category based on content type
    const primaryCategory = this.getPrimaryCategory(content);
    
    // Extract text for analysis
    const textForAnalysis = this.extractTextForAnalysis(content);
    
    // Extract keywords
    const extractedKeywords = await this.keywordExtractor.extract(textForAnalysis);
    
    // Extract entities
    const entities = await this.entityTagger.extractEntities(textForAnalysis, content);
    
    // Apply rule-based tagging
    const ruleTags = this.applyRuleBasedTagging(content, extractedKeywords, entities);
    
    // Apply NLP-based tagging
    const nlpTags = await this.applyNLPTagging(textForAnalysis, extractedKeywords);
    
    // Merge and deduplicate tags
    const allTags = this.mergeTags(ruleTags, nlpTags);
    
    // Calculate confidence scores
    const taggedContent = this.calculateConfidenceScores(allTags, content);
    
    // Separate high-confidence tags from suggestions
    const { tags, suggestedTags } = this.separateByConfidence(taggedContent);
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(tags);

    return {
      primaryCategory,
      tags,
      suggestedTags,
      confidence: {
        overall: overallConfidence,
        byCategory: this.getConfidenceByCategory(tags)
      }
    };
  }

  /**
   * Batch tag multiple content items
   */
  async tagContentBatch(contents: NormalizedContent[]): Promise<TagResult[]> {
    const results = await Promise.all(
      contents.map(content => this.tagContent(content))
    );
    return results;
  }

  /**
   * Get primary category based on content type
   */
  private getPrimaryCategory(content: NormalizedContent): ContentCategory {
    switch (content.type) {
      case 'destination':
        return ContentCategory.DESTINATION;
      case 'activity':
        return ContentCategory.ACTIVITY;
      case 'accommodation':
        return ContentCategory.ACCOMMODATION;
      case 'transportation':
        return ContentCategory.TRANSPORTATION;
      case 'itinerary':
        return ContentCategory.ITINERARY;
      default:
        return ContentCategory.PRACTICAL_INFO;
    }
  }

  /**
   * Extract text for analysis from normalized content
   */
  private extractTextForAnalysis(content: NormalizedContent): string {
    const textParts: string[] = [];
    
    // Common fields
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
    
    // Type-specific fields
    if (content.type === 'activity') {
      const activity = content as NormalizedActivity;
      if (activity.activityType) textParts.push(activity.activityType);
      if (activity.locationName) textParts.push(activity.locationName);
    }
    
    if (content.type === 'accommodation') {
      const accommodation = content as NormalizedAccommodation;
      if (accommodation.accommodationType) textParts.push(accommodation.accommodationType);
      if (accommodation.amenities) textParts.push(...accommodation.amenities);
    }
    
    return textParts.join(' ');
  }

  /**
   * Apply rule-based tagging using taxonomy
   */
  private applyRuleBasedTagging(
    content: NormalizedContent, 
    keywords: string[], 
    entities: any
  ): ContentTag[] {
    const tags: ContentTag[] = [];
    const primaryCategory = this.getPrimaryCategory(content);
    
    // Apply category-specific rules
    switch (primaryCategory) {
      case ContentCategory.DESTINATION:
        tags.push(...this.tagDestination(content as NormalizedDestination, keywords));
        break;
      case ContentCategory.ACTIVITY:
        tags.push(...this.tagActivity(content as NormalizedActivity, keywords));
        break;
      case ContentCategory.ACCOMMODATION:
        tags.push(...this.tagAccommodation(content as NormalizedAccommodation, keywords));
        break;
    }
    
    // Add entity-based tags
    if (entities.locations && entities.locations.length > 0) {
      tags.forEach(tag => {
        tag.entities = { ...tag.entities, locations: entities.locations };
      });
    }
    
    return tags;
  }

  /**
   * Tag destination content
   */
  private tagDestination(dest: NormalizedDestination, keywords: string[]): ContentTag[] {
    const tags: ContentTag[] = [];
    const tag: ContentTag = {
      category: ContentCategory.DESTINATION,
      subcategories: [],
      keywords: [],
      entities: {},
      attributes: {},
      confidence: 0.7,
      hierarchicalPath: ['destination']
    };
    
    // Get content text for matching
    const contentText = this.extractTextForAnalysis(dest).toLowerCase();
    
    // Determine destination type
    const destTypes = TravelTaxonomy.destination.types;
    let typeMatched = false;
    let matchStrength = 0;
    
    for (const [typeKey, typeData] of Object.entries(destTypes)) {
      // Check if any of the type's keywords appear in the content
      const typeKeywords = typeData.keywords || [];
      let keywordMatches = 0;
      
      typeKeywords.forEach(keyword => {
        if (contentText.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      });
      
      const matchScore = typeKeywords.length > 0 ? keywordMatches / typeKeywords.length : 0;
      
      if (matchScore > 0) {
        tag.subcategories.push(typeKey);
        tag.hierarchicalPath.push(typeKey);
        tag.keywords.push(...typeKeywords);
        tag.confidence = 0.7 + (matchScore * 0.3);
        typeMatched = true;
        break;
      }
    }
    
    // If no type matched, try to infer from content
    if (!typeMatched) {
      if (contentText.includes('beach') || contentText.includes('coast') || contentText.includes('sea')) {
        tag.subcategories.push('beach');
        tag.hierarchicalPath.push('beach');
        tag.keywords = ['beach', 'coastal', 'seaside'];
        tag.confidence = 0.65;
      } else if (contentText.includes('city') || contentText.includes('urban') || contentText.includes('capital')) {
        tag.subcategories.push('city');
        tag.hierarchicalPath.push('city');
        tag.keywords = ['city', 'urban', 'metropolitan'];
        tag.confidence = 0.65;
      }
    }
    
    // Add geographic hierarchy
    if (dest.country) {
      tag.entities.locations = [dest.country];
      if (dest.region) {
        tag.entities.locations.push(dest.region);
      }
      tag.confidence = Math.min(1.0, tag.confidence + 0.1);
    }
    
    tags.push(tag);
    return tags;
  }

  /**
   * Tag activity content
   */
  private tagActivity(activity: NormalizedActivity, keywords: string[]): ContentTag[] {
    const tags: ContentTag[] = [];
    const activityTaxonomy = TravelTaxonomy.activity.categories;
    const contentText = this.extractTextForAnalysis(activity).toLowerCase();
    
    // Check each category
    for (const [catKey, catData] of Object.entries(activityTaxonomy)) {
      for (const [subKey, subData] of Object.entries(catData.subcategories)) {
        const subKeywords = subData.keywords || [];
        let keywordMatches = 0;
        
        subKeywords.forEach(keyword => {
          if (contentText.includes(keyword.toLowerCase())) {
            keywordMatches++;
          }
        });
        
        const matchScore = subKeywords.length > 0 ? keywordMatches / subKeywords.length : 0;
        
        if (matchScore > 0) {
          const tag: ContentTag = {
            category: ContentCategory.ACTIVITY,
            subcategories: [catKey, subKey],
            keywords: subKeywords,
            entities: {},
            attributes: {},
            confidence: 0.6 + (matchScore * 0.4), // Scale confidence based on match strength
            hierarchicalPath: ['activity', catKey, subKey]
          };
          
          // Add attributes
          if (activity.duration) {
            tag.attributes.duration = this.categorizeDuration(activity.duration);
          }
          if (activity.price) {
            tag.attributes.priceRange = this.categorizePriceRange(activity.price.amount);
          }
          
          tags.push(tag);
        }
      }
    }
    
    // If no tags found, create a generic activity tag
    if (tags.length === 0) {
      const genericTag: ContentTag = {
        category: ContentCategory.ACTIVITY,
        subcategories: [],
        keywords: keywords,
        entities: {},
        attributes: {},
        confidence: 0.5,
        hierarchicalPath: ['activity']
      };
      
      if (activity.duration) {
        genericTag.attributes.duration = this.categorizeDuration(activity.duration);
      }
      if (activity.price) {
        genericTag.attributes.priceRange = this.categorizePriceRange(activity.price.amount);
      }
      
      tags.push(genericTag);
    }
    
    return tags;
  }

  /**
   * Tag accommodation content
   */
  private tagAccommodation(accommodation: NormalizedAccommodation, keywords: string[]): ContentTag[] {
    const tags: ContentTag[] = [];
    const accommodationTaxonomy = TravelTaxonomy.accommodation.types;
    const contentText = this.extractTextForAnalysis(accommodation).toLowerCase();
    
    // Check accommodation types
    for (const [typeKey, typeData] of Object.entries(accommodationTaxonomy)) {
      for (const [subKey, subData] of Object.entries(typeData.subtypes)) {
        const subKeywords = subData.keywords || [];
        let keywordMatches = 0;
        
        subKeywords.forEach(keyword => {
          if (contentText.includes(keyword.toLowerCase())) {
            keywordMatches++;
          }
        });
        
        const matchScore = subKeywords.length > 0 ? keywordMatches / subKeywords.length : 0;
        const isTypeMatch = subKey === accommodation.accommodationType;
        
        if (matchScore > 0 || isTypeMatch) {
          const tag: ContentTag = {
            category: ContentCategory.ACCOMMODATION,
            subcategories: [typeKey, subKey],
            keywords: subKeywords,
            entities: {},
            attributes: {},
            confidence: isTypeMatch ? 0.9 : 0.6 + (matchScore * 0.4), // Higher confidence for exact type match
            hierarchicalPath: ['accommodation', typeKey, subKey]
          };
          
          // Add amenity tags
          if (accommodation.amenities) {
            const amenityCategories = this.categorizeAmenities(accommodation.amenities);
            tag.attributes.suitability = amenityCategories;
          }
          
          tags.push(tag);
        }
      }
    }
    
    // If no tags found, create a generic accommodation tag
    if (tags.length === 0) {
      const genericTag: ContentTag = {
        category: ContentCategory.ACCOMMODATION,
        subcategories: [],
        keywords: keywords,
        entities: {},
        attributes: {},
        confidence: 0.5,
        hierarchicalPath: ['accommodation']
      };
      
      if (accommodation.amenities) {
        const amenityCategories = this.categorizeAmenities(accommodation.amenities);
        genericTag.attributes.suitability = amenityCategories;
      }
      
      tags.push(genericTag);
    }
    
    return tags;
  }

  /**
   * Apply NLP-based tagging
   */
  private async applyNLPTagging(text: string, keywords: string[]): Promise<ContentTag[]> {
    // This would integrate with an NLP library like compromise or natural
    // For now, returning empty array as placeholder
    return [];
  }

  /**
   * Match keywords against a list
   */
  private matchKeywords(textKeywords: string[], taxonomyKeywords: string[]): boolean {
    const lowerTextKeywords = textKeywords.map(k => k.toLowerCase());
    return taxonomyKeywords.some(tk => 
      lowerTextKeywords.some(ltk => 
        ltk.includes(tk.toLowerCase()) || tk.toLowerCase().includes(ltk)
      )
    );
  }

  /**
   * Categorize duration
   */
  private categorizeDuration(duration: string): string {
    const durationLower = duration.toLowerCase();
    
    if (durationLower.includes('hour')) {
      const hours = parseFloat(durationLower.match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
      if (hours <= 2) return 'quick';
      if (hours <= 4) return 'half_day';
      if (hours <= 8) return 'full_day';
    }
    
    if (durationLower.includes('day')) {
      const days = parseInt(durationLower.match(/(\d+)/)?.[1] || '0');
      if (days >= 2) return 'multi_day';
    }
    
    return 'half_day';
  }

  /**
   * Categorize price range
   */
  private categorizePriceRange(amount: number): string {
    // This would need currency-specific logic
    // Using USD as example
    if (amount < 50) return 'budget';
    if (amount < 150) return 'moderate';
    if (amount < 500) return 'expensive';
    return 'luxury';
  }

  /**
   * Categorize amenities
   */
  private categorizeAmenities(amenities: string[]): string[] {
    const categories: string[] = [];
    const amenityTaxonomy = TravelTaxonomy.accommodation.amenities;
    
    if (!amenityTaxonomy) {
      return categories;
    }
    
    // Check business amenities
    const businessAmenities = amenityTaxonomy.business;
    if (businessAmenities && Array.isArray(businessAmenities)) {
      if (amenities.some(a => businessAmenities.includes(a.toLowerCase()))) {
        categories.push('business');
      }
    }
    
    // Check family amenities
    const familyAmenities = amenityTaxonomy.family;
    if (familyAmenities && Array.isArray(familyAmenities)) {
      if (amenities.some(a => familyAmenities.includes(a.toLowerCase()))) {
        categories.push('families');
      }
    }
    
    return categories;
  }

  /**
   * Merge and deduplicate tags
   */
  private mergeTags(ruleTags: ContentTag[], nlpTags: ContentTag[]): ContentTag[] {
    const merged = [...ruleTags];
    
    // Add NLP tags that don't duplicate rule tags
    for (const nlpTag of nlpTags) {
      const isDuplicate = merged.some(tag => 
        tag.category === nlpTag.category &&
        JSON.stringify(tag.subcategories) === JSON.stringify(nlpTag.subcategories)
      );
      
      if (!isDuplicate) {
        merged.push(nlpTag);
      }
    }
    
    return merged;
  }

  /**
   * Calculate confidence scores for tags
   */
  private calculateConfidenceScores(tags: ContentTag[], content: NormalizedContent): ContentTag[] {
    return tags.map(tag => ({
      ...tag,
      confidence: this.confidenceScorer.calculateConfidence(tag, content)
    }));
  }

  /**
   * Separate tags by confidence threshold
   */
  private separateByConfidence(tags: ContentTag[], threshold: number = 0.5): {
    tags: ContentTag[];
    suggestedTags: ContentTag[];
  } {
    const highConfidence = tags.filter(tag => tag.confidence >= threshold);
    const lowConfidence = tags.filter(tag => tag.confidence < threshold);
    
    return {
      tags: highConfidence,
      suggestedTags: lowConfidence
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(tags: ContentTag[]): number {
    if (tags.length === 0) return 0;
    
    const sum = tags.reduce((acc, tag) => acc + tag.confidence, 0);
    return sum / tags.length;
  }

  /**
   * Get confidence by category
   */
  private getConfidenceByCategory(tags: ContentTag[]): Record<string, number> {
    const byCategory: Record<string, number[]> = {};
    
    tags.forEach(tag => {
      if (!byCategory[tag.category]) {
        byCategory[tag.category] = [];
      }
      byCategory[tag.category].push(tag.confidence);
    });
    
    const result: Record<string, number> = {};
    for (const [category, confidences] of Object.entries(byCategory)) {
      result[category] = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
    
    return result;
  }
} 