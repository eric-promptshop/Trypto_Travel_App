import { NormalizedContent, Address, Coordinates } from './types';

// Placeholder for a more sophisticated gazetteer service or library
interface Gazetteer {
  isLocation(term: string): boolean;
  isActivityType(term: string): boolean;
  isAmenity(term: string): boolean;
  // Add more specific lookups as needed
}

// Basic Gazetteer implementation (replace with a real one)
const basicGazetteer: Gazetteer = {
  isLocation: (term: string) => [
    'paris', 'london', 'new york', 'tokyo', 'rome', 'barcelona', // Cities
    'france', 'united kingdom', 'united states', 'japan', 'italy', 'spain', // Countries
    'eiffel tower', 'louvre museum', 'colosseum', 'statue of liberty' // Landmarks
  ].includes(term.toLowerCase()),
  isActivityType: (term: string) => [
    'museum', 'hiking', 'tour', 'restaurant', 'sightseeing', 'shopping', 'show', 'concert'
  ].includes(term.toLowerCase()),
  isAmenity: (term: string) => [
    'wifi', 'pool', 'parking', 'gym', 'breakfast included', 'air conditioning'
  ].includes(term.toLowerCase()),
};

export class EntityRecognizer {
  private gazetteer: Gazetteer;

  constructor(gazetteer: Gazetteer = basicGazetteer) {
    this.gazetteer = gazetteer;
    // In a real scenario, you might load NLP models here or connect to an NER service.
    // For now, we'll rely on simpler regex and gazetteer lookups.
  }

  public extractEntities(text: string, context?: Partial<NormalizedContent>): Partial<NormalizedContent> {
    const entities: Partial<NormalizedContent> = {};

    // Simple example: Extract potential location names
    // This is highly simplistic and would need a proper NER library for real-world use.
    const potentialLocations = this.extractPotentialLocations(text);
    if (potentialLocations.length > 0 && (!context || context.type === 'destination' || context.type === 'activity')) {
      // For simplicity, assume the first one is the primary name if no name context
      if (context?.type === 'destination') (entities as any).name = potentialLocations[0];
      // Could also populate address fields if more context is available
    }

    // Example: Extract activity types (very basic)
    if (context?.type === 'activity') {
      const activityType = this.extractPotentialActivityType(text);
      if (activityType) {
        (entities as any).activityType = activityType;
      }
    }
    
    // Add more sophisticated entity extraction logic here using NLP libraries,
    // regex, and the gazetteer for different entity types (addresses, coordinates, prices etc.).

    return entities;
  }

  private extractPotentialLocations(text: string): string[] {
    // Super simple regex for capitalized words as potential locations (very naive)
    const words = text.split(/\s+/);
    const locations: string[] = [];
    words.forEach(word => {
      if (word && word.length > 0 && /[A-Z]/.test(word[0])) {
        const cleanedWord = String(word.replace(/[^a-zA-Z]/g, ''));
        if (cleanedWord.length > 0 && this.gazetteer.isLocation(cleanedWord)) {
          const locationToAdd = String(word.replace(/[^a-zA-Z\s]/g, ''));
          if (locationToAdd.length > 0) {
            locations.push(locationToAdd);
          }
        }
      }
    });
    return locations;
  }

  private extractPotentialActivityType(text: string): string | undefined {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word) {
        const cleanedWord = String(word.replace(/[^a-z]/g, ''));
        if (cleanedWord.length > 0 && this.gazetteer.isActivityType(cleanedWord)) {
          return cleanedWord;
        }
      }
    }
    return undefined;
  }

  public extractAddress(text: string): Partial<Address> {
    // Placeholder for address parsing logic. 
    // Use libraries like `address-parser` or regex for specific countries.
    return {};
  }

  public extractCoordinates(text: string): Partial<Coordinates> {
    // Placeholder for coordinate parsing (e.g., DD, DMS formats)
    // Regex example: /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/
    return {};
  }

  // Add more methods for specific entity types as needed
} 