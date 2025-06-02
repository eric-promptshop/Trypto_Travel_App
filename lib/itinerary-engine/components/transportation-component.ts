import { BaseItineraryComponent } from '../base/base-component'
import { 
  Transportation, 
  TransportationType, 
  VehicleInfo, 
  Coordinates, 
  BaseComponent,
  Money 
} from '@/lib/types/itinerary'

/**
 * Transportation component implementation
 * Represents transportation between destinations in an itinerary
 */
export class TransportationComponent extends BaseItineraryComponent implements Transportation {
  public readonly type: TransportationType
  public readonly from: string
  public readonly to: string
  public readonly fromCoordinates: Coordinates
  public readonly toCoordinates: Coordinates
  public readonly departureTime: string
  public readonly arrivalTime: string
  public readonly duration: number
  public readonly carrier?: string
  public readonly vehicleInfo?: VehicleInfo
  public readonly bookingReference?: string

  constructor(data: Transportation) {
    super(data)
    
    this.type = data.type
    this.from = data.from
    this.to = data.to
    this.fromCoordinates = data.fromCoordinates
    this.toCoordinates = data.toCoordinates
    this.departureTime = data.departureTime
    this.arrivalTime = data.arrivalTime
    this.duration = data.duration
    this.carrier = data.carrier
    this.vehicleInfo = data.vehicleInfo
    this.bookingReference = data.bookingReference
  }

  /**
   * Transportation-specific validation
   */
  protected validateSpecific(): void {
    // Validate coordinates
    this.validateCoordinates(this.fromCoordinates, 'from')
    this.validateCoordinates(this.toCoordinates, 'to')

    // Validate duration
    if (this.duration <= 0) {
      throw new Error('Transportation duration must be positive')
    }

    // Validate times
    if (!this.isValidISOTimeString(this.departureTime)) {
      throw new Error('Invalid departure time format')
    }
    if (!this.isValidISOTimeString(this.arrivalTime)) {
      throw new Error('Invalid arrival time format')
    }

    // Validate departure is before arrival
    const depTime = new Date(this.departureTime)
    const arrTime = new Date(this.arrivalTime)
    if (depTime >= arrTime) {
      throw new Error('Departure time must be before arrival time')
    }

    // Validate duration matches time difference
    const calculatedDuration = Math.floor((arrTime.getTime() - depTime.getTime()) / (1000 * 60))
    if (Math.abs(calculatedDuration - this.duration) > 5) { // Allow 5-minute tolerance
      throw new Error('Duration does not match departure and arrival times')
    }

    // Validate locations
    if (!this.from || this.from.trim().length === 0) {
      throw new Error('From location is required')
    }
    if (!this.to || this.to.trim().length === 0) {
      throw new Error('To location is required')
    }
    if (this.from === this.to) {
      throw new Error('From and to locations cannot be the same')
    }

    // Validate transportation type specific requirements
    this.validateTypeSpecificRequirements()
  }

  /**
   * Validate coordinates helper
   */
  private validateCoordinates(coords: Coordinates, label: string): void {
    if (coords.latitude < -90 || coords.latitude > 90) {
      throw new Error(`Invalid ${label} latitude value`)
    }
    if (coords.longitude < -180 || coords.longitude > 180) {
      throw new Error(`Invalid ${label} longitude value`)
    }
  }

  /**
   * Check if string is valid ISO time format
   */
  private isValidISOTimeString(timeStr: string): boolean {
    try {
      const date = new Date(timeStr)
      return date instanceof Date && !isNaN(date.getTime())
    } catch {
      return false
    }
  }

  /**
   * Validate type-specific requirements
   */
  private validateTypeSpecificRequirements(): void {
    switch (this.type) {
      case 'flight':
        if (!this.carrier) {
          throw new Error('Airline carrier is required for flights')
        }
        break
      case 'train':
        if (this.duration < 10) {
          throw new Error('Train journey duration seems too short')
        }
        break
      case 'walking':
        if (this.duration > 8 * 60) { // 8 hours
          throw new Error('Walking duration seems unreasonably long')
        }
        break
      case 'cycling':
        if (this.duration > 12 * 60) { // 12 hours
          throw new Error('Cycling duration seems unreasonably long')
        }
        break
      // Additional validation can be added for other types
    }
  }

  /**
   * Get estimated duration in minutes
   */
  public getEstimatedDuration(): number {
    return this.duration
  }

  /**
   * Get component type identifier
   */
  public getType(): string {
    return 'transportation'
  }

  /**
   * Check if transportation is available for given dates
   */
  public isAvailable(startDate: Date, endDate?: Date): boolean {
    const depDate = new Date(this.departureTime)
    
    // Check if departure falls within the available date range
    if (startDate && depDate < startDate) return false
    if (endDate && depDate > endDate) return false
    
    return true
  }

  /**
   * Get transportation priority based on type and characteristics
   */
  public override getPriority(): number {
    let priority = 1

    // Higher priority for faster transportation modes
    const fastModes: TransportationType[] = ['flight', 'train']
    if (fastModes.includes(this.type)) {
      priority += 2
    }

    // Boost priority for transportation with booking references
    if (this.bookingReference) {
      priority += 1
    }

    // Boost priority for shorter duration (more efficient)
    if (this.duration < 60) { // Less than 1 hour
      priority += 1
    }

    return priority
  }

  /**
   * Get transportation-specific data for serialization
   */
  protected getSpecificData(): object {
    return {
      type: this.type,
      from: this.from,
      to: this.to,
      fromCoordinates: this.fromCoordinates,
      toCoordinates: this.toCoordinates,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      duration: this.duration,
      carrier: this.carrier,
      vehicleInfo: this.vehicleInfo,
      bookingReference: this.bookingReference
    }
  }

  /**
   * Clone the transportation with optional modifications
   */
  public clone(modifications?: Partial<BaseComponent>): TransportationComponent {
    const clonedData: Transportation = {
      ...this.toJSON() as Transportation,
      ...modifications,
      id: modifications?.id || this.id + '_clone_' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return new TransportationComponent(clonedData)
  }

  /**
   * Calculate travel distance using Haversine formula (in kilometers)
   */
  public calculateDistance(): number {
    const R = 6371 // Earth's radius in kilometers
    const lat1Rad = this.fromCoordinates.latitude * Math.PI / 180
    const lat2Rad = this.toCoordinates.latitude * Math.PI / 180
    const deltaLatRad = (this.toCoordinates.latitude - this.fromCoordinates.latitude) * Math.PI / 180
    const deltaLngRad = (this.toCoordinates.longitude - this.fromCoordinates.longitude) * Math.PI / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Get transportation mode category
   */
  public getModeCategory(): 'local' | 'regional' | 'long-distance' {
    const distance = this.calculateDistance()
    
    if (distance <= 10) return 'local'      // 10km or less
    if (distance <= 100) return 'regional'  // 100km or less
    return 'long-distance'                  // More than 100km
  }

  /**
   * Check if transportation is eco-friendly
   */
  public isEcoFriendly(): boolean {
    const ecoFriendlyModes: TransportationType[] = ['walking', 'cycling', 'train']
    return ecoFriendlyModes.includes(this.type)
  }

  /**
   * Get estimated speed in km/h
   */
  public getAverageSpeed(): number {
    const distance = this.calculateDistance()
    const durationHours = this.duration / 60
    
    if (durationHours === 0) return 0
    return distance / durationHours
  }

  /**
   * Check if this transportation requires booking
   */
  public requiresBooking(): boolean {
    const bookingRequiredModes: TransportationType[] = ['flight', 'train', 'bus']
    return bookingRequiredModes.includes(this.type)
  }

  /**
   * Get transportation cost per person (if cost is for the entire group)
   */
  public getCostPerPerson(groupSize: number = 1): Money | undefined {
    if (!this.estimatedCost) return undefined

    return {
      amount: this.estimatedCost.amount / groupSize,
      currency: this.estimatedCost.currency
    }
  }

  /**
   * Get departure and arrival dates as Date objects
   */
  public getDepartureDates(): { departure: Date; arrival: Date } {
    return {
      departure: new Date(this.departureTime),
      arrival: new Date(this.arrivalTime)
    }
  }

  /**
   * Check if transportation has specific amenities
   */
  public hasAmenities(requiredAmenities: string[]): boolean {
    if (!this.vehicleInfo?.amenities) return false
    
    return requiredAmenities.every(amenity => 
      this.vehicleInfo!.amenities.some(available => 
        available.toLowerCase().includes(amenity.toLowerCase())
      )
    )
  }

  /**
   * Get formatted duration string
   */
  public getFormattedDuration(): string {
    const hours = Math.floor(this.duration / 60)
    const minutes = this.duration % 60
    
    if (hours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}m`
    }
  }

  /**
   * Create a summary of the transportation
   */
  public getSummary(): string {
    const duration = this.getFormattedDuration()
    const distance = Math.round(this.calculateDistance())
    const costInfo = this.estimatedCost ? ` (${this.estimatedCost.amount} ${this.estimatedCost.currency})` : ''
    
    return `${this.type} from ${this.from} to ${this.to} - ${duration}, ${distance}km${costInfo}`
  }
} 