import { NormalizedContent } from '../normalizers/types';

export interface ExtractedEntities {
  locations: string[];
  attractions: string[];
  organizations: string[];
  dates: string[];
  people: string[];
}

export class EntityTagger {
  private locationPatterns: RegExp[];
  private attractionPatterns: RegExp[];
  private organizationPatterns: RegExp[];
  
  constructor() {
    this.locationPatterns = [];
    this.attractionPatterns = [];
    this.organizationPatterns = [];
    this.initializePatterns();
  }

  /**
   * Extract entities from text
   */
  async extractEntities(text: string, content?: NormalizedContent): Promise<ExtractedEntities> {
    const entities: ExtractedEntities = {
      locations: [],
      attractions: [],
      organizations: [],
      dates: [],
      people: []
    };

    // Extract from structured content if available
    if (content) {
      this.extractFromStructuredContent(content, entities);
    }

    // Extract from text using patterns
    entities.locations.push(...this.extractLocations(text));
    entities.attractions.push(...this.extractAttractions(text));
    entities.organizations.push(...this.extractOrganizations(text));
    entities.dates.push(...this.extractDates(text));

    // Deduplicate
    return this.deduplicateEntities(entities);
  }

  /**
   * Initialize regex patterns for entity extraction
   */
  private initializePatterns(): void {
    // Location patterns (cities, countries, regions)
    this.locationPatterns = [
      // Capital cities
      /\b(Paris|London|Tokyo|New York|Rome|Berlin|Madrid|Amsterdam|Vienna|Prague)\b/gi,
      // Countries
      /\b(France|Italy|Spain|Germany|United Kingdom|UK|USA|United States|Japan|China|India)\b/gi,
      // Regions
      /\b(Europe|Asia|Africa|North America|South America|Mediterranean|Caribbean|Scandinavia)\b/gi,
      // Geographic features
      /\b(Mount|Mt\.|Lake|River|Bay|Ocean|Sea|Island|Peninsula|Valley|Desert)\s+[A-Z][a-z]+/g
    ];

    // Attraction patterns
    this.attractionPatterns = [
      // Famous landmarks
      /\b(Eiffel Tower|Colosseum|Statue of Liberty|Big Ben|Sydney Opera House|Taj Mahal)\b/gi,
      // Museums
      /\b(Museum|Gallery|Exhibition|Center|Centre)\s+(of|for)?\s*[A-Z][a-z]+/g,
      // Parks and natural sites
      /\b(National Park|State Park|Nature Reserve|Wildlife Sanctuary|Botanical Garden)\b/gi,
      // Religious sites
      /\b(Cathedral|Church|Temple|Mosque|Shrine|Abbey|Monastery)\s+(of|de)?\s*[A-Z][a-z]*/g
    ];

    // Organization patterns
    this.organizationPatterns = [
      // Airlines
      /\b(Airlines|Airways|Air)\s+[A-Z][a-z]+/g,
      // Hotels
      /\b(Hotel|Resort|Inn|Lodge)\s+[A-Z][a-z]+/g,
      // Tour companies
      /\b[A-Z][a-z]+\s+(Tours|Travel|Adventures|Expeditions)\b/g,
      // Transportation companies
      /\b[A-Z][a-z]+\s+(Railways|Rail|Bus|Coach|Cruise|Ferries)\b/g
    ];
  }

  /**
   * Extract from structured content fields
   */
  private extractFromStructuredContent(content: NormalizedContent, entities: ExtractedEntities): void {
    // Extract locations
    if ('country' in content) {
      const countryValue = (content as any).country;
      if (typeof countryValue === 'string') {
        entities.locations.push(countryValue);
      }
    }
    if ('region' in content) {
      const regionValue = (content as any).region;
      if (typeof regionValue === 'string') {
        entities.locations.push(regionValue);
      }
    }
    if ('city' in content) {
      const cityValue = (content as any).city;
      if (typeof cityValue === 'string') {
        entities.locations.push(cityValue);
      }
    }
    if ('locationName' in content) {
      const locationNameValue = (content as any).locationName;
      if (typeof locationNameValue === 'string') {
        entities.locations.push(locationNameValue);
      }
    }

    // Extract organization names
    if ('provider' in content) {
      const providerValue = (content as any).provider;
      if (typeof providerValue === 'string') {
        entities.organizations.push(providerValue);
      }
    }
    if ('airline' in content) {
      const airlineValue = (content as any).airline;
      if (typeof airlineValue === 'string') {
        entities.organizations.push(airlineValue);
      }
    }
  }

  /**
   * Extract locations from text
   */
  private extractLocations(text: string): string[] {
    const locations = new Set<string>();

    this.locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => locations.add(this.cleanEntity(match)));
      }
    });

    // Also extract capitalized sequences that might be place names
    const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
    const capitalizedMatches = text.match(capitalizedPattern);
    if (capitalizedMatches) {
      capitalizedMatches.forEach(match => {
        // Check if it looks like a place name
        if (this.looksLikeLocation(match)) {
          locations.add(match);
        }
      });
    }

    return Array.from(locations);
  }

  /**
   * Extract attractions from text
   */
  private extractAttractions(text: string): string[] {
    const attractions = new Set<string>();

    this.attractionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => attractions.add(this.cleanEntity(match)));
      }
    });

    return Array.from(attractions);
  }

  /**
   * Extract organizations from text
   */
  private extractOrganizations(text: string): string[] {
    const organizations = new Set<string>();

    this.organizationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => organizations.add(this.cleanEntity(match)));
      }
    });

    return Array.from(organizations);
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): string[] {
    const dates = new Set<string>();
    
    // Date patterns
    const datePatterns = [
      // Month DD, YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      // DD Month YYYY
      /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
      // MM/DD/YYYY or DD/MM/YYYY
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      // YYYY-MM-DD
      /\b\d{4}-\d{2}-\d{2}\b/g,
      // Relative dates
      /\b(today|tomorrow|yesterday|next week|last week|this month|next month)\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => dates.add(match));
      }
    });

    return Array.from(dates);
  }

  /**
   * Check if a capitalized phrase looks like a location
   */
  private looksLikeLocation(text: string): boolean {
    const locationKeywords = ['City', 'Town', 'Village', 'Port', 'Bay', 'Beach', 'Park'];
    const prepositions = ['in', 'at', 'near', 'from', 'to'];
    
    // Check if it contains location keywords
    if (locationKeywords.some(keyword => text.includes(keyword))) {
      return true;
    }

    // Check if it appears after location prepositions
    const lowerText = text.toLowerCase();
    for (const prep of prepositions) {
      const pattern = new RegExp(`\\b${prep}\\s+${text}\\b`, 'i');
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clean extracted entity
   */
  private cleanEntity(entity: string): string {
    return entity
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^(the|a|an)\s+/i, '');
  }

  /**
   * Deduplicate entities
   */
  private deduplicateEntities(entities: ExtractedEntities): ExtractedEntities {
    return {
      locations: [...new Set(entities.locations)],
      attractions: [...new Set(entities.attractions)],
      organizations: [...new Set(entities.organizations)],
      dates: [...new Set(entities.dates)],
      people: [...new Set(entities.people)]
    };
  }

  /**
   * Get geographic hierarchy for a location
   */
  async getLocationHierarchy(location: string): Promise<string[]> {
    // This would integrate with a geocoding service
    // For now, returning a simple hierarchy
    const hierarchyMap: Record<string, string[]> = {
      'Paris': ['France', 'Europe'],
      'Tokyo': ['Japan', 'Asia'],
      'New York': ['United States', 'North America'],
      'London': ['United Kingdom', 'Europe'],
      'Sydney': ['Australia', 'Oceania']
    };

    return hierarchyMap[location] || [];
  }
} 