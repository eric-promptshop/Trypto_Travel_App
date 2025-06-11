// Trip Customization Components
export { TripModificationForm } from './trip-modification-form'
export type { TripModificationData } from './trip-modification-form'

// Accommodation Selection Components
export { AccommodationSelector } from './accommodation-selector'
export { AccommodationMap } from './accommodation-map'

// Activity Selection Components
export { ActivitySelector } from './activity-selector'
export { ActivityTimeline } from './activity-timeline'

// Drag-and-Drop Components
export { DragDropTimeline } from './drag-drop-timeline'

// Real-time Pricing Components
export { PricingBreakdown } from './pricing-breakdown'
export { PricingHistoryTracker } from './pricing-history'
export { RealTimePricingService, useRealTimePricing } from './pricing-service'
export type { 
  SelectedItems, 
  PricingUpdate, 
  PricingHistory, 
  CurrencyOption
} from './pricing-service'

// Re-export existing travel form components that are useful for customization
export { DestinationSelector } from '../travel-forms/destination-selector'
export { DateRangePicker } from '../travel-forms/date-range-picker'
export { TravelerCounter } from '../travel-forms/traveler-counter'
export { BudgetRangeSlider } from '../travel-forms/budget-range-slider'
export { InterestTags } from '../travel-forms/interest-tags' 