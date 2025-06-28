import { container } from '@/src/core/container';
import { TourApplicationService } from '@/src/core/application/tour/TourApplicationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import '@/src/infrastructure/startup'; // Initialize infrastructure

// Get service instance
const tourAppService = container.get<TourApplicationService>(TourApplicationService);

/**
 * Adapter to use new tour service with existing API routes
 * This allows gradual migration without breaking existing code
 */
export async function createTourAdapter(request: NextRequest) {
  if (!isFeatureEnabled('USE_NEW_TOUR_SERVICE')) {
    // Use old implementation
    return legacyCreateTour(request);
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const tour = await tourAppService.createTour({
      operatorId: session.user.id || session.user.email,
      operatorEmail: session.user.email,
      title: data.title,
      description: data.description,
      duration: data.duration,
      price: data.price || { amount: 0, currency: 'USD' },
      destinations: data.destinations || [],
      activities: data.activities || [],
      images: data.images || [],
      maxParticipants: data.maxGuests,
      minParticipants: data.minGuests,
      included: data.included || [],
      excluded: data.excluded || [],
      languages: data.languages || [],
      metadata: data.metadata || {}
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error('Tour creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tour' },
      { status: 500 }
    );
  }
}

/**
 * Legacy implementation placeholder
 * This would be the existing implementation
 */
async function legacyCreateTour(request: NextRequest) {
  // Existing implementation goes here
  throw new Error('Legacy implementation not migrated yet');
}

/**
 * Get tours with new service
 */
export async function getToursAdapter(request: NextRequest) {
  if (!isFeatureEnabled('USE_NEW_TOUR_SERVICE')) {
    return legacyGetTours(request);
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const tours = await tourAppService.getToursByOperator(
      session.user.id || session.user.email,
      { page, limit, includeArchived }
    );

    return NextResponse.json(tours);
  } catch (error) {
    console.error('Failed to get tours:', error);
    return NextResponse.json(
      { error: 'Failed to get tours' },
      { status: 500 }
    );
  }
}

async function legacyGetTours(request: NextRequest) {
  throw new Error('Legacy implementation not migrated yet');
}