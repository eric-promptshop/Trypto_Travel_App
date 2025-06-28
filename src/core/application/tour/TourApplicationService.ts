import { injectable, inject } from 'inversify';
import { TYPES } from '@/src/core/types';
import { TourService } from '@/src/core/domain/tour/TourService';
import { TourRepository } from '@/src/core/domain/tour/TourRepository';
import { ValidationError, UnauthorizedError } from '@/src/core/shared/errors';
import { PaginatedResult } from '@/src/core/shared/types';

// DTOs
export interface TourDTO {
  id: string;
  operatorId: string;
  title: string;
  description: string;
  duration: number;
  price: {
    amount: number;
    currency: string;
  };
  destinations: string[];
  activities: Array<{
    id: string;
    title: string;
    description: string;
    duration?: string;
    price?: {
      amount: number;
      currency: string;
    };
    location?: any;
    order: number;
  }>;
  images: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  status: string;
  maxParticipants?: number;
  minParticipants?: number;
  included: string[];
  excluded: string[];
  languages: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Commands
export interface CreateTourCommand {
  operatorId: string;
  operatorEmail: string;
  title: string;
  description: string;
  duration: number;
  price: {
    amount: number;
    currency: string;
  };
  destinations: string[];
  activities: Array<{
    title: string;
    description: string;
    duration?: string;
    price?: number;
    location?: any;
  }>;
  images: Array<{
    url: string;
    alt: string;
  }>;
  maxParticipants?: number;
  minParticipants?: number;
  included?: string[];
  excluded?: string[];
  languages?: string[];
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTourCommand {
  tourId: string;
  operatorId: string;
  updates: {
    title?: string;
    description?: string;
    duration?: number;
    price?: {
      amount: number;
      currency: string;
    };
    destinations?: string[];
    maxParticipants?: number;
    minParticipants?: number;
    included?: string[];
    excluded?: string[];
    languages?: string[];
    metadata?: Record<string, any>;
  };
}

// External service interfaces
export interface EmailService {
  send(params: {
    to: string;
    template: string;
    data: any;
  }): Promise<void>;
}

export interface AnalyticsService {
  track(event: string, data: any): Promise<void>;
}

// Mapper
export class TourMapper {
  static toDTO(tour: any): TourDTO {
    return {
      id: tour.id,
      operatorId: tour.operatorId,
      title: tour.title,
      description: tour.description,
      duration: tour.duration,
      price: tour.price.toJSON(),
      destinations: tour.destinations,
      activities: tour.activities.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        duration: a.duration,
        price: a.price?.toJSON(),
        location: a.location,
        order: a.order
      })),
      images: tour.images,
      status: tour.status,
      maxParticipants: tour.maxParticipants,
      minParticipants: tour.minParticipants,
      included: tour.included,
      excluded: tour.excluded,
      languages: tour.languages,
      metadata: tour.metadata,
      createdAt: tour.createdAt.toISOString(),
      updatedAt: tour.updatedAt.toISOString(),
      publishedAt: tour.publishedAt?.toISOString()
    };
  }
}

@injectable()
export class TourApplicationService {
  constructor(
    @inject(TYPES.TourService) private tourService: TourService,
    @inject(TYPES.TourRepository) private tourRepository: TourRepository,
    @inject(TYPES.EmailService) private emailService: EmailService,
    @inject(TYPES.AnalyticsService) private analytics: AnalyticsService
  ) {}

  async createTour(command: CreateTourCommand): Promise<TourDTO> {
    // Validate command
    const validation = await this.validateCreateCommand(command);
    if (!validation.isValid) {
      throw new ValidationError('Invalid tour data', undefined, validation.errors);
    }

    // Create tour through domain service
    const result = await this.tourService.createTour({
      operatorId: command.operatorId,
      title: command.title,
      description: command.description,
      duration: command.duration,
      price: {
        amount: command.price.amount,
        currency: command.price.currency
      },
      destinations: command.destinations,
      activities: command.activities.map(a => ({
        ...a,
        price: a.price ? { amount: a.price, currency: command.price.currency } : undefined
      })),
      images: command.images,
      maxParticipants: command.maxParticipants,
      minParticipants: command.minParticipants,
      included: command.included || [],
      excluded: command.excluded || [],
      languages: command.languages || [],
      templateId: command.templateId,
      metadata: command.metadata
    });

    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    const tour = result.getValue();

    // Side effects
    await this.sendTourCreatedEmail(command.operatorEmail, tour);
    await this.trackTourCreated(tour);

    return TourMapper.toDTO(tour);
  }

  async updateTour(command: UpdateTourCommand): Promise<TourDTO> {
    // Check permissions
    const canManage = await this.tourService.canManageTour(
      command.tourId,
      command.operatorId
    );

    if (!canManage) {
      throw new UnauthorizedError('You cannot manage this tour');
    }

    // Update tour
    const result = await this.tourService.updateTour(
      command.tourId,
      {
        ...command.updates,
        price: command.updates.price ? {
          amount: command.updates.price.amount,
          currency: command.updates.price.currency
        } : undefined
      }
    );

    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    const tour = result.getValue();

    // Track update
    await this.analytics.track('tour_updated', {
      tourId: tour.id,
      operatorId: tour.operatorId,
      changes: Object.keys(command.updates)
    });

    return TourMapper.toDTO(tour);
  }

  async publishTour(tourId: string, operatorId: string): Promise<TourDTO> {
    // Check permissions
    const canManage = await this.tourService.canManageTour(tourId, operatorId);
    if (!canManage) {
      throw new UnauthorizedError('You cannot manage this tour');
    }

    // Publish tour
    const result = await this.tourService.publishTour(tourId);
    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    const tour = result.getValue();

    // Track publish
    await this.analytics.track('tour_published', {
      tourId: tour.id,
      operatorId: tour.operatorId
    });

    return TourMapper.toDTO(tour);
  }

  async archiveTour(tourId: string, operatorId: string): Promise<void> {
    // Check permissions
    const canManage = await this.tourService.canManageTour(tourId, operatorId);
    if (!canManage) {
      throw new UnauthorizedError('You cannot manage this tour');
    }

    // Archive tour
    const result = await this.tourService.archiveTour(tourId);
    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    // Track archive
    await this.analytics.track('tour_archived', {
      tourId,
      operatorId
    });
  }

  async duplicateTour(tourId: string, operatorId: string): Promise<TourDTO> {
    const result = await this.tourService.duplicateTour(tourId, operatorId);
    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    const tour = result.getValue();

    // Track duplication
    await this.analytics.track('tour_duplicated', {
      originalId: tourId,
      newId: tour.id,
      operatorId
    });

    return TourMapper.toDTO(tour);
  }

  async getTourById(tourId: string): Promise<TourDTO | null> {
    const tour = await this.tourRepository.findById(tourId);
    return tour ? TourMapper.toDTO(tour) : null;
  }

  async getToursByOperator(
    operatorId: string,
    options?: {
      includeArchived?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResult<TourDTO>> {
    const result = await this.tourRepository.findByOperator(operatorId, options);
    
    return {
      ...result,
      data: result.data.map(tour => TourMapper.toDTO(tour))
    };
  }

  async searchTours(criteria: any): Promise<PaginatedResult<TourDTO>> {
    const result = await this.tourRepository.search(criteria);
    
    return {
      ...result,
      data: result.data.map(tour => TourMapper.toDTO(tour))
    };
  }

  async getOperatorStats(operatorId: string): Promise<{
    draft: number;
    published: number;
    archived: number;
    total: number;
  }> {
    const stats = await this.tourRepository.countByStatus(operatorId);
    
    return {
      ...stats,
      total: stats.draft + stats.published + stats.archived
    };
  }

  private async validateCreateCommand(command: CreateTourCommand): Promise<{
    isValid: boolean;
    errors?: Array<{ field: string; message: string }>;
  }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!command.title || command.title.trim().length < 5) {
      errors.push({ field: 'title', message: 'Title must be at least 5 characters' });
    }

    if (!command.description || command.description.trim().length < 20) {
      errors.push({ field: 'description', message: 'Description must be at least 20 characters' });
    }

    if (command.duration <= 0 || command.duration > 365) {
      errors.push({ field: 'duration', message: 'Duration must be between 1 and 365 days' });
    }

    if (command.price.amount <= 0) {
      errors.push({ field: 'price', message: 'Price must be greater than 0' });
    }

    if (!command.destinations || command.destinations.length === 0) {
      errors.push({ field: 'destinations', message: 'At least one destination is required' });
    }

    if (!command.activities || command.activities.length === 0) {
      errors.push({ field: 'activities', message: 'At least one activity is required' });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private async sendTourCreatedEmail(email: string, tour: any): Promise<void> {
    try {
      await this.emailService.send({
        to: email,
        template: 'tour-created',
        data: {
          tourTitle: tour.title,
          tourId: tour.id,
          viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/operator/tours/${tour.id}`
        }
      });
    } catch (error) {
      // Log but don't fail the operation
      console.error('Failed to send tour created email:', error);
    }
  }

  private async trackTourCreated(tour: any): Promise<void> {
    try {
      await this.analytics.track('tour_created', {
        tourId: tour.id,
        operatorId: tour.operatorId,
        price: tour.price.amount,
        duration: tour.duration,
        destinations: tour.destinations.length,
        activities: tour.activities.length
      });
    } catch (error) {
      // Log but don't fail the operation
      console.error('Failed to track tour created:', error);
    }
  }
}