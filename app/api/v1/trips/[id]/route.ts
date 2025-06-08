import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse, createNotFoundResponse, withErrorHandling } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { updateTripSchema } from '@/lib/validations/trip';
import { Trip } from '@/lib/types/api';

/**
 * GET /api/v1/trips/[id]
 * Get a specific trip by ID
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
    },
    include: {
      tenant: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  if (!itinerary) {
    return createNotFoundResponse('Trip not found');
  }

  // Transform to Trip interface
  const trip: Trip = {
    id: itinerary.id,
    title: itinerary.title,
    description: itinerary.description || undefined,
    startDate: itinerary.startDate.toISOString(),
    endDate: itinerary.endDate.toISOString(),
    location: itinerary.destination,
    participants: (JSON.parse(itinerary.metadata || '{}').participants) || [],
    status: (JSON.parse(itinerary.metadata || '{}').status) || 'active',
    createdAt: itinerary.createdAt.toISOString(),
    updatedAt: itinerary.updatedAt.toISOString(),
    userId: itinerary.userId || session.user.id,
    // Additional metadata from the itinerary data
    metadata: {
      travelers: itinerary.travelers,
      totalPrice: itinerary.totalPrice,
      currency: itinerary.currency,
      days: JSON.parse(itinerary.days || '[]')
    }
  };

  return createSuccessResponse(trip);
});

/**
 * PUT /api/v1/trips/[id]
 * Update a specific trip
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
  const validation = updateTripSchema.safeParse(body);
  
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
    return createNotFoundResponse('Trip not found');
  }

  const { title, description, startDate, endDate, location, participants, status } = validation.data;

  // Prepare update data
  const updateData: any = {};
  
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (location !== undefined) updateData.destination = location;
  if (startDate !== undefined) updateData.startDate = new Date(startDate);
  if (endDate !== undefined) updateData.endDate = new Date(endDate);
  if (participants !== undefined) updateData.travelers = participants.length;

  // Update metadata
  const currentMetadata = JSON.parse(existingItinerary.metadata || '{}');
  const updatedMetadata = {
    ...currentMetadata,
    ...(status !== undefined && { status }),
    ...(participants !== undefined && { participants }),
    lastModifiedBy: session.user.email,
    lastModifiedAt: new Date().toISOString()
  };
  updateData.metadata = JSON.stringify(updatedMetadata);

  // Update days structure if dates changed
  if (startDate || endDate) {
    const start = new Date(startDate || existingItinerary.startDate);
    const end = new Date(endDate || existingItinerary.endDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const existingDays = JSON.parse(existingItinerary.days || '[]');
    const newDays = Array.from({ length: numberOfDays }, (_, index) => {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + index);
      const existingDay = existingDays[index];
      
      return existingDay || {
        day: index + 1,
        date: dayDate.toISOString().split('T')[0],
        activities: [],
        accommodations: [],
        transportation: []
      };
    });
    
    updateData.days = JSON.stringify(newDays);
  }

  // Update in database
  const updatedItinerary = await prisma.itinerary.update({
    where: { id },
    data: updateData
  });

  // Log the update
  if (session.user.tenantId) {
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'itinerary',
        resourceId: id,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        oldValues: {
          title: existingItinerary.title,
          destination: existingItinerary.destination
        },
        newValues: {
          title: updatedItinerary.title,
          destination: updatedItinerary.destination
        }
      }
    });
  }

  // Transform to Trip interface
  const updatedTrip: Trip = {
    id: updatedItinerary.id,
    title: updatedItinerary.title,
    description: updatedItinerary.description || '',
    startDate: updatedItinerary.startDate.toISOString(),
    endDate: updatedItinerary.endDate.toISOString(),
    location: updatedItinerary.destination,
    participants: JSON.parse(updatedMetadata.participants || '[]'),
    status: updatedMetadata.status || 'active',
    createdAt: updatedItinerary.createdAt.toISOString(),
    updatedAt: updatedItinerary.updatedAt.toISOString(),
    userId: updatedItinerary.userId || session.user.id
  };

  return createSuccessResponse(updatedTrip);
});

/**
 * DELETE /api/v1/trips/[id]
 * Delete a specific trip
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Get authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  const { id } = params;

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
    return createNotFoundResponse('Trip not found');
  }

  // Delete from database
  await prisma.itinerary.delete({
    where: { id }
  });

  // Log the deletion
  if (session.user.tenantId) {
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'itinerary',
        resourceId: id,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        oldValues: {
          title: existingItinerary.title,
          destination: existingItinerary.destination
        }
      }
    });
  }

  return createSuccessResponse({ message: 'Trip deleted successfully' });
});