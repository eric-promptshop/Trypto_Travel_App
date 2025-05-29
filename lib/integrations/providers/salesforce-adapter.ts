import { BaseCRMAdapter } from '../base-crm-adapter';
import {
  CRMProvider,
  CRMCredentials,
  CRMConnection,
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMSyncResult,
  CRMFieldMapping,
  CRMSettings,
  WebhookPayload,
  APIResponse,
  CRMProviderConfig,
  CRMWebhookPayload
} from '../types';

// Salesforce-specific types
interface SalesforceContact {
  Id: string;
  Email?: string;
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  Account?: {
    Name?: string;
  };
  Title?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingCountry?: string;
  MailingPostalCode?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  LeadSource?: string;
  [key: string]: any;
}

interface SalesforceOpportunity {
  Id: string;
  Name: string;
  Amount?: number;
  StageName: string;
  Probability?: number;
  CloseDate?: string;
  AccountId?: string;
  ContactId?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  [key: string]: any;
}

interface SalesforceTask {
  Id: string;
  Type?: string;
  Subject: string;
  Description?: string;
  WhoId?: string; // Contact ID
  WhatId?: string; // Opportunity ID
  ActivityDate?: string;
  Status?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  [key: string]: any;
}

interface SalesforceAuthResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export class SalesforceAdapter extends BaseCRMAdapter {
  private readonly baseUrl: string;

  constructor(connection: CRMConnection, config: CRMProviderConfig) {
    super(connection, config);
    this.baseUrl = connection.credentials.instanceUrl || 'https://your-instance.salesforce.com/services/data/v60.0';
  }

  async authenticate(authCode: string): Promise<CRMCredentials> {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
        redirect_uri: process.env.SALESFORCE_REDIRECT_URI!,
        code: authCode
      })
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Salesforce');
    }

    const data = await response.json();
    
    // Store instance URL for API calls
    if (data.instance_url) {
      this.connection.credentials.instanceUrl = data.instance_url;
    }
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope?.split(' ') || []
    };
  }

  async refreshToken(): Promise<CRMCredentials> {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
        refresh_token: this.connection.credentials.refreshToken!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Salesforce token');
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: this.connection.credentials.refreshToken!, // Salesforce doesn't always return new refresh token
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope?.split(' ') || []
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeApiRequest<any>('GET', '/sobjects/Contact/describe');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getContacts(params?: {
    limit?: number;
    cursor?: string;
    updatedAfter?: Date;
    filter?: Record<string, any>
  }): Promise<APIResponse<CRMContact[]>> {
    try {
      let query = `SELECT Id, Email, FirstName, LastName, Phone, Account.Name, Title, MailingStreet, MailingCity, MailingState, MailingCountry, MailingPostalCode, CreatedDate, LastModifiedDate, LeadSource FROM Contact`;
      
      const conditions: string[] = [];
      
      if (params?.updatedAfter) {
        conditions.push(`LastModifiedDate >= ${params.updatedAfter.toISOString()}`);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY LastModifiedDate DESC`;
      
      if (params?.limit) {
        query += ` LIMIT ${params.limit}`;
      }

      if (params?.cursor) {
        query += ` OFFSET ${params.cursor}`;
      }

      const response = await this.makeApiRequest<{
        records: SalesforceContact[]
        totalSize: number
        done: boolean
      }>('GET', `/query?q=${encodeURIComponent(query)}`);

      const contacts = response.records.map(this.transformSalesforceContactToInternal.bind(this));

      return {
        success: true,
        data: contacts,
        pagination: {
          hasMore: !response.done,
          nextCursor: response.done ? undefined : (parseInt(params?.cursor || '0') + (params?.limit || 100)).toString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getContact(id: string): Promise<APIResponse<CRMContact>> {
    try {
      const response = await this.makeApiRequest<SalesforceContact>('GET', `/sobjects/Contact/${id}`);
      const contact = this.transformSalesforceContactToInternal(response);

      return {
        success: true,
        data: contact
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createContact(contact: CRMContact): Promise<APIResponse<CRMContact>> {
    try {
      const salesforceContact = this.transformInternalContactToSalesforce(contact);
      
      const response = await this.makeApiRequest<{ id: string; success: boolean }>('POST', '/sobjects/Contact', salesforceContact);

      if (!response.success) {
        throw new Error('Failed to create contact');
      }

      // Fetch the created contact to return full data
      const createdContact = await this.getContact(response.id);
      
      return createdContact;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<APIResponse<CRMContact>> {
    try {
      const salesforceContact = this.transformInternalContactToSalesforce(contact);
      
      await this.makeApiRequest<void>('PATCH', `/sobjects/Contact/${id}`, salesforceContact);

      // Fetch the updated contact to return full data
      const updatedContact = await this.getContact(id);
      
      return updatedContact;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteContact(id: string): Promise<APIResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/sobjects/Contact/${id}`);

      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDeals(params?: {
    limit?: number;
    cursor?: string;
    updatedAfter?: Date;
    filter?: Record<string, any>
  }): Promise<APIResponse<CRMDeal[]>> {
    try {
      let query = `SELECT Id, Name, Amount, StageName, Probability, CloseDate, AccountId, CreatedDate, LastModifiedDate FROM Opportunity`;
      
      const conditions: string[] = [];
      
      if (params?.updatedAfter) {
        conditions.push(`LastModifiedDate >= ${params.updatedAfter.toISOString()}`);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY LastModifiedDate DESC`;
      
      if (params?.limit) {
        query += ` LIMIT ${params.limit}`;
      }

      if (params?.cursor) {
        query += ` OFFSET ${params.cursor}`;
      }

      const response = await this.makeApiRequest<{
        records: SalesforceOpportunity[]
        totalSize: number
        done: boolean
      }>('GET', `/query?q=${encodeURIComponent(query)}`);

      const deals = response.records.map(this.transformSalesforceOpportunityToInternal.bind(this));

      return {
        success: true,
        data: deals,
        pagination: {
          hasMore: !response.done,
          nextCursor: response.done ? undefined : (parseInt(params?.cursor || '0') + (params?.limit || 100)).toString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDeal(id: string): Promise<APIResponse<CRMDeal>> {
    try {
      const response = await this.makeApiRequest<SalesforceOpportunity>('GET', `/sobjects/Opportunity/${id}`);
      const deal = this.transformSalesforceOpportunityToInternal(response);

      return {
        success: true,
        data: deal
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createDeal(deal: CRMDeal): Promise<APIResponse<CRMDeal>> {
    try {
      const salesforceDeal = this.transformInternalDealToSalesforce(deal);
      
      const response = await this.makeApiRequest<{ id: string; success: boolean }>('POST', '/sobjects/Opportunity', salesforceDeal);

      if (!response.success) {
        throw new Error('Failed to create opportunity');
      }

      // Fetch the created deal to return full data
      const createdDeal = await this.getDeal(response.id);
      
      return createdDeal;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<APIResponse<CRMDeal>> {
    try {
      const salesforceDeal = this.transformInternalDealToSalesforce(deal);
      
      await this.makeApiRequest<void>('PATCH', `/sobjects/Opportunity/${id}`, salesforceDeal);

      // Fetch the updated deal to return full data
      const updatedDeal = await this.getDeal(id);
      
      return updatedDeal;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteDeal(id: string): Promise<APIResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/sobjects/Opportunity/${id}`);

      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getActivities(params?: {
    limit?: number;
    cursor?: string;
    contactId?: string;
    dealId?: string;
    updatedAfter?: Date
  }): Promise<APIResponse<CRMActivity[]>> {
    try {
      let query = `SELECT Id, Type, Subject, Description, WhoId, WhatId, ActivityDate, Status, CreatedDate, LastModifiedDate FROM Task`;
      
      const conditions: string[] = [];
      
      if (params?.updatedAfter) {
        conditions.push(`LastModifiedDate >= ${params.updatedAfter.toISOString()}`);
      }
      
      if (params?.contactId) {
        conditions.push(`WhoId = '${params.contactId}'`);
      }
      
      if (params?.dealId) {
        conditions.push(`WhatId = '${params.dealId}'`);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY LastModifiedDate DESC`;
      
      if (params?.limit) {
        query += ` LIMIT ${params.limit}`;
      }

      if (params?.cursor) {
        query += ` OFFSET ${params.cursor}`;
      }

      const response = await this.makeRequest(`/query?q=${encodeURIComponent(query)}`);

      const activities = response.data.records.map(this.transformSalesforceTaskToInternal.bind(this));

      return {
        success: true,
        data: activities,
        pagination: {
          hasMore: !response.data.done,
          nextCursor: response.data.done ? undefined : (parseInt(params?.cursor || '0') + (params?.limit || 100)).toString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch activities'
      };
    }
  }

  async createActivity(activity: CRMActivity): Promise<APIResponse<CRMActivity>> {
    try {
      const salesforceTask = this.transformInternalActivityToSalesforce(activity);
      
      const response = await this.makeRequest('/sobjects/Task/', {
        method: 'POST',
        body: JSON.stringify(salesforceTask)
      });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create task');
      }

      // Fetch the created activity to return full data
      const createdActivity = await this.getActivity(response.data.id);
      
      return {
        success: true,
        data: createdActivity
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create activity'
      };
    }
  }

  async updateActivity(id: string, activity: Partial<CRMActivity>): Promise<APIResponse<CRMActivity>> {
    try {
      const salesforceTask = this.transformInternalActivityToSalesforce(activity);
      
      const response = await this.makeRequest(`/sobjects/Task/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(salesforceTask)
      });
      
      if (!response.success) {
        return { success: false, error: response.error };
      }

      // Fetch the updated activity to return full data
      const updatedActivity = await this.getActivity(id);
      
      return {
        success: true,
        data: updatedActivity
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update activity'
      };
    }
  }

  async deleteActivity(id: string): Promise<APIResponse<boolean>> {
    try {
      const response = await this.makeRequest(`/sobjects/Task/${id}`, {
        method: 'DELETE'
      });
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete activity'
      };
    }
  }

  async createWebhook(url: string, events: string[]): Promise<APIResponse<{ id: string; url: string }>> {
    try {
      // Salesforce uses different webhook mechanism (Platform Events or Streaming API)
      // This is a simplified implementation - in production you'd set up Platform Events
      const response = await this.makeRequest('/sobjects/PlatformEventChannelMember', {
        method: 'POST',
        body: JSON.stringify({
          PlatformEventChannel: 'data/ContactChangeEvent',
          EndpointUrl: url
        })
      });

      return {
        success: true,
        data: {
          id: response.data.id,
          url: url
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create webhook'
      };
    }
  }

  async deleteWebhook(webhookId: string): Promise<APIResponse<boolean>> {
    try {
      const response = await this.makeRequest(`/sobjects/PlatformEventChannelMember/${webhookId}`, {
        method: 'DELETE'
      });
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete webhook'
      };
    }
  }

  processWebhook(payload: any): CRMWebhookPayload {
    // Salesforce webhook payload structure
    return {
      provider: CRMProvider.SALESFORCE,
      tenantId: this.connection.tenantId,
      eventType: payload.eventType || 'change',
      objectType: this.mapSalesforceObjectType(payload.sobjectType),
      objectId: payload.recordId || payload.Id,
      changeType: this.mapSalesforceChangeType(payload.changeType),
      data: payload,
      timestamp: new Date(payload.CreatedDate || Date.now())
    };
  }

  async fullSync(): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: []
    };

    try {
      // Sync contacts, opportunities, and tasks
      await this.syncContacts(result);
      await this.syncOpportunities(result);
      await this.syncTasks(result);
    } catch (error: any) {
      result.success = false;
      result.errors?.push({
        error: error.message
      });
    }

    return result;
  }

  async incrementalSync(cursor?: string): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: []
    };

    const lastSyncDate = cursor ? new Date(cursor) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    try {
      // Sync updated records since last sync
      await this.syncContacts(result, lastSyncDate);
      await this.syncOpportunities(result, lastSyncDate);
      await this.syncTasks(result, lastSyncDate);
      
      result.lastSyncCursor = new Date().toISOString();
    } catch (error: any) {
      result.success = false;
      result.errors?.push({
        error: error.message
      });
    }

    return result;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.connection.credentials.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Helper method to get activity by ID
  private async getActivity(id: string): Promise<CRMActivity> {
    const response = await this.makeRequest(`/sobjects/Task/${id}`);
    return this.transformSalesforceTaskToInternal(response.data);
  }

  // Private transformation methods
  private transformSalesforceContactToInternal(salesforceContact: SalesforceContact): CRMContact {
    return {
      id: salesforceContact.Id || '',
      email: salesforceContact.Email || '',
      firstName: salesforceContact.FirstName,
      lastName: salesforceContact.LastName,
      phone: salesforceContact.Phone,
      company: salesforceContact.Account?.Name || '',
      jobTitle: salesforceContact.Title,
      address: salesforceContact.MailingStreet ? {
        street: salesforceContact.MailingStreet,
        city: salesforceContact.MailingCity,
        state: salesforceContact.MailingState,
        country: salesforceContact.MailingCountry,
        postalCode: salesforceContact.MailingPostalCode
      } : undefined,
      source: salesforceContact.LeadSource,
      customFields: this.mapExternalToInternal(salesforceContact),
      createdAt: new Date(salesforceContact.CreatedDate || ''),
      updatedAt: new Date(salesforceContact.LastModifiedDate || '')
    };
  }

  private transformInternalContactToSalesforce(contact: Partial<CRMContact>): Partial<SalesforceContact> {
    const salesforceContact: any = {};

    if (contact.email) salesforceContact.Email = contact.email;
    if (contact.firstName) salesforceContact.FirstName = contact.firstName;
    if (contact.lastName) salesforceContact.LastName = contact.lastName;
    if (contact.phone) salesforceContact.Phone = contact.phone;
    if (contact.jobTitle) salesforceContact.Title = contact.jobTitle;
    
    if (contact.address) {
      if (contact.address.street) salesforceContact.MailingStreet = contact.address.street;
      if (contact.address.city) salesforceContact.MailingCity = contact.address.city;
      if (contact.address.state) salesforceContact.MailingState = contact.address.state;
      if (contact.address.country) salesforceContact.MailingCountry = contact.address.country;
      if (contact.address.postalCode) salesforceContact.MailingPostalCode = contact.address.postalCode;
    }

    // Apply field mappings
    const mappedFields = this.mapInternalToExternal(contact);
    Object.assign(salesforceContact, mappedFields);

    return salesforceContact;
  }

  private transformSalesforceOpportunityToInternal(salesforceOpportunity: SalesforceOpportunity): CRMDeal {
    return {
      id: salesforceOpportunity.Id || '',
      name: salesforceOpportunity.Name,
      amount: salesforceOpportunity.Amount,
      stage: salesforceOpportunity.StageName,
      probability: salesforceOpportunity.Probability,
      closeDate: salesforceOpportunity.CloseDate ? new Date(salesforceOpportunity.CloseDate) : undefined,
      contactId: salesforceOpportunity.ContactId,
      customFields: this.mapExternalToInternal(salesforceOpportunity),
      createdAt: new Date(salesforceOpportunity.CreatedDate || ''),
      updatedAt: new Date(salesforceOpportunity.LastModifiedDate || '')
    };
  }

  private transformInternalDealToSalesforce(deal: Partial<CRMDeal>): Partial<SalesforceOpportunity> {
    const salesforceDeal: any = {};

    if (deal.name) salesforceDeal.Name = deal.name;
    if (deal.amount) salesforceDeal.Amount = deal.amount;
    if (deal.stage) salesforceDeal.StageName = deal.stage;
    if (deal.probability) salesforceDeal.Probability = deal.probability;
    if (deal.closeDate) salesforceDeal.CloseDate = deal.closeDate.toISOString().split('T')[0];

    // Apply field mappings
    const mappedFields = this.mapInternalToExternal(deal);
    Object.assign(salesforceDeal, mappedFields);

    return salesforceDeal;
  }

  private transformSalesforceTaskToInternal(salesforceTask: SalesforceTask): CRMActivity {
    return {
      id: salesforceTask.Id || '',
      type: this.mapSalesforceActivityType(salesforceTask.Type),
      subject: salesforceTask.Subject,
      description: salesforceTask.Description,
      contactId: salesforceTask.WhoId,
      dealId: salesforceTask.WhatId,
      dueDate: salesforceTask.ActivityDate ? new Date(salesforceTask.ActivityDate) : undefined,
      completed: salesforceTask.Status === 'Completed',
      createdAt: new Date(salesforceTask.CreatedDate || ''),
      updatedAt: new Date(salesforceTask.LastModifiedDate || '')
    };
  }

  private transformInternalActivityToSalesforce(activity: Partial<CRMActivity>): Partial<SalesforceTask> {
    const salesforceTask: any = {};

    if (activity.type) salesforceTask.Type = this.mapInternalActivityTypeToSalesforce(activity.type);
    if (activity.subject) salesforceTask.Subject = activity.subject;
    if (activity.description) salesforceTask.Description = activity.description;
    if (activity.contactId) salesforceTask.WhoId = activity.contactId;
    if (activity.dealId) salesforceTask.WhatId = activity.dealId;
    if (activity.dueDate) salesforceTask.ActivityDate = activity.dueDate.toISOString().split('T')[0];
    if (activity.completed !== undefined) salesforceTask.Status = activity.completed ? 'Completed' : 'In Progress';

    return salesforceTask;
  }

  private mapSalesforceActivityType(salesforceType?: string): CRMActivity['type'] {
    const typeMap: Record<string, CRMActivity['type']> = {
      'Call': 'call',
      'Email': 'email',
      'Meeting': 'meeting',
      'Task': 'task',
      'Other': 'note'
    };
    return typeMap[salesforceType || 'Other'] || 'note';
  }

  private mapInternalActivityTypeToSalesforce(internalType: CRMActivity['type']): string {
    const typeMap: Record<CRMActivity['type'], string> = {
      'call': 'Call',
      'email': 'Email',
      'meeting': 'Meeting',
      'task': 'Task',
      'note': 'Other'
    };
    return typeMap[internalType] || 'Other';
  }

  private mapSalesforceObjectType(objectType: string): 'contact' | 'deal' | 'activity' {
    const typeMap: Record<string, 'contact' | 'deal' | 'activity'> = {
      'Contact': 'contact',
      'Opportunity': 'deal',
      'Task': 'activity',
      'Event': 'activity'
    };
    return typeMap[objectType] || 'contact';
  }

  private mapSalesforceChangeType(changeType: string): 'created' | 'updated' | 'deleted' {
    const changeMap: Record<string, 'created' | 'updated' | 'deleted'> = {
      'CREATE': 'created',
      'UPDATE': 'updated',
      'DELETE': 'deleted'
    };
    return changeMap[changeType] || 'updated';
  }

  private async syncContacts(result: CRMSyncResult, updatedAfter?: Date): Promise<void> {
    // Implementation for contact synchronization
    // This would fetch contacts from Salesforce and sync with internal database
  }

  private async syncOpportunities(result: CRMSyncResult, updatedAfter?: Date): Promise<void> {
    // Implementation for opportunity synchronization
  }

  private async syncTasks(result: CRMSyncResult, updatedAfter?: Date): Promise<void> {
    // Implementation for task synchronization
  }
} 