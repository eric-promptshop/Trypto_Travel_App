import { 
  ICrmIntegration, 
  CrmAuthConfig, 
  CrmResponse, 
  CrmContact, 
  CrmLead, 
  CrmItineraryData, 
  CrmWebhookPayload 
} from '../types/crm-integration';

/**
 * Base CRM Connector
 * 
 * Abstract base class for all CRM connectors.
 * Provides placeholder implementations for all methods.
 */
export abstract class BaseCrmConnector implements ICrmIntegration {
  protected config: CrmAuthConfig;
  protected authenticated: boolean = false;
  
  // Mock data stores for placeholder implementation
  protected contacts: Map<string, CrmContact> = new Map();
  protected leads: Map<string, CrmLead> = new Map();
  
  constructor(config: CrmAuthConfig) {
    this.config = config;
  }
  
  // Authentication methods
  async authenticate(config: CrmAuthConfig): Promise<CrmResponse<boolean>> {
    console.log(`[${this.config.type}] Authenticating with config:`, { 
      type: config.type, 
      sandbox: config.sandbox 
    });
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.authenticated = true;
    return {
      success: true,
      data: true,
      metadata: {
        authenticatedAt: new Date().toISOString(),
        sandbox: config.sandbox || false
      }
    };
  }
  
  isAuthenticated(): boolean {
    return this.authenticated;
  }
  
  // Contact management
  async createContact(contact: CrmContact): Promise<CrmResponse<CrmContact>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newContact = { ...contact, id };
    this.contacts.set(id, newContact);
    
    console.log(`[${this.config.type}] Created contact:`, newContact);
    
    return {
      success: true,
      data: newContact,
      metadata: {
        createdAt: new Date().toISOString()
      }
    };
  }
  
  async updateContact(id: string, contact: Partial<CrmContact>): Promise<CrmResponse<CrmContact>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const existing = this.contacts.get(id);
    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }
    
    const updated = { ...existing, ...contact };
    this.contacts.set(id, updated);
    
    console.log(`[${this.config.type}] Updated contact:`, updated);
    
    return {
      success: true,
      data: updated,
      metadata: {
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  async getContact(id: string): Promise<CrmResponse<CrmContact>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const contact = this.contacts.get(id);
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }
    
    return {
      success: true,
      data: contact
    };
  }
  
  async searchContacts(email: string): Promise<CrmResponse<CrmContact[]>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const results = Array.from(this.contacts.values())
      .filter(contact => contact.email.toLowerCase().includes(email.toLowerCase()));
    
    return {
      success: true,
      data: results,
      metadata: {
        count: results.length
      }
    };
  }
  
  // Lead management
  async createLead(lead: CrmLead, itinerary?: CrmItineraryData): Promise<CrmResponse<CrmLead>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newLead: CrmLead = {
      ...lead,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (itinerary) {
      newLead.itineraryId = itinerary.id;
      // Store itinerary data in metadata for placeholder
      newLead.metadata = {
        ...newLead.metadata,
        itinerary
      };
    }
    
    this.leads.set(id, newLead);
    
    console.log(`[${this.config.type}] Created lead:`, newLead);
    
    return {
      success: true,
      data: newLead,
      metadata: {
        createdAt: new Date().toISOString(),
        hasItinerary: !!itinerary
      }
    };
  }
  
  async updateLead(id: string, lead: Partial<CrmLead>): Promise<CrmResponse<CrmLead>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const existing = this.leads.get(id);
    if (!existing) {
      return { success: false, error: 'Lead not found' };
    }
    
    const updated: CrmLead = {
      ...existing,
      ...lead,
      updatedAt: new Date()
    };
    this.leads.set(id, updated);
    
    console.log(`[${this.config.type}] Updated lead:`, updated);
    
    return {
      success: true,
      data: updated,
      metadata: {
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  async getLead(id: string): Promise<CrmResponse<CrmLead>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const lead = this.leads.get(id);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }
    
    return {
      success: true,
      data: lead
    };
  }
  
  // Itinerary data
  async attachItineraryToLead(leadId: string, itinerary: CrmItineraryData): Promise<CrmResponse<boolean>> {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const lead = this.leads.get(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }
    
    lead.itineraryId = itinerary.id;
    lead.metadata = {
      ...lead.metadata,
      itinerary
    };
    lead.updatedAt = new Date();
    
    this.leads.set(leadId, lead);
    
    console.log(`[${this.config.type}] Attached itinerary to lead:`, leadId);
    
    return {
      success: true,
      data: true,
      metadata: {
        attachedAt: new Date().toISOString()
      }
    };
  }
  
  // Webhook handling
  async handleWebhook(payload: CrmWebhookPayload): Promise<CrmResponse<boolean>> {
    console.log(`[${this.config.type}] Handling webhook:`, payload);
    
    // Placeholder webhook handling
    return {
      success: true,
      data: true,
      metadata: {
        processedAt: new Date().toISOString(),
        event: payload.event
      }
    };
  }
  
  // Configuration
  getConfig(): CrmAuthConfig {
    return this.config;
  }
  
  async testConnection(): Promise<CrmResponse<boolean>> {
    if (!this.authenticated) {
      return { 
        success: false, 
        error: 'Not authenticated',
        data: false 
      };
    }
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: true,
      metadata: {
        testedAt: new Date().toISOString(),
        type: this.config.type,
        sandbox: this.config.sandbox || false
      }
    };
  }
} 