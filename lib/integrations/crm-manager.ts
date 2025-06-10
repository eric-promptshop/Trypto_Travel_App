import { BaseCRMAdapter } from './base-crm-adapter'
import { HubSpotAdapter } from './providers/hubspot-adapter'
import { SalesforceAdapter } from './providers/salesforce-adapter'
import { ZohoAdapter } from './providers/zoho-adapter'
import {
  CRMConnection,
  CRMProvider,
  CRMProviderConfig,
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMApiResponse,
  CRMSyncResult,
  CRMCredentials,
  CRMWebhookPayload
} from './types'
import { prisma } from '../prisma'

// CRM Provider configurations
const CRM_CONFIGS: Record<CRMProvider, CRMProviderConfig> = {
  [CRMProvider.HUBSPOT]: {
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    apiBaseUrl: 'https://api.hubapi.com',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read', 'crm.objects.deals.write'],
    rateLimits: {
      requestsPerSecond: 10,
      dailyLimit: 40000
    },
    webhookSupport: true,
    supportedObjects: ['contacts', 'deals', 'activities']
  },
  [CRMProvider.SALESFORCE]: {
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    apiBaseUrl: 'https://your-instance.salesforce.com/services/data/v60.0',
    scopes: ['api', 'refresh_token'],
    rateLimits: {
      requestsPerSecond: 20,
      dailyLimit: 100000
    },
    webhookSupport: true,
    supportedObjects: ['contacts', 'accounts', 'opportunities', 'tasks']
  },
  [CRMProvider.ZOHO]: {
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    apiBaseUrl: 'https://www.zohoapis.com/crm/v3',
    scopes: ['ZohoCRM.modules.ALL'],
    rateLimits: {
      requestsPerSecond: 10,
      dailyLimit: 200000
    },
    webhookSupport: true,
    supportedObjects: ['contacts', 'deals', 'tasks', 'accounts']
  }
}

export class CRMManager {
  private adapters = new Map<string, BaseCRMAdapter>()

  constructor() {
    // Initialize adapters on demand
  }

  /**
   * Get authorization URL for a CRM provider
   */
  getAuthorizationUrl(provider: CRMProvider, redirectUri: string, state?: string): string {
    const config = CRM_CONFIGS[provider]
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.getClientId(provider),
      redirect_uri: redirectUri,
      scope: config.scopes.join(' ')
    })

    if (state) {
      params.append('state', state)
    }

    return `${config.authUrl}?${params}`
  }

  /**
   * Create a new CRM connection
   */
  async createConnection(
    tenantId: string,
    provider: CRMProvider,
    authCode: string,
    settings: CRMConnection['settings']
  ): Promise<CRMConnection> {
    const adapter = this.createAdapter(provider, {
      id: 'temp',
      tenantId,
      provider,
      credentials: { accessToken: '' },
      isActive: true,
      settings
    })

    // Authenticate and get credentials
    const credentials = await adapter.authenticate(authCode)

    // Create connection record
    const connection = await prisma.crmIntegration.create({
      data: {
        tenantId,
        provider,
        credentials: JSON.stringify(credentials),
        isActive: true,
        settings: JSON.stringify(settings)
      }
    })

    const crmConnection: CRMConnection = {
      id: connection.id,
      tenantId: connection.tenantId,
      provider: connection.provider as CRMProvider,
      credentials,
      isActive: connection.isActive,
      lastSyncAt: connection.lastSyncAt || undefined,
      settings
    }

    // Store adapter for reuse
    this.adapters.set(connection.id, this.createAdapter(provider, crmConnection))

    return crmConnection
  }

  /**
   * Get an existing CRM connection
   */
  async getConnection(connectionId: string): Promise<CRMConnection | null> {
    const connection = await prisma.crmIntegration.findUnique({
      where: { id: connectionId }
    })

    if (!connection) {
      return null
    }

    return {
      id: connection.id,
      tenantId: connection.tenantId,
      provider: connection.provider as CRMProvider,
      credentials: JSON.parse(connection.credentials),
      isActive: connection.isActive,
      lastSyncAt: connection.lastSyncAt || undefined,
      settings: JSON.parse(connection.settings)
    }
  }

  /**
   * Get all connections for a tenant
   */
  async getTenantConnections(tenantId: string): Promise<CRMConnection[]> {
    const connections = await prisma.crmIntegration.findMany({
      where: { tenantId }
    })

    return connections.map((connection: any) => ({
      id: connection.id,
      tenantId: connection.tenantId,
      provider: connection.provider as CRMProvider,
      credentials: JSON.parse(connection.credentials),
      isActive: connection.isActive,
      lastSyncAt: connection.lastSyncAt || undefined,
      settings: JSON.parse(connection.settings)
    }))
  }

  /**
   * Get adapter for a connection
   */
  async getAdapter(connectionId: string): Promise<BaseCRMAdapter | null> {
    if (this.adapters.has(connectionId)) {
      return this.adapters.get(connectionId)!
    }

    const connection = await this.getConnection(connectionId)
    if (!connection) {
      return null
    }

    const adapter = this.createAdapter(connection.provider, connection)
    this.adapters.set(connectionId, adapter)
    
    return adapter
  }

  /**
   * Test a CRM connection
   */
  async testConnection(connectionId: string): Promise<boolean> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    return adapter.validateCredentials()
  }

  /**
   * Sync data from CRM
   */
  async syncConnection(connectionId: string, fullSync = false): Promise<CRMSyncResult> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    const connection = await this.getConnection(connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }

    let result: CRMSyncResult

    if (fullSync) {
      result = await adapter.fullSync()
    } else {
      // Get last sync cursor if available
      const lastSyncCursor = await this.getLastSyncCursor(connectionId)
      result = await adapter.incrementalSync(lastSyncCursor)
    }

    // Update last sync time
    await prisma.crmIntegration.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        ...(result.lastSyncCursor && {
          syncCursor: result.lastSyncCursor
        })
      }
    })

    return result
  }

  /**
   * Process webhook from CRM provider
   */
  async processWebhook(connectionId: string, payload: any): Promise<CRMWebhookPayload> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    const webhookData = adapter.processWebhook(payload)
    
    // Here you would typically process the webhook data
    // For example, update local records based on the changes
    await this.handleWebhookData(webhookData)
    
    return webhookData
  }

  /**
   * Update connection settings
   */
  async updateConnectionSettings(
    connectionId: string, 
    settings: Partial<CRMConnection['settings']>
  ): Promise<void> {
    const connection = await this.getConnection(connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }

    const updatedSettings = { ...connection.settings, ...settings }

    await prisma.crmIntegration.update({
      where: { id: connectionId },
      data: {
        settings: JSON.stringify(updatedSettings)
      }
    })

    // Update adapter if it's cached
    if (this.adapters.has(connectionId)) {
      this.adapters.delete(connectionId)
    }
  }

  /**
   * Delete a CRM connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    await prisma.crmIntegration.delete({
      where: { id: connectionId }
    })

    // Remove cached adapter
    this.adapters.delete(connectionId)
  }

  /**
   * Get contacts from a CRM connection
   */
  async getContacts(
    connectionId: string,
    params?: Parameters<BaseCRMAdapter['getContacts']>[0]
  ): Promise<CRMApiResponse<CRMContact[]>> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    return adapter.getContacts(params)
  }

  /**
   * Create contact in CRM
   */
  async createContact(connectionId: string, contact: CRMContact): Promise<CRMApiResponse<CRMContact>> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    return adapter.createContact(contact)
  }

  /**
   * Get deals from a CRM connection
   */
  async getDeals(
    connectionId: string,
    params?: Parameters<BaseCRMAdapter['getDeals']>[0]
  ): Promise<CRMApiResponse<CRMDeal[]>> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    return adapter.getDeals(params)
  }

  /**
   * Create deal in CRM
   */
  async createDeal(connectionId: string, deal: CRMDeal): Promise<CRMApiResponse<CRMDeal>> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    return adapter.createDeal(deal)
  }

  /**
   * Create webhook subscription
   */
  async createWebhook(
    connectionId: string,
    webhookUrl: string,
    events: string[]
  ): Promise<CRMApiResponse<{ id: string; url: string }>> {
    const adapter = await this.getAdapter(connectionId)
    if (!adapter) {
      throw new Error('Connection not found')
    }

    return adapter.createWebhook(webhookUrl, events)
  }

  // Private helper methods

  private createAdapter(provider: CRMProvider, connection: CRMConnection): BaseCRMAdapter {
    const config = CRM_CONFIGS[provider]

    switch (provider) {
      case CRMProvider.HUBSPOT:
        return new HubSpotAdapter(connection, config)
      case CRMProvider.SALESFORCE:
        return new SalesforceAdapter(connection, config)
      case CRMProvider.ZOHO:
        return new ZohoAdapter(connection, config)
      default:
        throw new Error(`Unsupported CRM provider: ${provider}`)
    }
  }

  private getClientId(provider: CRMProvider): string {
    switch (provider) {
      case CRMProvider.HUBSPOT:
        return process.env.HUBSPOT_CLIENT_ID!
      case CRMProvider.SALESFORCE:
        return process.env.SALESFORCE_CLIENT_ID!
      case CRMProvider.ZOHO:
        return process.env.ZOHO_CLIENT_ID!
      default:
        throw new Error(`No client ID configured for provider: ${provider}`)
    }
  }

  private async getLastSyncCursor(connectionId: string): Promise<string | undefined> {
    const connection = await prisma.crmIntegration.findUnique({
      where: { id: connectionId },
      select: { syncCursor: true }
    })

    return connection?.syncCursor || undefined
  }

  private async handleWebhookData(webhookData: CRMWebhookPayload): Promise<void> {
    // Implementation for processing webhook data
    // This would typically involve:
    // 1. Validating the webhook data
    // 2. Updating local records based on the changes
    // 3. Triggering any necessary business logic
    
    console.log('Processing webhook data:', webhookData)
    
    // Example: Log webhook activity
    // In a real implementation, you'd update your local database
    // based on the webhook payload
  }
}

// Export singleton instance
export const crmManager = new CRMManager() 