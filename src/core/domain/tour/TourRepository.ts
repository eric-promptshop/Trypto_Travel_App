import { Tour } from './Tour';
import { PaginatedResult, SearchCriteria } from '@/src/core/shared/types';

/**
 * Repository interface for Tour aggregate
 * This interface defines the contract for data persistence
 */
export interface TourRepository {
  /**
   * Save a tour (create or update)
   */
  save(tour: Tour): Promise<Tour>;

  /**
   * Find a tour by ID
   */
  findById(id: string): Promise<Tour | null>;

  /**
   * Find tours by operator
   */
  findByOperator(operatorId: string, options?: {
    includeArchived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Tour>>;

  /**
   * Search tours
   */
  search(criteria: SearchCriteria): Promise<PaginatedResult<Tour>>;

  /**
   * Find published tours by destination
   */
  findByDestination(destination: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Tour>>;

  /**
   * Find similar tours
   */
  findSimilar(tourId: string, limit?: number): Promise<Tour[]>;

  /**
   * Delete a tour (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Count tours by status for an operator
   */
  countByStatus(operatorId: string): Promise<{
    draft: number;
    published: number;
    archived: number;
  }>;

  /**
   * Find tours that use a specific template
   */
  findByTemplate(templateId: string): Promise<Tour[]>;
}