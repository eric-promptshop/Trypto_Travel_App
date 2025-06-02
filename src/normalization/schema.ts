export type NormalizedContentType = 'destination' | 'activity' | 'accommodation' | 'transportation';

export interface BaseNormalizedContent {
  id: string;
  source: string;
  extractionDate: string;
  confidence: number;
  type: NormalizedContentType;
}

export interface NormalizedDestination extends BaseNormalizedContent {
  type: 'destination';
  name: string;
  coordinates?: { lat: number; lng: number };
  country: string;
  region?: string;
  description?: string;
}

export interface NormalizedActivity extends BaseNormalizedContent {
  type: 'activity';
  name: string;
  location?: string;
  startTime?: string; // ISO
  endTime?: string;   // ISO
  price?: number;
  currency?: string;
  description?: string;
}

export interface NormalizedAccommodation extends BaseNormalizedContent {
  type: 'accommodation';
  name: string;
  location?: string;
  checkIn?: string; // ISO
  checkOut?: string; // ISO
  price?: number;
  currency?: string;
  description?: string;
}

export type NormalizedContent =
  | NormalizedDestination
  | NormalizedActivity
  | NormalizedAccommodation;

export interface NormalizedContentSet {
  destinations: NormalizedDestination[];
  activities: NormalizedActivity[];
  accommodations: NormalizedAccommodation[];
  // Add more as needed
} 