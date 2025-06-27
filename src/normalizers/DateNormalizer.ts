import { parse, format, parseISO, isValid, addDays, addWeeks, addMonths } from 'date-fns';
import { enUS, enGB, fr, de, es, it, ja, zhCN } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export class DateNormalizer {
  private locales: Record<string, Locale> = {
    'en-US': enUS,
    'en-GB': enGB,
    'fr': fr,
    'de': de,
    'es': es,
    'it': it,
    'ja': ja,
    'zh-CN': zhCN,
  };

  // Common date formats to try when parsing
  private commonFormats = [
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'dd-MM-yyyy',
    'MM-dd-yyyy',
    'dd.MM.yyyy',
    'yyyy/MM/dd',
    'dd MMM yyyy',
    'dd MMMM yyyy',
    'MMM dd, yyyy',
    'MMMM dd, yyyy',
    'yyyy-MM-dd HH:mm:ss',
    'dd/MM/yyyy HH:mm',
    'MM/dd/yyyy HH:mm',
    'dd-MM-yyyy HH:mm:ss',
    'yyyy-MM-dd\'T\'HH:mm:ss',
    'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
  ];

  /**
   * Normalize a date string to ISO 8601 format
   * @param dateString The date string to normalize
   * @param locale Optional locale code (e.g., 'en-US', 'fr')
   * @param referenceDate Optional reference date for relative date parsing
   * @returns ISO date string or null if parsing fails
   */
  public normalizeDate(
    dateString: string, 
    locale: string = 'en-US',
    referenceDate: Date = new Date()
  ): string | null {
    if (!dateString || dateString.trim() === '') {
      return null;
    }

    const trimmedDate = dateString.trim();

    // First, try to parse as ISO date
    try {
      const isoDate = parseISO(trimmedDate);
      if (isValid(isoDate)) {
        return format(isoDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }
    } catch (e) {
      // Not an ISO date, continue
    }

    // Handle relative dates
    const relativeDate = this.parseRelativeDate(trimmedDate, referenceDate);
    if (relativeDate) {
      return format(relativeDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
    }

    // Try parsing with common formats
    const selectedLocale = this.locales[locale] || enUS;
    
    for (const formatString of this.commonFormats) {
      try {
        const parsedDate = parse(trimmedDate, formatString, referenceDate, {
          locale: selectedLocale
        });
        
        if (isValid(parsedDate)) {
          return format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        }
      } catch (e) {
        // Try next format
        continue;
      }
    }

    // Try parsing with locale-specific formats
    const localeSpecificDate = this.parseWithLocale(trimmedDate, locale, referenceDate);
    if (localeSpecificDate) {
      return format(localeSpecificDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
    }

    return null;
  }

  /**
   * Parse relative dates like "tomorrow", "next week", "in 3 days"
   */
  private parseRelativeDate(dateString: string, referenceDate: Date): Date | null {
    const lowerDate = dateString.toLowerCase();
    
    // Simple relative date patterns
    const relativePatterns: { pattern: RegExp; handler: (match: RegExpMatchArray) => Date }[] = [
      {
        pattern: /^today$/i,
        handler: () => referenceDate
      },
      {
        pattern: /^tomorrow$/i,
        handler: () => addDays(referenceDate, 1)
      },
      {
        pattern: /^yesterday$/i,
        handler: () => addDays(referenceDate, -1)
      },
      {
        pattern: /^in (\d+) days?$/i,
        handler: (match) => addDays(referenceDate, parseInt(match[1] || '0'))
      },
      {
        pattern: /^(\d+) days? ago$/i,
        handler: (match) => addDays(referenceDate, -parseInt(match[1] || '0'))
      },
      {
        pattern: /^next week$/i,
        handler: () => addWeeks(referenceDate, 1)
      },
      {
        pattern: /^last week$/i,
        handler: () => addWeeks(referenceDate, -1)
      },
      {
        pattern: /^in (\d+) weeks?$/i,
        handler: (match) => addWeeks(referenceDate, parseInt(match[1] || '0'))
      },
      {
        pattern: /^next month$/i,
        handler: () => addMonths(referenceDate, 1)
      },
      {
        pattern: /^in (\d+) months?$/i,
        handler: (match) => addMonths(referenceDate, parseInt(match[1] || '0'))
      }
    ];

    for (const { pattern, handler } of relativePatterns) {
      const match = lowerDate.match(pattern);
      if (match) {
        return handler(match);
      }
    }

    return null;
  }

  /**
   * Try parsing with locale-specific month names
   */
  private parseWithLocale(dateString: string, locale: string, referenceDate: Date): Date | null {
    const selectedLocale = this.locales[locale] || enUS;
    
    // Try some flexible formats with locale
    const flexibleFormats = [
      'dd MMMM yyyy',
      'MMMM dd, yyyy',
      'd MMMM yyyy',
      'MMMM d, yyyy',
      'dd MMM yyyy',
      'MMM dd, yyyy',
      'd MMM yyyy',
      'MMM d, yyyy'
    ];

    for (const formatString of flexibleFormats) {
      try {
        const parsedDate = parse(dateString, formatString, referenceDate, {
          locale: selectedLocale
        });
        
        if (isValid(parsedDate)) {
          return parsedDate;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  }

  /**
   * Extract date ranges from text (e.g., "May 15-20, 2024")
   * @returns Array of {start: ISO string, end: ISO string} or empty array
   */
  public extractDateRange(text: string, locale: string = 'en-US'): Array<{start: string, end: string}> {
    const ranges: Array<{start: string, end: string}> = [];
    
    // Pattern for date ranges like "May 15-20, 2024" or "15-20 May 2024"
    const rangePatterns = [
      /(\w+ \d{1,2})-(\d{1,2}),? (\d{4})/gi,  // May 15-20, 2024
      /(\d{1,2})-(\d{1,2}) (\w+) (\d{4})/gi,   // 15-20 May 2024
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/gi, // 05/15/2024 - 05/20/2024
    ];

    for (const pattern of rangePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        // Parse based on pattern type
        let startDate: string | null = null;
        let endDate: string | null = null;

        if (pattern.source.includes('\\w+ \\d{1,2}')) {
          // Pattern like "May 15-20, 2024"
          const parts = match[1]?.split(' ');
          if (!parts || parts.length < 2) continue;
          const month = parts[0];
          const startDay = parts[1];
          const endDay = match[2];
          const year = match[3];
          
          if (month && startDay && endDay && year) {
            startDate = this.normalizeDate(`${month} ${startDay}, ${year}`, locale);
            endDate = this.normalizeDate(`${month} ${endDay}, ${year}`, locale);
          }
        } else if (pattern.source.includes('\\d{1,2}-\\d{1,2} \\w+')) {
          // Pattern like "15-20 May 2024"
          const startDay = match[1];
          const endDay = match[2];
          const month = match[3];
          const year = match[4];
          
          if (startDay && endDay && month && year) {
            startDate = this.normalizeDate(`${month} ${startDay}, ${year}`, locale);
            endDate = this.normalizeDate(`${month} ${endDay}, ${year}`, locale);
          }
        } else {
          // Direct date format
          if (match[1] && match[2]) {
            startDate = this.normalizeDate(match[1], locale);
            endDate = this.normalizeDate(match[2], locale);
          }
        }

        if (startDate && endDate) {
          ranges.push({ start: startDate, end: endDate });
        }
      }
    }

    return ranges;
  }

  /**
   * Extract time information and normalize to HH:mm format
   */
  public normalizeTime(timeString: string): string | null {
    if (!timeString || timeString.trim() === '') {
      return null;
    }

    const trimmedTime = timeString.trim();
    
    // Time patterns
    const timePatterns: { pattern: RegExp; handler: (match: RegExpMatchArray) => string }[] = [
      {
        // 24-hour format: 14:30, 14:30:00
        pattern: /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        handler: (match) => {
          const hours = (match[1] || '0').padStart(2, '0');
          const minutes = match[2] || '00';
          return `${hours}:${minutes}`;
        }
      },
      {
        // 12-hour format with AM/PM: 2:30 PM, 2:30pm
        pattern: /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i,
        handler: (match) => {
          let hours = parseInt(match[1] || '0');
          const minutes = match[2] || '00';
          const period = (match[3] || 'AM').toUpperCase();
          
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      },
      {
        // Simple hour format: 2PM, 2pm, 14h
        pattern: /^(\d{1,2})\s*(AM|PM|am|pm|h)$/i,
        handler: (match) => {
          let hours = parseInt(match[1] || '0');
          const suffix = (match[2] || 'h').toLowerCase();
          
          if ((suffix === 'pm' && hours !== 12) || (suffix === 'am' && hours === 12)) {
            hours = suffix === 'pm' ? hours + 12 : 0;
          }
          
          return `${hours.toString().padStart(2, '0')}:00`;
        }
      }
    ];

    for (const { pattern, handler } of timePatterns) {
      const match = trimmedTime.match(pattern);
      if (match) {
        return handler(match);
      }
    }

    return null;
  }

  /**
   * Parse duration strings like "2 hours", "half day", "3 days"
   */
  public normalizeDuration(durationString: string): { value: number; unit: string } | null {
    if (!durationString || durationString.trim() === '') {
      return null;
    }

    const trimmedDuration = durationString.trim().toLowerCase();

    // Duration patterns
    const durationPatterns: { pattern: RegExp; handler: (match: RegExpMatchArray) => { value: number; unit: string } }[] = [
      {
        pattern: /^(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)$/i,
        handler: (match) => ({ value: parseFloat(match[1] || '0'), unit: 'hours' })
      },
      {
        pattern: /^(\d+(?:\.\d+)?)\s*(days?|d)$/i,
        handler: (match) => ({ value: parseFloat(match[1] || '0'), unit: 'days' })
      },
      {
        pattern: /^(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)$/i,
        handler: (match) => ({ value: parseFloat(match[1] || '0'), unit: 'minutes' })
      },
      {
        pattern: /^(\d+(?:\.\d+)?)\s*(weeks?|w)$/i,
        handler: (match) => ({ value: parseFloat(match[1] || '0'), unit: 'weeks' })
      },
      {
        pattern: /^half\s*(?:a\s*)?day$/i,
        handler: () => ({ value: 0.5, unit: 'days' })
      },
      {
        pattern: /^full\s*day$/i,
        handler: () => ({ value: 1, unit: 'days' })
      },
      {
        pattern: /^all\s*day$/i,
        handler: () => ({ value: 1, unit: 'days' })
      }
    ];

    for (const { pattern, handler } of durationPatterns) {
      const match = trimmedDuration.match(pattern);
      if (match) {
        return handler(match);
      }
    }

    return null;
  }
} 