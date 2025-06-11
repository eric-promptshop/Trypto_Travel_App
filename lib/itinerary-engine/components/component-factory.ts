import { BaseItineraryComponent } from '../base/base-component'
import { ActivityComponent } from './activity-component'
import { AccommodationComponent } from './accommodation-component'
import { TransportationComponent } from './transportation-component'

import { 
  Activity, 
  Accommodation, 
  Transportation, 
  Destination,
  BaseComponent,
  Money,
  Coordinates 
} from '@/lib/types/itinerary'

/**
 * Factory for creating different types of itinerary components
 */
export class ComponentFactory {
  /**
   * Create a component based on the provided data and type
   */
  static createComponent(data: Activity | Accommodation | Transportation | Destination): BaseItineraryComponent {
    // Determine component type based on data structure
    if ('category' in data && 'timeSlot' in data) {
      return new ActivityComponent(data as Activity)
    }
    
    if ('roomTypes' in data && 'checkInTime' in data) {
      return new AccommodationComponent(data as Accommodation)
    }
    
    if ('from' in data && 'to' in data && 'departureTime' in data) {
      return new TransportationComponent(data as Transportation)
    }
    
    throw new Error(`Unknown component type for data: ${JSON.stringify(data)}`)
  }

  /**
   * Create an activity component
   */
  static createActivity(data: Partial<Activity> & { 
    title: string; 
    description: string;
    category: Activity['category'];
    location: string;
    coordinates: Coordinates;
    timeSlot: Activity['timeSlot'];
  }): ActivityComponent {
    const activityData: Activity = {
      id: data.id || this.generateId('activity'),
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      coordinates: data.coordinates,
      timeSlot: data.timeSlot,
      difficulty: data.difficulty || 'easy',
      indoorOutdoor: data.indoorOutdoor || 'both',
      accessibility: data.accessibility || {
        wheelchairAccessible: false,
        hearingImpaired: false,
        visuallyImpaired: false,
        mobilityAssistance: false
      },
      seasonality: data.seasonality || ['year-round'],
      bookingRequired: data.bookingRequired || false,
      images: data.images || [],
      tags: data.tags || [],
      estimatedCost: data.estimatedCost,
      bookingUrl: data.bookingUrl,
      minAge: data.minAge,
      maxGroupSize: data.maxGroupSize,
      cancellationPolicy: data.cancellationPolicy,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    }

    return new ActivityComponent(activityData)
  }

  /**
   * Generate a unique ID for components
   */
  private static generateId(prefix: string): string {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substr(2, 9)
    return `${prefix}_${timestamp}_${randomStr}`
  }

  /**
   * Create multiple components from an array of data
   */
  static createBatch(dataArray: (Activity | Accommodation | Transportation | Destination)[]): BaseItineraryComponent[] {
    return dataArray.map(data => this.createComponent(data))
  }
}

/**
 * Component composition system for combining components into complex structures
 */
export class ComponentComposer {
  /**
   * Calculate total cost for a collection of components
   */
  static calculateTotalCost(components: BaseItineraryComponent[], currency: string = 'USD'): Money {
    let total = 0
    const validComponents = components.filter(c => c.estimatedCost && c.estimatedCost.currency === currency)

    for (const component of validComponents) {
      if (component.estimatedCost) {
        total += component.estimatedCost.amount
      }
    }

    return { amount: total, currency }
  }

  /**
   * Group components by type
   */
  static groupByType(components: BaseItineraryComponent[]): ComponentGrouping {
    return {
      activities: components.filter(c => c.getType() === 'activity') as ActivityComponent[],
      accommodations: components.filter(c => c.getType() === 'accommodation') as AccommodationComponent[],
      transportation: components.filter(c => c.getType() === 'transportation') as TransportationComponent[]
    }
  }

  /**
   * Sort components by priority and time
   */
  static sortComponents(components: BaseItineraryComponent[]): BaseItineraryComponent[] {
    return components.sort((a, b) => {
      // First sort by priority
      const priorityDiff = b.getPriority() - a.getPriority()
      if (priorityDiff !== 0) return priorityDiff

      // Then by creation date
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }
}

/**
 * Type definitions for composition structures
 */
export interface ComponentGrouping {
  activities: ActivityComponent[]
  accommodations: AccommodationComponent[]
  transportation: TransportationComponent[]
}

/**
 * External adapter interface for integrating with external APIs
 */
export interface ExternalDataAdapter {
  /**
   * Fetch data from external source and convert to component format
   */
  fetchAndConvert(query: any): Promise<BaseItineraryComponent[]>
  
  /**
   * Transform external data to internal format
   */
  transformData(externalData: any): Activity | Accommodation | Transportation | Destination
} 