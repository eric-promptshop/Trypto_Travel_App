/**
 * CRM Integration Module
 * 
 * Export all CRM integration types and factory
 */

// Export types
export * from './types/crm-integration';

// Export factory
export { CrmIntegrationFactory } from './crm-factory';

// Export connectors (for testing or direct usage)
export { BaseCrmConnector } from './connectors/base-connector';
export { HubSpotConnector } from './connectors/hubspot-connector';
export { SalesforceConnector } from './connectors/salesforce-connector';
export { ZohoConnector } from './connectors/zoho-connector';
export { NoneCrmConnector } from './connectors/none-connector';

// Export services
export { WebhookService } from './services/webhook-service';
export { EmailService } from './services/email-service'; 