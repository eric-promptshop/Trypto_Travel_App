import { NormalizedContentSet } from '../schema';

export class Validator {
  validateContentSet(contentSet: NormalizedContentSet): string[] {
    const errors: string[] = [];
    // Example checks
    if (!contentSet.destinations.length && !contentSet.activities.length && !contentSet.accommodations.length) {
      errors.push('No content found');
    }
    for (const dest of contentSet.destinations) {
      if (!dest.name) errors.push('Destination missing name');
      if (!dest.country) errors.push('Destination missing country');
    }
    for (const act of contentSet.activities) {
      if (!act.name) errors.push('Activity missing name');
    }
    for (const acc of contentSet.accommodations) {
      if (!acc.name) errors.push('Accommodation missing name');
    }
    return errors;
  }
} 