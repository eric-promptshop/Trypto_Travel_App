import { parse, formatISO } from 'date-fns';

export class DateNormalizer {
  // Tries to parse a date string using common formats and returns ISO string
  parseDateToISO(dateStr: string): string | null {
    const formats = [
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'dd/MM/yyyy',
      'MMMM d, yyyy',
      'd MMM yyyy',
      'MMM d, yyyy',
      'yyyy/MM/dd',
    ];
    for (const fmt of formats) {
      try {
        const parsed = parse(dateStr, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
          return formatISO(parsed, { representation: 'date' });
        }
      } catch {}
    }
    return null;
  }
}
export {}; 