import { prisma } from '@/lib/prisma';
import { Content, Itinerary } from '@prisma/client';

export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
  accommodations: ItineraryActivity[];
  transportation: ItineraryActivity[];
}

export interface ItineraryActivity {
  id: string;
  type: 'activity' | 'accommodation' | 'transportation';
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  price?: number;
  currency?: string;
  bookingUrl?: string;
  notes?: string;
  contentId?: string;
  // Enriched fields from Content
  images?: string[];
  amenities?: string[];
  highlights?: string[];
}

export interface ItinerarySearchOptions {
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  tenantId?: string;
}

export interface ActivitySuggestion {
  contentId: string;
  name: string;
  description: string;
  type: string;
  price?: number;
  duration?: number;
  location: string;
  images: string[];
  score: number; // Relevance score
}

export class ItineraryService {
  /**
   * Create a blank itinerary structure for given dates
   */
  static createBlankItinerary(startDate: Date, endDate: Date): ItineraryDay[] {
    const days: ItineraryDay[] = [];
    const currentDate = new Date(startDate);
    let dayNumber = 1;

    while (currentDate <= endDate) {
      days.push({
        day: dayNumber,
        date: currentDate.toISOString().split('T')[0],
        activities: [],
        accommodations: [],
        transportation: []
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }

    return days;
  }

  /**
   * Calculate total cost of an itinerary
   */
  static calculateTotalCost(days: ItineraryDay[]): number {
    let total = 0;
    
    days.forEach(day => {
      ['activities', 'accommodations', 'transportation'].forEach(type => {
        const items = day[type as keyof ItineraryDay] as ItineraryActivity[];
        items.forEach(item => {
          if (item.price) {
            total += item.price;
          }
        });
      });
    });

    return total;
  }

  /**
   * Validate itinerary structure
   */
  static validateItinerary(days: ItineraryDay[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(days) || days.length === 0) {
      errors.push('Itinerary must have at least one day');
      return { isValid: false, errors };
    }

    days.forEach((day, index) => {
      if (!day.day || day.day !== index + 1) {
        errors.push(`Day ${index + 1} has incorrect day number`);
      }
      
      if (!day.date || !Date.parse(day.date)) {
        errors.push(`Day ${index + 1} has invalid date`);
      }

      ['activities', 'accommodations', 'transportation'].forEach(type => {
        if (!Array.isArray(day[type as keyof ItineraryDay])) {
          errors.push(`Day ${index + 1} has invalid ${type} array`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get activity suggestions based on destination and preferences
   */
  static async getActivitySuggestions(
    destination: string,
    type: 'activity' | 'accommodation' | 'transport',
    preferences?: {
      maxPrice?: number;
      keywords?: string[];
    }
  ): Promise<ActivitySuggestion[]> {
    const whereClause: any = {
      active: true,
      type: type === 'transport' ? 'transportation' : type,
      OR: [
        { location: { contains: destination, mode: 'insensitive' } },
        { city: { contains: destination, mode: 'insensitive' } },
        { country: { contains: destination, mode: 'insensitive' } }
      ]
    };

    if (preferences?.maxPrice) {
      whereClause.price = { lte: preferences.maxPrice };
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      take: 20,
      orderBy: [
        { price: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Score and sort by relevance
    const suggestions: ActivitySuggestion[] = contents.map(content => {
      let score = 1;
      
      // Boost score for exact location match
      if (content.location.toLowerCase() === destination.toLowerCase()) {
        score += 2;
      }
      
      // Boost score for keyword matches
      if (preferences?.keywords) {
        const contentText = `${content.name} ${content.description}`.toLowerCase();
        preferences.keywords.forEach(keyword => {
          if (contentText.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });
      }

      return {
        contentId: content.id,
        name: content.name,
        description: content.description,
        type: content.type,
        price: content.price || undefined,
        duration: content.duration || undefined,
        location: content.location,
        images: JSON.parse(content.images || '[]'),
        score
      };
    });

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Clone an existing itinerary
   */
  static async cloneItinerary(
    itineraryId: string,
    newTitle: string,
    userId: string,
    tenantId: string = 'default'
  ): Promise<Itinerary> {
    const original = await prisma.itinerary.findUnique({
      where: { id: itineraryId }
    });

    if (!original) {
      throw new Error('Original itinerary not found');
    }

    const cloned = await prisma.itinerary.create({
      data: {
        title: newTitle,
        description: original.description,
        destination: original.destination,
        startDate: original.startDate,
        endDate: original.endDate,
        travelers: original.travelers,
        totalPrice: original.totalPrice,
        currency: original.currency,
        days: original.days,
        userId,
        tenantId,
        metadata: JSON.stringify({
          clonedFrom: itineraryId,
          clonedAt: new Date().toISOString()
        })
      }
    });

    return cloned;
  }

  /**
   * Share itinerary with another user
   */
  static async shareItinerary(
    itineraryId: string,
    sharedWithEmail: string,
    permission: 'view' | 'edit' = 'view'
  ): Promise<void> {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId }
    });

    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    // Find the user to share with
    const sharedUser = await prisma.user.findUnique({
      where: { email: sharedWithEmail }
    });

    if (!sharedUser) {
      throw new Error('User not found');
    }

    // Update metadata to include sharing info
    const metadata = JSON.parse(itinerary.metadata || '{}');
    if (!metadata.sharedWith) {
      metadata.sharedWith = [];
    }

    metadata.sharedWith.push({
      userId: sharedUser.id,
      email: sharedWithEmail,
      permission,
      sharedAt: new Date().toISOString()
    });

    await prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        metadata: JSON.stringify(metadata)
      }
    });
  }

  /**
   * Export itinerary to different formats
   */
  static async exportItinerary(
    itineraryId: string,
    format: 'json' | 'pdf' | 'csv'
  ): Promise<any> {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId }
    });

    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    const days = JSON.parse(itinerary.days || '[]');

    switch (format) {
      case 'json':
        return {
          title: itinerary.title,
          description: itinerary.description,
          destination: itinerary.destination,
          dates: {
            start: itinerary.startDate,
            end: itinerary.endDate
          },
          travelers: itinerary.travelers,
          totalPrice: itinerary.totalPrice,
          currency: itinerary.currency,
          days
        };

      case 'csv':
        // Convert to CSV format
        const csvRows = ['Day,Date,Type,Name,Description,Location,Price'];
        days.forEach((day: ItineraryDay) => {
          ['activities', 'accommodations', 'transportation'].forEach(type => {
            const items = day[type as keyof ItineraryDay] as ItineraryActivity[];
            items.forEach(item => {
              csvRows.push([
                day.day,
                day.date,
                type,
                item.name,
                item.description || '',
                item.location || '',
                item.price || ''
              ].join(','));
            });
          });
        });
        return csvRows.join('\n');

      case 'pdf':
        // This would require a PDF generation library
        throw new Error('PDF export not yet implemented');

      default:
        throw new Error('Unsupported export format');
    }
  }
}