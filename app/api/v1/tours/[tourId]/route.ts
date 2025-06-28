import { container } from '@/src/core/container';
import { TourController } from '@/src/presentation/controllers/TourController';

const controller = container.get<TourController>(TourController);

interface RouteParams {
  params: {
    tourId: string;
  };
}

/**
 * Get a specific tour
 * GET /api/v1/tours/:tourId
 */
export async function GET(request: Request, { params }: RouteParams) {
  return controller.getTour(request, params.tourId);
}

/**
 * Update a tour
 * PUT /api/v1/tours/:tourId
 */
export async function PUT(request: Request, { params }: RouteParams) {
  return controller.updateTour(request, params.tourId);
}