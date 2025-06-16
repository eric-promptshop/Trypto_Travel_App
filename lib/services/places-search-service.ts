import { POI } from '@/store/planStore'
import { withCache } from './search-cache'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export interface SearchOptions {
  query: string
  categories?: string[]
  proximity?: [number, number] // [lng, lat]
  limit?: number
  bbox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
}

export interface MapboxFeature {
  id: string
  type: string
  place_type: string[]
  relevance: number
  properties: {
    category?: string
    maki?: string
    address?: string
    foursquare?: string
    landmark?: boolean
    wikidata?: string
  }
  text: string
  place_name: string
  center: [number, number] // [lng, lat]
  geometry: {
    type: string
    coordinates: [number, number]
  }
  context?: Array<{
    id: string
    text: string
    wikidata?: string
    short_code?: string
  }>
}

// Map Mapbox categories to our POI categories
const CATEGORY_MAPPING: Record<string, POI['category']> = {
  'restaurant': 'restaurant',
  'restaurant.pizza': 'restaurant',
  'restaurant.burger': 'restaurant',
  'restaurant.chinese': 'restaurant',
  'restaurant.italian': 'restaurant',
  'restaurant.french': 'restaurant',
  'cafe': 'cafe-bakery',
  'cafe.coffee': 'cafe-bakery',
  'cafe.tea': 'cafe-bakery',
  'bakery': 'cafe-bakery',
  'bar': 'bars-nightlife',
  'nightclub': 'bars-nightlife',
  'pub': 'bars-nightlife',
  'hotel': 'hotel',
  'lodging': 'hotel',
  'hostel': 'hotel',
  'motel': 'hotel',
  'museum': 'art-museums',
  'art_gallery': 'art-museums',
  'gallery': 'art-museums',
  'tourist_attraction': 'attraction',
  'attraction': 'attraction',
  'landmark': 'attraction',
  'monument': 'attraction',
  'shop': 'shopping',
  'shopping_mall': 'shopping',
  'store': 'shopping',
  'beauty': 'beauty-fashion',
  'beauty_salon': 'beauty-fashion',
  'spa': 'beauty-fashion',
  'transport': 'transport',
  'airport': 'transport',
  'train_station': 'transport',
  'bus_station': 'transport',
  'subway': 'transport',
}

// Get category from Mapbox feature
function getCategoryFromFeature(feature: MapboxFeature): POI['category'] {
  // Check properties.category first
  if (feature.properties.category) {
    const mapped = CATEGORY_MAPPING[feature.properties.category]
    if (mapped) return mapped
  }
  
  // Check place_type
  for (const placeType of feature.place_type) {
    const mapped = CATEGORY_MAPPING[placeType]
    if (mapped) return mapped
  }
  
  // Check maki icon
  if (feature.properties.maki) {
    const mapped = CATEGORY_MAPPING[feature.properties.maki]
    if (mapped) return mapped
  }
  
  return 'other'
}

// Convert Mapbox feature to POI
function featureToPOI(feature: MapboxFeature): POI {
  const category = getCategoryFromFeature(feature)
  
  // Extract address from place_name
  const parts = feature.place_name.split(',')
  const name = parts[0].trim()
  const address = parts.slice(1).join(',').trim()
  
  return {
    id: feature.id,
    name: name,
    category: category,
    location: {
      lat: feature.center[1],
      lng: feature.center[0],
      address: address || feature.properties.address
    },
    // Mapbox doesn't provide ratings, so we'll need to fetch from another source or omit
    rating: undefined,
    price: undefined,
    description: undefined,
    tags: feature.properties.landmark ? ['landmark'] : []
  }
}

export async function searchPlaces(options: SearchOptions): Promise<POI[]> {
  console.log('[SearchPlaces] Called with options:', options);
  console.log('[SearchPlaces] Mapbox token available:', !!MAPBOX_TOKEN);
  
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured')
    return []
  }
  
  // Use cache for search results
  return withCache(
    { type: 'search', ...options },
    async () => {
      try {
        const { query, categories, proximity, limit = 10, bbox } = options
        
        // Build Mapbox Geocoding API URL
        const baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
        const encodedQuery = encodeURIComponent(query)
        const url = new URL(`${baseUrl}/${encodedQuery}.json`)
        
        // Add parameters
        url.searchParams.set('access_token', MAPBOX_TOKEN)
        url.searchParams.set('limit', limit.toString())
        
        // Add proximity bias if provided
        if (proximity) {
          url.searchParams.set('proximity', `${proximity[0]},${proximity[1]}`)
        }
        
        // Add bounding box if provided
        if (bbox) {
          url.searchParams.set('bbox', bbox.join(','))
        }
        
        // Filter by types - always include POI to get actual places
        const types = ['poi', 'poi.landmark']
        if (categories && categories.length > 0) {
          // Map our categories to Mapbox types
          const mapboxTypes = categories
            .map(cat => getMapboxTypes(cat))
            .flat()
            .filter(Boolean)
          
          if (mapboxTypes.length > 0) {
            types.push(...mapboxTypes)
          }
        }
        url.searchParams.set('types', types.join(','))
        
        console.log('[SearchPlaces] Fetching from URL:', url.toString());
        const response = await fetch(url.toString())
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[SearchPlaces] Mapbox API error:', response.status, errorText);
          throw new Error(`Mapbox API error: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('[SearchPlaces] Mapbox response:', data);
        
        // Convert features to POIs with enhanced data
        const pois = data.features
          .map((feature: MapboxFeature) => {
            console.log('[SearchPlaces] Processing feature:', {
              name: feature.text,
              place_type: feature.place_type,
              category: feature.properties.category
            });
            const poi = featureToPOI(feature)
            // Add mock data for better UX
            return enhancePOIData(poi)
          })
          .filter((poi: POI) => {
            // Filter by our categories if specified
            if (categories && categories.length > 0) {
              return categories.includes(poi.category)
            }
            return true
          })
        
        return pois
      } catch (error) {
        console.error('[SearchPlaces] Error:', error)
        return []
      }
    }
  )
}

// Map our categories to Mapbox place types
function getMapboxTypes(category: string): string[] {
  const typeMap: Record<string, string[]> = {
    'restaurant': ['poi'],
    'restaurants': ['poi'],
    'cafe-bakery': ['poi'],
    'bars-nightlife': ['poi'],
    'hotel': ['poi'],
    'hotels': ['poi'],
    'art-museums': ['poi'],
    'attraction': ['poi', 'poi.landmark'],
    'attractions': ['poi', 'poi.landmark'],
    'shopping': ['poi'],
    'beauty-fashion': ['poi'],
    'transport': ['poi']
  }
  
  return typeMap[category] || ['poi']
}

// Search for POIs by category
export async function searchByCategory(
  category: string, 
  proximity?: [number, number],
  limit = 20
): Promise<POI[]> {
  console.log('[SearchByCategory] Called with:', { category, proximity, limit });
  // Use cache for category search
  return withCache(
    { type: 'category', category, proximity, limit },
    async () => {
      // For category search, we'll search for common terms in that category
      const categorySearchTerms: Record<string, string[]> = {
        'restaurant': ['restaurant'],
        'restaurants': ['restaurant'],
        'cafe-bakery': ['cafe', 'coffee shop', 'bakery'],
        'bars-nightlife': ['bar', 'pub', 'nightclub'],
        'hotel': ['hotel'],
        'hotels': ['hotel'],
        'art-museums': ['museum', 'art gallery'],
        'attraction': ['tourist attraction', 'landmark'],
        'attractions': ['tourist attraction', 'landmark'],
        'shopping': ['shopping mall', 'store'],
        'beauty-fashion': ['beauty salon', 'spa'],
        'transport': ['train station', 'bus station', 'metro station']
      }
      
      const searchTerms = categorySearchTerms[category] || [category]
      
      try {
        // Search for multiple terms and combine results
        const allResults = await Promise.all(
          searchTerms.slice(0, 3).map(async (term) => {
            return searchPlaces({
              query: term,
              proximity,
              limit: Math.ceil(limit / searchTerms.length)
            })
          })
        )
        
        // Combine and deduplicate results
        const seenIds = new Set<string>()
        const uniquePois: POI[] = []
        
        for (const results of allResults) {
          for (const poi of results) {
            if (!seenIds.has(poi.id)) {
              seenIds.add(poi.id)
              // Override category to match what was searched for
              poi.category = category as POI['category']
              uniquePois.push(poi)
            }
          }
        }
        
        return uniquePois.slice(0, limit)
      } catch (error) {
        console.error('Error searching by category:', error)
        return []
      }
    }
  )
}

// Enhance POI data with mock ratings, reviews, and images
function enhancePOIData(poi: POI): POI {
  // Generate consistent mock data based on POI id
  const hash = poi.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Add rating (3.5 to 5.0)
  poi.rating = 3.5 + (hash % 16) / 10
  
  // Add review count
  poi.reviews = 50 + (hash % 450)
  
  // Add price level (1-4)
  if (poi.category === 'restaurant' || poi.category === 'restaurants' || 
      poi.category === 'cafe-bakery' || poi.category === 'bars-nightlife') {
    poi.price = 1 + (hash % 4)
  } else if (poi.category === 'hotel' || poi.category === 'hotels') {
    poi.price = 2 + (hash % 3)
  }
  
  // Add mock image URL using category
  const imageCategories: Record<string, string> = {
    'restaurant': 'restaurant',
    'restaurants': 'restaurant', 
    'cafe-bakery': 'coffee',
    'bars-nightlife': 'bar',
    'hotel': 'hotel',
    'hotels': 'hotel',
    'art-museums': 'museum',
    'attraction': 'tourist',
    'attractions': 'tourist',
    'shopping': 'shopping',
    'beauty-fashion': 'spa',
    'transport': 'station'
  }
  
  const imageCategory = imageCategories[poi.category] || 'building'
  poi.image = `https://source.unsplash.com/160x120/?${imageCategory},${poi.name.replace(/\s+/g, '')}`
  
  // Add opening hours (mock)
  poi.openingHours = {
    monday: { open: '09:00', close: '21:00' },
    tuesday: { open: '09:00', close: '21:00' },
    wednesday: { open: '09:00', close: '21:00' },
    thursday: { open: '09:00', close: '21:00' },
    friday: { open: '09:00', close: '22:00' },
    saturday: { open: '10:00', close: '22:00' },
    sunday: { open: '10:00', close: '20:00' }
  }
  
  // Add more descriptive tags
  const categoryTags: Record<string, string[]> = {
    'restaurant': ['dining', 'food'],
    'restaurants': ['dining', 'food'],
    'cafe-bakery': ['coffee', 'pastries', 'breakfast'],
    'bars-nightlife': ['drinks', 'nightlife', 'cocktails'],
    'hotel': ['accommodation', 'lodging'],
    'hotels': ['accommodation', 'lodging'],
    'art-museums': ['culture', 'art', 'history'],
    'attraction': ['sightseeing', 'tourist'],
    'attractions': ['sightseeing', 'tourist'],
    'shopping': ['retail', 'boutique'],
    'beauty-fashion': ['wellness', 'beauty'],
    'transport': ['transit', 'transportation']
  }
  
  poi.tags = [...(poi.tags || []), ...(categoryTags[poi.category] || [])]
  
  return poi
}

// Get place details with additional information
export async function getPlaceDetails(placeId: string): Promise<POI | null> {
  // Mapbox doesn't have a separate details endpoint, 
  // so we'll return the basic info we have
  // In a real app, you might want to fetch additional details from other sources
  return null
}