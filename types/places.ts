// Common types for place services (Google Places, Foursquare, etc.)

export type PlaceCategory = 'attractions' | 'restaurants' | 'accommodation' | 'entertainment' | 'shopping' | 'culture' | 'all'

export interface PlaceSearchParams {
  location: string
  category?: PlaceCategory
  radius?: number // in meters
  limit?: number
  interests?: string[]
}

export interface PlaceLocation {
  address: string
  city: string
  country: string
  coordinates: {
    latitude: number
    longitude: number
  }
}

export interface PlaceData {
  id: string
  name: string
  category: PlaceCategory
  description: string
  location: PlaceLocation
  rating?: number
  reviewCount?: number
  priceLevel?: number // 0-4 scale
  imageUrl?: string
  isOpen?: boolean
  categories: string[] // Raw categories from API
  website?: string
  phone?: string
  tips?: string[]
  relevanceScore?: number
}

export interface CategoryMapping {
  [key: string]: PlaceCategory
}