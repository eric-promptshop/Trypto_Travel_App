import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from '@/src/core/types';
import { Tour, TourStatus, Activity } from '@/src/core/domain/tour/Tour';
import { TourRepository } from '@/src/core/domain/tour/TourRepository';
import { PaginatedResult, SearchCriteria, Money } from '@/src/core/shared/types';

@injectable()
export class PrismaTourRepository implements TourRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async save(tour: Tour): Promise<Tour> {
    const data = tour.toJSON();
    
    const saved = await this.prisma.tour.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        operatorId: data.operatorId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price.amount,
        currency: data.price.currency,
        destinations: data.destinations,
        status: data.status,
        maxGuests: data.maxParticipants,
        minGuests: data.minParticipants,
        included: data.included,
        excluded: data.excluded,
        languages: data.languages,
        metadata: data.metadata as any,
        publishedAt: data.publishedAt,
        // Handle activities separately due to relation
        activities: {
          deleteMany: {}, // Clear existing
          create: data.activities.map(activity => ({
            title: activity.title,
            description: activity.description,
            duration: activity.duration,
            price: activity.price?.amount,
            location: activity.location as any,
            order: activity.order
          }))
        },
        // Handle images
        images: data.images as any
      },
      update: {
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price.amount,
        currency: data.price.currency,
        destinations: data.destinations,
        status: data.status,
        maxGuests: data.maxParticipants,
        minGuests: data.minParticipants,
        included: data.included,
        excluded: data.excluded,
        languages: data.languages,
        metadata: data.metadata as any,
        publishedAt: data.publishedAt,
        updatedAt: new Date(),
        // Handle activities
        activities: {
          deleteMany: {}, // Clear existing
          create: data.activities.map(activity => ({
            title: activity.title,
            description: activity.description,
            duration: activity.duration,
            price: activity.price?.amount,
            location: activity.location as any,
            order: activity.order
          }))
        },
        images: data.images as any
      },
      include: {
        activities: true,
        operator: true
      }
    });
    
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Tour | null> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { order: 'asc' }
        },
        operator: true
      }
    });
    
    return tour ? this.toDomain(tour) : null;
  }

  async findByOperator(
    operatorId: string, 
    options?: {
      includeArchived?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResult<Tour>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      operatorId,
      deletedAt: null
    };

    if (!options?.includeArchived) {
      where.status = { not: TourStatus.ARCHIVED };
    }

    const [tours, total] = await Promise.all([
      this.prisma.tour.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          activities: {
            orderBy: { order: 'asc' }
          },
          operator: true
        }
      }),
      this.prisma.tour.count({ where })
    ]);

    return {
      data: tours.map(tour => this.toDomain(tour)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async search(criteria: SearchCriteria): Promise<PaginatedResult<Tour>> {
    const page = criteria.pagination?.page || 1;
    const limit = criteria.pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: TourStatus.PUBLISHED
    };

    // Apply search query
    if (criteria.query) {
      where.OR = [
        { title: { contains: criteria.query, mode: 'insensitive' } },
        { description: { contains: criteria.query, mode: 'insensitive' } },
        { destinations: { has: criteria.query } }
      ];
    }

    // Apply filters
    if (criteria.filters) {
      if (criteria.filters.destination) {
        where.destinations = { has: criteria.filters.destination };
      }
      if (criteria.filters.minPrice !== undefined) {
        where.price = { gte: criteria.filters.minPrice };
      }
      if (criteria.filters.maxPrice !== undefined) {
        where.price = { ...where.price, lte: criteria.filters.maxPrice };
      }
      if (criteria.filters.duration !== undefined) {
        where.duration = criteria.filters.duration;
      }
      if (criteria.filters.languages?.length > 0) {
        where.languages = { hasSome: criteria.filters.languages };
      }
    }

    const [tours, total] = await Promise.all([
      this.prisma.tour.findMany({
        where,
        skip,
        take: limit,
        orderBy: criteria.pagination?.orderBy 
          ? { [criteria.pagination.orderBy]: criteria.pagination.orderDirection || 'desc' }
          : { createdAt: 'desc' },
        include: {
          activities: {
            orderBy: { order: 'asc' }
          },
          operator: true
        }
      }),
      this.prisma.tour.count({ where })
    ]);

    return {
      data: tours.map(tour => this.toDomain(tour)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findByDestination(
    destination: string, 
    options?: { page?: number; limit?: number; }
  ): Promise<PaginatedResult<Tour>> {
    return this.search({
      filters: { destination },
      pagination: options
    });
  }

  async findSimilar(tourId: string, limit: number = 5): Promise<Tour[]> {
    const tour = await this.findById(tourId);
    if (!tour) return [];

    // Find tours with similar destinations or from same operator
    const similar = await this.prisma.tour.findMany({
      where: {
        id: { not: tourId },
        deletedAt: null,
        status: TourStatus.PUBLISHED,
        OR: [
          { destinations: { hasSome: tour.destinations } },
          { operatorId: tour.operatorId }
        ]
      },
      take: limit,
      include: {
        activities: {
          orderBy: { order: 'asc' }
        },
        operator: true
      }
    });

    return similar.map(t => this.toDomain(t));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tour.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async countByStatus(operatorId: string): Promise<{
    draft: number;
    published: number;
    archived: number;
  }> {
    const counts = await this.prisma.tour.groupBy({
      by: ['status'],
      where: {
        operatorId,
        deletedAt: null
      },
      _count: true
    });

    const result = {
      draft: 0,
      published: 0,
      archived: 0
    };

    counts.forEach(count => {
      const status = count.status.toLowerCase() as keyof typeof result;
      result[status] = count._count;
    });

    return result;
  }

  async findByTemplate(templateId: string): Promise<Tour[]> {
    const tours = await this.prisma.tour.findMany({
      where: {
        metadata: {
          path: ['templateId'],
          equals: templateId
        },
        deletedAt: null
      },
      include: {
        activities: {
          orderBy: { order: 'asc' }
        },
        operator: true
      }
    });

    return tours.map(tour => this.toDomain(tour));
  }

  private toDomain(data: any): Tour {
    // Map activities
    const activities: Activity[] = (data.activities || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      duration: a.duration,
      price: a.price ? Money.create(a.price, data.currency || 'USD') : undefined,
      location: a.location,
      order: a.order || 0
    }));

    return Tour.reconstitute({
      id: data.id,
      operatorId: data.operatorId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      price: Money.create(data.price, data.currency || 'USD'),
      destinations: data.destinations || [],
      activities,
      images: data.images || [],
      status: data.status as TourStatus,
      maxParticipants: data.maxGuests,
      minParticipants: data.minGuests,
      included: data.included || [],
      excluded: data.excluded || [],
      languages: data.languages || [],
      metadata: (data.metadata as any) || {},
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      publishedAt: data.publishedAt
    });
  }
}