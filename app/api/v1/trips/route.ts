import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse, withErrorHandling } from '@/lib/api/response';
import { authenticateRequest, extractPaginationParams, extractQueryParams } from '@/lib/auth/middleware';
import { createTripSchema, tripQuerySchema } from '@/lib/validations/trip';
import { Trip } from '@/lib/types/api';

// Mock data for development - replace with actual database calls
const mockTrips: Trip[] = [
  {
    id: '1',
    title: 'Peru Adventure',
    description: 'Explore the ancient wonders of Machu Picchu',
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-06-10T00:00:00Z',
    location: 'Peru',
    participants: [],
    status: 'active',
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
    userId: '1'
  },
  {
    id: '2',
    title: 'Brazil Explorer',
    description: 'Discover the vibrant culture of Brazil',
    startDate: '2024-07-15T00:00:00Z',
    endDate: '2024-07-25T00:00:00Z',
    location: 'Brazil',
    participants: [],
    status: 'draft',
    createdAt: '2024-05-02T00:00:00Z',
    updatedAt: '2024-05-02T00:00:00Z',
    userId: '1'
  }
];

/**
 * GET /api/v1/trips
 * List trips with optional filtering and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate request
  const user = await authenticateRequest(request);
  if (!user) {
    return createUnauthorizedResponse();
  }

  // Extract and validate query parameters
  const queryParams = extractQueryParams(request);
  const paginationParams = extractPaginationParams(request);
  
  const validation = tripQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return createErrorResponse(
      'Invalid query parameters',
      validation.error.format(),
      400
    );
  }

  const { status, location, startDate, endDate } = validation.data;

  // Filter trips based on user and query parameters
  let filteredTrips = mockTrips.filter(trip => trip.userId === user.id);

  if (status) {
    filteredTrips = filteredTrips.filter(trip => trip.status === status);
  }

  if (location) {
    filteredTrips = filteredTrips.filter(trip => 
      trip.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (startDate) {
    filteredTrips = filteredTrips.filter(trip => 
      new Date(trip.startDate) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredTrips = filteredTrips.filter(trip => 
      new Date(trip.endDate) <= new Date(endDate)
    );
  }

  // Apply pagination
  const { page = 1, limit = 10 } = paginationParams;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

  // Create response with metadata
  const meta = {
    page,
    limit,
    total: filteredTrips.length,
    totalPages: Math.ceil(filteredTrips.length / limit)
  };

  return createSuccessResponse(paginatedTrips, meta);
});

/**
 * POST /api/v1/trips
 * Create a new trip
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate request
  const user = await authenticateRequest(request);
  if (!user) {
    return createUnauthorizedResponse();
  }

  // Parse and validate request body
  const body = await request.json();
  const validation = createTripSchema.safeParse(body);
  
  if (!validation.success) {
    return createErrorResponse(
      'Validation failed',
      validation.error.format(),
      422
    );
  }

  // Create new trip
  const { description, participants, ...requiredData } = validation.data;
  const newTrip: Trip = {
    id: Math.random().toString(36).substr(2, 9), // Generate random ID
    ...requiredData,
    // Only include optional properties if they are defined
    ...(description !== undefined && { description }),
    ...(participants !== undefined && { participants }),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: user.id
  };

  // TODO: Save to database
  mockTrips.push(newTrip);

  return createSuccessResponse(newTrip, undefined, 201);
}); 