import { container } from '@/src/core/container';
import { TourEventHandlers } from './events/handlers/TourEventHandlers';
import { TYPES } from '@/src/core/types';
import { Logger } from '@/src/core/domain/tour/TourServiceImpl';

/**
 * Initialize infrastructure services and event handlers
 * This should be called once when the application starts
 */
export function initializeInfrastructure(): void {
  const logger = container.get<Logger>(TYPES.Logger);
  
  try {
    // Initialize event handlers
    container.bind(TourEventHandlers).toSelf();
    const tourEventHandlers = container.get(TourEventHandlers);
    
    logger.info('Infrastructure initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize infrastructure', error);
    throw error;
  }
}

// Initialize on first import (for Next.js)
if (typeof window === 'undefined') {
  // Server-side initialization
  initializeInfrastructure();
}