// Component implementations
export { ActivityComponent } from './activity-component'
export { AccommodationComponent } from './accommodation-component'
export { TransportationComponent } from './transportation-component'

// Factory and composition utilities
export { 
  ComponentFactory, 
  ComponentComposer, 
  type ComponentGrouping,
  type ExternalDataAdapter 
} from './component-factory'

// Base component and utilities
export { BaseItineraryComponent, ComponentUtils } from '../base/base-component'

// Re-export types for convenience
export type {
  Activity,
  Accommodation,
  Transportation,
  Destination,
  BaseComponent,
  Money,
  Coordinates,
  TimeSlot,
  ActivityCategory,
  AccommodationType,
  TransportationType
} from '@/lib/types/itinerary' 