import { injectable, inject } from 'inversify';
import { Result } from '@/src/core/shared/result';
import { TYPES } from '@/src/core/types';
import { Tour, TourStatus, Activity } from './Tour';
import { TourService, CreateTourDTO, UpdateTourDTO } from './TourService';
import { TourRepository } from './TourRepository';
import { generateId } from '@/src/core/shared/utils';
import { NotFoundError, UnauthorizedError } from '@/src/core/shared/errors';

export interface Logger {
  info(message: string, data?: any): void;
  error(message: string, error?: any): void;
  warn(message: string, data?: any): void;
}

export interface EventBus {
  publish(event: any): Promise<void>;
}

export class TourCreatedEvent {
  constructor(public readonly tour: Tour) {}
}

export class TourPublishedEvent {
  constructor(public readonly tour: Tour) {}
}

export class TourArchivedEvent {
  constructor(public readonly tour: Tour) {}
}

@injectable()
export class TourServiceImpl implements TourService {
  constructor(
    @inject(TYPES.TourRepository) private repository: TourRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async createTour(data: CreateTourDTO): Promise<Result<Tour>> {
    try {
      // Validate data
      const validation = await this.validateTourData(data);
      if (!validation.isSuccess) {
        return Result.fail(validation.error);
      }

      // Map activities
      const activities: Activity[] = data.activities.map((activity, index) => ({
        id: generateId(),
        title: activity.title,
        description: activity.description,
        duration: activity.duration,
        price: activity.price,
        location: activity.location,
        order: index
      }));

      // Create tour
      const tour = Tour.create({
        operatorId: data.operatorId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price,
        destinations: data.destinations,
        activities,
        images: data.images,
        status: TourStatus.DRAFT,
        maxParticipants: data.maxParticipants,
        minParticipants: data.minParticipants,
        included: data.included || [],
        excluded: data.excluded || [],
        languages: data.languages || [],
        metadata: data.metadata || {}
      });

      // Save to repository
      const saved = await this.repository.save(tour);

      // Publish event
      await this.eventBus.publish(new TourCreatedEvent(saved));

      this.logger.info('Tour created', { 
        tourId: saved.id, 
        operatorId: saved.operatorId 
      });

      return Result.ok(saved);
    } catch (error) {
      this.logger.error('Failed to create tour', error);
      return Result.fail('Failed to create tour');
    }
  }

  async updateTour(id: string, data: UpdateTourDTO): Promise<Result<Tour>> {
    try {
      const tour = await this.repository.findById(id);
      if (!tour) {
        return Result.fail('Tour not found');
      }

      // Update tour
      const updateResult = tour.update(data);
      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.error);
      }

      // Save changes
      const saved = await this.repository.save(tour);

      this.logger.info('Tour updated', { tourId: id });

      return Result.ok(saved);
    } catch (error) {
      this.logger.error('Failed to update tour', error);
      return Result.fail('Failed to update tour');
    }
  }

  async publishTour(id: string): Promise<Result<Tour>> {
    try {
      const tour = await this.repository.findById(id);
      if (!tour) {
        return Result.fail('Tour not found');
      }

      // Publish tour
      const publishResult = tour.publish();
      if (!publishResult.isSuccess) {
        return Result.fail(publishResult.error);
      }

      // Save changes
      const saved = await this.repository.save(tour);

      // Publish event
      await this.eventBus.publish(new TourPublishedEvent(saved));

      this.logger.info('Tour published', { tourId: id });

      return Result.ok(saved);
    } catch (error) {
      this.logger.error('Failed to publish tour', error);
      return Result.fail('Failed to publish tour');
    }
  }

  async archiveTour(id: string): Promise<Result<void>> {
    try {
      const tour = await this.repository.findById(id);
      if (!tour) {
        return Result.fail('Tour not found');
      }

      // Archive tour
      const archiveResult = tour.archive();
      if (!archiveResult.isSuccess) {
        return Result.fail(archiveResult.error);
      }

      // Save changes
      await this.repository.save(tour);

      // Publish event
      await this.eventBus.publish(new TourArchivedEvent(tour));

      this.logger.info('Tour archived', { tourId: id });

      return Result.ok();
    } catch (error) {
      this.logger.error('Failed to archive tour', error);
      return Result.fail('Failed to archive tour');
    }
  }

  async duplicateTour(id: string, operatorId: string): Promise<Result<Tour>> {
    try {
      const original = await this.repository.findById(id);
      if (!original) {
        return Result.fail('Tour not found');
      }

      // Create duplicate
      const duplicate = Tour.create({
        operatorId,
        title: `${original.title} (Copy)`,
        description: original.description,
        duration: original.duration,
        price: original.price,
        destinations: original.destinations,
        activities: original.activities.map(a => ({
          title: a.title,
          description: a.description,
          duration: a.duration,
          price: a.price,
          location: a.location
        })),
        images: original.images,
        status: TourStatus.DRAFT,
        maxParticipants: original.maxParticipants,
        minParticipants: original.minParticipants,
        included: original.included,
        excluded: original.excluded,
        languages: original.languages,
        metadata: {
          ...original.metadata,
          duplicatedFrom: original.id,
          duplicatedAt: new Date().toISOString()
        }
      });

      // Save duplicate
      const saved = await this.repository.save(duplicate);

      this.logger.info('Tour duplicated', { 
        originalId: id, 
        duplicateId: saved.id 
      });

      return Result.ok(saved);
    } catch (error) {
      this.logger.error('Failed to duplicate tour', error);
      return Result.fail('Failed to duplicate tour');
    }
  }

  async validateTourData(data: CreateTourDTO): Promise<Result<void>> {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    // Description validation
    if (!data.description || data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    // Duration validation
    if (data.duration <= 0 || data.duration > 365) {
      errors.push('Duration must be between 1 and 365 days');
    }

    // Price validation
    if (data.price.amount <= 0) {
      errors.push('Price must be greater than 0');
    }

    // Destinations validation
    if (!data.destinations || data.destinations.length === 0) {
      errors.push('At least one destination is required');
    }

    // Activities validation
    if (!data.activities || data.activities.length === 0) {
      errors.push('At least one activity is required');
    }

    // Images validation
    if (!data.images || data.images.length === 0) {
      errors.push('At least one image is required');
    }

    // Participants validation
    if (data.minParticipants && data.maxParticipants) {
      if (data.minParticipants > data.maxParticipants) {
        errors.push('Minimum participants cannot exceed maximum participants');
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '));
    }

    return Result.ok();
  }

  async canManageTour(tourId: string, operatorId: string): Promise<boolean> {
    const tour = await this.repository.findById(tourId);
    return tour !== null && tour.operatorId === operatorId;
  }
}