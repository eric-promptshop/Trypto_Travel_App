import { BaseItineraryComponent } from '../base/base-component'
import { 
  Accommodation, 
  AccommodationType, 
  RoomType, 
  Coordinates, 
  ContactInfo, 
  BaseComponent,
  Money 
} from '@/lib/types/itinerary'

/**
 * Accommodation component implementation
 * Represents lodging options within an itinerary
 */
export class AccommodationComponent extends BaseItineraryComponent implements Accommodation {
  public readonly type: AccommodationType
  public readonly location: string
  public readonly coordinates: Coordinates
  public readonly starRating?: number
  public readonly amenities: string[]
  public readonly roomTypes: RoomType[]
  public readonly checkInTime: string
  public readonly checkOutTime: string
  public readonly cancellationPolicy: string
  public readonly contactInfo: ContactInfo

  constructor(data: Accommodation) {
    super(data)
    
    this.type = data.type
    this.location = data.location
    this.coordinates = data.coordinates
    this.starRating = data.starRating
    this.amenities = data.amenities
    this.roomTypes = data.roomTypes
    this.checkInTime = data.checkInTime
    this.checkOutTime = data.checkOutTime
    this.cancellationPolicy = data.cancellationPolicy
    this.contactInfo = data.contactInfo
  }

  /**
   * Accommodation-specific validation
   */
  protected validateSpecific(): void {
    // Validate coordinates
    if (this.coordinates.latitude < -90 || this.coordinates.latitude > 90) {
      throw new Error('Invalid latitude value')
    }
    if (this.coordinates.longitude < -180 || this.coordinates.longitude > 180) {
      throw new Error('Invalid longitude value')
    }

    // Validate star rating
    if (this.starRating !== undefined && (this.starRating < 1 || this.starRating > 5)) {
      throw new Error('Star rating must be between 1 and 5')
    }

    // Validate check-in/check-out times
    if (!this.isValidTimeFormat(this.checkInTime)) {
      throw new Error('Invalid check-in time format')
    }
    if (!this.isValidTimeFormat(this.checkOutTime)) {
      throw new Error('Invalid check-out time format')
    }

    // Validate location
    if (!this.location || this.location.trim().length === 0) {
      throw new Error('Accommodation location is required')
    }

    // Validate room types
    if (this.roomTypes.length === 0) {
      throw new Error('At least one room type is required')
    }

    // Validate room type data
    for (const roomType of this.roomTypes) {
      if (!roomType.name || roomType.name.trim().length === 0) {
        throw new Error('Room type name is required')
      }
      if (roomType.capacity <= 0) {
        throw new Error('Room capacity must be positive')
      }
      if (roomType.pricePerNight.amount < 0) {
        throw new Error('Room price cannot be negative')
      }
    }

    // Validate contact info
    if (!this.contactInfo.address || this.contactInfo.address.trim().length === 0) {
      throw new Error('Contact address is required')
    }

    // Validate email format if provided
    if (this.contactInfo.email && !this.isValidEmail(this.contactInfo.email)) {
      throw new Error('Invalid email format')
    }

    // Validate website URL if provided
    if (this.contactInfo.website) {
      try {
        new URL(this.contactInfo.website)
      } catch {
        throw new Error('Invalid website URL')
      }
    }
  }

  /**
   * Check if time format is valid (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  /**
   * Check if email format is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Get estimated duration (stays are typically overnight)
   */
  public getEstimatedDuration(): number {
    // Accommodation duration is typically in nights, return 24 hours in minutes
    return 24 * 60
  }

  /**
   * Get component type identifier
   */
  public getType(): string {
    return 'accommodation'
  }

  /**
   * Check if accommodation is available for given dates
   */
  public isAvailable(startDate: Date, endDate?: Date): boolean {
    // Basic availability check - can be extended with actual availability data
    return true
  }

  /**
   * Get accommodation priority based on type and rating
   */
  public override getPriority(): number {
    let priority = 1

    // Higher priority for higher star ratings
    if (this.starRating) {
      priority += this.starRating
    }

    // Boost priority for certain accommodation types
    const premiumTypes: AccommodationType[] = ['hotel', 'resort', 'boutique']
    if (premiumTypes.includes(this.type)) {
      priority += 2
    }

    return priority
  }

  /**
   * Get accommodation-specific data for serialization
   */
  protected getSpecificData(): object {
    return {
      type: this.type,
      location: this.location,
      coordinates: this.coordinates,
      starRating: this.starRating,
      amenities: this.amenities,
      roomTypes: this.roomTypes,
      checkInTime: this.checkInTime,
      checkOutTime: this.checkOutTime,
      cancellationPolicy: this.cancellationPolicy,
      contactInfo: this.contactInfo
    }
  }

  /**
   * Clone the accommodation with optional modifications
   */
  public clone(modifications?: Partial<BaseComponent>): AccommodationComponent {
    const clonedData: Accommodation = {
      ...this.toJSON() as Accommodation,
      ...modifications,
      id: modifications?.id || this.id + '_clone_' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return new AccommodationComponent(clonedData)
  }

  /**
   * Get room types that can accommodate the specified number of guests
   */
  public getSuitableRoomTypes(guestCount: number): RoomType[] {
    return this.roomTypes.filter(room => room.capacity >= guestCount)
  }

  /**
   * Get the cheapest room type that can accommodate guests
   */
  public getCheapestSuitableRoom(guestCount: number, currency: string = 'USD'): RoomType | null {
    const suitableRooms = this.getSuitableRoomTypes(guestCount)
      .filter(room => room.pricePerNight.currency === currency)
    
    if (suitableRooms.length === 0) return null
    
    return suitableRooms.reduce((cheapest, current) => 
      current.pricePerNight.amount < cheapest.pricePerNight.amount ? current : cheapest
    )
  }

  /**
   * Calculate total cost for a stay
   */
  public calculateStayCost(roomType: RoomType, nights: number): Money {
    return {
      amount: roomType.pricePerNight.amount * nights,
      currency: roomType.pricePerNight.currency
    }
  }

  /**
   * Check if accommodation has specific amenities
   */
  public hasAmenities(requiredAmenities: string[]): boolean {
    return requiredAmenities.every(amenity => 
      this.amenities.some(available => 
        available.toLowerCase().includes(amenity.toLowerCase())
      )
    )
  }

  /**
   * Get accommodation category based on star rating
   */
  public getCategory(): 'budget' | 'mid-range' | 'luxury' {
    if (!this.starRating) return 'mid-range'
    
    if (this.starRating <= 2) return 'budget'
    if (this.starRating >= 4) return 'luxury'
    return 'mid-range'
  }

  /**
   * Check if accommodation is accessible
   */
  public isAccessible(): boolean {
    const accessibilityAmenities = [
      'wheelchair accessible',
      'elevator',
      'accessible bathroom',
      'accessible parking',
      'accessible entrance'
    ]
    
    return accessibilityAmenities.some(amenity => 
      this.amenities.some(available => 
        available.toLowerCase().includes(amenity)
      )
    )
  }

  /**
   * Get check-in and check-out times as Date objects for a specific date
   */
  public getCheckInOutDates(date: Date): { checkIn: Date; checkOut: Date } {
    const checkInDate = new Date(date)
    const [checkInHours, checkInMinutes] = this.checkInTime.split(':').map(Number)
    checkInDate.setHours(checkInHours, checkInMinutes, 0, 0)

    const checkOutDate = new Date(date)
    checkOutDate.setDate(checkOutDate.getDate() + 1) // Next day
    const [checkOutHours, checkOutMinutes] = this.checkOutTime.split(':').map(Number)
    checkOutDate.setHours(checkOutHours, checkOutMinutes, 0, 0)

    return { checkIn: checkInDate, checkOut: checkOutDate }
  }

  /**
   * Create a summary of the accommodation
   */
  public getSummary(): string {
    const starInfo = this.starRating ? ` (${this.starRating}-star)` : ''
    const cheapestRoom = this.roomTypes.reduce((cheapest, current) => 
      current.pricePerNight.amount < cheapest.pricePerNight.amount ? current : cheapest
    )
    const priceInfo = ` from ${cheapestRoom.pricePerNight.amount} ${cheapestRoom.pricePerNight.currency}/night`
    
    return `${this.title}${starInfo} - ${this.type} in ${this.location}${priceInfo}`
  }
} 