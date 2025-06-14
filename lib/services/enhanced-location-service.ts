import { LocationResult } from './geocoding-service'

export interface EnhancedLocation extends LocationResult {
  displayName: string
  shortName: string
  category: 'city' | 'region' | 'country' | 'landmark'
  icon: string
  confidence: number
  popularityScore: number
}

// Popular destinations with pre-defined clean names
const POPULAR_DESTINATIONS: Record<string, EnhancedLocation> = {
  'paris': {
    value: 'paris-france',
    label: 'Paris, Île-de-France, France',
    displayName: 'Paris, France',
    shortName: 'Paris',
    country: 'France',
    region: 'Île-de-France',
    lat: 48.8566,
    lng: 2.3522,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 100
  },
  'london': {
    value: 'london-uk',
    label: 'London, England, United Kingdom',
    displayName: 'London, United Kingdom',
    shortName: 'London',
    country: 'United Kingdom',
    region: 'England',
    lat: 51.5074,
    lng: -0.1278,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 100
  },
  'new york': {
    value: 'new-york-usa',
    label: 'New York, New York, United States',
    displayName: 'New York, United States',
    shortName: 'New York',
    country: 'United States',
    region: 'New York',
    lat: 40.7128,
    lng: -74.0060,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 100
  },
  'tokyo': {
    value: 'tokyo-japan',
    label: 'Tokyo, Japan',
    displayName: 'Tokyo, Japan',
    shortName: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 100
  },
  'dubai': {
    value: 'dubai-uae',
    label: 'Dubai, United Arab Emirates',
    displayName: 'Dubai, UAE',
    shortName: 'Dubai',
    country: 'United Arab Emirates',
    lat: 25.2048,
    lng: 55.2708,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 95
  },
  'barcelona': {
    value: 'barcelona-spain',
    label: 'Barcelona, Catalonia, Spain',
    displayName: 'Barcelona, Spain',
    shortName: 'Barcelona',
    country: 'Spain',
    region: 'Catalonia',
    lat: 41.3851,
    lng: 2.1734,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 90
  },
  'rome': {
    value: 'rome-italy',
    label: 'Rome, Lazio, Italy',
    displayName: 'Rome, Italy',
    shortName: 'Rome',
    country: 'Italy',
    region: 'Lazio',
    lat: 41.9028,
    lng: 12.4964,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 90
  },
  'singapore': {
    value: 'singapore',
    label: 'Singapore',
    displayName: 'Singapore',
    shortName: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    type: 'city',
    category: 'city',
    icon: '🏙️',
    confidence: 1.0,
    popularityScore: 85
  }
}

export class EnhancedLocationService {
  /**
   * Fuzzy match score between two strings
   */
  private static fuzzyMatch(str1: string, str2: string): number {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    
    // Exact match
    if (s1 === s2) return 1.0
    
    // Starts with
    if (s1.startsWith(s2) || s2.startsWith(s1)) return 0.8
    
    // Contains
    if (s1.includes(s2) || s2.includes(s1)) return 0.6
    
    // Levenshtein distance for typos
    const distance = this.levenshteinDistance(s1, s2)
    const maxLen = Math.max(s1.length, s2.length)
    const similarity = 1 - (distance / maxLen)
    
    return Math.max(0, similarity)
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
  
  /**
   * Determine location category and icon
   */
  private static categorizeLocation(location: LocationResult): { category: EnhancedLocation['category'], icon: string } {
    const type = location.type?.toLowerCase() || ''
    
    if (type.includes('city') || type.includes('locality') || type.includes('town')) {
      return { category: 'city', icon: '🏙️' }
    } else if (type.includes('state') || type.includes('region') || type.includes('administrative')) {
      return { category: 'region', icon: '🗺️' }
    } else if (type.includes('country')) {
      return { category: 'country', icon: '🌍' }
    } else {
      return { category: 'landmark', icon: '📍' }
    }
  }
  
  /**
   * Create standardized display name
   */
  private static createDisplayName(location: LocationResult): { displayName: string, shortName: string } {
    const parts = location.label.split(',').map(p => p.trim())
    let city = ''
    let state = ''
    let country = location.country || ''
    
    // Parse based on number of parts
    if (parts.length === 1) {
      city = parts[0]
    } else if (parts.length === 2) {
      city = parts[0]
      country = parts[1]
    } else if (parts.length === 3) {
      city = parts[0]
      state = parts[1]
      country = parts[2]
    } else {
      // For longer names, try to extract city and country
      city = parts[0]
      country = parts[parts.length - 1]
      
      // If second part looks like a state/region, use it
      if (parts.length > 3 && !parts[1].match(/\d/) && parts[1].length > 2) {
        state = parts[1]
      }
    }
    
    // Clean up country names
    const countryAbbreviations: Record<string, string> = {
      'USA': 'United States',
      'US': 'United States',
      'UK': 'United Kingdom',
      'UAE': 'United Arab Emirates'
    }
    
    country = countryAbbreviations[country] || country
    
    // Create display name
    let displayName = city
    if (state && country !== 'Singapore' && city !== state) {
      displayName += `, ${state}`
    }
    if (country && country !== city) {
      displayName += `, ${country}`
    }
    
    return { displayName, shortName: city }
  }
  
  /**
   * Calculate popularity score based on various factors
   */
  private static calculatePopularityScore(location: LocationResult): number {
    // Base score by type
    let score = 50
    
    if (location.type === 'city') score = 70
    else if (location.type === 'locality') score = 60
    else if (location.type === 'town') score = 50
    else if (location.type === 'administrative') score = 40
    
    // Boost for major cities (simple heuristic based on common city names)
    const cityName = location.label.split(',')[0].toLowerCase().trim()
    const majorCities = ['paris', 'london', 'new york', 'tokyo', 'dubai', 'barcelona', 'rome', 'singapore', 'sydney', 'los angeles', 'san francisco', 'chicago', 'miami', 'berlin', 'amsterdam', 'madrid', 'vienna', 'prague', 'budapest']
    
    if (majorCities.includes(cityName)) {
      score = Math.max(score, 85)
    }
    
    return score
  }
  
  /**
   * Enhance and deduplicate location results
   */
  static enhanceResults(results: LocationResult[], query: string): EnhancedLocation[] {
    const enhanced: EnhancedLocation[] = []
    const seen = new Map<string, EnhancedLocation>()
    
    // First, check if query matches any popular destination
    const queryLower = query.toLowerCase().trim()
    const popularMatch = POPULAR_DESTINATIONS[queryLower]
    
    if (popularMatch) {
      enhanced.push({ ...popularMatch, confidence: 1.0 })
      seen.set(popularMatch.shortName.toLowerCase(), popularMatch)
    }
    
    // Process API results
    for (const location of results) {
      const { displayName, shortName } = this.createDisplayName(location)
      const { category, icon } = this.categorizeLocation(location)
      const confidence = this.fuzzyMatch(query, shortName)
      const popularityScore = this.calculatePopularityScore(location)
      
      const enhancedLocation: EnhancedLocation = {
        ...location,
        displayName,
        shortName,
        category,
        icon,
        confidence,
        popularityScore,
        label: displayName // Override label with clean display name
      }
      
      // Deduplicate by city name
      const key = shortName.toLowerCase()
      const existing = seen.get(key)
      
      if (!existing || existing.confidence < confidence || existing.popularityScore < popularityScore) {
        seen.set(key, enhancedLocation)
      }
    }
    
    // Convert map to array and sort
    const deduplicated = Array.from(seen.values())
    
    // Sort by: confidence (fuzzy match score), then popularity, then category
    deduplicated.sort((a, b) => {
      // Prioritize exact matches
      if (Math.abs(a.confidence - b.confidence) > 0.1) {
        return b.confidence - a.confidence
      }
      
      // Then by popularity
      if (Math.abs(a.popularityScore - b.popularityScore) > 10) {
        return b.popularityScore - a.popularityScore
      }
      
      // Then cities over regions
      const categoryOrder = { city: 4, town: 3, region: 2, country: 1, landmark: 0 }
      return (categoryOrder[b.category] || 0) - (categoryOrder[a.category] || 0)
    })
    
    // Return top 8 results
    return deduplicated.slice(0, 8)
  }
  
  /**
   * Get intelligent suggestions based on context
   */
  static getSmartSuggestions(recentSearches: string[] = []): EnhancedLocation[] {
    const suggestions: EnhancedLocation[] = []
    
    // Add popular destinations
    const popularCities = ['paris', 'london', 'new york', 'tokyo', 'dubai', 'barcelona', 'rome', 'singapore']
    
    for (const cityKey of popularCities) {
      const city = POPULAR_DESTINATIONS[cityKey]
      if (city) {
        suggestions.push(city)
      }
    }
    
    return suggestions.slice(0, 8)
  }
}