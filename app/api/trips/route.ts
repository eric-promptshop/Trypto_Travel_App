import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse, withErrorHandling } from '@/lib/api/response';
import { authenticateRequest, extractPaginationParams, extractQueryParams } from '@/lib/auth/middleware';
import { createTripSchema, tripQuerySchema } from '@/lib/validations/trip';
import { Trip } from '@/lib/types/api';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/trips
 * List trips (itineraries) with optional filtering and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Get authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
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
  const { page = 1, limit = 10 } = paginationParams;

  // Build where clause for database query
  const whereClause: any = {
    OR: [
      { userId: session.user.id },
      { tenantId: session.user.tenantId || 'default' }
    ]
  };

  // Add filters
  if (location) {
    whereClause.destination = {
      contains: location,
      mode: 'insensitive'
    };
  }

  if (startDate) {
    whereClause.startDate = {
      gte: new Date(startDate)
    };
  }

  if (endDate) {
    whereClause.endDate = {
      lte: new Date(endDate)
    };
  }

  // Query database with pagination
  const [itineraries, total] = await Promise.all([
    prisma.itinerary.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    }),
    prisma.itinerary.count({ where: whereClause })
  ]);

  // Transform itineraries to match Trip interface
  const trips: Trip[] = itineraries.map(itinerary => {
    const trip: Trip = {
      id: itinerary.id,
      title: itinerary.title,
      startDate: itinerary.startDate.toISOString(),
      endDate: itinerary.endDate.toISOString(),
      location: itinerary.destination,
      status: ((itinerary.metadata as any)?.status || 'active') as Trip['status'],
      createdAt: itinerary.createdAt.toISOString(),
      updatedAt: itinerary.updatedAt.toISOString(),
      userId: itinerary.userId || session.user.id
    };
    
    // Add optional properties only if they exist
    if (itinerary.description) {
      trip.description = itinerary.description;
    }
    
    const metadata = itinerary.metadata ? JSON.parse(itinerary.metadata as string) : {};
    if (metadata.participants && Array.isArray(metadata.participants)) {
      trip.participants = metadata.participants;
    }
    
    return trip;
  });

  // Create response with metadata
  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };

  return createSuccessResponse(trips, meta);
});

/**
 * POST /api/trips
 * Create a new trip (itinerary)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
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

  const { title, startDate, endDate, location, description, participants } = validation.data;

  // Calculate number of days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Create default day structure
  const days = Array.from({ length: numberOfDays }, (_, index) => {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + index);
    return {
      day: index + 1,
      date: dayDate.toISOString().split('T')[0],
      activities: [],
      accommodations: [],
      transportation: []
    };
  });

  // Create new itinerary in database
  const newItinerary = await prisma.itinerary.create({
    data: {
      title,
      description: description || null,
      destination: location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      travelers: participants?.length || 1,
      days: JSON.stringify(days),
      userId: session.user.id,
      tenantId: session.user.tenantId || 'default',
      metadata: JSON.stringify({
        status: 'draft',
        participants: participants || [],
        createdBy: session.user.email
      })
    }
  });

  // Log the creation
  if (session.user.tenantId) {
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'itinerary',
        resourceId: newItinerary.id,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        newValues: {
          title,
          destination: location,
          dates: `${startDate} - ${endDate}`
        }
      }
    });
  }

  // Transform to Trip interface
  const newTrip: Trip = {
    id: newItinerary.id,
    title: newItinerary.title,
    startDate: newItinerary.startDate.toISOString(),
    endDate: newItinerary.endDate.toISOString(),
    location: newItinerary.destination,
    status: 'draft',
    createdAt: newItinerary.createdAt.toISOString(),
    updatedAt: newItinerary.updatedAt.toISOString(),
    userId: session.user.id
  };
  
  // Add optional properties
  if (newItinerary.description) {
    newTrip.description = newItinerary.description;
  }
  if (participants && participants.length > 0) {
    newTrip.participants = participants;
  }

  return createSuccessResponse(newTrip, undefined, 201);
}); 