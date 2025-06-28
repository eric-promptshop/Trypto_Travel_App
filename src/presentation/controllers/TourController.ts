import { injectable, inject } from 'inversify';
import { TYPES } from '@/src/core/types';
import { TourApplicationService } from '@/src/core/application/tour/TourApplicationService';
import { ValidationError, UnauthorizedError, NotFoundError } from '@/src/core/shared/errors';

export interface AuthService {
  authenticate(request: Request): Promise<{ userId: string; email: string } | null>;
}

@injectable()
export class TourController {
  constructor(
    @inject(TYPES.TourApplicationService) private tourAppService: TourApplicationService,
    @inject(TYPES.AuthService) private auth: AuthService
  ) {}

  /**
   * Create a new tour
   * POST /api/v1/tours
   */
  async createTour(request: Request): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      
      const tour = await this.tourAppService.createTour({
        ...body,
        operatorId: session.userId,
        operatorEmail: session.email
      });

      return new Response(JSON.stringify(tour), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get tours for the authenticated operator
   * GET /api/v1/tours
   */
  async getTours(request: Request): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const includeArchived = url.searchParams.get('includeArchived') === 'true';

      const tours = await this.tourAppService.getToursByOperator(session.userId, {
        page,
        limit,
        includeArchived
      });

      return new Response(JSON.stringify(tours), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific tour by ID
   * GET /api/v1/tours/:id
   */
  async getTour(request: Request, tourId: string): Promise<Response> {
    try {
      const tour = await this.tourAppService.getTourById(tourId);
      
      if (!tour) {
        return new Response(JSON.stringify({ error: 'Tour not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(tour), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a tour
   * PUT /api/v1/tours/:id
   */
  async updateTour(request: Request, tourId: string): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const updates = await request.json();
      
      const tour = await this.tourAppService.updateTour({
        tourId,
        operatorId: session.userId,
        updates
      });

      return new Response(JSON.stringify(tour), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Publish a tour
   * POST /api/v1/tours/:id/publish
   */
  async publishTour(request: Request, tourId: string): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const tour = await this.tourAppService.publishTour(tourId, session.userId);

      return new Response(JSON.stringify(tour), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Archive a tour
   * POST /api/v1/tours/:id/archive
   */
  async archiveTour(request: Request, tourId: string): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await this.tourAppService.archiveTour(tourId, session.userId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Duplicate a tour
   * POST /api/v1/tours/:id/duplicate
   */
  async duplicateTour(request: Request, tourId: string): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const tour = await this.tourAppService.duplicateTour(tourId, session.userId);

      return new Response(JSON.stringify(tour), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Search tours (public endpoint)
   * GET /api/v1/tours/search
   */
  async searchTours(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      const criteria = {
        query: url.searchParams.get('q') || undefined,
        filters: {
          destination: url.searchParams.get('destination') || undefined,
          minPrice: url.searchParams.get('minPrice') 
            ? parseFloat(url.searchParams.get('minPrice')!) 
            : undefined,
          maxPrice: url.searchParams.get('maxPrice') 
            ? parseFloat(url.searchParams.get('maxPrice')!) 
            : undefined,
          duration: url.searchParams.get('duration') 
            ? parseInt(url.searchParams.get('duration')!) 
            : undefined,
          languages: url.searchParams.getAll('language')
        },
        pagination: {
          page: parseInt(url.searchParams.get('page') || '1'),
          limit: parseInt(url.searchParams.get('limit') || '20'),
          orderBy: url.searchParams.get('orderBy') || 'createdAt',
          orderDirection: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc'
        }
      };

      const tours = await this.tourAppService.searchTours(criteria);

      return new Response(JSON.stringify(tours), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get operator statistics
   * GET /api/v1/tours/stats
   */
  async getStats(request: Request): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const stats = await this.tourAppService.getOperatorStats(session.userId);

      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and return appropriate HTTP responses
   */
  private handleError(error: unknown): Response {
    console.error('Tour controller error:', error);

    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof UnauthorizedError) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof Error) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}