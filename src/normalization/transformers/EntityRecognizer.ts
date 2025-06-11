export class EntityRecognizer {
  private locationGazetteer: Set<string>;
  private activityGazetteer: Set<string>;
  private accommodationGazetteer: Set<string>;

  constructor() {
    // Example gazetteers; in production, load from files or DB
    this.locationGazetteer = new Set(['paris', 'london', 'new york']);
    this.activityGazetteer = new Set(['museum', 'tour', 'hiking']);
    this.accommodationGazetteer = new Set(['hotel', 'hostel', 'bnb']);
  }

  extractLocations(text: string): string[] {
    // Simple gazetteer lookup (case-insensitive)
    const found: string[] = [];
    for (const loc of this.locationGazetteer) {
      if (text.toLowerCase().includes(loc)) found.push(loc);
    }
    return found;
  }

  extractActivities(text: string): string[] {
    const found: string[] = [];
    for (const act of this.activityGazetteer) {
      if (text.toLowerCase().includes(act)) found.push(act);
    }
    return found;
  }

  extractAccommodations(text: string): string[] {
    const found: string[] = [];
    for (const acc of this.accommodationGazetteer) {
      if (text.toLowerCase().includes(acc)) found.push(acc);
    }
    return found;
  }
} 