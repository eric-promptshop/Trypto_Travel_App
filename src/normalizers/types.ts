export interface BaseNormalizedContent {
  id: string;
  source: string; // URL or document identifier
  originalContentType: 'web' | 'pdf' | 'docx'; // To know where it came from
  extractionDate: string; // ISO Date string
  processingDate?: string; // ISO Date string, when this normalization happened
  confidence?: number; // 0-1 confidence score of the extraction/normalization
  tags?: string[];
  type: 'destination' | 'activity' | 'accommodation' | 'transportation' | 'itinerary' | 'generic';
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string; // ISO 3166-1 alpha-2 code
}

export interface NormalizedDestination extends BaseNormalizedContent {
  type: 'destination';
  name: string;
  alternateNames?: string[];
  description?: string;
  address?: Address;
  coordinates?: Coordinates;
  country: string; // ISO 3166-1 alpha-2 code
  region?: string; // Broader region, e.g., "Europe", "Southeast Asia"
  timezone?: string; // IANA timezone database name, e.g., "America/New_York"
  images?: string[]; // URLs to images
  relevantUrls?: string[]; // Official website, tourism board etc.
}

export interface Price {
  amount: number;
  currency: string; // ISO 4217 currency code
  priceType?: 'per_person' | 'per_group' | 'total';
}

export interface OperatingHours {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Daily';
  opens?: string; // HH:MM format
  closes?: string; // HH:MM format
  notes?: string;
}

export interface NormalizedActivity extends BaseNormalizedContent {
  type: 'activity';
  name: string;
  description?: string;
  activityType?: string; // e.g., "Museum", "Hiking", "Tour", "Restaurant"
  locationName?: string; // Name of the place where activity happens, if different from activity name
  address?: Address;
  coordinates?: Coordinates;
  duration?: string; // e.g., "2 hours", "Half-day"
  price?: Price;
  rating?: number; // e.g., 4.5 (out of 5)
  reviewsCount?: number;
  images?: string[];
  bookingUrl?: string;
  operatingHours?: OperatingHours[];
  suitability?: string[]; // e.g., "Family-friendly", "Adventure seekers"
}

export interface NormalizedAccommodation extends BaseNormalizedContent {
  type: 'accommodation';
  name: string;
  accommodationType?: string; // e.g., "Hotel", "Hostel", "Apartment"
  description?: string;
  address: Address;
  coordinates?: Coordinates;
  priceRange?: { min: Price; max: Price };
  rating?: number;
  amenities?: string[];
  images?: string[];
  bookingUrl?: string;
  checkInTime?: string; // HH:MM
  checkOutTime?: string; // HH:MM
}

export enum TransportationMode {
  FLIGHT = 'flight',
  TRAIN = 'train',
  BUS = 'bus',
  CAR_RENTAL = 'car_rental',
  TAXI = 'taxi',
  FERRY = 'ferry',
  WALK = 'walk',
  OTHER = 'other',
}

export interface NormalizedTransportation extends BaseNormalizedContent {
  type: 'transportation';
  mode: TransportationMode;
  departureLocation?: { name: string; address?: Address; coordinates?: Coordinates; time?: string }; // ISO Date for time
  arrivalLocation?: { name: string; address?: Address; coordinates?: Coordinates; time?: string }; // ISO Date for time
  provider?: string; // e.g., "United Airlines", "Amtrak"
  description?: string;
  duration?: string;
  price?: Price;
  bookingUrl?: string;
}

export interface ItineraryItem {
  startTime?: string; // ISO Date string
  endTime?: string; // ISO Date string
  activity?: NormalizedActivity | Omit<NormalizedActivity, keyof BaseNormalizedContent>; // Can be full object or just key details
  transportationToNext?: NormalizedTransportation | Omit<NormalizedTransportation, keyof BaseNormalizedContent>;
  notes?: string;
}

export interface DailyItinerary {
  day: number; // Day number in the itinerary
  date?: string; // Specific date (ISO Date string)
  title?: string;
  description?: string;
  items: ItineraryItem[];
}

export interface NormalizedItinerary extends BaseNormalizedContent {
  type: 'itinerary';
  title: string;
  description?: string;
  durationDays?: number;
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
  totalPrice?: Price;
  dailyPlans: DailyItinerary[];
  destinationsCovered?: NormalizedDestination[]; // List of destinations visited
}

export interface NormalizedGenericContent extends BaseNormalizedContent {
  type: 'generic';
  title: string;
  text: string;
  // Could be used for content that doesn't fit other types, like travel tips, articles, etc.
}

// Discriminated union for all normalized content types
export type NormalizedContent =
  | NormalizedDestination
  | NormalizedActivity
  | NormalizedAccommodation
  | NormalizedTransportation
  | NormalizedItinerary
  | NormalizedGenericContent;

// Helper type for the pipeline
export interface RawContent {
  id: string; // Unique ID for this piece of raw content
  sourceUrl?: string; // If from web
  filePath?: string; // If from document
  contentType: 'html' | 'pdf_text' | 'docx_text'; // Type of raw content
  rawText: string; // The actual raw text content
  metadata?: Record<string, any>; // Any metadata from scraper/parser
  extractedDate: string; // ISO Date string
} 