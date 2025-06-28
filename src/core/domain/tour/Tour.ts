import { Result } from '@/src/core/shared/result';
import { Money, Image, Location } from '@/src/core/shared/types';
import { generateId } from '@/src/core/shared/utils';
import { BusinessRuleError } from '@/src/core/shared/errors';

export enum TourStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  duration?: string;
  price?: Money;
  location?: Location;
  order: number;
}

export interface TourTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}

export interface TourProps {
  id: string;
  operatorId: string;
  title: string;
  description: string;
  duration: number; // in days
  price: Money;
  destinations: string[];
  activities: Activity[];
  images: Image[];
  status: TourStatus;
  template?: TourTemplate;
  maxParticipants?: number;
  minParticipants?: number;
  included: string[];
  excluded: string[];
  languages: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export class Tour {
  private constructor(private props: TourProps) {}

  /**
   * Create a new tour
   */
  static create(props: Omit<TourProps, 'id' | 'createdAt' | 'updatedAt'>): Tour {
    const now = new Date();
    return new Tour({
      ...props,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute a tour from persistence
   */
  static reconstitute(props: TourProps): Tour {
    return new Tour(props);
  }

  /**
   * Publish a tour
   */
  publish(): Result<void> {
    if (this.props.status !== TourStatus.DRAFT) {
      return Result.fail('Only draft tours can be published');
    }

    const validation = this.validateForPublishing();
    if (!validation.isSuccess) {
      return validation;
    }

    this.props.status = TourStatus.PUBLISHED;
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
    
    return Result.ok();
  }

  /**
   * Archive a tour
   */
  archive(): Result<void> {
    if (this.props.status === TourStatus.ARCHIVED) {
      return Result.fail('Tour is already archived');
    }

    this.props.status = TourStatus.ARCHIVED;
    this.props.updatedAt = new Date();
    
    return Result.ok();
  }

  /**
   * Update tour details
   */
  update(updates: Partial<Omit<TourProps, 'id' | 'operatorId' | 'createdAt' | 'status'>>): Result<void> {
    if (this.props.status === TourStatus.ARCHIVED) {
      return Result.fail('Cannot update archived tour');
    }

    // Apply updates
    Object.assign(this.props, {
      ...updates,
      updatedAt: new Date()
    });

    // If published, validate changes
    if (this.props.status === TourStatus.PUBLISHED) {
      const validation = this.validateForPublishing();
      if (!validation.isSuccess) {
        return validation;
      }
    }

    return Result.ok();
  }

  /**
   * Add an activity to the tour
   */
  addActivity(activity: Omit<Activity, 'id' | 'order'>): Result<void> {
    if (this.props.status === TourStatus.ARCHIVED) {
      return Result.fail('Cannot add activities to archived tour');
    }

    const newActivity: Activity = {
      ...activity,
      id: generateId(),
      order: this.props.activities.length
    };

    this.props.activities.push(newActivity);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Remove an activity from the tour
   */
  removeActivity(activityId: string): Result<void> {
    if (this.props.status === TourStatus.ARCHIVED) {
      return Result.fail('Cannot remove activities from archived tour');
    }

    const index = this.props.activities.findIndex(a => a.id === activityId);
    if (index === -1) {
      return Result.fail('Activity not found');
    }

    this.props.activities.splice(index, 1);
    
    // Reorder remaining activities
    this.props.activities.forEach((activity, i) => {
      activity.order = i;
    });

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Validate tour for publishing
   */
  private validateForPublishing(): Result<void> {
    const errors: string[] = [];

    if (!this.props.title || this.props.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    if (!this.props.description || this.props.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    if (this.props.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (this.props.destinations.length === 0) {
      errors.push('At least one destination is required');
    }

    if (this.props.activities.length === 0) {
      errors.push('At least one activity is required');
    }

    if (this.props.price.amount <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (this.props.images.length === 0) {
      errors.push('At least one image is required');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '));
    }

    return Result.ok();
  }

  /**
   * Check if tour is bookable
   */
  isBookable(): boolean {
    return this.props.status === TourStatus.PUBLISHED;
  }

  /**
   * Calculate total price for given number of participants
   */
  calculatePrice(participants: number): Money {
    return this.props.price.multiply(participants);
  }

  // Getters
  get id(): string { return this.props.id; }
  get operatorId(): string { return this.props.operatorId; }
  get title(): string { return this.props.title; }
  get description(): string { return this.props.description; }
  get duration(): number { return this.props.duration; }
  get price(): Money { return this.props.price; }
  get destinations(): string[] { return [...this.props.destinations]; }
  get activities(): Activity[] { return [...this.props.activities]; }
  get images(): Image[] { return [...this.props.images]; }
  get status(): TourStatus { return this.props.status; }
  get template(): TourTemplate | undefined { return this.props.template; }
  get maxParticipants(): number | undefined { return this.props.maxParticipants; }
  get minParticipants(): number | undefined { return this.props.minParticipants; }
  get included(): string[] { return [...this.props.included]; }
  get excluded(): string[] { return [...this.props.excluded]; }
  get languages(): string[] { return [...this.props.languages]; }
  get metadata(): Record<string, any> { return { ...this.props.metadata }; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }
  
  /**
   * Convert to plain object
   */
  toJSON(): TourProps {
    return {
      ...this.props,
      destinations: [...this.props.destinations],
      activities: [...this.props.activities],
      images: [...this.props.images],
      included: [...this.props.included],
      excluded: [...this.props.excluded],
      languages: [...this.props.languages],
      metadata: { ...this.props.metadata }
    };
  }
}