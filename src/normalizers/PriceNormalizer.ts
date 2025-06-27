import { Price } from './types';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export class PriceNormalizer {
  // Common currency information
  private currencies: Map<string, CurrencyInfo> = new Map([
    ['USD', { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 }],
    ['EUR', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
    ['GBP', { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 }],
    ['JPY', { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 }],
    ['CNY', { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 }],
    ['AUD', { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 }],
    ['CAD', { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 }],
    ['CHF', { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', decimalPlaces: 2 }],
    ['SEK', { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalPlaces: 2 }],
    ['NZD', { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimalPlaces: 2 }],
    ['KRW', { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0 }],
    ['SGD', { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2 }],
    ['NOK', { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalPlaces: 2 }],
    ['MXN', { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2 }],
    ['INR', { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 }],
    ['RUB', { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2 }],
    ['ZAR', { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalPlaces: 2 }],
    ['TRY', { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalPlaces: 2 }],
    ['BRL', { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2 }],
    ['TWD', { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', decimalPlaces: 2 }],
    ['DKK', { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalPlaces: 2 }],
    ['PLN', { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalPlaces: 2 }],
    ['THB', { code: 'THB', symbol: '฿', name: 'Thai Baht', decimalPlaces: 2 }],
    ['IDR', { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimalPlaces: 0 }],
    ['HUF', { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimalPlaces: 0 }],
    ['CZK', { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimalPlaces: 2 }],
    ['ILS', { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimalPlaces: 2 }],
    ['CLP', { code: 'CLP', symbol: '$', name: 'Chilean Peso', decimalPlaces: 0 }],
    ['PHP', { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimalPlaces: 2 }],
    ['AED', { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2 }],
    ['COP', { code: 'COP', symbol: '$', name: 'Colombian Peso', decimalPlaces: 0 }],
    ['SAR', { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimalPlaces: 2 }],
    ['MYR', { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimalPlaces: 2 }],
    ['RON', { code: 'RON', symbol: 'lei', name: 'Romanian Leu', decimalPlaces: 2 }],
  ]);

  // Symbol to currency code mapping for ambiguous symbols
  private symbolToCurrency: Map<string, string[]> = new Map([
    ['$', ['USD', 'CAD', 'AUD', 'NZD', 'SGD', 'MXN', 'CLP', 'COP']],
    ['¥', ['JPY', 'CNY']],
    ['kr', ['SEK', 'NOK', 'DKK']],
    ['£', ['GBP']],
    ['€', ['EUR']],
    ['₹', ['INR']],
    ['₽', ['RUB']],
    ['₺', ['TRY']],
    ['฿', ['THB']],
    ['₱', ['PHP']],
    ['₪', ['ILS']],
    ['₩', ['KRW']],
  ]);

  /**
   * Normalize a price string to a structured Price object
   * @param priceString The price string to normalize (e.g., "$100", "€50.99", "100 USD")
   * @param defaultCurrency Default currency code if not detected
   * @param locale Locale hint for currency detection (e.g., 'en-US' suggests USD)
   */
  public normalizePrice(
    priceString: string,
    defaultCurrency: string = 'USD',
    locale?: string
  ): Price | null {
    if (!priceString || priceString.trim() === '') {
      return null;
    }

    const cleaned = priceString.trim();
    
    // Try to extract currency and amount
    const extraction = this.extractCurrencyAndAmount(cleaned, locale);
    
    if (!extraction) {
      return null;
    }

    const { amount, currency, priceType } = extraction;
    
    // Use detected currency or fall back to default
    const finalCurrency = currency || defaultCurrency;
    
    // Validate currency code
    if (!this.isValidCurrencyCode(finalCurrency)) {
      return null;
    }

    return {
      amount: this.roundToDecimalPlaces(amount, finalCurrency),
      currency: finalCurrency,
      priceType: priceType || 'per_person'
    };
  }

  /**
   * Extract currency and amount from a price string
   */
  private extractCurrencyAndAmount(
    priceString: string,
    locale?: string
  ): { amount: number; currency?: string; priceType?: 'per_person' | 'per_group' | 'total' } | null {
    // Price patterns to try
    const patterns = [
      // Symbol at start: $100, €50.99, £20
      /^([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)/,
      // Symbol at end: 100$, 50€
      /^([0-9,]+(?:\.[0-9]+)?)\s*([₹₽₺฿₱₪₩$€£¥])/,
      // Currency code at start: USD 100, EUR 50
      /^([A-Z]{3})\s*([0-9,]+(?:\.[0-9]+)?)/,
      // Currency code at end: 100 USD, 50 EUR
      /^([0-9,]+(?:\.[0-9]+)?)\s*([A-Z]{3})/,
      // With text: $100 per person, 50€ pp, 100 USD/person
      /([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per person|\/person|pp|p\.p\.|per pax|\/pax)/i,
      /([0-9,]+(?:\.[0-9]+)?)\s*([₹₽₺฿₱₪₩$€£¥])\s*(?:per person|\/person|pp|p\.p\.|per pax|\/pax)/i,
      // Total price patterns
      /([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:total|in total|grand total)/i,
      /([0-9,]+(?:\.[0-9]+)?)\s*([₹₽₺฿₱₪₩$€£¥])\s*(?:total|in total|grand total)/i,
      // Per group patterns
      /([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per group|\/group|for group)/i,
    ];

    for (const pattern of patterns) {
      const match = priceString.match(pattern);
      if (match) {
        let amount: number;
        let currencyStr: string;
        let priceType: 'per_person' | 'per_group' | 'total' | undefined;

        // Determine which group contains amount vs currency
        if (/[0-9]/.test(match[1] || '')) {
          amount = this.parseAmount(match[1] || '0');
          currencyStr = match[2] || '';
        } else {
          currencyStr = match[1] || '';
          amount = this.parseAmount(match[2] || '0');
        }

        // Determine price type from pattern
        if (pattern.source.includes('per person') || pattern.source.includes('pp')) {
          priceType = 'per_person';
        } else if (pattern.source.includes('total')) {
          priceType = 'total';
        } else if (pattern.source.includes('per group')) {
          priceType = 'per_group';
        }

        // Convert symbol to currency code
        const currency = this.symbolToCurrencyCode(currencyStr, locale);

        return { 
          amount, 
          ...(currency && { currency }),
          ...(priceType && { priceType })
        };
      }
    }

    // Try simple number extraction as last resort
    const simpleNumber = priceString.match(/([0-9,]+(?:\.[0-9]+)?)/);
    if (simpleNumber && simpleNumber[1]) {
      return {
        amount: this.parseAmount(simpleNumber[1])
      };
    }

    return null;
  }

  /**
   * Parse amount string to number, handling different formats
   */
  private parseAmount(amountStr: string): number {
    // Remove spaces and handle different decimal/thousand separators
    let cleaned = amountStr.replace(/\s/g, '');
    
    // Check if uses comma as decimal separator (European style)
    if (cleaned.match(/^\d{1,3}(,\d{3})*\.\d+$/) || cleaned.match(/^\d+\.\d+$/)) {
      // Standard format: 1,000.50 or 1000.50
      cleaned = cleaned.replace(/,/g, '');
    } else if (cleaned.match(/^\d{1,3}(\.\d{3})*,\d+$/) || cleaned.match(/^\d+,\d+$/)) {
      // European format: 1.000,50 or 1000,50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Fallback: just remove commas
      cleaned = cleaned.replace(/,/g, '');
    }
    
    return parseFloat(cleaned) || 0;
  }

  /**
   * Convert currency symbol to ISO code
   */
  private symbolToCurrencyCode(symbol: string, locale?: string): string | undefined {
    // Check if it's already a currency code
    if (symbol.length === 3 && /^[A-Z]{3}$/.test(symbol)) {
      return symbol;
    }

    // Get possible currencies for this symbol
    const possibleCurrencies = this.symbolToCurrency.get(symbol);
    
    if (!possibleCurrencies || possibleCurrencies.length === 0) {
      return undefined;
    }

    // If only one possibility, return it
    if (possibleCurrencies.length === 1) {
      return possibleCurrencies[0];
    }

    // Use locale hint to disambiguate
    if (locale) {
      const localeMap: Record<string, string> = {
        'en-US': 'USD',
        'en-CA': 'CAD',
        'en-AU': 'AUD',
        'en-NZ': 'NZD',
        'en-SG': 'SGD',
        'es-MX': 'MXN',
        'es-CL': 'CLP',
        'es-CO': 'COP',
        'ja-JP': 'JPY',
        'zh-CN': 'CNY',
        'sv-SE': 'SEK',
        'nb-NO': 'NOK',
        'da-DK': 'DKK',
      };

      const localeCurrency = localeMap[locale];
      if (localeCurrency && possibleCurrencies.includes(localeCurrency)) {
        return localeCurrency;
      }
    }

    // Default to most common currency for ambiguous symbols
    if (symbol === '$') return 'USD';
    if (symbol === '¥') return 'JPY';
    if (symbol === 'kr') return 'SEK';

    return possibleCurrencies[0];
  }

  /**
   * Check if a currency code is valid
   */
  private isValidCurrencyCode(code: string): boolean {
    return this.currencies.has(code);
  }

  /**
   * Round amount to appropriate decimal places for the currency
   */
  private roundToDecimalPlaces(amount: number, currencyCode: string): number {
    const currency = this.currencies.get(currencyCode);
    if (!currency) {
      return Math.round(amount * 100) / 100; // Default to 2 decimal places
    }

    const factor = Math.pow(10, currency.decimalPlaces);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Extract price range from text (e.g., "$100-200", "50 to 100 EUR")
   */
  public extractPriceRange(
    text: string,
    defaultCurrency: string = 'USD',
    locale?: string
  ): { min: Price; max: Price } | null {
    // Price range patterns
    const rangePatterns = [
      // $100-200, €50-100
      /([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)\s*[-–]\s*([0-9,]+(?:\.[0-9]+)?)/,
      // 100-200 USD, 50-100 EUR
      /([0-9,]+(?:\.[0-9]+)?)\s*[-–]\s*([0-9,]+(?:\.[0-9]+)?)\s*([A-Z]{3})/,
      // $100 to $200
      /([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:to|thru|through)\s*([₹₽₺฿₱₪₩$€£¥])\s*([0-9,]+(?:\.[0-9]+)?)/i,
      // 100 to 200 USD
      /([0-9,]+(?:\.[0-9]+)?)\s*(?:to|thru|through)\s*([0-9,]+(?:\.[0-9]+)?)\s*([A-Z]{3})/i,
    ];

    for (const pattern of rangePatterns) {
      const match = text.match(pattern);
      if (match) {
        let minAmount: number;
        let maxAmount: number;
        let currency: string | undefined;

        if (pattern.source.includes('to|thru|through') && match[3]) {
          // Pattern with repeated currency symbol
          currency = this.symbolToCurrencyCode(match[1] || '', locale);
          minAmount = this.parseAmount(match[2] || '0');
          maxAmount = this.parseAmount(match[4] || '0');
        } else if (/^[₹₽₺฿₱₪₩$€£¥]/.test(match[1] || '')) {
          // Currency symbol at start
          currency = this.symbolToCurrencyCode(match[1] || '', locale);
          minAmount = this.parseAmount(match[2] || '0');
          maxAmount = this.parseAmount(match[3] || '0');
        } else {
          // Currency at end
          minAmount = this.parseAmount(match[1] || '0');
          maxAmount = this.parseAmount(match[2] || '0');
          currency = match[3];
        }

        const finalCurrency = currency || defaultCurrency;

        if (this.isValidCurrencyCode(finalCurrency)) {
          return {
            min: {
              amount: this.roundToDecimalPlaces(minAmount, finalCurrency),
              currency: finalCurrency
            },
            max: {
              amount: this.roundToDecimalPlaces(maxAmount, finalCurrency),
              currency: finalCurrency
            }
          };
        }
      }
    }

    return null;
  }
} 