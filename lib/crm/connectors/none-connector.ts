import { CrmAuthConfig, CrmContact, CrmLead, CrmItineraryData, CrmResponse } from '../types/crm-integration';
import { BaseCrmConnector } from './base-connector';

/**
 * None CRM Connector
 * 
 * For users without CRM integration.
 * Stores data locally and can send email notifications.
 */
export class NoneCrmConnector extends BaseCrmConnector {
  constructor(config: CrmAuthConfig) {
    super({
      ...config,
      type: 'none'
    });
  }
  
  /**
   * No authentication needed for local storage
   */
  override async authenticate(config: CrmAuthConfig): Promise<CrmResponse<boolean>> {
    console.log('[None] No authentication required - using local storage');
    
    this.authenticated = true;
    return {
      success: true,
      data: true,
      metadata: {
        storage: 'local',
        authenticatedAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Store contact locally
   */
  override async createContact(contact: CrmContact): Promise<CrmResponse<CrmContact>> {
    console.log('[None] Storing contact locally...');
    
    const result = await super.createContact(contact);
    
    if (result.success && result.data) {
      result.metadata = {
        ...result.metadata,
        storage: 'local',
        emailNotificationPending: true
      };
    }
    
    return result;
  }
  
  /**
   * Store lead locally and prepare email
   */
  override async createLead(lead: CrmLead, itinerary?: CrmItineraryData): Promise<CrmResponse<CrmLead>> {
    console.log('[None] Storing lead locally and preparing email...');
    
    const result = await super.createLead(lead, itinerary);
    
    if (result.success && result.data) {
      // Prepare email data
      const emailData = {
        to: 'sales@travelcompany.com',
        subject: `New Trip Inquiry: ${itinerary?.title || 'Travel Package'}`,
        leadId: result.data.id,
        contactInfo: {
          id: lead.contactId,
          status: lead.status
        },
        itineraryInfo: itinerary ? {
          destinations: itinerary.destinations.join(', '),
          duration: `${itinerary.duration} days`,
          travelers: itinerary.travelers,
          totalCost: `$${itinerary.totalCost.toLocaleString()}`,
          startDate: itinerary.startDate
        } : null
      };
      
      result.metadata = {
        ...result.metadata,
        storage: 'local',
        emailPrepared: true,
        emailData
      };
    }
    
    return result;
  }
  
  /**
   * No external webhook handling needed
   */
  override async handleWebhook(payload: any): Promise<CrmResponse<boolean>> {
    console.log('[None] No webhook handling for local storage');
    
    return {
      success: true,
      data: true,
      metadata: {
        message: 'Webhook ignored - using local storage only'
      }
    };
  }
  
  /**
   * Always connected for local storage
   */
  override async testConnection(): Promise<CrmResponse<boolean>> {
    return {
      success: true,
      data: true,
      metadata: {
        storage: 'local',
        testedAt: new Date().toISOString(),
        features: {
          localStorage: true,
          emailNotifications: true,
          crmIntegration: false
        }
      }
    };
  }
  
  /**
   * Get stored data summary
   */
  async getStorageSummary(): Promise<CrmResponse<any>> {
    const contactCount = this.contacts.size;
    const leadCount = this.leads.size;
    
    return {
      success: true,
      data: {
        contacts: contactCount,
        leads: leadCount,
        totalRecords: contactCount + leadCount
      },
      metadata: {
        storage: 'local',
        summaryGeneratedAt: new Date().toISOString()
      }
    };
  }
} 