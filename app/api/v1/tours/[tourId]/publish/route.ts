import { container } from '@/src/core/container';
import { TourController } from '@/src/presentation/controllers/TourController';

const controller = container.get<TourController>(TourController);

interface RouteParams {
  params: {
    tourId: string;
  };
}

/**
 * Publish a tour
 * POST /api/v1/tours/:tourId/publish
 */
export async function POST(request: Request, { params }: RouteParams) {
  return controller.publishTour(request, params.tourId);
}