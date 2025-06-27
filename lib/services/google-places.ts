import { PlaceCategory, PlaceData, PlaceSearchParams, CategoryMapping } from '@/types/places'

// Google Places API types
interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address?: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number // 0-4 scale
  types?: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  vicinity?: string
  plus_code?: {
    compound_code?: string
    global_code?: string
  }
}

interface GooglePlaceDetails extends GooglePlaceResult {
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
  }>
  editorial_summary?: {
    overview?: string
  }
}

interface GoogleTextSearchResponse {
  results: GooglePlaceResult[]
  status: string
  next_page_token?: string
  error_message?: string
}

interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetails
  status: string
  error_message?: string
}

class GooglePlacesService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/place'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || 
      process.env.GOOGLE_PLACES_API_KEY || 
      process.env.GOOGLE_MAPS_API_KEY || 
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
    
    console.log('[GooglePlacesService] Initialized:', {
      hasApiKey: !!this.apiKey,
      keyLength: this.apiKey.length,
      keySource: apiKey ? 'parameter' : 
        process.env.GOOGLE_PLACES_API_KEY ? 'GOOGLE_PLACES_API_KEY' :
        process.env.GOOGLE_MAPS_API_KEY ? 'GOOGLE_MAPS_API_KEY' :
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' :
        process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? 'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY' : 'none'
    })
    
    if (!this.apiKey) {
    }
  }

  // Map our categories to Google Places types
  private getCategoryTypes(category: PlaceCategory): string[] {
    const categoryMap: Record<PlaceCategory, string[]> = {
      attractions: ['tourist_attraction', 'museum', 'art_gallery', 'point_of_interest'],
      restaurants: ['restaurant', 'cafe', 'food'],
      accommodation: ['lodging', 'hotel', 'hostel', 'guest_house'],
      entertainment: ['night_club', 'bar', 'movie_theater', 'amusement_park'],
      shopping: ['shopping_mall', 'store', 'market'],
      culture: ['museum', 'art_gallery', 'library', 'church', 'temple', 'mosque', 'synagogue'],
      all: []
    }
    return categoryMap[category] || []
  }

  // Convert Google place type to our category
  private getPlaceCategory(types: string[] = []): PlaceCategory {
    if (types.some(t => ['restaurant', 'cafe', 'food', 'meal_delivery', 'meal_takeaway'].includes(t))) {
      return 'restaurants'
    }
    if (types.some(t => ['lodging', 'hotel', 'motel', 'hostel'].includes(t))) {
      return 'accommodation'
    }
    if (types.some(t => ['night_club', 'bar', 'casino', 'movie_theater'].includes(t))) {
      return 'entertainment'
    }
    if (types.some(t => ['shopping_mall', 'store', 'market', 'clothing_store'].includes(t))) {
      return 'shopping'
    }
    if (types.some(t => ['museum', 'art_gallery', 'church', 'temple', 'mosque', 'synagogue'].includes(t))) {
      return 'culture'
    }
    return 'attractions'
  }

  // Convert Google Place to our PlaceData format
  private convertToPlaceData(place: GooglePlaceResult | GooglePlaceDetails, query?: string): PlaceData {
    const details = place as GooglePlaceDetails
    const photoUrl = place.photos?.[0] 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${this.apiKey}`
      : undefined

    // Extract city and country from formatted address or vicinity
    const addressParts = (place.formatted_address || place.vicinity || '').split(',').map(s => s.trim())
    const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : query || 'Unknown'
    const country = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : 'Unknown'

    return {
      id: place.place_id,
      name: place.name,
      category: this.getPlaceCategory(place.types),
      description: details.editorial_summary?.overview || `Visit ${place.name} in ${city}`,
      location: {
        address: place.formatted_address || place.vicinity || '',
        city,
        country,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        }
      },
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: place.price_level,
      imageUrl: photoUrl,
      isOpen: place.opening_hours?.open_now,
      categories: place.types || [],
      website: details.website,
      phone: details.formatted_phone_number,
      tips: details.reviews?.slice(0, 3).map(r => r.text) || [],
      relevanceScore: this.calculateRelevanceScore(place, query)
    }
  }

  // Calculate relevance score for sorting
  private calculateRelevanceScore(place: GooglePlaceResult, query?: string): number {
    let score = 0
    
    // Rating contribution (0-5 points)
    if (place.rating) {
      score += place.rating
    }
    
    // Review count contribution (0-3 points)
    if (place.user_ratings_total) {
      if (place.user_ratings_total > 1000) score += 3
      else if (place.user_ratings_total > 500) score += 2
      else if (place.user_ratings_total > 100) score += 1
    }
    
    // Tourist attraction bonus
    if (place.types?.includes('tourist_attraction')) {
      score += 2
    }
    
    // Name match bonus
    if (query && place.name.toLowerCase().includes(query.toLowerCase())) {
      score += 1
    }
    
    return Math.min(score, 5) // Cap at 5
  }

  // Main search method
  async searchPlaces(params: PlaceSearchParams): Promise<PlaceData[]> {
    
    if (!this.apiKey) {
      return this.getDemoPlaces(params)
    }

    try {
      const { location, category = 'all', radius = 5000, limit = 20 } = params
      
      // Build query based on category
      let query = location
      if (category !== 'all') {
        const types = this.getCategoryTypes(category)
        if (types.length > 0) {
          query = `${types[0]} in ${location}`
        }
      }

      // Use Text Search for more flexible results
      const url = new URL(`${this.baseUrl}/textsearch/json`)
      url.searchParams.append('query', query)
      url.searchParams.append('key', this.apiKey)
      url.searchParams.append('radius', radius.toString())
      
      const response = await fetch(url.toString())
      const data: GoogleTextSearchResponse = await response.json()

      console.log('[GooglePlacesService] Text search response:', {
        status: data.status, 
        error: data.error_message,
        resultsCount: data.results?.length || 0,
        url: url.toString().replace(this.apiKey, 'REDACTED')
      })
      
      if (data.status === 'REQUEST_DENIED') {
        console.error('Google Places API access denied. Please ensure:')
        console.error('1. Your API key is valid')
        console.error('2. Places API is enabled in Google Cloud Console')
        console.error('3. API key restrictions allow your domain/IP')
        throw new Error('Google Places API access denied. Check console for details.')
      }
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message)
        throw new Error(data.error_message || `Google Places API error: ${data.status}`)
      }

      const places = data.results
        .slice(0, limit)
        .map(place => this.convertToPlaceData(place, location))
        
      // Filter by category if specified
      if (category !== 'all') {
        return places.filter(place => place.category === category)
      }
      
      return places
    } catch (error) {
      console.error('Google Places search failed:', error)
      return this.getDemoPlaces(params)
    }
  }

  // Category-specific methods for compatibility
  async findAttractions(location: string, limit = 20): Promise<PlaceData[]> {
    return this.searchPlaces({ location, category: 'attractions', limit })
  }

  async findRestaurants(location: string, limit = 20): Promise<PlaceData[]> {
    return this.searchPlaces({ location, category: 'restaurants', limit })
  }

  async findAccommodation(location: string, limit = 20): Promise<PlaceData[]> {
    return this.searchPlaces({ location, category: 'accommodation', limit })
  }

  async findEntertainment(location: string, limit = 20): Promise<PlaceData[]> {
    return this.searchPlaces({ location, category: 'entertainment', limit })
  }

  async findShopping(location: string, limit = 20): Promise<PlaceData[]> {
    return this.searchPlaces({ location, category: 'shopping', limit })
  }

  async findCulture(location: string, limit = 20): Promise<PlaceData[]> {
    return this.searchPlaces({ location, category: 'culture', limit })
  }

  async findTourismPlaces(location: string, limit = 20): Promise<PlaceData[]> {
    // Combine attractions and culture for tourism
    const [attractions, culture] = await Promise.all([
      this.findAttractions(location, limit / 2),
      this.findCulture(location, limit / 2)
    ])
    return [...attractions, ...culture]
  }

  // Convert PlaceData to POI format for API compatibility
  private convertToPOI(place: PlaceData): any {
    return {
      id: place.id,
      name: place.name,
      description: place.description,
      location: {
        lat: place.location.coordinates.latitude,
        lng: place.location.coordinates.longitude,
        address: place.location.address
      },
      category: place.category,
      subcategories: place.categories || [],
      rating: place.rating,
      reviews: place.reviewCount,
      price: place.priceLevel ? '$'.repeat(place.priceLevel) : undefined,
      hours: place.isOpen !== undefined ? (place.isOpen ? 'Open now' : 'Closed') : undefined,
      images: place.imageUrl ? [place.imageUrl] : [],
      website: place.website,
      phone: place.phone,
      tips: place.tips || []
    }
  }

  // Search by category with location bias
  async searchByCategory(category: string, locationBias?: { lat: number, lng: number }, limit = 20): Promise<any[]> {
    
    // Map our categories to Google Places categories
    const categoryMap: Record<string, string> = {
      'art-museums': 'culture',
      'bars-nightlife': 'entertainment',
      'cafe-bakery': 'food',
      'restaurants': 'food',
      'hotels': 'accommodation',
      'attractions': 'attractions',
      'shopping': 'shopping',
      'beauty-fashion': 'shopping',
      'transport': 'all'
    }
    
    const mappedCategory = categoryMap[category] || 'all'
    
    // If we have location bias, use it to search nearby
    let location = 'New York' // Default location
    if (locationBias) {
      location = `${locationBias.lat},${locationBias.lng}`
    }
    
    const places = await this.searchPlaces({
      location,
      category: mappedCategory,
      limit
    })
    
    // Convert to POI format
    return places.map(place => this.convertToPOI(place))
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<PlaceData | null> {
    if (!this.apiKey) {
      return null
    }

    try {
      const url = new URL(`${this.baseUrl}/details/json`)
      url.searchParams.append('place_id', placeId)
      url.searchParams.append('key', this.apiKey)
      url.searchParams.append('fields', 'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,photos,opening_hours,vicinity,website,formatted_phone_number,reviews,editorial_summary')
      
      const response = await fetch(url.toString())
      const data: GooglePlaceDetailsResponse = await response.json()

      if (data.status !== 'OK') {
        console.error('Google Places Details API error:', data.status, data.error_message)
        return null
      }

      return this.convertToPlaceData(data.result)
    } catch (error) {
      console.error('Google Places details fetch failed:', error)
      return null
    }
  }

  // Geocode a location string to get coordinates and place ID
  async geocodeLocation(location: string): Promise<{
    placeId: string
    coordinates: { lat: number; lng: number }
    formattedAddress: string
    city?: string
    country?: string
  } | null> {
    
    if (!this.apiKey) {
      return null
    }

    try {
      // Use findplaces API for better place matching
      const url = new URL(`${this.baseUrl}/findplacefromtext/json`)
      url.searchParams.append('input', location)
      url.searchParams.append('inputtype', 'textquery')
      url.searchParams.append('fields', 'place_id,formatted_address,geometry,name,types')
      url.searchParams.append('key', this.apiKey)
      
      const response = await fetch(url.toString())
      const data = await response.json()

      console.log('[GooglePlacesService] Geocoding response:', {
        status: data.status, 
        candidates: data.candidates?.length || 0
      })

      if (data.status !== 'OK' || !data.candidates?.length) {
        return null
      }

      const place = data.candidates[0]
      const addressParts = (place.formatted_address || '').split(',').map((s: string) => s.trim())
      
      return {
        placeId: place.place_id,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        formattedAddress: place.formatted_address,
        city: addressParts.length >= 2 ? addressParts[addressParts.length - 2] : undefined,
        country: addressParts.length >= 1 ? addressParts[addressParts.length - 1] : undefined
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
      return null
    }
  }

  // Batch geocode multiple locations
  async batchGeocodeLocations(locations: string[]): Promise<Map<string, {
    placeId: string
    coordinates: { lat: number; lng: number }
    formattedAddress: string
    city?: string
    country?: string
  } | null>> {
    
    const results = new Map()
    
    // Process in parallel with rate limiting (max 5 concurrent)
    const batchSize = 5
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(location => this.geocodeLocation(location))
      )
      
      batch.forEach((location, index) => {
        results.set(location, batchResults[index])
      })
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  // Demo data fallback
  private getDemoPlaces(params: PlaceSearchParams): PlaceData[] {
    const { location, category = 'all', limit = 20 } = params
    
    const demoPlaces: PlaceData[] = [
      {
        id: 'demo-1',
        name: `${location} Historic Museum`,
        category: 'culture',
        description: `Discover the rich history and culture of ${location} through fascinating exhibits and artifacts.`,
        location: {
          address: `123 Heritage St, ${location}`,
          city: location,
          country: 'Demo Country',
          coordinates: { latitude: 0, longitude: 0 }
        },
        rating: 4.7,
        reviewCount: 1250,
        priceLevel: 2,
        imageUrl: `https://source.unsplash.com/400x300/?museum,${location}`,
        isOpen: true,
        categories: ['museum', 'tourist_attraction'],
        tips: [
          'Don\'t miss the ancient artifacts collection',
          'Audio guides available in multiple languages',
          'Best visited in the morning to avoid crowds'
        ],
        relevanceScore: 4.5
      },
      {
        id: 'demo-2',
        name: `${location} Central Market`,
        category: 'shopping',
        description: `Experience local life at ${location}'s bustling central market with fresh produce, crafts, and street food.`,
        location: {
          address: `456 Market Square, ${location}`,
          city: location,
          country: 'Demo Country',
          coordinates: { latitude: 0, longitude: 0 }
        },
        rating: 4.5,
        reviewCount: 890,
        priceLevel: 1,
        imageUrl: `https://source.unsplash.com/400x300/?market,${location}`,
        isOpen: true,
        categories: ['market', 'shopping', 'food'],
        tips: [
          'Bargaining is expected',
          'Try the local street food',
          'Visit early morning for freshest produce'
        ],
        relevanceScore: 4.2
      },
      {
        id: 'demo-3',
        name: `La Cuisine de ${location}`,
        category: 'restaurants',
        description: `Award-winning restaurant serving modern interpretations of traditional ${location} cuisine.`,
        location: {
          address: `789 Gourmet Ave, ${location}`,
          city: location,
          country: 'Demo Country',
          coordinates: { latitude: 0, longitude: 0 }
        },
        rating: 4.8,
        reviewCount: 567,
        priceLevel: 3,
        imageUrl: `https://source.unsplash.com/400x300/?restaurant,fine-dining`,
        isOpen: true,
        categories: ['restaurant', 'fine_dining'],
        website: 'https://example.com',
        phone: '+1 234 567 8900',
        tips: [
          'Reservations recommended',
          'Try the chef\'s tasting menu',
          'Excellent wine selection'
        ],
        relevanceScore: 4.6
      },
      {
        id: 'demo-4',
        name: `${location} Grand Hotel`,
        category: 'accommodation',
        description: `Luxury hotel in the heart of ${location} with stunning views and world-class amenities.`,
        location: {
          address: `100 Luxury Blvd, ${location}`,
          city: location,
          country: 'Demo Country',
          coordinates: { latitude: 0, longitude: 0 }
        },
        rating: 4.6,
        reviewCount: 2340,
        priceLevel: 4,
        imageUrl: `https://source.unsplash.com/400x300/?luxury-hotel`,
        isOpen: true,
        categories: ['lodging', 'hotel'],
        website: 'https://example.com',
        tips: [
          'Rooftop bar has amazing sunset views',
          'Spa services are exceptional',
          'Central location near major attractions'
        ],
        relevanceScore: 4.4
      },
      {
        id: 'demo-5',
        name: `${location} Adventure Park`,
        category: 'entertainment',
        description: `Thrilling outdoor adventure park with zip lines, rope courses, and family-friendly activities.`,
        location: {
          address: `200 Adventure Way, ${location}`,
          city: location,
          country: 'Demo Country',
          coordinates: { latitude: 0, longitude: 0 }
        },
        rating: 4.7,
        reviewCount: 1890,
        priceLevel: 2,
        imageUrl: `https://source.unsplash.com/400x300/?adventure-park`,
        isOpen: true,
        categories: ['amusement_park', 'tourist_attraction'],
        tips: [
          'Book tickets online for discounts',
          'Wear comfortable clothes and shoes',
          'Great for families with kids 8+'
        ],
        relevanceScore: 4.3
      }
    ]

    // Filter by category if needed
    const filtered = category === 'all' 
      ? demoPlaces 
      : demoPlaces.filter(p => p.category === category)
    
    return filtered.slice(0, limit)
  }
}

// Export singleton instance
export const googlePlacesService = new GooglePlacesService()

// Export class for cases where a new instance is needed
export { GooglePlacesService }

// Export types for backward compatibility
export type { PlaceData, PlaceCategory, PlaceSearchParams }