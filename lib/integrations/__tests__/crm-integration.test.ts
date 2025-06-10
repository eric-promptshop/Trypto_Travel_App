import { HubSpotAdapter } from '../providers/hubspot-adapter'
import { CRMManager } from '../crm-manager'
import {
  CRMProvider,
  CRMConnection,
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMProviderConfig
} from '../types'

// Mock environment variables
process.env.HUBSPOT_CLIENT_ID = 'test-client-id'
process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret'
process.env.HUBSPOT_REDIRECT_URI = 'http://localhost:3000/callback'

// Mock fetch globally
global.fetch = jest.fn()

// Mock Prisma
jest.mock('../../prisma', () => ({
  prisma: {
    crmIntegration: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}))

import { prisma } from '../../prisma'

describe('CRM Integration System', () => {
  const mockConnection: CRMConnection = {
    id: 'test-connection-id',
    tenantId: 'test-tenant-id',
    provider: CRMProvider.HUBSPOT,
    credentials: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 3600000)
    },
    isActive: true,
    settings: {
      syncDirection: 'bidirectional',
      syncFrequency: 60,
      fieldMappings: [
        {
          internalField: 'email',
          crmField: 'email',
          direction: 'bidirectional'
        }
      ],
      enableRealTimeSync: true
    }
  }

  const mockConfig: CRMProviderConfig = {
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    apiBaseUrl: 'https://api.hubapi.com',
    scopes: ['crm.objects.contacts.read'],
    rateLimits: {
      requestsPerSecond: 10,
      dailyLimit: 40000
    },
    webhookSupport: true,
    supportedObjects: ['contacts', 'deals']
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HubSpotAdapter', () => {
    let adapter: HubSpotAdapter

    beforeEach(() => {
      adapter = new HubSpotAdapter(mockConnection, mockConfig)
    })

    describe('Authentication', () => {
      it('should authenticate with authorization code', async () => {
        const mockResponse = {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          scope: 'crm.objects.contacts.read'
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const credentials = await adapter.authenticate('test-auth-code')

        expect(credentials.accessToken).toBe('new-access-token')
        expect(credentials.refreshToken).toBe('new-refresh-token')
        expect(credentials.scope).toEqual(['crm.objects.contacts.read'])
        expect(fetch).toHaveBeenCalledWith(
          'https://api.hubapi.com/oauth/v1/token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        )
      })

      it('should refresh expired token', async () => {
        const mockResponse = {
          access_token: 'refreshed-access-token',
          refresh_token: 'refreshed-refresh-token',
          expires_in: 3600
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const credentials = await adapter.refreshToken()

        expect(credentials.accessToken).toBe('refreshed-access-token')
        expect(fetch).toHaveBeenCalledWith(
          'https://api.hubapi.com/oauth/v1/token',
          expect.objectContaining({
            method: 'POST'
          })
        )
      })

      it('should validate credentials', async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })

        const isValid = await adapter.validateCredentials()

        expect(isValid).toBe(true)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-access-token'
            })
          })
        )
      })
    })

    describe('Contact Management', () => {
      const mockHubSpotContact = {
        id: 'hubspot-contact-id',
        properties: {
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          phone: '+1234567890',
          createdate: '2023-01-01T00:00:00.000Z'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      it('should get contacts with pagination', async () => {
        const mockResponse = {
          results: [mockHubSpotContact],
          paging: {
            next: {
              after: 'next-cursor'
            }
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
        expect(result.pagination?.hasMore).toBe(true)
        expect(result.pagination?.nextCursor).toBe('next-cursor')
      })

      it('should create a contact', async () => {
        const newContact: CRMContact = {
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockHubSpotContact,
            id: 'new-contact-id',
            properties: {
              ...mockHubSpotContact.properties,
              email: 'new@example.com',
              firstname: 'Jane',
              lastname: 'Smith'
            }
          })
        })

        const result = await adapter.createContact(newContact)

        expect(result.success).toBe(true)
        expect(result.data?.email).toBe('new@example.com')
        expect(fetch).toHaveBeenCalledWith(
          'https://api.hubapi.com/crm/v3/objects/contacts',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('new@example.com')
          })
        )
      })

      it('should handle API errors gracefully', async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ message: 'Invalid email format' })
        })

        const result = await adapter.getContacts()

        expect(result.success).toBe(false)
        expect(result.error).toContain('CRM API Error')
      })
    })

    describe('Rate Limiting', () => {
      it('should handle rate limiting with retry', async () => {
        // First call returns 429 (rate limited)
        ;(fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: false,
            status: 429,
            headers: {
              get: () => '60' // Retry after 60 seconds
            }
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ results: [] })
          })

        // Mock setTimeout to speed up test
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
          callback()
          return {} as any
        })

        const result = await adapter.getContacts()

        expect(result.success).toBe(true)
        expect(fetch).toHaveBeenCalledTimes(2)

        ;(global.setTimeout as jest.Mock).mockRestore()
      })
    })

    describe('Field Mapping', () => {
      it('should map internal fields to external fields', async () => {
        const contact: CRMContact = {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHubSpotContact)
        })

        await adapter.createContact(contact)

        const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)
        expect(requestBody.properties.email).toBe('test@example.com')
        expect(requestBody.properties.firstname).toBe('John')
        expect(requestBody.properties.lastname).toBe('Doe')
      })
    })
  })

  describe('CRMManager', () => {
    let manager: CRMManager

    beforeEach(() => {
      manager = new CRMManager()
    })

    describe('Connection Management', () => {
      it('should generate authorization URL', () => {
        const authUrl = manager.getAuthorizationUrl(
          CRMProvider.HUBSPOT,
          'http://localhost:3000/callback',
          'test-state'
        )

        expect(authUrl).toContain('https://app.hubspot.com/oauth/authorize')
        expect(authUrl).toContain('client_id=test-client-id')
        expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback')
        expect(authUrl).toContain('state=test-state')
      })

      it('should create a new connection', async () => {
        const mockDbConnection = {
          id: 'new-connection-id',
          tenantId: 'test-tenant-id',
          provider: 'HUBSPOT',
          credentials: JSON.stringify(mockConnection.credentials),
          isActive: true,
          lastSyncAt: null,
          settings: JSON.stringify(mockConnection.settings),
          syncCursor: null
        }

        ;(prisma.crmIntegration.create as jest.Mock).mockResolvedValueOnce(mockDbConnection)

        // Mock the adapter authentication
        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            expires_in: 3600
          })
        })

        const connection = await manager.createConnection(
          'test-tenant-id',
          CRMProvider.HUBSPOT,
          'auth-code',
          mockConnection.settings
        )

        expect(connection.id).toBe('new-connection-id')
        expect(connection.provider).toBe(CRMProvider.HUBSPOT)
        expect(prisma.crmIntegration.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tenantId: 'test-tenant-id',
            provider: CRMProvider.HUBSPOT
          })
        })
      })

      it('should get existing connection', async () => {
        const mockDbConnection = {
          id: 'existing-connection-id',
          tenantId: 'test-tenant-id',
          provider: 'HUBSPOT',
          credentials: JSON.stringify(mockConnection.credentials),
          isActive: true,
          lastSyncAt: new Date(),
          settings: JSON.stringify(mockConnection.settings)
        }

        ;(prisma.crmIntegration.findUnique as jest.Mock).mockResolvedValueOnce(mockDbConnection)

        const connection = await manager.getConnection('existing-connection-id')

        expect(connection).toBeTruthy()
        expect(connection?.id).toBe('existing-connection-id')
        expect(connection?.provider).toBe(CRMProvider.HUBSPOT)
      })

      it('should return null for non-existent connection', async () => {
        ;(prisma.crmIntegration.findUnique as jest.Mock).mockResolvedValueOnce(null)

        const connection = await manager.getConnection('non-existent-id')

        expect(connection).toBeNull()
      })
    })

    describe('Synchronization', () => {
      it('should sync connection data', async () => {
        ;(prisma.crmIntegration.findUnique as jest.Mock).mockResolvedValueOnce({
          id: 'test-connection-id',
          tenantId: 'test-tenant-id',
          provider: 'HUBSPOT',
          credentials: JSON.stringify(mockConnection.credentials),
          isActive: true,
          settings: JSON.stringify(mockConnection.settings),
          syncCursor: null
        })

        ;(prisma.crmIntegration.update as jest.Mock).mockResolvedValueOnce({})

        // Mock adapter sync methods
        ;(fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })

        const result = await manager.syncConnection('test-connection-id', true)

        expect(result.success).toBe(true)
        expect(prisma.crmIntegration.update).toHaveBeenCalledWith({
          where: { id: 'test-connection-id' },
          data: expect.objectContaining({
            lastSyncAt: expect.any(Date)
          })
        })
      })
    })

    describe('Webhook Processing', () => {
      it('should process webhook payload', async () => {
        ;(prisma.crmIntegration.findUnique as jest.Mock).mockResolvedValueOnce({
          id: 'test-connection-id',
          tenantId: 'test-tenant-id',
          provider: 'HUBSPOT',
          credentials: JSON.stringify(mockConnection.credentials),
          isActive: true,
          settings: JSON.stringify(mockConnection.settings)
        })

        const webhookPayload = {
          subscriptionType: 'contact.creation',
          objectType: 'contact',
          objectId: 12345,
          changeType: 'created',
          occurredAt: Date.now()
        }

        const result = await manager.processWebhook('test-connection-id', webhookPayload)

        expect(result.provider).toBe(CRMProvider.HUBSPOT)
        expect(result.eventType).toBe('contact.creation')
        expect(result.objectType).toBe('contact')
        expect(result.changeType).toBe('created')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const adapter = new HubSpotAdapter(mockConnection, mockConfig)

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.getContacts()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle token expiration and refresh', async () => {
      const adapter = new HubSpotAdapter(mockConnection, mockConfig)

      // First call returns 401 (unauthorized)
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        // Refresh token call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            expires_in: 3600
          })
        })
        // Retry original call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })

      const result = await adapter.getContacts()

      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(3)
    })
  })
}) 