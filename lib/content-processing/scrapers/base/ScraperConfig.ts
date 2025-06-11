export interface ScraperSelectors {
  // Basic content selectors
  title?: string;
  description?: string;
  price?: string;
  rating?: string;
  images?: string;
  
  // Location and metadata
  location?: string;
  coordinates?: string;
  category?: string;
  tags?: string;
  
  // Pagination
  pagination?: {
    nextButton?: string;
    pageCount?: string;
    currentPage?: string;
    hasMore?: string;
  };
  
  // Site-specific containers
  container?: string;
  items?: string;
}

export interface ActivitySelectors extends ScraperSelectors {
  duration?: string;
  highlights?: string;
  includes?: string;
  excludes?: string;
  meetingPoint?: string;
  cancelPolicy?: string;
  availability?: string;
  groupSize?: string;
}

export interface AccommodationSelectors extends ScraperSelectors {
  starRating?: string;
  amenities?: string;
  checkIn?: string;
  checkOut?: string;
  availability?: string;
  roomTypes?: string;
  policies?: string;
  address?: string;
}

export interface DestinationSelectors extends ScraperSelectors {
  attractions?: string;
  overview?: string;
  bestTime?: string;
  weather?: string;
  transportation?: string;
  tips?: string;
}

export interface ThrottlingConfig {
  requestsPerMinute: number;
  concurrentRequests: number;
  delayBetweenRequests: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  timeout: number; // milliseconds
}

export interface ProxyConfig {
  enabled: boolean;
  providers?: string[];
  rotation: boolean;
  testOnStartup: boolean;
}

export interface UserAgentConfig {
  rotation: boolean;
  list?: string[];
  mobileRatio?: number; // 0-1, percentage of mobile user agents
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  selectors: ScraperSelectors | ActivitySelectors | AccommodationSelectors | DestinationSelectors;
  throttling: ThrottlingConfig;
  proxy?: ProxyConfig;
  userAgent?: UserAgentConfig;
  
  // Browser configuration
  browser?: {
    headless: boolean;
    viewport: { width: number; height: number };
    blockResources: string[]; // ['image', 'stylesheet', 'font']
    enableJavaScript: boolean;
    waitForSelector?: string;
    waitTime?: number;
  };
  
  // Data extraction settings
  extraction?: {
    maxPages?: number;
    followLinks?: boolean;
    extractImages?: boolean;
    imageQualityMin?: string; // 'low', 'medium', 'high'
    cleanText?: boolean;
    extractMetadata?: boolean;
  };
  
  // Error handling
  errorHandling?: {
    skipOnError: boolean;
    logErrors: boolean;
    maxErrors: number;
    notifyOnBlock: boolean;
  };
}

export interface ScrapingResult<T = any> {
  success: boolean;
  data?: T[];
  errors?: string[];
  metadata: {
    url: string;
    timestamp: Date;
    itemsFound: number;
    processingTime: number;
    pagesCrawled: number;
  };
}

export interface ExtractedContent {
  id?: string;
  url: string;
  title: string;
  description?: string;
  price?: string | number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  location?: string;
  coordinates?: { lat: number; lng: number };
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  extractedAt: Date;
}

export interface ExtractedActivity extends ExtractedContent {
  duration?: string;
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  meetingPoint?: string;
  cancelPolicy?: string;
  availability?: string[];
  groupSize?: { min?: number; max?: number };
  difficulty?: string;
}

export interface ExtractedAccommodation extends ExtractedContent {
  starRating?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  roomTypes?: Array<{
    name: string;
    price?: string;
    capacity?: number;
    amenities?: string[];
  }>;
  policies?: string[];
  address?: string;
  nearbyAttractions?: string[];
}

export interface ExtractedDestination extends ExtractedContent {
  attractions?: string[];
  overview?: string;
  bestTimeToVisit?: string;
  weather?: Record<string, any>;
  transportation?: string[];
  tips?: string[];
  nearbyDestinations?: string[];
} 