import { container } from '@/src/core/container';
import { TourController } from '@/src/presentation/controllers/TourController';

// Get controller instance from DI container
const controller = container.get<TourController>(TourController);

/**
 * Create a new tour
 * POST /api/v1/tours
 */
export async function POST(request: Request) {
  return controller.createTour(request);
}

/**
 * Get tours for authenticated operator
 * GET /api/v1/tours
 */
export async function GET(request: Request) {
  return controller.getTours(request);
}