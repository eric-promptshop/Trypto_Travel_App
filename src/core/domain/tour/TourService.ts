import { Result } from '@/src/core/shared/result';
import { Tour, TourStatus } from './Tour';
import { Money } from '@/src/core/shared/types';

export interface CreateTourDTO {
  operatorId: string;
  title: string;
  description: string;
  duration: number;
  price: Money;
  destinations: string[];
  activities: Array<{
    title: string;
    description: string;
    duration?: string;
    price?: Money;
    location?: {
      address: string;
      city?: string;
      country?: string;
      coordinates?: { lat: number; lng: number };
    };
  }>;
  images: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  maxParticipants?: number;
  minParticipants?: number;
  included: string[];
  excluded: string[];
  languages: string[];
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTourDTO {
  title?: string;
  description?: string;
  duration?: number;
  price?: Money;
  destinations?: string[];
  maxParticipants?: number;
  minParticipants?: number;
  included?: string[];
  excluded?: string[];
  languages?: string[];
  metadata?: Record<string, any>;
}

/**
 * Domain service for Tour operations
 */
export interface TourService {
  /**
   * Create a new tour
   */
  createTour(data: CreateTourDTO): Promise<Result<Tour>>;

  /**
   * Update an existing tour
   */
  updateTour(id: string, data: UpdateTourDTO): Promise<Result<Tour>>;

  /**
   * Publish a tour
   */
  publishTour(id: string): Promise<Result<Tour>>;

  /**
   * Archive a tour
   */
  archiveTour(id: string): Promise<Result<void>>;

  /**
   * Duplicate a tour
   */
  duplicateTour(id: string, operatorId: string): Promise<Result<Tour>>;

  /**
   * Validate tour data
   */
  validateTourData(data: CreateTourDTO): Promise<Result<void>>;

  /**
   * Check if operator can manage tour
   */
  canManageTour(tourId: string, operatorId: string): Promise<boolean>;
}