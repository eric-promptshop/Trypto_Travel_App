import { cache } from 'react'
import { LocationStandardizer } from './location-standardizer'
import { EnhancedLocationService } from './enhanced-location-service'

export interface LocationResult {
  value: string
  label: string
  country?: string
  region?: string
  lat?: number
  lng?: number
  type?: string
}

// Cache results for 5 minutes to reduce API calls
const CACHE_DURATION = 5 * 60 * 1000
const searchCache = new Map<string, { results: LocationResult[], timestamp: number }>()

/**
 * Service for geocoding and location search
 * Supports multiple providers with fallback
 */
export class GeocodingService {
  /**
   * Search for locations using OpenStreetMap's Nominatim API (free, no API key required)
   */
  private static async searchWithNominatim(query: string): Promise<LocationResult[]> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&accept-language=en`,
        {
          headers: {
            'User-Agent': 'TravelItineraryBuilder/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.map((item: any) => {
        // Parse the display name to extract city and country
        const parts = item.display_name.split(', ')
        const city = parts[0]
        const country = parts[parts.length - 1]
        const region = parts.length > 2 ? parts[1] : undefined

        return {
          value: `${city}-${country.toLowerCase().replace(/\s+/g, '-')}`,
          label: item.display_name,
          country,
          region,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type
        }
      })
    } catch (error) {
      console.error('Nominatim search error:', error)
      return []
    }
  }

  /**
   * Search for locations using Mapbox API (requires API key)
   */
  private static async searchWithMapbox(query: string): Promise<LocationResult[]> {
    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!apiKey) return []

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=10&types=place,locality,district&access_token=${apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.features.map((feature: any) => ({
        value: feature.id,
        label: feature.place_name,
        country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text,
        region: feature.context?.find((c: any) => c.id.startsWith('region'))?.text,
        lat: feature.center[1],
        lng: feature.center[0],
        type: feature.place_type[0]
      }))
    } catch (error) {
      console.error('Mapbox search error:', error)
      return []
    }
  }

  /**
   * Search for locations using Google Places API (requires API key)
   */
  private static async searchWithGooglePlaces(query: string): Promise<LocationResult[]> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return []

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.predictions.map((prediction: any) => ({
        value: prediction.place_id,
        label: prediction.description,
        type: 'city'
      }))
    } catch (error) {
      console.error('Google Places search error:', error)
      return []
    }
  }

  /**
   * Main search function with caching and fallback
   */
  static async searchLocations(query: string): Promise<LocationResult[]> {
    if (!query || query.length < 2) return []

    // Check cache first
    const cacheKey = query.toLowerCase()
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.results
    }

    let results: LocationResult[] = []

    // Try primary provider (Nominatim - free, no API key required)
    results = await this.searchWithNominatim(query)

    // If no results and we have API keys, try other providers
    if (results.length === 0) {
      if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        results = await this.searchWithMapbox(query)
      } else if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        results = await this.searchWithGooglePlaces(query)
      }
    }

    // If still no results, return some fallback suggestions based on the query
    if (results.length === 0) {
      results = this.getFallbackSuggestions(query)
    }

    // Enhance results with better formatting and deduplication
    const enhancedResults = EnhancedLocationService.enhanceResults(results, query)
    
    // Cache the enhanced results
    searchCache.set(cacheKey, { results: enhancedResults, timestamp: Date.now() })

    return enhancedResults
  }

  /**
   * Fallback suggestions when API calls fail
   */
  private static getFallbackSuggestions(query: string): LocationResult[] {
    const q = query.toLowerCase()
    const allCities = [
      // Major world cities
      { value: 'new-york-usa', label: 'New York, United States', country: 'United States' },
      { value: 'london-uk', label: 'London, United Kingdom', country: 'United Kingdom' },
      { value: 'paris-france', label: 'Paris, France', country: 'France' },
      { value: 'tokyo-japan', label: 'Tokyo, Japan', country: 'Japan' },
      { value: 'sydney-australia', label: 'Sydney, Australia', country: 'Australia' },
      { value: 'dubai-uae', label: 'Dubai, United Arab Emirates', country: 'United Arab Emirates' },
      { value: 'singapore', label: 'Singapore', country: 'Singapore' },
      { value: 'hong-kong', label: 'Hong Kong', country: 'Hong Kong' },
      { value: 'barcelona-spain', label: 'Barcelona, Spain', country: 'Spain' },
      { value: 'rome-italy', label: 'Rome, Italy', country: 'Italy' },
      { value: 'amsterdam-netherlands', label: 'Amsterdam, Netherlands', country: 'Netherlands' },
      { value: 'bangkok-thailand', label: 'Bangkok, Thailand', country: 'Thailand' },
      { value: 'istanbul-turkey', label: 'Istanbul, Turkey', country: 'Turkey' },
      { value: 'mumbai-india', label: 'Mumbai, India', country: 'India' },
      { value: 'beijing-china', label: 'Beijing, China', country: 'China' },
      { value: 'cairo-egypt', label: 'Cairo, Egypt', country: 'Egypt' },
      { value: 'rio-de-janeiro-brazil', label: 'Rio de Janeiro, Brazil', country: 'Brazil' },
      { value: 'cape-town-south-africa', label: 'Cape Town, South Africa', country: 'South Africa' },
      { value: 'moscow-russia', label: 'Moscow, Russia', country: 'Russia' },
      { value: 'toronto-canada', label: 'Toronto, Canada', country: 'Canada' },
    ]

    return allCities
      .filter(city => city.label.toLowerCase().includes(q))
      .slice(0, 10)
  }

  /**
   * Get location details by ID (for future use)
   */
  static async getLocationDetails(locationId: string): Promise<LocationResult | null> {
    // Implementation depends on the provider
    // For now, return null
    return null
  }
}

// Cached version for use in React Server Components
export const searchLocations = cache(GeocodingService.searchLocations)