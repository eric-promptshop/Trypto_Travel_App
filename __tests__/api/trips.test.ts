import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/trips/route';

// Mock the authentication middleware
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn(),
  extractPaginationParams: jest.fn(),
  extractQueryParams: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
}));

jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn(),
}));

const mockAuthenticateRequest = require('@/lib/auth/middleware').authenticateRequest;
const mockExtractPaginationParams = require('@/lib/auth/middleware').extractPaginationParams;
const mockExtractQueryParams = require('@/lib/auth/middleware').extractQueryParams;

describe('/api/v1/trips', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    tenantId: 'test-tenant',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/trips', () => {
    it('should return trips for authenticated user', async () => {
      // Mock successful authentication
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockExtractQueryParams.mockReturnValue({});
      mockExtractPaginationParams.mockReturnValue({ page: 1, limit: 10 });

      // Create mock request
      const request = new NextRequest(new Request('http://localhost:3000/api/v1/trips'));

      // Call the endpoint
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.meta).toHaveProperty('page');
      expect(data.meta).toHaveProperty('limit');
      expect(data.meta).toHaveProperty('total');
    });

    it('should return 401 for unauthenticated user', async () => {
      // Mock failed authentication
      mockAuthenticateRequest.mockResolvedValue(null);

      const request = new NextRequest(new Request('http://localhost:3000/api/v1/trips'));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should filter trips by status', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockExtractQueryParams.mockReturnValue({ status: 'active' });
      mockExtractPaginationParams.mockReturnValue({ page: 1, limit: 10 });

      const request = new NextRequest(new Request('http://localhost:3000/api/v1/trips?status=active'));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      // All returned trips should have 'active' status
      data.data.forEach((trip: any) => {
        expect(trip.status).toBe('active');
      });
    });
  });

  describe('POST /api/v1/trips', () => {
    const validTripData = {
      title: 'Test Trip',
      description: 'A test trip description',
      startDate: '2024-06-01T00:00:00Z',
      endDate: '2024-06-10T00:00:00Z',
      location: 'Test Location',
      participants: [],
    };

    it('should create a new trip for authenticated user', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const request = new NextRequest(
        new Request('http://localhost:3000/api/v1/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validTripData),
        })
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toHaveProperty('id');
      expect(data.data.title).toBe(validTripData.title);
      expect(data.data.userId).toBe(mockUser.id);
      expect(data.data.status).toBe('draft');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const request = new NextRequest(
        new Request('http://localhost:3000/api/v1/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validTripData),
        })
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return validation error for invalid data', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const invalidTripData = {
        title: 'ab', // Too short
        startDate: 'invalid-date',
        endDate: '2024-05-01T00:00:00Z', // Before start date
        location: '',
      };

      const request = new NextRequest(
        new Request('http://localhost:3000/api/v1/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidTripData),
        })
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should validate end date is after start date', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const invalidTripData = {
        ...validTripData,
        startDate: '2024-06-10T00:00:00Z',
        endDate: '2024-06-01T00:00:00Z', // Before start date
      };

      const request = new NextRequest(
        new Request('http://localhost:3000/api/v1/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidTripData),
        })
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });
  });
}); 