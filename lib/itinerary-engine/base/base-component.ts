import { BaseComponent, Money } from '@/lib/types/itinerary'
import { z } from 'zod'

/**
 * Abstract base class for all itinerary components
 * Provides common functionality for validation, serialization, and metadata
 */
export abstract class BaseItineraryComponent implements BaseComponent {
  public readonly id: string
  public readonly title: string
  public readonly description: string
  public readonly images: string[]
  public readonly tags: string[]
  public readonly estimatedCost?: Money
  public readonly bookingUrl?: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: Partial<BaseComponent> & { id: string; title: string; description: string }) {
    this.id = data.id
    this.title = data.title
    this.description = data.description
    this.images = data.images || []
    this.tags = data.tags || []
    if (data.estimatedCost !== undefined) {
      this.estimatedCost = data.estimatedCost
    }
    if (data.bookingUrl !== undefined) {
      this.bookingUrl = data.bookingUrl
    }
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()

    this.validate()
  }

  /**
   * Abstract method that each component must implement for specific validation
   */
  protected abstract validateSpecific(): void

  /**
   * Common validation for all components
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Component ID is required')
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Component title is required')
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Component description is required')
    }

    // Validate booking URL if provided
    if (this.bookingUrl) {
      try {
        new URL(this.bookingUrl)
      } catch {
        throw new Error('Invalid booking URL format')
      }
    }

    // Validate estimated cost if provided
    if (this.estimatedCost) {
      if (this.estimatedCost.amount < 0) {
        throw new Error('Cost amount cannot be negative')
      }
      if (!this.estimatedCost.currency || this.estimatedCost.currency.length !== 3) {
        throw new Error('Currency must be a valid 3-letter code')
      }
    }

    // Validate images are URLs
    for (const image of this.images) {
      if (image && !this.isValidImageUrl(image)) {
        throw new Error(`Invalid image URL: ${image}`)
      }
    }

    // Call component-specific validation
    this.validateSpecific()
  }

  /**
   * Check if a string is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      // Allow relative paths for local images
      return url.startsWith('/') || url.startsWith('./')
    }
  }

  /**
   * Convert component to JSON for storage/transmission
   */
  public toJSON(): object {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      images: this.images,
      tags: this.tags,
      estimatedCost: this.estimatedCost,
      bookingUrl: this.bookingUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      ...this.getSpecificData()
    }
  }

  /**
   * Abstract method for component-specific data serialization
   */
  protected abstract getSpecificData(): object

  /**
   * Update component metadata
   */
  public updateMetadata(updates: Partial<Pick<BaseComponent, 'title' | 'description' | 'tags' | 'estimatedCost' | 'bookingUrl'>>): void {
    if (updates.title !== undefined) {
      Object.defineProperty(this, 'title', { value: updates.title, writable: false })
    }
    if (updates.description !== undefined) {
      Object.defineProperty(this, 'description', { value: updates.description, writable: false })
    }
    if (updates.tags !== undefined) {
      Object.defineProperty(this, 'tags', { value: [...updates.tags], writable: false })
    }
    if (updates.estimatedCost !== undefined) {
      Object.defineProperty(this, 'estimatedCost', { value: updates.estimatedCost, writable: false })
    }
    if (updates.bookingUrl !== undefined) {
      Object.defineProperty(this, 'bookingUrl', { value: updates.bookingUrl, writable: false })
    }
    
    Object.defineProperty(this, 'updatedAt', { value: new Date(), writable: false })
    this.validate()
  }

  /**
   * Check if component has a specific tag
   */
  public hasTag(tag: string): boolean {
    return this.tags.includes(tag)
  }

  /**
   * Check if component matches search criteria
   */
  public matches(searchTerm: string): boolean {
    const term = searchTerm.toLowerCase()
    return (
      this.title.toLowerCase().includes(term) ||
      this.description.toLowerCase().includes(term) ||
      this.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }

  /**
   * Calculate estimated duration in minutes (to be overridden by specific components)
   */
  public abstract getEstimatedDuration(): number

  /**
   * Get component type identifier
   */
  public abstract getType(): string

  /**
   * Check if component is available for given dates
   */
  public abstract isAvailable(startDate: Date, endDate?: Date): boolean

  /**
   * Get component display priority (higher numbers = higher priority)
   */
  public getPriority(): number {
    return 1 // Base priority, can be overridden
  }

  /**
   * Clone the component with optional modifications
   */
  public abstract clone(modifications?: Partial<BaseComponent>): BaseItineraryComponent
}

/**
 * Utility functions for component management
 */
export class ComponentUtils {
  /**
   * Generate a unique ID for a component
   */
  static generateId(prefix: string = 'comp'): string {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substr(2, 9)
    return `${prefix}_${timestamp}_${randomStr}`
  }

  /**
   * Validate component data against schema
   */
  static validateComponentData<T>(data: any, schema: z.ZodSchema<T>): { valid: boolean; errors: string[] } {
    try {
      schema.parse(data)
      return { valid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        }
      }
      return { valid: false, errors: [error instanceof Error ? error.message : 'Unknown validation error'] }
    }
  }

  /**
   * Sort components by priority and relevance
   */
  static sortByPriority<T extends BaseItineraryComponent>(components: T[], searchTerm?: string): T[] {
    return components.sort((a, b) => {
      // First sort by priority
      const priorityDiff = b.getPriority() - a.getPriority()
      if (priorityDiff !== 0) return priorityDiff

      // Then by search relevance if search term provided
      if (searchTerm) {
        const aMatches = a.matches(searchTerm)
        const bMatches = b.matches(searchTerm)
        if (aMatches && !bMatches) return -1
        if (!aMatches && bMatches) return 1
      }

      // Finally by creation date (newer first)
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }

  /**
   * Filter components by tags
   */
  static filterByTags<T extends BaseItineraryComponent>(components: T[], tags: string[]): T[] {
    if (tags.length === 0) return components
    
    return components.filter(component => 
      tags.some(tag => component.hasTag(tag))
    )
  }

  /**
   * Group components by type
   */
  static groupByType<T extends BaseItineraryComponent>(components: T[]): Map<string, T[]> {
    const groups = new Map<string, T[]>()
    
    for (const component of components) {
      const type = component.getType()
      if (!groups.has(type)) {
        groups.set(type, [])
      }
      groups.get(type)!.push(component)
    }
    
    return groups
  }

  /**
   * Calculate total estimated cost for a collection of components
   */
  static calculateTotalCost(components: BaseItineraryComponent[], currency: string = 'USD'): Money {
    let total = 0
    let hasIncompatibleCurrency = false

    for (const component of components) {
      if (component.estimatedCost) {
        if (component.estimatedCost.currency === currency) {
          total += component.estimatedCost.amount
        } else {
          hasIncompatibleCurrency = true
        }
      }
    }

    if (hasIncompatibleCurrency) {
      console.warn('Some components have different currencies. Consider implementing currency conversion.')
    }

    return { amount: total, currency }
  }

  /**
   * Extract all unique tags from a collection of components
   */
  static extractAllTags(components: BaseItineraryComponent[]): string[] {
    const tagSet = new Set<string>()
    
    for (const component of components) {
      for (const tag of component.tags) {
        tagSet.add(tag)
      }
    }
    
    return Array.from(tagSet).sort()
  }
} 