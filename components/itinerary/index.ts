// Primary Itinerary Component (Standardized)
export { ModernItineraryViewer } from './ModernItineraryViewer';

// Print and Share Functionality
export { PrintShareActions, type ItineraryData } from './print-share-actions';
export { 
  useShareAnalytics, 
  ShareAnalyticsDashboard,
  type ShareEvent,
  type ShareAnalytics 
} from './share-analytics';
export { PrintShareDemo } from './print-share-demo';

// Print Styles (imported for side effects)
import './print-styles.css';

// Re-export everything for easy access
export * from './ModernItineraryViewer';
export * from './print-share-actions';
export * from './share-analytics';
export * from './print-share-demo'; 