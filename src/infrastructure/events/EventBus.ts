import { injectable } from 'inversify';
import { EventBus } from '@/src/core/domain/tour/TourServiceImpl';
import { EventEmitter } from 'events';

export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  eventData: any;
  eventVersion: number;
  occurredAt: Date;
}

export type EventHandler<T = any> = (event: T) => Promise<void> | void;

@injectable()
export class InMemoryEventBus implements EventBus {
  private emitter = new EventEmitter();
  private handlers = new Map<string, EventHandler[]>();

  async publish(event: any): Promise<void> {
    const eventName = event.constructor.name;
    
    // Create domain event wrapper
    const domainEvent: DomainEvent = {
      aggregateId: event.aggregateId || event.tour?.id || event.id || 'unknown',
      eventType: eventName,
      eventData: event,
      eventVersion: 1,
      occurredAt: new Date()
    };

    // Log event
    console.log(`[EventBus] Publishing event: ${eventName}`, {
      aggregateId: domainEvent.aggregateId,
      occurredAt: domainEvent.occurredAt
    });

    // Emit for immediate handling
    this.emitter.emit(eventName, domainEvent);

    // Also emit to 'all' for general event logging
    this.emitter.emit('*', domainEvent);

    // In production, persist to event store
    if (process.env.NODE_ENV === 'production') {
      await this.persistEvent(domainEvent);
    }
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    this.emitter.on(eventType, handler);
    
    // Track handlers
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  unsubscribe<T>(eventType: string, handler: EventHandler<T>): void {
    this.emitter.off(eventType, handler);
    
    // Remove from tracked handlers
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  // Subscribe to all events
  subscribeToAll(handler: EventHandler<DomainEvent>): void {
    this.emitter.on('*', handler);
  }

  private async persistEvent(event: DomainEvent): Promise<void> {
    try {
      // Persist to event store
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('[EventBus] Failed to persist event:', error);
      // In production, could write to a local queue for retry
    }
  }

  // Get all registered handlers (useful for debugging)
  getHandlers(): Map<string, EventHandler[]> {
    return new Map(this.handlers);
  }

  // Clear all handlers (useful for testing)
  clearHandlers(): void {
    this.emitter.removeAllListeners();
    this.handlers.clear();
  }
}

// Distributed event bus for production use
@injectable()
export class DistributedEventBus extends InMemoryEventBus {
  private queueUrl?: string;

  constructor() {
    super();
    // In production, configure with message queue URL
    this.queueUrl = process.env.EVENT_QUEUE_URL;
  }

  async publish(event: any): Promise<void> {
    // Publish locally first
    await super.publish(event);

    // Then publish to distributed queue
    if (this.queueUrl) {
      await this.publishToQueue(event);
    }
  }

  private async publishToQueue(event: any): Promise<void> {
    // Implement integration with SQS, RabbitMQ, Kafka, etc.
    console.log('[DistributedEventBus] Would publish to queue:', event.constructor.name);
  }
}

// Event handler decorator (for future use)
export function EventHandler(eventType: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // This would register the handler automatically
    console.log(`Registering handler ${propertyKey} for event ${eventType}`);
  };
}