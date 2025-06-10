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
  CRMProvider,
  CRMConnection
} from '../types'

interface ZohoContact {
  id: string
  Email?: string
  First_Name?: string
  Last_Name?: string
  Phone?: string
  Account_Name?: {
    name?: string
  }
  Title?: string
  Mailing_Street?: string
  Mailing_City?: string
  Mailing_State?: string
  Mailing_Country?: string
  Mailing_Zip?: string
  Created_Time: string
  Modified_Time: string
  Lead_Source?: string
  [key: string]: any
}

interface ZohoDeal {
  id: string
  Deal_Name: string
  Amount?: number
  Stage: string
  Probability?: number
  Closing_Date?: string
  Account_Name?: {
    id?: string
    name?: string
  }
  Contact_Name?: {
    id?: string
    name?: string
  }
  Created_Time: string
  Modified_Time: string
  [key: string]: any
}

interface ZohoActivity {
  id: string
  Activity_Type?: string
  Subject: string
  Description?: string
  Who_Id?: {
    id?: string
    name?: string
  }
  What_Id?: {
    id?: string
    name?: string
  }
  Due_Date?: string
  Status?: string
  Created_Time: string
  Modified_Time: string
  [key: string]: any
}

export class ZohoAdapter extends BaseCRMAdapter {
  constructor(connection: CRMConnection, config: CRMProviderConfig) {
    super(connection, config)
  }

  async authenticate(authCode: string): Promise<CRMCredentials> {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        redirect_uri: process.env.ZOHO_REDIRECT_URI!,
        code: authCode
      })
    })

    if (!response.ok) {
      throw new Error('Failed to authenticate with Zoho')
    }

    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope?.split(' ') || []
    }
  }

  async refreshToken(): Promise<CRMCredentials> {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        refresh_token: this.connection.credentials.refreshToken!
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Zoho token')
    }

    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: this.connection.credentials.refreshToken!, // Zoho doesn't always return new refresh token
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope?.split(' ') || []
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeApiRequest<any>('GET', '/Contacts')
      return true
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
      const searchParams = new URLSearchParams()
      
      if (params?.limit) {
        searchParams.append('per_page', params.limit.toString())
      }
      
      if (params?.cursor) {
        searchParams.append('page', params.cursor)
      }
      
      if (params?.updatedAfter) {
        searchParams.append('modified_since', params.updatedAfter.toISOString())
      }

      const response = await this.makeApiRequest<{
        data: ZohoContact[]
        info: {
          per_page: number
          count: number
          page: number
          more_records: boolean
        }
      }>('GET', `/Contacts?${searchParams.toString()}`)

      const contacts = response.data.map(this.transformZohoContactToInternal.bind(this))

      return {
        success: true,
        data: contacts,
        pagination: {
          hasMore: response.info.more_records,
          nextCursor: response.info.more_records ? (response.info.page + 1).toString() : undefined
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
      const response = await this.makeApiRequest<{ data: ZohoContact[] }>('GET', `/Contacts/${id}`)
      const contact = this.transformZohoContactToInternal(response.data[0])

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
      const zohoContact = this.transformInternalContactToZoho(contact)
      
      const response = await this.makeApiRequest<{
        data: Array<{ code: string; details: { id: string } }>
      }>('POST', '/Contacts', { data: [zohoContact] })

      if (response.data[0].code !== 'SUCCESS') {
        throw new Error('Failed to create contact')
      }

      // Fetch the created contact to return full data
      const createdContact = await this.getContact(response.data[0].details.id)
      
      return createdContact
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMApiResponse<CRMContact>> {
    try {
      const zohoContact = this.transformInternalContactToZoho(contact)
      
      await this.makeApiRequest<void>('PUT', `/Contacts/${id}`, { data: [zohoContact] })

      // Fetch the updated contact to return full data
      const updatedContact = await this.getContact(id)
      
      return updatedContact
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteContact(id: string): Promise<CRMApiResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/Contacts/${id}`)

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
      const searchParams = new URLSearchParams()
      
      if (params?.limit) {
        searchParams.append('per_page', params.limit.toString())
      }
      
      if (params?.cursor) {
        searchParams.append('page', params.cursor)
      }
      
      if (params?.updatedAfter) {
        searchParams.append('modified_since', params.updatedAfter.toISOString())
      }

      const response = await this.makeApiRequest<{
        data: ZohoDeal[]
        info: {
          per_page: number
          count: number
          page: number
          more_records: boolean
        }
      }>('GET', `/Deals?${searchParams.toString()}`)

      const deals = response.data.map(this.transformZohoDealToInternal.bind(this))

      return {
        success: true,
        data: deals,
        pagination: {
          hasMore: response.info.more_records,
          nextCursor: response.info.more_records ? (response.info.page + 1).toString() : undefined
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
      const response = await this.makeApiRequest<{ data: ZohoDeal[] }>('GET', `/Deals/${id}`)
      const deal = this.transformZohoDealToInternal(response.data[0])

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
      const zohoDeal = this.transformInternalDealToZoho(deal)
      
      const response = await this.makeApiRequest<{
        data: Array<{ code: string; details: { id: string } }>
      }>('POST', '/Deals', { data: [zohoDeal] })

      if (response.data[0].code !== 'SUCCESS') {
        throw new Error('Failed to create deal')
      }

      // Fetch the created deal to return full data
      const createdDeal = await this.getDeal(response.data[0].details.id)
      
      return createdDeal
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMApiResponse<CRMDeal>> {
    try {
      const zohoDeal = this.transformInternalDealToZoho(deal)
      
      await this.makeApiRequest<void>('PUT', `/Deals/${id}`, { data: [zohoDeal] })

      // Fetch the updated deal to return full data
      const updatedDeal = await this.getDeal(id)
      
      return updatedDeal
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteDeal(id: string): Promise<CRMApiResponse<boolean>> {
    try {
      await this.makeApiRequest<void>('DELETE', `/Deals/${id}`)

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
      const searchParams = new URLSearchParams()
      
      if (params?.limit) {
        searchParams.append('per_page', params.limit.toString())
      }
      
      if (params?.cursor) {
        searchParams.append('page', params.cursor)
      }
      
      if (params?.updatedAfter) {
        searchParams.append('modified_since', params.updatedAfter.toISOString())
      }

      const response = await this.makeApiRequest<{
        data: ZohoActivity[]
        info: {
          per_page: number
          count: number
          page: number
          more_records: boolean
        }
      }>('GET', `/Activities?${searchParams.toString()}`)

      const activities = response.data.map(this.transformZohoActivityToInternal.bind(this))

      return {
        success: true,
        data: activities,
        pagination: {
          hasMore: response.info.more_records,
          nextCursor: response.info.more_records ? (response.info.page + 1).toString() : undefined
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
      const zohoActivity = this.transformInternalActivityToZoho(activity)
      
      const response = await this.makeApiRequest<{
        data: Array<{ code: string; details: { id: string } }>
      }>('POST', '/Activities', { data: [zohoActivity] })

      if (response.data[0].code !== 'SUCCESS') {
        throw new Error('Failed to create activity')
      }

      // Fetch the created activity to return full data
      const createdActivity = await this.getActivity(response.data[0].details.id)
      
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
      const zohoActivity = this.transformInternalActivityToZoho(activity)
      
      await this.makeApiRequest<void>('PUT', `/Activities/${id}`, { data: [zohoActivity] })

      // Fetch the updated activity to return full data
      const updatedActivity = await this.getActivity(id)
      
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
      await this.makeApiRequest<void>('DELETE', `/Activities/${id}`)

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
      const response = await this.makeApiRequest<{
        data: Array<{ code: string; details: { id: string } }>
      }>('POST', '/actions/webhook', {
        data: [{
          name: 'Travel Itinerary Webhook',
          url: url,
          events: events,
          trigger: ['create', 'edit', 'delete']
        }]
      })

      if (response.data[0].code !== 'SUCCESS') {
        throw new Error('Failed to create webhook')
      }

      return {
        success: true,
        data: {
          id: response.data[0].details.id,
          url: url
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
      await this.makeApiRequest<void>('DELETE', `/actions/webhook/${webhookId}`)

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
    // Zoho webhook payload structure
    return {
      provider: CRMProvider.ZOHO,
      tenantId: this.connection.tenantId,
      eventType: payload.event_type || 'change',
      objectType: this.mapZohoObjectType(payload.module),
      objectId: payload.id || payload.record_id,
      changeType: this.mapZohoChangeType(payload.operation),
      data: payload,
      timestamp: new Date(payload.modified_time || Date.now())
    }
  }

  async fullSync(): Promise<CRMSyncResult> {
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

  async incrementalSync(cursor?: string): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: []
    }

    const lastSyncDate = cursor ? new Date(cursor) : new Date(Date.now() - 24 * 60 * 60 * 1000) // Default: last 24 hours

    try {
      // Sync updated records since last sync
      await this.syncContacts(result, lastSyncDate)
      await this.syncDeals(result, lastSyncDate)
      await this.syncActivities(result, lastSyncDate)
      
      result.lastSyncCursor = new Date().toISOString()
    } catch (error: any) {
      result.success = false
      result.errors?.push({
        error: error.message
      })
    }

    return result
  }

  // Helper method to get activity by ID
  private async getActivity(id: string): Promise<CRMActivity> {
    const response = await this.makeApiRequest<{ data: ZohoActivity[] }>('GET', `/Activities/${id}`)
    return this.transformZohoActivityToInternal(response.data[0])
  }

  // Private transformation methods
  private transformZohoContactToInternal(zohoContact: ZohoContact): CRMContact {
    return {
      id: zohoContact.id,
      email: zohoContact.Email || '',
      firstName: zohoContact.First_Name,
      lastName: zohoContact.Last_Name,
      phone: zohoContact.Phone,
      company: zohoContact.Account_Name?.name,
      jobTitle: zohoContact.Title,
      address: zohoContact.Mailing_Street ? {
        street: zohoContact.Mailing_Street,
        city: zohoContact.Mailing_City,
        state: zohoContact.Mailing_State,
        country: zohoContact.Mailing_Country,
        postalCode: zohoContact.Mailing_Zip
      } : undefined,
      source: zohoContact.Lead_Source,
      customFields: this.mapExternalToInternal(zohoContact),
      createdAt: new Date(zohoContact.Created_Time),
      updatedAt: new Date(zohoContact.Modified_Time)
    }
  }

  private transformInternalContactToZoho(contact: Partial<CRMContact>): Partial<ZohoContact> {
    const zohoContact: any = {}

    if (contact.email) zohoContact.Email = contact.email
    if (contact.firstName) zohoContact.First_Name = contact.firstName
    if (contact.lastName) zohoContact.Last_Name = contact.lastName
    if (contact.phone) zohoContact.Phone = contact.phone
    if (contact.jobTitle) zohoContact.Title = contact.jobTitle
    
    if (contact.address) {
      if (contact.address.street) zohoContact.Mailing_Street = contact.address.street
      if (contact.address.city) zohoContact.Mailing_City = contact.address.city
      if (contact.address.state) zohoContact.Mailing_State = contact.address.state
      if (contact.address.country) zohoContact.Mailing_Country = contact.address.country
      if (contact.address.postalCode) zohoContact.Mailing_Zip = contact.address.postalCode
    }

    // Apply field mappings
    const mappedFields = this.mapInternalToExternal(contact)
    Object.assign(zohoContact, mappedFields)

    return zohoContact
  }

  private transformZohoDealToInternal(zohoDeal: ZohoDeal): CRMDeal {
    return {
      id: zohoDeal.id,
      name: zohoDeal.Deal_Name,
      amount: zohoDeal.Amount,
      stage: zohoDeal.Stage,
      probability: zohoDeal.Probability,
      closeDate: zohoDeal.Closing_Date ? new Date(zohoDeal.Closing_Date) : undefined,
      contactId: zohoDeal.Contact_Name?.id,
      customFields: this.mapExternalToInternal(zohoDeal),
      createdAt: new Date(zohoDeal.Created_Time),
      updatedAt: new Date(zohoDeal.Modified_Time)
    }
  }

  private transformInternalDealToZoho(deal: Partial<CRMDeal>): Partial<ZohoDeal> {
    const zohoDeal: any = {}

    if (deal.name) zohoDeal.Deal_Name = deal.name
    if (deal.amount) zohoDeal.Amount = deal.amount
    if (deal.stage) zohoDeal.Stage = deal.stage
    if (deal.probability) zohoDeal.Probability = deal.probability
    if (deal.closeDate) zohoDeal.Closing_Date = deal.closeDate.toISOString().split('T')[0]

    // Apply field mappings
    const mappedFields = this.mapInternalToExternal(deal)
    Object.assign(zohoDeal, mappedFields)

    return zohoDeal
  }

  private transformZohoActivityToInternal(zohoActivity: ZohoActivity): CRMActivity {
    return {
      id: zohoActivity.id,
      type: this.mapZohoActivityType(zohoActivity.Activity_Type),
      subject: zohoActivity.Subject,
      description: zohoActivity.Description,
      contactId: zohoActivity.Who_Id?.id,
      dealId: zohoActivity.What_Id?.id,
      dueDate: zohoActivity.Due_Date ? new Date(zohoActivity.Due_Date) : undefined,
      completed: zohoActivity.Status === 'Completed',
      createdAt: new Date(zohoActivity.Created_Time),
      updatedAt: new Date(zohoActivity.Modified_Time)
    }
  }

  private transformInternalActivityToZoho(activity: Partial<CRMActivity>): Partial<ZohoActivity> {
    const zohoActivity: any = {}

    if (activity.type) zohoActivity.Activity_Type = this.mapInternalActivityTypeToZoho(activity.type)
    if (activity.subject) zohoActivity.Subject = activity.subject
    if (activity.description) zohoActivity.Description = activity.description
    if (activity.contactId) zohoActivity.Who_Id = { id: activity.contactId }
    if (activity.dealId) zohoActivity.What_Id = { id: activity.dealId }
    if (activity.dueDate) zohoActivity.Due_Date = activity.dueDate.toISOString().split('T')[0]
    if (activity.completed !== undefined) zohoActivity.Status = activity.completed ? 'Completed' : 'In Progress'

    return zohoActivity
  }

  private mapZohoActivityType(zohoType?: string): CRMActivity['type'] {
    const typeMap: Record<string, CRMActivity['type']> = {
      'Call': 'call',
      'Email': 'email',
      'Meeting': 'meeting',
      'Task': 'task',
      'Other': 'note'
    }
    return typeMap[zohoType || 'Other'] || 'note'
  }

  private mapInternalActivityTypeToZoho(internalType: CRMActivity['type']): string {
    const typeMap: Record<CRMActivity['type'], string> = {
      'call': 'Call',
      'email': 'Email',
      'meeting': 'Meeting',
      'task': 'Task',
      'note': 'Other'
    }
    return typeMap[internalType] || 'Other'
  }

  private mapZohoObjectType(module: string): 'contact' | 'deal' | 'activity' {
    const typeMap: Record<string, 'contact' | 'deal' | 'activity'> = {
      'Contacts': 'contact',
      'Deals': 'deal',
      'Activities': 'activity',
      'Tasks': 'activity',
      'Events': 'activity'
    }
    return typeMap[module] || 'contact'
  }

  private mapZohoChangeType(operation: string): 'created' | 'updated' | 'deleted' {
    const changeMap: Record<string, 'created' | 'updated' | 'deleted'> = {
      'insert': 'created',
      'update': 'updated',
      'delete': 'deleted'
    }
    return changeMap[operation] || 'updated'
  }

  private async syncContacts(result: CRMSyncResult, updatedAfter?: Date): Promise<void> {
    // Implementation for contact synchronization
    // This would fetch contacts from Zoho and sync with internal database
  }

  private async syncDeals(result: CRMSyncResult, updatedAfter?: Date): Promise<void> {
    // Implementation for deal synchronization
  }

  private async syncActivities(result: CRMSyncResult, updatedAfter?: Date): Promise<void> {
    // Implementation for activity synchronization
  }
} 