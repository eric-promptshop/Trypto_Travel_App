/**
 * CRM Integration Types
 * 
 * This file contains placeholder interfaces and types for CRM integration.
 * These are designed to be replaced with real implementations in the future.
 */

// CRM Types
export type CrmType = 'hubspot' | 'salesforce' | 'zoho' | 'none';

// CRM Contact data structure
export interface CrmContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tripInterest?: string;
  metadata?: Record<string, any>;
}

// CRM Lead data structure
export interface CrmLead {
  id?: string;
  contactId?: string;
  status: 'new' | 'qualified' | 'in-progress' | 'closed';
  score?: number;
  itineraryId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Itinerary data format for CRM
export interface CrmItineraryData {
  id: string;
  title: string;
  duration: number;
  destinations: string[];
  totalCost: number;
  startDate?: Date;
  endDate?: Date;
  travelers: number;
  highlights: string[];
  customizations?: Record<string, any>;
}

// CRM Authentication configuration
export interface CrmAuthConfig {
  type: CrmType;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  domain?: string;
  sandbox?: boolean;
}

// CRM Integration response
export interface CrmResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Webhook payload
export interface CrmWebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  source: CrmType;
}

// Main CRM Integration interface
export interface ICrmIntegration {
  // Authentication
  authenticate(config: CrmAuthConfig): Promise<CrmResponse<boolean>>;
  isAuthenticated(): boolean;
  
  // Contact management
  createContact(contact: CrmContact): Promise<CrmResponse<CrmContact>>;
  updateContact(id: string, contact: Partial<CrmContact>): Promise<CrmResponse<CrmContact>>;
  getContact(id: string): Promise<CrmResponse<CrmContact>>;
  searchContacts(email: string): Promise<CrmResponse<CrmContact[]>>;
  
  // Lead management
  createLead(lead: CrmLead, itinerary?: CrmItineraryData): Promise<CrmResponse<CrmLead>>;
  updateLead(id: string, lead: Partial<CrmLead>): Promise<CrmResponse<CrmLead>>;
  getLead(id: string): Promise<CrmResponse<CrmLead>>;
  
  // Itinerary data
  attachItineraryToLead(leadId: string, itinerary: CrmItineraryData): Promise<CrmResponse<boolean>>;
  
  // Webhook handling
  handleWebhook(payload: CrmWebhookPayload): Promise<CrmResponse<boolean>>;
  
  // Configuration
  getConfig(): CrmAuthConfig;
  testConnection(): Promise<CrmResponse<boolean>>;
}

// CRM Integration Factory interface
export interface ICrmIntegrationFactory {
  create(type: CrmType, config: CrmAuthConfig): ICrmIntegration;
}

// Lead scoring criteria
export interface LeadScoringCriteria {
  hasCompletedForm: boolean;
  hasViewedItinerary: boolean;
  engagementDuration: number; // in minutes
  customizationsMade: number;
  budgetRange?: 'low' | 'medium' | 'high' | 'luxury';
}

// Email template data
export interface EmailTemplateData {
  recipientEmail: string;
  recipientName?: string;
  itinerary: CrmItineraryData;
  personalMessage?: string;
  senderInfo?: {
    name: string;
    email: string;
    company?: string;
  };
} 