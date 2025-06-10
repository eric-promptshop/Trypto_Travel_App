import { BaseCRMAdapter } from '../base-crm-adapter'
import {
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMApiResponse,
  CRMSyncResult,
  CRMCredentials,
  CRMProviderConfig,
  CRMWebhookPayload,
  CRMProvider
} from '../types'

interface HubSpotContact {
  id: string
  properties: {
    email?: string
    firstname?: string
    lastname?: string
    phone?: string
    company?: string
    jobtitle?: string
    address?: string
    city?: string
    state?: string
    country?: string
    zip?: string
    createdate?: string
    lastmodifieddate?: string
    hs_object_source?: string
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
}

interface HubSpotDeal {
  id: string
  properties: {
    dealname: string
    amount?: string
    dealstage: string
    probability?: string
    closedate?: string
    pipeline?: string
    dealtype?: string
    description?: string
    createdate?: string
    hs_lastmodifieddate?: string
    [key: string]: any
  }
  associations?: {
    contacts?: { id: string }[]
  }
}

interface HubSpotActivity {
  id: string
  properties: {
    hs_activity_type: string
    hs_subject: string
    hs_body?: string
    hs_activity_date: string
    hs_due_date?: string
    hs_completed?: string
    [key: string]: any
  }
  associations?: {
    contacts?: { id: string }[]
    deals?: { id: string }[]
  }
}

export class HubSpotAdapter extends BaseCRMAdapter {
  private readonly baseUrl = 'https://api.hubapi.com'

  async authenticate(authCode: string): Promise<CRMCredentials> {
    const response = await fetch(`${this.baseUrl}/oauth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code: authCode
      })
    })

    if (!response.ok) {
      throw new Error('Failed to authenticate with HubSpot')
    }

    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope?.split(' ') || []
    }
  }

  async refreshToken(): Promise<CRMCredentials> {
    if (!this.connection.credentials.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${this.baseUrl}/oauth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: this.connection.credentials.refreshToken
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh HubSpot token')
    }

    const data = await response.json()
    
    const newCredentials = {
      ...this.connection.credentials,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.connection.credentials.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    }

    // Update stored credentials
    this.connection.credentials = newCredentials
    
    return newCredentials
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeApiRequest<any>('GET', '/crm/v3/objects/contacts?limit=1')
      return response !== null
    } catch (error) {
      return false
    }
  }

  async getContacts(params?: {
    limit?: number
    cursor?: string
    updatedAfter?: Date
    filter?: Record<string, any>
  }): Promise<CRMApiResponse<CRMContact[]>> {
    try {
      const searchParams = new URLSearchParams({
        limit: (params?.limit || 100).toString()
      })

      if (params?.cursor) {
        searchParams.append('after', params.cursor)
      }

      if (params?.updatedAfter) {
        searchParams.append('lastmodifieddate__gte', params.updatedAfter.toISOString())
      }

      const response = await this.makeApiRequest<{
        results: HubSpotContact[]
        paging?: { next?: { after: string } }
      }>('GET', `/crm/v3/objects/contacts?${searchParams}`)

      const contacts = response.results.map(this.transformHubSpotContactToInternal.bind(this))

      return {
        success: true,
        data: contacts,
        pagination: {
          hasMore: !!response.paging?.next,
          nextCursor: response.paging?.next?.after
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getContact(id: string): Promise<CRMApiResponse<CRMContact>> {
    try {
      const response = await this.makeApiRequest<HubSpotContact>('GET', `/crm/v3/objects/contacts/${id}`)
      const contact = this.transformHubSpotContactToInternal(response)

      return {
        success: true,
        data: contact
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createContact(contact: CRMContact): Promise<CRMApiResponse<CRMContact>> {
    try {
      const hubspotContact = this.transformInternalContactToHubSpot(contact)
      
      const response = await this.makeApiRequest<HubSpotContact>('POST', '/crm/v3/objects/contacts', {
        properties: hubspotContact.properties
      })

      const createdContact = this.transformHubSpotContactToInternal(response)

      return {
        success: true,
        data: createdContact
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMApiResponse<CRMContact>> {
    try {
      const hubspotContact = this.transformInternalContactToHubSpot(contact)
      
      const response = await this.makeApiRequest<HubSpotContact>('PATCH', `/crm/v3/objects/contacts/${id}`, {
        properties: hubspotContact.properties
      })

      const updatedContact = this.transformHubSpotContactToInternal(response)

      return {
        success: true,
        data: updatedContact
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteContact(id: string): Promise<CRMApiResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/crm/v3/objects/contacts/${id}`)

      return {
        success: true,
        data: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getDeals(params?: {
    limit?: number
    cursor?: string
    updatedAfter?: Date
    filter?: Record<string, any>
  }): Promise<CRMApiResponse<CRMDeal[]>> {
    try {
      const searchParams = new URLSearchParams({
        limit: (params?.limit || 100).toString(),
        associations: 'contacts'
      })

      if (params?.cursor) {
        searchParams.append('after', params.cursor)
      }

      const response = await this.makeApiRequest<{
        results: HubSpotDeal[]
        paging?: { next?: { after: string } }
      }>('GET', `/crm/v3/objects/deals?${searchParams}`)

      const deals = response.results.map(this.transformHubSpotDealToInternal.bind(this))

      return {
        success: true,
        data: deals,
        pagination: {
          hasMore: !!response.paging?.next,
          nextCursor: response.paging?.next?.after
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getDeal(id: string): Promise<CRMApiResponse<CRMDeal>> {
    try {
      const response = await this.makeApiRequest<HubSpotDeal>('GET', `/crm/v3/objects/deals/${id}?associations=contacts`)
      const deal = this.transformHubSpotDealToInternal(response)

      return {
        success: true,
        data: deal
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createDeal(deal: CRMDeal): Promise<CRMApiResponse<CRMDeal>> {
    try {
      const hubspotDeal = this.transformInternalDealToHubSpot(deal)
      
      const response = await this.makeApiRequest<HubSpotDeal>('POST', '/crm/v3/objects/deals', {
        properties: hubspotDeal.properties
      })

      const createdDeal = this.transformHubSpotDealToInternal(response)

      return {
        success: true,
        data: createdDeal
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMApiResponse<CRMDeal>> {
    try {
      const hubspotDeal = this.transformInternalDealToHubSpot(deal)
      
      const response = await this.makeApiRequest<HubSpotDeal>('PATCH', `/crm/v3/objects/deals/${id}`, {
        properties: hubspotDeal.properties
      })

      const updatedDeal = this.transformHubSpotDealToInternal(response)

      return {
        success: true,
        data: updatedDeal
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteDeal(id: string): Promise<CRMApiResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/crm/v3/objects/deals/${id}`)

      return {
        success: true,
        data: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getActivities(params?: {
    limit?: number
    cursor?: string
    contactId?: string
    dealId?: string
    updatedAfter?: Date
  }): Promise<CRMApiResponse<CRMActivity[]>> {
    try {
      const searchParams = new URLSearchParams({
        limit: (params?.limit || 100).toString(),
        associations: 'contacts,deals'
      })

      if (params?.cursor) {
        searchParams.append('after', params.cursor)
      }

      const response = await this.makeApiRequest<{
        results: HubSpotActivity[]
        paging?: { next?: { after: string } }
      }>('GET', `/crm/v3/objects/activities?${searchParams}`)

      let activities = response.results.map(this.transformHubSpotActivityToInternal.bind(this))

      // Filter by contact or deal if specified
      if (params?.contactId) {
        activities = activities.filter(a => a.contactId === params.contactId)
      }
      if (params?.dealId) {
        activities = activities.filter(a => a.dealId === params.dealId)
      }

      return {
        success: true,
        data: activities,
        pagination: {
          hasMore: !!response.paging?.next,
          nextCursor: response.paging?.next?.after
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createActivity(activity: CRMActivity): Promise<CRMApiResponse<CRMActivity>> {
    try {
      const hubspotActivity = this.transformInternalActivityToHubSpot(activity)
      
      const response = await this.makeApiRequest<HubSpotActivity>('POST', '/crm/v3/objects/activities', {
        properties: hubspotActivity.properties
      })

      const createdActivity = this.transformHubSpotActivityToInternal(response)

      return {
        success: true,
        data: createdActivity
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateActivity(id: string, activity: Partial<CRMActivity>): Promise<CRMApiResponse<CRMActivity>> {
    try {
      const hubspotActivity = this.transformInternalActivityToHubSpot(activity)
      
      const response = await this.makeApiRequest<HubSpotActivity>('PATCH', `/crm/v3/objects/activities/${id}`, {
        properties: hubspotActivity.properties
      })

      const updatedActivity = this.transformHubSpotActivityToInternal(response)

      return {
        success: true,
        data: updatedActivity
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteActivity(id: string): Promise<CRMApiResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/crm/v3/objects/activities/${id}`)

      return {
        success: true,
        data: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createWebhook(url: string, events: string[]): Promise<CRMApiResponse<{ id: string; url: string }>> {
    try {
      const response = await this.makeApiRequest<any>('POST', '/webhooks/v3/subscriptions', {
        eventType: events.join(','),
        webhookUrl: url,
        active: true
      })

      return {
        success: true,
        data: {
          id: response.id,
          url: response.webhookUrl
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteWebhook(webhookId: string): Promise<CRMApiResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/webhooks/v3/subscriptions/${webhookId}`)

      return {
        success: true,
        data: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  processWebhook(payload: any): CRMWebhookPayload {
    return {
      provider: CRMProvider.HUBSPOT,
      tenantId: this.connection.tenantId,
      eventType: payload.subscriptionType,
      objectType: payload.objectType,
      objectId: payload.objectId.toString(),
      changeType: payload.changeType,
      data: payload,
      timestamp: new Date(payload.occurredAt)
    }
  }

  async fullSync(): Promise<CRMSyncResult> {
    // Implementation for full synchronization
    const result: CRMSyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: []
    }

    try {
      // Sync contacts, deals, and activities
      await this.syncContacts(result)
      await this.syncDeals(result)
      await this.syncActivities(result)
    } catch (error: any) {
      result.success = false
      result.errors?.push({
        error: error.message
      })
    }

    return result
  }

  async incrementalSync(lastSyncCursor?: string): Promise<CRMSyncResult> {
    // Implementation for incremental synchronization
    return this.fullSync() // Simplified for now
  }

  // Protected utility methods for overriding base class behavior
  protected buildApiUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.connection.credentials.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  // Private transformation methods
  private transformHubSpotContactToInternal(hubspotContact: HubSpotContact): CRMContact {
    const props = hubspotContact.properties

    return {
      id: hubspotContact.id,
      email: props.email || '',
      firstName: props.firstname,
      lastName: props.lastname,
      phone: props.phone,
      company: props.company,
      jobTitle: props.jobtitle,
      address: props.address ? {
        street: props.address,
        city: props.city,
        state: props.state,
        country: props.country,
        postalCode: props.zip
      } : undefined,
      source: props.hs_object_source,
      customFields: this.mapExternalToInternal(props),
      createdAt: props.createdate ? new Date(props.createdate) : undefined,
      updatedAt: props.lastmodifieddate ? new Date(props.lastmodifieddate) : undefined
    }
  }

  private transformInternalContactToHubSpot(contact: Partial<CRMContact>): Partial<HubSpotContact> {
    const properties: any = {}

    if (contact.email) properties.email = contact.email
    if (contact.firstName) properties.firstname = contact.firstName
    if (contact.lastName) properties.lastname = contact.lastName
    if (contact.phone) properties.phone = contact.phone
    if (contact.company) properties.company = contact.company
    if (contact.jobTitle) properties.jobtitle = contact.jobTitle
    
    if (contact.address) {
      if (contact.address.street) properties.address = contact.address.street
      if (contact.address.city) properties.city = contact.address.city
      if (contact.address.state) properties.state = contact.address.state
      if (contact.address.country) properties.country = contact.address.country
      if (contact.address.postalCode) properties.zip = contact.address.postalCode
    }

    // Apply field mappings
    const mappedFields = this.mapInternalToExternal(contact)
    Object.assign(properties, mappedFields)

    return { properties }
  }

  private transformHubSpotDealToInternal(hubspotDeal: HubSpotDeal): CRMDeal {
    const props = hubspotDeal.properties

    return {
      id: hubspotDeal.id,
      name: props.dealname,
      amount: props.amount ? parseFloat(props.amount) : undefined,
      stage: props.dealstage,
      probability: props.probability ? parseFloat(props.probability) : undefined,
      closeDate: props.closedate ? new Date(props.closedate) : undefined,
      contactId: hubspotDeal.associations?.contacts?.[0]?.id,
      customFields: this.mapExternalToInternal(props),
      createdAt: props.createdate ? new Date(props.createdate) : undefined,
      updatedAt: props.hs_lastmodifieddate ? new Date(props.hs_lastmodifieddate) : undefined
    }
  }

  private transformInternalDealToHubSpot(deal: Partial<CRMDeal>): Partial<HubSpotDeal> {
    const properties: any = {}

    if (deal.name) properties.dealname = deal.name
    if (deal.amount) properties.amount = deal.amount.toString()
    if (deal.stage) properties.dealstage = deal.stage
    if (deal.probability) properties.probability = deal.probability.toString()
    if (deal.closeDate) properties.closedate = deal.closeDate.toISOString()

    // Apply field mappings
    const mappedFields = this.mapInternalToExternal(deal)
    Object.assign(properties, mappedFields)

    return { properties }
  }

  private transformHubSpotActivityToInternal(hubspotActivity: HubSpotActivity): CRMActivity {
    const props = hubspotActivity.properties

    return {
      id: hubspotActivity.id,
      type: this.mapHubSpotActivityType(props.hs_activity_type),
      subject: props.hs_subject,
      description: props.hs_body,
      contactId: hubspotActivity.associations?.contacts?.[0]?.id,
      dealId: hubspotActivity.associations?.deals?.[0]?.id,
      dueDate: props.hs_due_date ? new Date(props.hs_due_date) : undefined,
      completed: props.hs_completed === 'true',
      createdAt: new Date(props.hs_activity_date),
      updatedAt: new Date(props.hs_activity_date)
    }
  }

  private transformInternalActivityToHubSpot(activity: Partial<CRMActivity>): Partial<HubSpotActivity> {
    const properties: any = {}

    if (activity.type) properties.hs_activity_type = this.mapInternalActivityTypeToHubSpot(activity.type)
    if (activity.subject) properties.hs_subject = activity.subject
    if (activity.description) properties.hs_body = activity.description
    if (activity.dueDate) properties.hs_due_date = activity.dueDate.toISOString()
    if (activity.completed !== undefined) properties.hs_completed = activity.completed.toString()

    return { properties }
  }

  private mapHubSpotActivityType(hubspotType: string): CRMActivity['type'] {
    const typeMap: Record<string, CRMActivity['type']> = {
      'CALL': 'call',
      'EMAIL': 'email',
      'MEETING': 'meeting',
      'TASK': 'task',
      'NOTE': 'note'
    }
    return typeMap[hubspotType] || 'note'
  }

  private mapInternalActivityTypeToHubSpot(internalType: CRMActivity['type']): string {
    const typeMap: Record<CRMActivity['type'], string> = {
      'call': 'CALL',
      'email': 'EMAIL',
      'meeting': 'MEETING',
      'task': 'TASK',
      'note': 'NOTE'
    }
    return typeMap[internalType] || 'NOTE'
  }

  private async syncContacts(result: CRMSyncResult): Promise<void> {
    // Implementation for contact synchronization
    // This would fetch contacts from HubSpot and sync with internal database
  }

  private async syncDeals(result: CRMSyncResult): Promise<void> {
    // Implementation for deal synchronization
  }

  private async syncActivities(result: CRMSyncResult): Promise<void> {
    // Implementation for activity synchronization
  }
} 