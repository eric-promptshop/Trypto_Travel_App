// Core types for CRM integration system
export interface CRMConnection {
  id: string
  tenantId: string
  provider: CRMProvider
  credentials: CRMCredentials
  isActive: boolean
  lastSyncAt?: Date
  settings: CRMSettings
}

export enum CRMProvider {
  HUBSPOT = 'hubspot',
  SALESFORCE = 'salesforce',
  ZOHO = 'zoho'
}

export interface CRMCredentials {
  accessToken: string
  refreshToken?: string
  instanceUrl?: string // For Salesforce
  expiresAt?: Date
  scope?: string[]
}

export interface CRMSettings {
  syncDirection: 'inbound' | 'outbound' | 'bidirectional'
  syncFrequency: number // minutes
  fieldMappings: FieldMapping[]
  webhookUrl?: string
  enableRealTimeSync: boolean
}

export interface FieldMapping {
  internalField: string
  crmField: string
  direction: 'inbound' | 'outbound' | 'bidirectional'
  transformation?: string // JS transformation function as string
}

// Unified contact data structure
export interface CRMContact {
  id?: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  jobTitle?: string
  address?: CRMAddress
  customFields?: Record<string, any>
  source?: string
  tags?: string[]
  lastActivity?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface CRMAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

// Deal/Opportunity structure
export interface CRMDeal {
  id?: string
  name: string
  amount?: number
  currency?: string
  stage: string
  probability?: number
  closeDate?: Date
  contactId?: string
  source?: string
  customFields?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

// CRM Activity/Task structure
export interface CRMActivity {
  id?: string
  type: 'call' | 'email' | 'meeting' | 'task' | 'note'
  subject: string
  description?: string
  contactId?: string
  dealId?: string
  dueDate?: Date
  completed?: boolean
  createdAt?: Date
  updatedAt?: Date
}

// API Response structures
export interface CRMApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    hasMore: boolean
    nextCursor?: string
    totalCount?: number
  }
}

export interface CRMSyncResult {
  success: boolean
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  errors?: CRMSyncError[]
  lastSyncCursor?: string
}

export interface CRMSyncError {
  recordId?: string
  error: string
  details?: any
}

// Webhook payload structure
export interface CRMWebhookPayload {
  provider: CRMProvider
  tenantId: string
  eventType: string
  objectType: 'contact' | 'deal' | 'activity'
  objectId: string
  changeType: 'created' | 'updated' | 'deleted'
  data: any
  timestamp: Date
}

// Configuration for each CRM provider
export interface CRMProviderConfig {
  authUrl: string
  tokenUrl: string
  apiBaseUrl: string
  scopes: string[]
  rateLimits: {
    requestsPerSecond: number
    dailyLimit?: number
  }
  webhookSupport: boolean
  supportedObjects: string[]
} 