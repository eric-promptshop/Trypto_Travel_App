import {
  CRMConnection,
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMApiResponse,
  CRMSyncResult,
  CRMCredentials,
  CRMProviderConfig,
  CRMWebhookPayload
} from './types'

export abstract class BaseCRMAdapter {
  protected connection: CRMConnection
  protected config: CRMProviderConfig

  constructor(connection: CRMConnection, config: CRMProviderConfig) {
    this.connection = connection
    this.config = config
  }

  // Authentication methods
  abstract authenticate(authCode: string): Promise<CRMCredentials>
  abstract refreshToken(): Promise<CRMCredentials>
  abstract validateCredentials(): Promise<boolean>

  // Contact management
  abstract getContacts(params?: {
    limit?: number
    cursor?: string
    updatedAfter?: Date
    filter?: Record<string, any>
  }): Promise<CRMApiResponse<CRMContact[]>>

  abstract getContact(id: string): Promise<CRMApiResponse<CRMContact>>
  abstract createContact(contact: CRMContact): Promise<CRMApiResponse<CRMContact>>
  abstract updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMApiResponse<CRMContact>>
  abstract deleteContact(id: string): Promise<CRMApiResponse<boolean>>

  // Deal/Opportunity management
  abstract getDeals(params?: {
    limit?: number
    cursor?: string
    updatedAfter?: Date
    filter?: Record<string, any>
  }): Promise<CRMApiResponse<CRMDeal[]>>

  abstract getDeal(id: string): Promise<CRMApiResponse<CRMDeal>>
  abstract createDeal(deal: CRMDeal): Promise<CRMApiResponse<CRMDeal>>
  abstract updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMApiResponse<CRMDeal>>
  abstract deleteDeal(id: string): Promise<CRMApiResponse<boolean>>

  // Activity management
  abstract getActivities(params?: {
    limit?: number
    cursor?: string
    contactId?: string
    dealId?: string
    updatedAfter?: Date
  }): Promise<CRMApiResponse<CRMActivity[]>>

  abstract createActivity(activity: CRMActivity): Promise<CRMApiResponse<CRMActivity>>
  abstract updateActivity(id: string, activity: Partial<CRMActivity>): Promise<CRMApiResponse<CRMActivity>>
  abstract deleteActivity(id: string): Promise<CRMApiResponse<boolean>>

  // Webhook management
  abstract createWebhook(url: string, events: string[]): Promise<CRMApiResponse<{ id: string; url: string }>>
  abstract deleteWebhook(webhookId: string): Promise<CRMApiResponse<boolean>>
  abstract processWebhook(payload: any): CRMWebhookPayload

  // Sync operations
  abstract fullSync(): Promise<CRMSyncResult>
  abstract incrementalSync(lastSyncCursor?: string): Promise<CRMSyncResult>

  // Rate limiting and error handling
  protected async handleRateLimit(retryAfter: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
  }

  protected handleApiError(error: any): never {
    console.error(`CRM API Error (${this.connection.provider}):`, error)
    throw new Error(`CRM API Error: ${error.message || 'Unknown error'}`)
  }

  // Utility methods
  protected buildApiUrl(endpoint: string): string {
    return `${this.config.apiBaseUrl}${endpoint}`
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.connection.credentials.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  protected async makeApiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = this.buildApiUrl(endpoint)
    const headers = this.getAuthHeaders()

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    })

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        await this.handleRateLimit(retryAfter)
        return this.makeApiRequest(method, endpoint, data)
      }

      if (response.status === 401) {
        // Token expired, try to refresh
        try {
          await this.refreshToken()
          // Retry the request with new token
          return this.makeApiRequest(method, endpoint, data)
        } catch (refreshError) {
          throw new Error('Authentication failed - unable to refresh token')
        }
      }

      const errorData = await response.json().catch(() => ({}))
      this.handleApiError({
        status: response.status,
        message: errorData.message || response.statusText,
        details: errorData
      })
    }

    return response.json()
  }

  // Field mapping utilities
  protected mapInternalToExternal(internalData: any): any {
    const mappings = this.connection.settings.fieldMappings.filter(
      m => m.direction === 'outbound' || m.direction === 'bidirectional'
    )

    const externalData: any = {}
    
    for (const mapping of mappings) {
      const value = this.getNestedValue(internalData, mapping.internalField)
      if (value !== undefined) {
        const transformedValue = mapping.transformation 
          ? this.applyTransformation(value, mapping.transformation)
          : value
        this.setNestedValue(externalData, mapping.crmField, transformedValue)
      }
    }

    return externalData
  }

  protected mapExternalToInternal(externalData: any): any {
    const mappings = this.connection.settings.fieldMappings.filter(
      m => m.direction === 'inbound' || m.direction === 'bidirectional'
    )

    const internalData: any = {}
    
    for (const mapping of mappings) {
      const value = this.getNestedValue(externalData, mapping.crmField)
      if (value !== undefined) {
        const transformedValue = mapping.transformation 
          ? this.applyTransformation(value, mapping.transformation)
          : value
        this.setNestedValue(internalData, mapping.internalField, transformedValue)
      }
    }

    return internalData
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  private applyTransformation(value: any, transformation: string): any {
    try {
      // Create a safe transformation function
      const transformFunction = new Function('value', `return ${transformation}`)
      return transformFunction(value)
    } catch (error) {
      return value
    }
  }
} 