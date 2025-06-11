import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse, createNotFoundResponse, withErrorHandling } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

// Validation schemas for itinerary operations
const dayActivitySchema = z.object({
  type: z.enum(['activity', 'accommodation', 'transportation']),
  name: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().default('USD'),
  bookingUrl: z.string().url().optional(),
  notes: z.string().optional(),
  contentId: z.string().optional() // Reference to Content table
});

const updateDaySchema = z.object({
  day: z.number().min(1),
  activities: z.array(dayActivitySchema).optional(),
  accommodations: z.array(dayActivitySchema).optional(),
  transportation: z.array(dayActivitySchema).optional()
});

const addActivitySchema = z.object({
  day: z.number().min(1),
  activity: dayActivitySchema
});

/**
 * GET /api/trips/[id]/itinerary
 * Get detailed itinerary for a trip
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Get authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  const { id } = params;

  // Fetch itinerary from database
  const itinerary = await prisma.itinerary.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { tenantId: session.user.tenantId || 'default' }
      ]
    }
  });

  if (!itinerary) {
    return createNotFoundResponse('Itinerary not found');
  }

  // Parse days data and enrich with content details
  const days = JSON.parse(itinerary.days || '[]');
  
  // Collect all content IDs to fetch
  const contentIds = new Set<string>();
  days.forEach((day: any) => {
    ['activities', 'accommodations', 'transportation'].forEach(type => {
      if (day[type] && Array.isArray(day[type])) {
        day[type].forEach((item: any) => {
          if (item.contentId) {
            contentIds.add(item.contentId);
          }
        });
      }
    });
  });

  // Fetch content details if any
  let contentMap = new Map();
  if (contentIds.size > 0) {
    const contents = await prisma.content.findMany({
      where: {
        id: { in: Array.from(contentIds) }
      }
    });
    
    contents.forEach(content => {
      contentMap.set(content.id, {
        name: content.name,
        description: content.description,
        location: content.location,
        price: content.price,
        currency: content.currency,
        images: JSON.parse(content.images || '[]'),
        amenities: content.amenities ? JSON.parse(content.amenities) : [],
        highlights: content.highlights ? JSON.parse(content.highlights) : []
      });
    });
  }

  // Enrich days with content details
  const enrichedDays = days.map((day: any) => {
    const enrichDay = { ...day };
    ['activities', 'accommodations', 'transportation'].forEach(type => {
      if (enrichDay[type] && Array.isArray(enrichDay[type])) {
        enrichDay[type] = enrichDay[type].map((item: any) => {
          if (item.contentId && contentMap.has(item.contentId)) {
            return { ...item, ...contentMap.get(item.contentId) };
          }
          return item;
        });
      }
    });
    return enrichDay;
  });

  const response = {
    id: itinerary.id,
    title: itinerary.title,
    description: itinerary.description,
    destination: itinerary.destination,
    startDate: itinerary.startDate.toISOString(),
    endDate: itinerary.endDate.toISOString(),
    travelers: itinerary.travelers,
    totalPrice: itinerary.totalPrice,
    currency: itinerary.currency,
    days: enrichedDays,
    metadata: JSON.parse(itinerary.metadata || '{}')
  };

  return createSuccessResponse(response);
});

/**
 * PUT /api/trips/[id]/itinerary
 * Update the entire itinerary
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Get authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  const { id } = params;

  // Parse and validate request body
  const body = await request.json();
  const validation = z.array(updateDaySchema).safeParse(body.days);
  
  if (!validation.success) {
    return createErrorResponse(
      'Validation failed',
      validation.error.format(),
      422
    );
  }

  // Check if itinerary exists and user has permission
  const existingItinerary = await prisma.itinerary.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { tenantId: session.user.tenantId || 'default' }
      ]
    }
  });

  if (!existingItinerary) {
    return createNotFoundResponse('Itinerary not found');
  }

  // Calculate total price from all activities
  let totalPrice = 0;
  validation.data.forEach(day => {
    ['activities', 'accommodations', 'transportation'].forEach(type => {
      const items = day[type as keyof typeof day];
      if (items && Array.isArray(items)) {
        items.forEach(item => {
          if (item.price) {
            totalPrice += item.price;
          }
        });
      }
    });
  });

  // Update itinerary
  const updatedItinerary = await prisma.itinerary.update({
    where: { id },
    data: {
      days: JSON.stringify(validation.data),
      totalPrice,
      updatedAt: new Date()
    }
  });

  // Log the update
  if (session.user.tenantId) {
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_ITINERARY',
        resource: 'itinerary',
        resourceId: id,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        newValues: {
          totalPrice,
          daysUpdated: validation.data.length
        }
      }
    });
  }

  return createSuccessResponse({
    id: updatedItinerary.id,
    days: JSON.parse(updatedItinerary.days),
    totalPrice: updatedItinerary.totalPrice,
    updatedAt: updatedItinerary.updatedAt.toISOString()
  });
});

/**
 * POST /api/trips/[id]/itinerary/activity
 * Add a single activity to a specific day
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Get authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  const { id } = params;

  // Parse and validate request body
  const body = await request.json();
  const validation = addActivitySchema.safeParse(body);
  
  if (!validation.success) {
    return createErrorResponse(
      'Validation failed',
      validation.error.format(),
      422
    );
  }

  // Check if itinerary exists and user has permission
  const existingItinerary = await prisma.itinerary.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { tenantId: session.user.tenantId || 'default' }
      ]
    }
  });

  if (!existingItinerary) {
    return createNotFoundResponse('Itinerary not found');
  }

  const { day: dayNumber, activity } = validation.data;

  // Parse existing days
  const days = JSON.parse(existingItinerary.days || '[]');
  
  // Find the specific day
  const dayIndex = days.findIndex((d: any) => d.day === dayNumber);
  if (dayIndex === -1) {
    return createErrorResponse('Day not found in itinerary', undefined, 404);
  }

  // Add activity to the appropriate type
  const activityType = activity.type === 'activity' ? 'activities' : 
                      activity.type === 'accommodation' ? 'accommodations' : 'transportation';
  
  if (!days[dayIndex][activityType]) {
    days[dayIndex][activityType] = [];
  }
  
  // Add unique ID to the activity
  const newActivity = {
    ...activity,
    id: `${activity.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  days[dayIndex][activityType].push(newActivity);

  // Calculate new total price
  let totalPrice = existingItinerary.totalPrice || 0;
  if (activity.price) {
    totalPrice += activity.price;
  }

  // Update itinerary
  const updatedItinerary = await prisma.itinerary.update({
    where: { id },
    data: {
      days: JSON.stringify(days),
      totalPrice,
      updatedAt: new Date()
    }
  });

  // Log the addition
  if (session.user.tenantId) {
    await prisma.auditLog.create({
      data: {
        action: 'ADD_ACTIVITY',
        resource: 'itinerary',
        resourceId: id,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        newValues: {
          day: dayNumber,
          activityType,
          activityName: activity.name
        }
      }
    });
  }

  return createSuccessResponse({
    message: 'Activity added successfully',
    activity: newActivity,
    totalPrice: updatedItinerary.totalPrice
  }, undefined, 201);
});