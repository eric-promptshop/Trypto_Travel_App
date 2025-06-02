import { z } from 'zod'
import { TravelFormData } from '@/components/travel-forms/travel-form-provider'

// ================================
// CORE ITINERARY DATA MODELS
// ================================

// Geographic coordinates interface
export interface Coordinates {
  latitude: number
  longitude: number
}

// Base component interface - all itinerary components extend this
export interface BaseComponent {
  id: string
  title: string
  description: string
  images: string[]
  tags: string[]
  estimatedCost?: Money
  bookingUrl?: string
  createdAt: Date
  updatedAt: Date
}

// Money interface for pricing calculations
export interface Money {
  amount: number
  currency: string
}

// Time slot interface for activities and events
export interface TimeSlot {
  startTime: string // ISO time format (e.g., "09:00:00")
  endTime: string   // ISO time format (e.g., "12:00:00")
  duration: number  // in minutes
}

// ================================
// DESTINATION COMPONENT
// ================================

export interface Destination extends BaseComponent {
  location: string
  coordinates: Coordinates
  countryCode: string
  timezone: string
  weatherInfo?: WeatherInfo
  localCurrency: string
  languages: string[]
  safetyRating: number // 1-10 scale
  touristSeason: 'peak' | 'shoulder' | 'off'
}

export interface WeatherInfo {
  averageTemperature: number
  humidity: number
  precipitation: number
  season: string
}

// ================================
// ACTIVITY COMPONENT
// ================================

export interface Activity extends BaseComponent {
  category: ActivityCategory
  location: string
  coordinates: Coordinates
  timeSlot: TimeSlot
  difficulty: 'easy' | 'moderate' | 'challenging'
  minAge?: number
  maxGroupSize?: number
  indoorOutdoor: 'indoor' | 'outdoor' | 'both'
  accessibility: AccessibilityInfo
  seasonality: string[]
  bookingRequired: boolean
  cancellationPolicy?: string
}

export type ActivityCategory = 
  | 'sightseeing' 
  | 'adventure' 
  | 'cultural' 
  | 'culinary' 
  | 'shopping' 
  | 'entertainment' 
  | 'relaxation' 
  | 'educational' 
  | 'nightlife'
  | 'sports'

export interface AccessibilityInfo {
  wheelchairAccessible: boolean
  hearingImpaired: boolean
  visuallyImpaired: boolean
  mobilityAssistance: boolean
}

// ================================
// ACCOMMODATION COMPONENT
// ================================

export interface Accommodation extends BaseComponent {
  type: AccommodationType
  location: string
  coordinates: Coordinates
  starRating?: number
  amenities: string[]
  roomTypes: RoomType[]
  checkInTime: string
  checkOutTime: string
  cancellationPolicy: string
  contactInfo: ContactInfo
}

export type AccommodationType = 'hotel' | 'resort' | 'vacation-rental' | 'hostel' | 'guesthouse' | 'boutique'

export interface RoomType {
  name: string
  capacity: number
  bedConfiguration: string
  amenities: string[]
  pricePerNight: Money
}

export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
  address: string
}

// ================================
// TRANSPORTATION COMPONENT
// ================================

export interface Transportation extends BaseComponent {
  type: TransportationType
  from: string
  to: string
  fromCoordinates: Coordinates
  toCoordinates: Coordinates
  departureTime: string
  arrivalTime: string
  duration: number // in minutes
  carrier?: string
  vehicleInfo?: VehicleInfo
  bookingReference?: string
}

export type TransportationType = 'flight' | 'train' | 'bus' | 'car' | 'boat' | 'taxi' | 'walking' | 'cycling'

export interface VehicleInfo {
  make?: string
  model?: string
  seatClass?: string
  amenities: string[]
}

// ================================
// DAY STRUCTURE
// ================================

export interface ItineraryDay {
  id: string
  dayNumber: number
  date: string // ISO date format
  title: string
  location: string
  coordinates: Coordinates
  accommodation?: Accommodation
  activities: Activity[]
  transportation: Transportation[]
  meals: Meal[]
  totalEstimatedCost: Money
  pacing: 'relaxed' | 'moderate' | 'packed'
  notes?: string
  weather?: WeatherInfo
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  time: string
  venue?: string
  location?: string
  estimatedCost?: Money
  dietaryOptions: string[]
}

// ================================
// COMPLETE ITINERARY
// ================================

export interface GeneratedItinerary {
  id: string
  title: string
  description: string
  destinations: Destination[]
  days: ItineraryDay[]
  totalDuration: number // in days
  totalEstimatedCost: Money
  summary: ItinerarySummary
  metadata: ItineraryMetadata
  preferences: UserPreferences // Original user input
  generatedAt: Date
  version: string
}

export interface ItinerarySummary {
  highlights: string[]
  totalActivities: number
  uniqueDestinations: number
  avgDailyCost: Money
  recommendedBudget: Money
  physicalDemand: 'low' | 'moderate' | 'high'
  culturalImmersion: 'light' | 'moderate' | 'deep'
}

export interface ItineraryMetadata {
  generationTime: number // in milliseconds
  aiModel: string
  confidenceScore: number // 0-1
  userFeedback?: UserFeedback
  optimizationFlags: string[]
}

export interface UserFeedback {
  rating: number // 1-5
  comments?: string
  improvements?: string[]
  submittedAt: Date
}

// ================================
// USER PREFERENCES INTERFACE
// ================================

export interface UserPreferences extends TravelFormData {
  // Additional computed preferences
  tripDuration: number
  travelerProfiles: TravelerProfile[]
  budgetCategory: 'budget' | 'mid-range' | 'luxury'
  pacePreference: 'slow' | 'moderate' | 'fast'
}

export interface TravelerProfile {
  type: 'adult' | 'child' | 'infant'
  count: number
  ageRange?: string
  specialNeeds?: string[]
}

// ================================
// CONTENT MATCHING INTERFACES
// ================================

export interface ContentMatchScore {
  contentId: string
  score: number // 0-1
  reasons: string[]
  category: string
}

export interface MatchingCriteria {
  userPreferences: UserPreferences
  destinationConstraints: DestinationConstraint[]
  timeConstraints: TimeConstraint[]
  budgetConstraints: BudgetConstraint[]
}

export interface DestinationConstraint {
  location: string
  coordinates: Coordinates
  mustVisit: boolean
  maxTravelTime?: number // minutes from previous location
}

export interface TimeConstraint {
  date: string
  timeSlot?: TimeSlot
  minDuration?: number
  maxDuration?: number
}

export interface BudgetConstraint {
  category: 'accommodation' | 'activities' | 'transportation' | 'meals'
  maxAmount: Money
  priority: 'high' | 'medium' | 'low'
}

// ================================
// GENERATION CONTEXT
// ================================

export interface GenerationContext {
  userPreferences: UserPreferences
  availableContent: ContentLibrary
  constraints: GenerationConstraints
  options: GenerationOptions
}

export interface ContentLibrary {
  destinations: Destination[]
  activities: Activity[]
  accommodations: Accommodation[]
  transportation: Transportation[]
  lastUpdated: Date
}

export interface GenerationConstraints {
  maxGenerationTime: number // milliseconds
  maxCost: Money
  requiredDestinations: string[]
  excludedCategories: string[]
  accessibility: AccessibilityInfo
}

export interface GenerationOptions {
  includeAlternatives: boolean
  optimizeFor: 'cost' | 'time' | 'experience' | 'balance'
  diversityWeight: number // 0-1, how much to vary activities
  localExperienceWeight: number // 0-1, preference for local vs tourist activities
  flexibilityLevel: 'rigid' | 'moderate' | 'flexible'
}

// ================================
// VALIDATION SCHEMAS
// ================================

// Zod schemas for runtime validation
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

export const moneySchema = z.object({
  amount: z.number().min(0),
  currency: z.string().length(3)
})

export const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  duration: z.number().min(1)
})

export const activitySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  category: z.enum(['sightseeing', 'adventure', 'cultural', 'culinary', 'shopping', 'entertainment', 'relaxation', 'educational', 'nightlife', 'sports']),
  location: z.string(),
  coordinates: coordinatesSchema,
  timeSlot: timeSlotSchema,
  difficulty: z.enum(['easy', 'moderate', 'challenging']),
  estimatedCost: moneySchema.optional(),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  bookingUrl: z.string().url().optional(),
  bookingRequired: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const itineraryDaySchema = z.object({
  id: z.string(),
  dayNumber: z.number().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  location: z.string(),
  coordinates: coordinatesSchema,
  activities: z.array(activitySchema),
  totalEstimatedCost: moneySchema,
  pacing: z.enum(['relaxed', 'moderate', 'packed'])
})

export const generatedItinerarySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  days: z.array(itineraryDaySchema),
  totalDuration: z.number().min(1),
  totalEstimatedCost: moneySchema,
  generatedAt: z.date(),
  version: z.string()
})

// ================================
// TYPE GUARDS
// ================================

export const isValidCoordinates = (obj: any): obj is Coordinates => {
  return coordinatesSchema.safeParse(obj).success
}

export const isValidMoney = (obj: any): obj is Money => {
  return moneySchema.safeParse(obj).success
}

export const isValidActivity = (obj: any): obj is Activity => {
  return activitySchema.safeParse(obj).success
}

export const isValidItinerary = (obj: any): obj is GeneratedItinerary => {
  return generatedItinerarySchema.safeParse(obj).success
} 