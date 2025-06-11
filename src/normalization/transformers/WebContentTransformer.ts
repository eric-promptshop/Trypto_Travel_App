import { NormalizedContentSet } from '../schema';
import { EntityRecognizer } from './EntityRecognizer';
import { DateNormalizer } from './DateNormalizer';
import { PriceNormalizer } from './PriceNormalizer';

export class WebContentTransformer {
  private entityRecognizer = new EntityRecognizer();
  private dateNormalizer = new DateNormalizer();
  private priceNormalizer = new PriceNormalizer();

  transform(raw: any): NormalizedContentSet {
    // Stub: implement real transformation logic
    // Example: extract destinations, activities, accommodations from raw web data
    return {
      destinations: [],
      activities: [],
      accommodations: [],
    };
  }
} 