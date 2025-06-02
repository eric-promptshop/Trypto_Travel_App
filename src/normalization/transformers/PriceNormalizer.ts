export class PriceNormalizer {
  // Extracts price and currency from a string, returns { price, currency }
  extractPrice(text: string): { price: number | null; currency: string | null } {
    // Example regex for price and currency
    const match = text.match(/(\$|€|£)?\s?(\d+[\.,]?\d*)/);
    if (match) {
      let currency = null;
      if (match[1]) {
        if (match[1] === '$') currency = 'USD';
        if (match[1] === '€') currency = 'EUR';
        if (match[1] === '£') currency = 'GBP';
      }
      if (match[2]) {
        const price = parseFloat(match[2].replace(',', ''));
        return { price, currency };
      }
    }
    return { price: null, currency: null };
  }
} 