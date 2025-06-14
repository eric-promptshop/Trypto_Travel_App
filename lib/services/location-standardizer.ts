import { LocationResult } from './geocoding-service'

interface StandardizedLocation {
  city: string
  state?: string
  country: string
  displayName: string
  priority: number
}

export class LocationStandardizer {
  /**
   * Extract city, state/region, and country from various location formats
   */
  private static parseLocationComponents(location: LocationResult): StandardizedLocation {
    const { label, country, region, type } = location
    
    // For Nominatim results, parse the display_name
    if (label.includes(',')) {
      const parts = label.split(',').map(p => p.trim())
      
      // Common patterns:
      // "City, State, Country"
      // "City, Country"
      // "City, District, State, Country"
      // "Landmark, City, State, Country"
      
      let city = ''
      let state = ''
      let countryName = country || ''
      
      // Determine location type priority (cities > districts > landmarks)
      let priority = 0
      if (type === 'city' || type === 'locality') priority = 10
      else if (type === 'administrative' || type === 'district') priority = 5
      else if (type === 'town' || type === 'village') priority = 8
      else if (type === 'suburb') priority = 3
      else priority = 1
      
      // Extract components based on type
      if (type === 'city' || type === 'locality' || type === 'town') {
        city = parts[0]
        if (parts.length === 3) {
          state = parts[1]
          countryName = parts[2]
        } else if (parts.length === 2) {
          countryName = parts[1]
        } else if (parts.length > 3) {
          // Skip district/suburb names
          city = parts[0]
          state = parts[parts.length - 2]
          countryName = parts[parts.length - 1]
        }
      } else {
        // For other types, try to find the city name
        if (parts.length >= 3) {
          city = parts[1] // Often the second part is the city
          state = parts[parts.length - 2]
          countryName = parts[parts.length - 1]
        } else if (parts.length === 2) {
          city = parts[0]
          countryName = parts[1]
        } else {
          city = parts[0]
        }
      }
      
      // Clean up country names
      countryName = this.standardizeCountryName(countryName)
      
      // Create standardized display name
      const displayName = state 
        ? `${city}, ${state}, ${countryName}`
        : `${city}, ${countryName}`
      
      return { city, state, country: countryName, displayName, priority }
    }
    
    // Fallback for non-comma separated labels
    return {
      city: label,
      country: country || '',
      displayName: label,
      priority: 0
    }
  }
  
  /**
   * Standardize country names to common formats
   */
  private static standardizeCountryName(country: string): string {
    const countryMappings: Record<string, string> = {
      'USA': 'United States',
      'US': 'United States',
      'United States of America': 'United States',
      'UK': 'United Kingdom',
      'Great Britain': 'United Kingdom',
      'UAE': 'United Arab Emirates',
      'Nederland': 'Netherlands',
      'The Netherlands': 'Netherlands',
      'République française': 'France',
      'Deutschland': 'Germany',
      'España': 'Spain',
      'Italia': 'Italy',
      'Россия': 'Russia',
      '中国': 'China',
      '日本': 'Japan',
      '대한민국': 'South Korea',
      'Republic of Korea': 'South Korea',
      'Czechia': 'Czech Republic',
    }
    
    return countryMappings[country] || country
  }
  
  /**
   * Deduplicate and standardize location results
   */
  static standardizeResults(results: LocationResult[]): LocationResult[] {
    if (!results || results.length === 0) return []
    
    // Parse and standardize all results
    const standardized = results.map(result => ({
      original: result,
      parsed: this.parseLocationComponents(result)
    }))
    
    // Group by city + country to detect duplicates
    const grouped = new Map<string, typeof standardized[0][]>()
    
    standardized.forEach(item => {
      const key = `${item.parsed.city.toLowerCase()}_${item.parsed.country.toLowerCase()}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(item)
    })
    
    // Select the best result from each group
    const deduplicated: LocationResult[] = []
    
    grouped.forEach(group => {
      // Sort by priority (higher is better) and completeness
      const sorted = group.sort((a, b) => {
        // Prefer higher priority types (cities over suburbs)
        if (a.parsed.priority !== b.parsed.priority) {
          return b.parsed.priority - a.parsed.priority
        }
        
        // Prefer results with coordinates
        const aHasCoords = a.original.lat && a.original.lng
        const bHasCoords = b.original.lat && b.original.lng
        if (aHasCoords && !bHasCoords) return -1
        if (!aHasCoords && bHasCoords) return 1
        
        // Prefer results with state/region info
        if (a.parsed.state && !b.parsed.state) return -1
        if (!a.parsed.state && b.parsed.state) return 1
        
        return 0
      })
      
      // Take the best result and update its label
      const best = sorted[0]
      deduplicated.push({
        ...best.original,
        label: best.parsed.displayName,
        value: `${best.parsed.city}-${best.parsed.country}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })
    })
    
    // Sort final results by priority and then alphabetically
    return deduplicated.sort((a, b) => {
      const aParsed = this.parseLocationComponents(a)
      const bParsed = this.parseLocationComponents(b)
      
      if (aParsed.priority !== bParsed.priority) {
        return bParsed.priority - aParsed.priority
      }
      
      return aParsed.displayName.localeCompare(bParsed.displayName)
    })
  }
  
  /**
   * Filter results to only include major destinations
   */
  static filterMajorDestinations(results: LocationResult[]): LocationResult[] {
    return results.filter(result => {
      const parsed = this.parseLocationComponents(result)
      // Keep cities, towns, and major administrative areas
      return parsed.priority >= 5
    })
  }
}