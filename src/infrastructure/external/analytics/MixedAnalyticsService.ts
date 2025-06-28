import { injectable } from 'inversify';
import { AnalyticsService } from '@/src/core/application/tour/TourApplicationService';
import { analytics } from '@/lib/analytics/analytics-service';

@injectable()
export class MixedAnalyticsService implements AnalyticsService {
  constructor() {
    // Initialize analytics if needed
    if (typeof window !== 'undefined') {
      analytics.initialize({});
    }
  }

  async track(event: string, data: any): Promise<void> {
    try {
      // Use the existing analytics service
      analytics.track(event, data);

      // For server-side tracking, also log to our database
      if (typeof window === 'undefined') {
        await this.serverSideTrack(event, data);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw to prevent operation failure due to analytics issues
    }
  }

  private async serverSideTrack(event: string, data: any): Promise<void> {
    try {
      // In a server environment, send to our analytics API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          properties: data,
          timestamp: new Date().toISOString(),
          source: 'server'
        })
      });
    } catch (error) {
      console.error('Server-side analytics error:', error);
    }
  }

  // Tour-specific tracking methods
  async trackTourCreated(data: {
    tourId: string;
    operatorId: string;
    title: string;
    price: number;
    duration: number;
    destinations: string[];
  }): Promise<void> {
    await this.track('tour_created', {
      tour_id: data.tourId,
      operator_id: data.operatorId,
      title: data.title,
      price: data.price,
      duration_days: data.duration,
      destination_count: data.destinations.length,
      destinations: data.destinations,
      timestamp: new Date().toISOString()
    });
  }

  async trackTourPublished(data: {
    tourId: string;
    operatorId: string;
    title: string;
  }): Promise<void> {
    await this.track('tour_published', {
      tour_id: data.tourId,
      operator_id: data.operatorId,
      title: data.title,
      timestamp: new Date().toISOString()
    });
  }

  async trackTourArchived(data: {
    tourId: string;
    operatorId: string;
    title: string;
  }): Promise<void> {
    await this.track('tour_archived', {
      tour_id: data.tourId,
      operator_id: data.operatorId,
      title: data.title,
      timestamp: new Date().toISOString()
    });
  }

  async trackTourViewed(data: {
    tourId: string;
    viewerId?: string;
    source?: string;
  }): Promise<void> {
    await this.track('tour_viewed', {
      tour_id: data.tourId,
      viewer_id: data.viewerId,
      source: data.source || 'direct',
      timestamp: new Date().toISOString()
    });
  }

  async trackLeadGenerated(data: {
    leadId: string;
    tourId: string;
    operatorId: string;
    source: string;
  }): Promise<void> {
    await this.track('lead_generated', {
      lead_id: data.leadId,
      tour_id: data.tourId,
      operator_id: data.operatorId,
      source: data.source,
      timestamp: new Date().toISOString()
    });
  }

  // User identification
  async identify(userId: string, properties: any): Promise<void> {
    analytics.identify(userId, properties);
  }

  // Page tracking
  async page(pageName: string, properties?: any): Promise<void> {
    analytics.page(pageName, properties);
  }
}