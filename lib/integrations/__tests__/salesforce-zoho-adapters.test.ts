import { SalesforceAdapter } from '../providers/salesforce-adapter'
import { ZohoAdapter } from '../providers/zoho-adapter'
import {
  CRMProvider,
  CRMConnection,
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMProviderConfig
} from '../types'

// Mock environment variables
process.env.SALESFORCE_CLIENT_ID = 'salesforce-client-id'
process.env.SALESFORCE_CLIENT_SECRET = 'salesforce-client-secret'
process.env.SALESFORCE_REDIRECT_URI = 'http://localhost:3000/callback/salesforce'

process.env.ZOHO_CLIENT_ID = 'zoho-client-id'
process.env.ZOHO_CLIENT_SECRET = 'zoho-client-secret'
process.env.ZOHO_REDIRECT_URI = 'http://localhost:3000/callback/zoho'

// Mock fetch globally
global.fetch = jest.fn()

describe('CRM Adapters - Salesforce & Zoho', () => {
  const mockSalesforceConnection: CRMConnection = {
    id: 'salesforce-connection-id',
    tenantId: 'test-tenant-id',
    provider: CRMProvider.SALESFORCE,
    credentials: {
      accessToken: 'sf-access-token',
      refreshToken: 'sf-refresh-token',
      expiresAt: new Date(Date.now() + 3600000),
      instanceUrl: 'https://test.salesforce.com'
    },
    isActive: true,
    settings: {
      syncDirection: 'bidirectional',
      syncFrequency: 60,
      fieldMappings: [],
      enableRealTimeSync: true
    }
  }

  const mockZohoConnection: CRMConnection = {
    id: 'zoho-connection-id',
    tenantId: 'test-tenant-id',
    provider: CRMProvider.ZOHO,
    credentials: {
      accessToken: 'zoho-access-token',
      refreshToken: 'zoho-refresh-token',
      expiresAt: new Date(Date.now() + 3600000)
    },
    isActive: true,
    settings: {
      syncDirection: 'bidirectional',
      syncFrequency: 60,
      fieldMappings: [],
      enableRealTimeSync: true
    }
  }

  const salesforceConfig: CRMProviderConfig = {
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    apiBaseUrl: 'https://test.salesforce.com/services/data/v60.0',
    scopes: ['api', 'refresh_token'],
    rateLimits: {
      requestsPerSecond: 20,
      dailyLimit: 100000
    },
    webhookSupport: true,
    supportedObjects: ['contacts', 'opportunities', 'tasks']
  }

  const zohoConfig: CRMProviderConfig = {
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    apiBaseUrl: 'https://www.zohoapis.com/crm/v3',
    scopes: ['ZohoCRM.modules.ALL'],
    rateLimits: {
      requestsPerSecond: 10,
      dailyLimit: 200000
    },
    webhookSupport: true,
    supportedObjects: ['contacts', 'deals', 'activities']
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SalesforceAdapter', () => {
    let adapter: SalesforceAdapter

    beforeEach(() => {
      adapter = new SalesforceAdapter(mockSalesforceConnection, salesforceConfig)
    })

    describe('Authentication', () => {
      it('should authenticate with authorization code', async () => {
        const mockResponse = {
          access_token: 'new-sf-token',
          refresh_token: 'new-sf-refresh',
          expires_in: 3600,
          instance_url: 'https://test.salesforce.com'
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const credentials = await adapter.authenticate('sf-auth-code')

        expect(credentials.accessToken).toBe('new-sf-token')
        expect(credentials.refreshToken).toBe('new-sf-refresh')
        expect(fetch).toHaveBeenCalledWith(
          'https://login.salesforce.com/services/oauth2/token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        )
      })

      it('should validate credentials', async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'Contact' })
        })

        const isValid = await adapter.validateCredentials()
        expect(isValid).toBe(true)
      })
    })

    describe('Contact Management', () => {
      const mockSalesforceContact = {
        Id: 'sf-contact-123',
        Email: 'test@example.com',
        FirstName: 'John',
        LastName: 'Doe',
        Phone: '+1234567890',
        Account: { Name: 'Test Company' },
        Title: 'Developer',
        CreatedDate: '2023-01-01T00:00:00.000Z',
        LastModifiedDate: '2023-01-01T00:00:00.000Z'
      }

      it('should get contacts', async () => {
        const mockResponse = {
          records: [mockSalesforceContact],
          totalSize: 1,
          done: true
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await adapter.getContacts({ limit: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data![0].email).toBe('test@example.com')
        expect(result.data![0].firstName).toBe('John')
        expect(result.data![0].lastName).toBe('Doe')
      })

      it('should create a contact', async () => {
        const newContact: CRMContact = {
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        }

        // Mock create response
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'new-sf-contact', success: true })
        })

        // Mock get contact response for returning created contact
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            Id: 'new-sf-contact',
            Email: 'new@example.com',
            FirstName: 'Jane',
            LastName: 'Smith',
            CreatedDate: '2023-01-01T00:00:00.000Z',
            LastModifiedDate: '2023-01-01T00:00:00.000Z'
          })
        })

        const result = await adapter.createContact(newContact)

        expect(result.success).toBe(true)
        expect(result.data?.email).toBe('new@example.com')
      })
    })

    describe('Deal Management', () => {
      const mockSalesforceOpportunity = {
        Id: 'sf-opp-123',
        Name: 'Test Deal',
        Amount: 10000,
        StageName: 'Prospecting',
        Probability: 25,
        CloseDate: '2023-12-31',
        CreatedDate: '2023-01-01T00:00:00.000Z',
        LastModifiedDate: '2023-01-01T00:00:00.000Z'
      }

      it('should get deals', async () => {
        const mockResponse = {
          records: [mockSalesforceOpportunity],
          totalSize: 1,
          done: true
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await adapter.getDeals({ limit: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data![0].name).toBe('Test Deal')
        expect(result.data![0].amount).toBe(10000)
      })
    })

    describe('Webhook Processing', () => {
      it('should process webhooks correctly', () => {
        const mockPayload = {
          eventType: 'change',
          sobjectType: 'Contact',
          recordId: 'contact-123',
          changeType: 'CREATE',
          CreatedDate: '2023-01-01T00:00:00.000Z'
        }

        const webhookData = adapter.processWebhook(mockPayload)

        expect(webhookData.provider).toBe(CRMProvider.SALESFORCE)
        expect(webhookData.objectType).toBe('contact')
        expect(webhookData.changeType).toBe('created')
      })
    })
  })

  describe('ZohoAdapter', () => {
    let adapter: ZohoAdapter

    beforeEach(() => {
      adapter = new ZohoAdapter(mockZohoConnection, zohoConfig)
    })

    describe('Authentication', () => {
      it('should authenticate with authorization code', async () => {
        const mockResponse = {
          access_token: 'new-zoho-token',
          refresh_token: 'new-zoho-refresh',
          expires_in: 3600,
          scope: 'ZohoCRM.modules.ALL'
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const credentials = await adapter.authenticate('zoho-auth-code')

        expect(credentials.accessToken).toBe('new-zoho-token')
        expect(credentials.refreshToken).toBe('new-zoho-refresh')
        expect(fetch).toHaveBeenCalledWith(
          'https://accounts.zoho.com/oauth/v2/token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        )
      })

      it('should validate credentials', async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })

        const isValid = await adapter.validateCredentials()
        expect(isValid).toBe(true)
      })
    })

    describe('Contact Management', () => {
      const mockZohoContact = {
        id: 'zoho-contact-123',
        Email: 'test@example.com',
        First_Name: 'John',
        Last_Name: 'Doe',
        Phone: '+1234567890',
        Account_Name: { name: 'Test Company' },
        Title: 'Developer',
        Created_Time: '2023-01-01T00:00:00.000Z',
        Modified_Time: '2023-01-01T00:00:00.000Z'
      }

      it('should get contacts', async () => {
        const mockResponse = {
          data: [mockZohoContact],
          info: {
            per_page: 10,
            count: 1,
            page: 1,
            more_records: false
          }
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await adapter.getContacts({ limit: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data![0].email).toBe('test@example.com')
        expect(result.data![0].firstName).toBe('John')
        expect(result.data![0].lastName).toBe('Doe')
      })

      it('should create a contact', async () => {
        const newContact: CRMContact = {
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        }

        // Mock create response
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ code: 'SUCCESS', details: { id: 'new-zoho-contact' } }]
          })
        })

        // Mock get contact response for returning created contact
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{
              id: 'new-zoho-contact',
              Email: 'new@example.com',
              First_Name: 'Jane',
              Last_Name: 'Smith',
              Created_Time: '2023-01-01T00:00:00.000Z',
              Modified_Time: '2023-01-01T00:00:00.000Z'
            }]
          })
        })

        const result = await adapter.createContact(newContact)

        expect(result.success).toBe(true)
        expect(result.data?.email).toBe('new@example.com')
      })
    })

    describe('Deal Management', () => {
      const mockZohoDeal = {
        id: 'zoho-deal-123',
        Deal_Name: 'Test Deal',
        Amount: 10000,
        Stage: 'Prospecting',
        Probability: 25,
        Closing_Date: '2023-12-31',
        Created_Time: '2023-01-01T00:00:00.000Z',
        Modified_Time: '2023-01-01T00:00:00.000Z'
      }

      it('should get deals', async () => {
        const mockResponse = {
          data: [mockZohoDeal],
          info: {
            per_page: 10,
            count: 1,
            page: 1,
            more_records: false
          }
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await adapter.getDeals({ limit: 10 })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data![0].name).toBe('Test Deal')
        expect(result.data![0].amount).toBe(10000)
      })
    })

    describe('Webhook Processing', () => {
      it('should process webhooks correctly', () => {
        const mockPayload = {
          event_type: 'change',
          module: 'Contacts',
          id: 'contact-123',
          operation: 'insert',
          modified_time: '2023-01-01T00:00:00.000Z'
        }

        const webhookData = adapter.processWebhook(mockPayload)

        expect(webhookData.provider).toBe(CRMProvider.ZOHO)
        expect(webhookData.objectType).toBe('contact')
        expect(webhookData.changeType).toBe('created')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle error responses gracefully', async () => {
      const adapter = new SalesforceAdapter(mockSalesforceConnection, salesforceConfig)

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const result = await adapter.getContacts()
      expect(result.success).toBe(false)
      expect(result.error).toContain('HTTP error')
    })

    it('should handle network errors', async () => {
      const adapter = new ZohoAdapter(mockZohoConnection, zohoConfig)

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.getContacts()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })
}) 