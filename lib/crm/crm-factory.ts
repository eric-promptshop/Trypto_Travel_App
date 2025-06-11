import { 
  ICrmIntegrationFactory, 
  ICrmIntegration, 
  CrmType, 
  CrmAuthConfig 
} from './types/crm-integration';
import { HubSpotConnector } from './connectors/hubspot-connector';
import { SalesforceConnector } from './connectors/salesforce-connector';
import { ZohoConnector } from './connectors/zoho-connector';
import { NoneCrmConnector } from './connectors/none-connector';

/**
 * CRM Integration Factory
 * 
 * Factory class for creating CRM integrations based on type.
 * Returns placeholder implementations for MVP/demo.
 */
export class CrmIntegrationFactory implements ICrmIntegrationFactory {
  private static instance: CrmIntegrationFactory;
  
  // Store active integrations
  private integrations: Map<string, ICrmIntegration> = new Map();
  
  private constructor() {
    console.log('[CRM Factory] Initialized');
  }
  
  /**
   * Get singleton instance of the factory
   */
  public static getInstance(): CrmIntegrationFactory {
    if (!CrmIntegrationFactory.instance) {
      CrmIntegrationFactory.instance = new CrmIntegrationFactory();
    }
    return CrmIntegrationFactory.instance;
  }
  
  /**
   * Create a CRM integration based on type
   */
  create(type: CrmType, config: CrmAuthConfig): ICrmIntegration {
    const key = `${type}_${config.sandbox ? 'sandbox' : 'production'}`;
    
    // Return existing integration if already created
    if (this.integrations.has(key)) {
      console.log(`[CRM Factory] Returning existing ${type} integration`);
      return this.integrations.get(key)!;
    }
    
    let integration: ICrmIntegration;
    
    switch (type) {
      case 'hubspot':
        integration = new HubSpotConnector(config);
        break;
      case 'salesforce':
        integration = new SalesforceConnector(config);
        break;
      case 'zoho':
        integration = new ZohoConnector(config);
        break;
      case 'none':
      default:
        integration = new NoneCrmConnector(config);
        break;
    }
    
    // Store the integration
    this.integrations.set(key, integration);
    
    console.log(`[CRM Factory] Created new ${type} integration`);
    
    return integration;
  }
  
  /**
   * Get all active integrations
   */
  getActiveIntegrations(): Map<string, ICrmIntegration> {
    return new Map(this.integrations);
  }
  
  /**
   * Clear all integrations (useful for testing)
   */
  clearIntegrations(): void {
    this.integrations.clear();
    console.log('[CRM Factory] Cleared all integrations');
  }
  
  /**
   * Get supported CRM types
   */
  static getSupportedTypes(): CrmType[] {
    return ['hubspot', 'salesforce', 'zoho', 'none'];
  }
} 