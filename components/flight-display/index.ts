// Main flight card component
export { FlightCard } from './flight-card';
export type { Flight } from './flight-card';

// Individual components
export { FlightTimeline } from './flight-timeline';
export { AirlineInfo, InlineAirlineInfo, getAirlineInfo, generateAirlinePlaceholder } from './airline-info';
export { FlightStatus, StatusIndicator, FlightProgress, determineFlightStatus } from './flight-status';

// Export types for external use
export type { FlightTimelineProps } from './flight-timeline';
export type { AirlineInfoProps } from './airline-info';
export type { FlightStatusProps } from './flight-status'; 