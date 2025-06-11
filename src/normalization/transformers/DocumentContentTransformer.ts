import { NormalizedContentSet } from '../schema';
import { EntityRecognizer } from './EntityRecognizer';
import { DateNormalizer } from './DateNormalizer';
import { PriceNormalizer } from './PriceNormalizer';

export class DocumentContentTransformer {
  private entityRecognizer = new EntityRecognizer();
  private dateNormalizer = new DateNormalizer();
  private priceNormalizer = new PriceNormalizer();

  transform(parsedDoc: any): NormalizedContentSet {
    // Stub: implement real transformation logic
    // Example: extract destinations, activities, accommodations from parsed document
    return {
      destinations: [],
      activities: [],
      accommodations: [],
    };
  }
} 