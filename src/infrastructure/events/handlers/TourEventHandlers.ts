import { injectable, inject } from 'inversify';
import { TYPES } from '@/src/core/types';
import { InMemoryEventBus } from '../EventBus';
import { 
  TourCreatedEvent, 
  TourPublishedEvent, 
  TourArchivedEvent 
} from '@/src/core/domain/tour/TourServiceImpl';
import { EmailService, AnalyticsService } from '@/src/core/application/tour/TourApplicationService';
import { Logger } from '@/src/core/domain/tour/TourServiceImpl';

@injectable()
export class TourEventHandlers {
  constructor(
    @inject(TYPES.EventBus) private eventBus: InMemoryEventBus,
    @inject(TYPES.EmailService) private emailService: EmailService,
    @inject(TYPES.AnalyticsService) private analytics: AnalyticsService,
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Register event handlers
    this.eventBus.subscribe(TourCreatedEvent.name, this.handleTourCreated.bind(this));
    this.eventBus.subscribe(TourPublishedEvent.name, this.handleTourPublished.bind(this));
    this.eventBus.subscribe(TourArchivedEvent.name, this.handleTourArchived.bind(this));

    this.logger.info('Tour event handlers registered');
  }

  private async handleTourCreated(event: { eventData: TourCreatedEvent }): Promise<void> {
    const { tour } = event.eventData;
    
    try {
      // Send notification email
      await this.emailService.send({
        to: 'operator@example.com', // In real app, get from tour.operatorId
        template: 'tour-created',
        data: {
          tourTitle: tour.title,
          tourId: tour.id,
          viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/operator/tours/${tour.id}`
        }
      });

      // Track analytics
      await this.analytics.track('tour_created', {
        tourId: tour.id,
        operatorId: tour.operatorId,
        title: tour.title,
        price: tour.price.amount,
        duration: tour.duration,
        destinations: tour.destinations
      });

      // Could also:
      // - Update operator statistics
      // - Send to search index
      // - Trigger AI analysis
      // - Create draft marketing materials

      this.logger.info('Tour created event handled', { tourId: tour.id });
    } catch (error) {
      this.logger.error('Failed to handle tour created event', error);
    }
  }

  private async handleTourPublished(event: { eventData: TourPublishedEvent }): Promise<void> {
    const { tour } = event.eventData;
    
    try {
      // Send notification email
      await this.emailService.send({
        to: 'operator@example.com', // In real app, get from tour.operatorId
        template: 'tour-published',
        data: {
          tourTitle: tour.title,
          tourId: tour.id,
          viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tours/${tour.id}`
        }
      });

      // Track analytics
      await this.analytics.track('tour_published', {
        tourId: tour.id,
        operatorId: tour.operatorId,
        title: tour.title
      });

      // Could also:
      // - Update search index
      // - Notify subscribers
      // - Post to social media
      // - Start monitoring for bookings

      this.logger.info('Tour published event handled', { tourId: tour.id });
    } catch (error) {
      this.logger.error('Failed to handle tour published event', error);
    }
  }

  private async handleTourArchived(event: { eventData: TourArchivedEvent }): Promise<void> {
    const { tour } = event.eventData;
    
    try {
      // Send notification email
      await this.emailService.send({
        to: 'operator@example.com', // In real app, get from tour.operatorId
        template: 'tour-archived',
        data: {
          tourTitle: tour.title,
          tourId: tour.id
        }
      });

      // Track analytics
      await this.analytics.track('tour_archived', {
        tourId: tour.id,
        operatorId: tour.operatorId,
        title: tour.title
      });

      // Could also:
      // - Remove from search index
      // - Cancel scheduled promotions
      // - Archive related content
      // - Notify affected travelers

      this.logger.info('Tour archived event handled', { tourId: tour.id });
    } catch (error) {
      this.logger.error('Failed to handle tour archived event', error);
    }
  }
}

// Factory function to initialize event handlers
export function initializeTourEventHandlers(container: any): TourEventHandlers {
  return container.get(TourEventHandlers);
}