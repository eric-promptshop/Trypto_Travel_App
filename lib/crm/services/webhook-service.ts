import { CrmType, CrmWebhookPayload, CrmResponse } from '../types/crm-integration';
import { CrmIntegrationFactory } from '../crm-factory';

/**
 * Webhook Registration
 */
interface WebhookRegistration {
  id: string;
  crmType: CrmType;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

/**
 * Webhook Event
 */
interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  timestamp: Date;
  status: 'pending' | 'processing' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

/**
 * Webhook Service
 * 
 * Manages webhook registrations and event processing for CRM integrations.
 * This is a placeholder implementation for the MVP/demo.
 */
export class WebhookService {
  private static instance: WebhookService;
  private webhooks: Map<string, WebhookRegistration> = new Map();
  private events: Map<string, WebhookEvent> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processing: boolean = false;
  
  private constructor() {
    console.log('[WebhookService] Initialized');
    // Start event processor
    this.startEventProcessor();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }
  
  /**
   * Register a webhook
   */
  async registerWebhook(
    crmType: CrmType,
    url: string,
    events: string[],
    secret?: string
  ): Promise<CrmResponse<WebhookRegistration>> {
    try {
      const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const webhook: WebhookRegistration = {
        id,
        crmType,
        url,
        events,
        active: true,
        createdAt: new Date()
      };
      
      // Only add secret if provided
      if (secret !== undefined) {
        webhook.secret = secret;
      }
      
      this.webhooks.set(id, webhook);
      
      console.log(`[WebhookService] Registered webhook for ${crmType}:`, {
        id,
        url,
        events
      });
      
      return {
        success: true,
        data: webhook,
        metadata: {
          registeredAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[WebhookService] Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register webhook'
      };
    }
  }
  
  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<CrmResponse<boolean>> {
    const webhook = this.webhooks.get(webhookId);
    
    if (!webhook) {
      return {
        success: false,
        error: 'Webhook not found'
      };
    }
    
    webhook.active = false;
    console.log(`[WebhookService] Unregistered webhook: ${webhookId}`);
    
    return {
      success: true,
      data: true,
      metadata: {
        unregisteredAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Handle incoming webhook
   */
  async handleIncomingWebhook(
    crmType: CrmType,
    event: string,
    payload: any,
    signature?: string
  ): Promise<CrmResponse<boolean>> {
    try {
      // Find active webhooks for this CRM type and event
      const activeWebhooks = Array.from(this.webhooks.values())
        .filter(w => w.active && w.crmType === crmType && w.events.includes(event));
      
      if (activeWebhooks.length === 0) {
        console.log(`[WebhookService] No active webhooks for ${crmType}/${event}`);
        return {
          success: true,
          data: true,
          metadata: {
            message: 'No webhooks registered for this event'
          }
        };
      }
      
      // Create webhook payload
      const webhookPayload: CrmWebhookPayload = {
        event,
        data: payload,
        timestamp: new Date(),
        source: crmType
      };
      
      // Queue events for each webhook
      for (const webhook of activeWebhooks) {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const webhookEvent: WebhookEvent = {
          id: eventId,
          webhookId: webhook.id,
          event,
          payload: webhookPayload,
          timestamp: new Date(),
          status: 'pending',
          attempts: 0
        };
        
        this.events.set(eventId, webhookEvent);
        this.eventQueue.push(webhookEvent);
        
        // Update last triggered
        webhook.lastTriggered = new Date();
      }
      
      console.log(`[WebhookService] Queued ${activeWebhooks.length} events for ${crmType}/${event}`);
      
      return {
        success: true,
        data: true,
        metadata: {
          eventsQueued: activeWebhooks.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[WebhookService] Error handling webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle webhook'
      };
    }
  }
  
  /**
   * Process webhook events (placeholder - in production would make HTTP calls)
   */
  private async startEventProcessor() {
    setInterval(async () => {
      if (this.processing || this.eventQueue.length === 0) {
        return;
      }
      
      this.processing = true;
      
      try {
        const event = this.eventQueue.shift();
        if (!event) {
          return;
        }
        
        await this.processEvent(event);
      } finally {
        this.processing = false;
      }
    }, 1000); // Process every second
  }
  
  /**
   * Process a single webhook event
   */
  private async processEvent(event: WebhookEvent) {
    console.log(`[WebhookService] Processing event ${event.id}`);
    
    event.status = 'processing';
    event.attempts++;
    event.lastAttempt = new Date();
    
    try {
      // Get the webhook
      const webhook = this.webhooks.get(event.webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }
      
      // Get the CRM integration
      const factory = CrmIntegrationFactory.getInstance();
      const integration = factory.create(webhook.crmType, { type: webhook.crmType });
      
      // Let the integration handle the webhook
      const result = await integration.handleWebhook(event.payload);
      
      if (result.success) {
        event.status = 'success';
        console.log(`[WebhookService] Event ${event.id} processed successfully`);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WebhookService] Event ${event.id} failed:`, error);
      
      // Retry logic (up to 3 attempts)
      if (event.attempts < 3) {
        event.status = 'pending';
        this.eventQueue.push(event);
        console.log(`[WebhookService] Requeued event ${event.id} (attempt ${event.attempts}/3)`);
      }
    }
  }
  
  /**
   * Get webhook statistics
   */
  getStatistics(): {
    totalWebhooks: number;
    activeWebhooks: number;
    totalEvents: number;
    pendingEvents: number;
    failedEvents: number;
  } {
    const stats = {
      totalWebhooks: this.webhooks.size,
      activeWebhooks: Array.from(this.webhooks.values()).filter(w => w.active).length,
      totalEvents: this.events.size,
      pendingEvents: this.eventQueue.length,
      failedEvents: Array.from(this.events.values()).filter(e => e.status === 'failed').length
    };
    
    return stats;
  }
  
  /**
   * Clear all data (for testing)
   */
  clearAll() {
    this.webhooks.clear();
    this.events.clear();
    this.eventQueue = [];
    console.log('[WebhookService] Cleared all data');
  }
} 