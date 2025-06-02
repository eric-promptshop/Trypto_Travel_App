/**
 * Comprehensive Travel Content Taxonomy
 * 
 * This taxonomy provides a structured hierarchy for categorizing travel content.
 * It's designed to support automatic tagging and content organization.
 */

export interface TaxonomyNode {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  synonyms?: string[];
  keywords?: string[];
  confidence?: number;
}

// Main content type categories
export enum ContentCategory {
  DESTINATION = 'destination',
  ACTIVITY = 'activity',
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  DINING = 'dining',
  SHOPPING = 'shopping',
  PRACTICAL_INFO = 'practical_info',
  ITINERARY = 'itinerary'
}

// Destination taxonomy
export const DestinationTaxonomy = {
  // Geographic hierarchy
  geographic: {
    continents: {
      'africa': { name: 'Africa', regions: ['north_africa', 'west_africa', 'east_africa', 'central_africa', 'southern_africa'] },
      'asia': { name: 'Asia', regions: ['east_asia', 'southeast_asia', 'south_asia', 'central_asia', 'western_asia'] },
      'europe': { name: 'Europe', regions: ['western_europe', 'eastern_europe', 'northern_europe', 'southern_europe'] },
      'north_america': { name: 'North America', regions: ['usa', 'canada', 'mexico', 'central_america', 'caribbean'] },
      'south_america': { name: 'South America', regions: ['northern_south_america', 'southern_cone', 'andean_states'] },
      'oceania': { name: 'Oceania', regions: ['australia', 'new_zealand', 'pacific_islands'] },
      'antarctica': { name: 'Antarctica', regions: [] }
    }
  },
  
  // Destination types
  types: {
    'city': { name: 'City', keywords: ['urban', 'metropolitan', 'downtown', 'city center'] },
    'beach': { name: 'Beach', keywords: ['coastal', 'seaside', 'shore', 'sand', 'ocean'] },
    'mountain': { name: 'Mountain', keywords: ['alpine', 'highland', 'peaks', 'summit', 'hill'] },
    'countryside': { name: 'Countryside', keywords: ['rural', 'village', 'farmland', 'pastoral'] },
    'island': { name: 'Island', keywords: ['isle', 'atoll', 'archipelago', 'cay'] },
    'desert': { name: 'Desert', keywords: ['arid', 'dunes', 'oasis', 'sahara'] },
    'forest': { name: 'Forest/Jungle', keywords: ['rainforest', 'woods', 'jungle', 'tropical'] },
    'lake': { name: 'Lake/River', keywords: ['waterfront', 'riverside', 'lakeside', 'stream'] },
    'national_park': { name: 'National Park', keywords: ['reserve', 'protected area', 'wildlife', 'conservation'] },
    'historical_site': { name: 'Historical Site', keywords: ['heritage', 'ancient', 'ruins', 'monument'] }
  }
};

// Activity taxonomy
export const ActivityTaxonomy = {
  categories: {
    'sightseeing': {
      name: 'Sightseeing & Tours',
      subcategories: {
        'city_tour': { name: 'City Tours', keywords: ['walking tour', 'bus tour', 'hop-on hop-off'] },
        'guided_tour': { name: 'Guided Tours', keywords: ['private guide', 'group tour', 'audio guide'] },
        'self_guided': { name: 'Self-Guided Tours', keywords: ['explore', 'walk', 'discover'] }
      }
    },
    'outdoor_adventure': {
      name: 'Outdoor & Adventure',
      subcategories: {
        'hiking': { name: 'Hiking & Trekking', keywords: ['trail', 'trek', 'hike', 'walk'] },
        'water_sports': { name: 'Water Sports', keywords: ['swimming', 'diving', 'snorkeling', 'surfing', 'kayaking'] },
        'winter_sports': { name: 'Winter Sports', keywords: ['skiing', 'snowboarding', 'ice skating'] },
        'extreme_sports': { name: 'Extreme Sports', keywords: ['bungee', 'skydiving', 'paragliding', 'rock climbing'] },
        'cycling': { name: 'Cycling', keywords: ['biking', 'bicycle tour', 'mountain biking'] },
        'wildlife': { name: 'Wildlife & Safari', keywords: ['safari', 'wildlife viewing', 'bird watching'] }
      }
    },
    'cultural': {
      name: 'Cultural Experiences',
      subcategories: {
        'museums': { name: 'Museums & Galleries', keywords: ['art', 'history', 'science', 'exhibition'] },
        'performances': { name: 'Shows & Performances', keywords: ['theater', 'concert', 'opera', 'dance', 'music'] },
        'local_experiences': { name: 'Local Experiences', keywords: ['cooking class', 'workshop', 'homestay'] },
        'festivals': { name: 'Festivals & Events', keywords: ['festival', 'celebration', 'carnival', 'parade'] },
        'religious': { name: 'Religious & Spiritual', keywords: ['temple', 'church', 'mosque', 'pilgrimage'] }
      }
    },
    'relaxation': {
      name: 'Relaxation & Wellness',
      subcategories: {
        'spa': { name: 'Spa & Wellness', keywords: ['massage', 'treatment', 'thermal', 'wellness'] },
        'beach': { name: 'Beach Activities', keywords: ['sunbathing', 'beach day', 'seaside'] },
        'yoga': { name: 'Yoga & Meditation', keywords: ['retreat', 'mindfulness', 'meditation'] }
      }
    },
    'entertainment': {
      name: 'Entertainment',
      subcategories: {
        'nightlife': { name: 'Nightlife', keywords: ['bar', 'club', 'pub', 'lounge', 'party'] },
        'theme_parks': { name: 'Theme Parks', keywords: ['amusement park', 'rides', 'attractions'] },
        'casinos': { name: 'Casinos & Gaming', keywords: ['gambling', 'casino', 'gaming'] },
        'shopping': { name: 'Shopping Tours', keywords: ['market tour', 'shopping guide', 'boutiques'] }
      }
    }
  }
};

// Accommodation taxonomy
export const AccommodationTaxonomy = {
  types: {
    'hotel': {
      name: 'Hotels',
      subtypes: {
        'luxury_hotel': { name: 'Luxury Hotel', stars: [5], keywords: ['five star', 'deluxe', 'premium'] },
        'boutique_hotel': { name: 'Boutique Hotel', keywords: ['designer', 'unique', 'stylish'] },
        'business_hotel': { name: 'Business Hotel', keywords: ['corporate', 'conference', 'business center'] },
        'resort': { name: 'Resort', keywords: ['all-inclusive', 'beach resort', 'spa resort'] },
        'budget_hotel': { name: 'Budget Hotel', stars: [1, 2], keywords: ['economy', 'cheap', 'affordable'] },
        'mid_range_hotel': { name: 'Mid-Range Hotel', stars: [3, 4], keywords: ['comfortable', 'standard'] }
      }
    },
    'alternative': {
      name: 'Alternative Accommodations',
      subtypes: {
        'hostel': { name: 'Hostel', keywords: ['backpacker', 'dormitory', 'shared'] },
        'guesthouse': { name: 'Guesthouse/B&B', keywords: ['bed and breakfast', 'pension', 'inn'] },
        'vacation_rental': { name: 'Vacation Rental', keywords: ['apartment', 'house', 'villa', 'condo'] },
        'camping': { name: 'Camping', keywords: ['campground', 'tent', 'RV', 'caravan'] },
        'glamping': { name: 'Glamping', keywords: ['luxury camping', 'safari tent', 'yurt'] },
        'homestay': { name: 'Homestay', keywords: ['local family', 'home stay', 'cultural immersion'] }
      }
    },
    'unique': {
      name: 'Unique Accommodations',
      subtypes: {
        'treehouse': { name: 'Treehouse', keywords: ['tree house', 'elevated', 'forest'] },
        'boat': { name: 'Boat/Yacht', keywords: ['houseboat', 'yacht', 'floating'] },
        'castle': { name: 'Castle/Palace', keywords: ['chateau', 'manor', 'historic'] },
        'eco_lodge': { name: 'Eco Lodge', keywords: ['sustainable', 'green', 'environmental'] }
      }
    }
  },
  
  amenities: {
    'essential': ['wifi', 'parking', 'air_conditioning', 'heating', 'tv', 'private_bathroom'],
    'comfort': ['pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge'],
    'business': ['business_center', 'meeting_rooms', 'conference_facilities'],
    'family': ['family_rooms', 'kids_club', 'babysitting', 'playground'],
    'accessibility': ['wheelchair_access', 'elevator', 'accessible_bathroom']
  }
};

// Transportation taxonomy
export const TransportationTaxonomy = {
  modes: {
    'air': {
      name: 'Air Travel',
      types: {
        'commercial_flight': { name: 'Commercial Flight', keywords: ['airline', 'flight', 'plane'] },
        'charter_flight': { name: 'Charter Flight', keywords: ['private plane', 'charter'] },
        'helicopter': { name: 'Helicopter', keywords: ['chopper', 'heli tour'] }
      }
    },
    'ground': {
      name: 'Ground Transportation',
      types: {
        'train': { name: 'Train', keywords: ['railway', 'rail', 'metro', 'subway'] },
        'bus': { name: 'Bus', keywords: ['coach', 'shuttle', 'public bus'] },
        'car': { name: 'Car', keywords: ['rental car', 'taxi', 'uber', 'private car'] },
        'motorcycle': { name: 'Motorcycle', keywords: ['scooter', 'motorbike', 'moped'] },
        'bicycle': { name: 'Bicycle', keywords: ['bike', 'cycling', 'bike rental'] }
      }
    },
    'water': {
      name: 'Water Transportation',
      types: {
        'cruise': { name: 'Cruise', keywords: ['cruise ship', 'ocean liner'] },
        'ferry': { name: 'Ferry', keywords: ['boat', 'water taxi'] },
        'yacht': { name: 'Yacht/Boat', keywords: ['sailing', 'speedboat', 'catamaran'] }
      }
    }
  }
};

// Dining taxonomy
export const DiningTaxonomy = {
  types: {
    'fine_dining': { name: 'Fine Dining', keywords: ['gourmet', 'michelin', 'haute cuisine'] },
    'casual_dining': { name: 'Casual Dining', keywords: ['restaurant', 'bistro', 'brasserie'] },
    'fast_food': { name: 'Fast Food', keywords: ['quick service', 'takeaway', 'drive-through'] },
    'cafe': { name: 'Café/Coffee Shop', keywords: ['coffee', 'pastry', 'breakfast'] },
    'street_food': { name: 'Street Food', keywords: ['food truck', 'market', 'vendor'] },
    'bar': { name: 'Bar/Pub', keywords: ['drinks', 'cocktails', 'beer', 'wine bar'] }
  },
  
  cuisines: {
    'african': ['moroccan', 'ethiopian', 'south_african'],
    'asian': ['chinese', 'japanese', 'thai', 'indian', 'korean', 'vietnamese'],
    'european': ['french', 'italian', 'spanish', 'greek', 'german', 'british'],
    'american': ['usa', 'mexican', 'brazilian', 'argentinian', 'peruvian'],
    'middle_eastern': ['lebanese', 'turkish', 'israeli', 'persian'],
    'fusion': ['asian_fusion', 'modern', 'contemporary']
  },
  
  dietary: {
    'vegetarian': { keywords: ['veggie', 'no meat'] },
    'vegan': { keywords: ['plant-based', 'no animal products'] },
    'gluten_free': { keywords: ['celiac', 'no gluten'] },
    'halal': { keywords: ['muslim friendly'] },
    'kosher': { keywords: ['jewish dietary'] },
    'organic': { keywords: ['natural', 'farm to table'] }
  }
};

// Shopping taxonomy
export const ShoppingTaxonomy = {
  types: {
    'mall': { name: 'Shopping Mall', keywords: ['shopping center', 'mall'] },
    'market': { name: 'Market', keywords: ['bazaar', 'souk', 'flea market', 'farmers market'] },
    'boutique': { name: 'Boutique', keywords: ['designer', 'specialty shop'] },
    'department_store': { name: 'Department Store', keywords: ['multi-level', 'variety'] },
    'outlet': { name: 'Outlet', keywords: ['discount', 'factory outlet'] },
    'souvenir': { name: 'Souvenir Shop', keywords: ['gifts', 'memorabilia', 'crafts'] }
  },
  
  categories: {
    'fashion': ['clothing', 'shoes', 'accessories', 'jewelry'],
    'electronics': ['gadgets', 'computers', 'phones'],
    'home': ['furniture', 'decor', 'kitchenware'],
    'local_products': ['handicrafts', 'art', 'food_products', 'textiles'],
    'luxury': ['designer_brands', 'watches', 'perfume']
  }
};

// Practical Information taxonomy
export const PracticalInfoTaxonomy = {
  categories: {
    'travel_requirements': {
      'visa': { keywords: ['visa requirements', 'entry permit', 'tourist visa'] },
      'passport': { keywords: ['passport validity', 'documentation'] },
      'vaccinations': { keywords: ['health requirements', 'immunization', 'shots'] },
      'insurance': { keywords: ['travel insurance', 'health coverage'] }
    },
    'money_matters': {
      'currency': { keywords: ['exchange rate', 'local currency', 'money'] },
      'payment': { keywords: ['credit cards', 'cash', 'ATM', 'banking'] },
      'tipping': { keywords: ['gratuity', 'service charge', 'tip'] },
      'budget': { keywords: ['costs', 'expenses', 'pricing', 'affordable'] }
    },
    'communication': {
      'language': { keywords: ['local language', 'phrases', 'translation'] },
      'internet': { keywords: ['wifi', 'sim card', 'mobile data', 'connectivity'] },
      'emergency': { keywords: ['emergency numbers', 'police', 'hospital'] }
    },
    'local_info': {
      'weather': { keywords: ['climate', 'temperature', 'seasons', 'rainfall'] },
      'customs': { keywords: ['local customs', 'etiquette', 'culture', 'traditions'] },
      'safety': { keywords: ['safe areas', 'warnings', 'precautions', 'crime'] },
      'health': { keywords: ['medical', 'pharmacy', 'clinic', 'health tips'] }
    },
    'getting_around': {
      'public_transport': { keywords: ['metro', 'bus routes', 'transport card'] },
      'maps': { keywords: ['navigation', 'directions', 'GPS'] },
      'airports': { keywords: ['airport transfer', 'terminals', 'arrival'] },
      'local_transport': { keywords: ['taxi', 'rideshare', 'rental'] }
    }
  }
};

// Helper functions for taxonomy operations
export class TaxonomyHelper {
  /**
   * Find all parent categories for a given subcategory
   */
  static getParentCategories(categoryId: string): string[] {
    const parents: string[] = [];
    
    // Search through all taxonomies
    const searchInObject = (obj: any, path: string[] = []): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === categoryId) {
          parents.push(...path);
          return true;
        }
        if (typeof value === 'object' && value !== null) {
          if (searchInObject(value, [...path, key])) {
            return true;
          }
        }
      }
      return false;
    };
    
    searchInObject(TravelTaxonomy);
    return parents;
  }

  /**
   * Get all keywords associated with a category including synonyms
   */
  static getCategoryKeywords(category: string): string[] {
    const keywords = new Set<string>();
    
    // Helper to extract keywords from an object
    const extractKeywords = (obj: any): void => {
      if (obj.keywords && Array.isArray(obj.keywords)) {
        obj.keywords.forEach((k: string) => keywords.add(k));
      }
      if (obj.synonyms && Array.isArray(obj.synonyms)) {
        obj.synonyms.forEach((s: string) => keywords.add(s));
      }
    };
    
    // Search for the category and extract its keywords
    const searchCategory = (obj: any): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === category) {
          extractKeywords(value);
          // Also extract from subcategories
          if (typeof value === 'object' && value !== null) {
            for (const subValue of Object.values(value)) {
              if (typeof subValue === 'object') {
                extractKeywords(subValue);
              }
            }
          }
          return true;
        }
        if (typeof value === 'object' && value !== null) {
          if (searchCategory(value)) {
            return true;
          }
        }
      }
      return false;
    };
    
    searchCategory(TravelTaxonomy);
    return Array.from(keywords);
  }

  /**
   * Match text to most relevant categories
   */
  static matchCategories(text: string, threshold: number = 0.6): Array<{category: string, confidence: number}> {
    const matches: Array<{category: string, confidence: number}> = [];
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    // Check each category in the taxonomy
    const checkCategory = (obj: any, categoryName: string, path: string[] = []): void => {
      let matchCount = 0;
      let totalKeywords = 0;
      
      // Check keywords
      if (obj.keywords && Array.isArray(obj.keywords)) {
        totalKeywords += obj.keywords.length;
        obj.keywords.forEach((keyword: string) => {
          if (lowerText.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        });
      }
      
      // Check name
      if (obj.name && lowerText.includes(obj.name.toLowerCase())) {
        matchCount += 2; // Give extra weight to name matches
      }
      
      // Calculate confidence
      if (totalKeywords > 0 && matchCount > 0) {
        const confidence = matchCount / (totalKeywords + 2); // +2 for potential name match
        if (confidence >= threshold) {
          matches.push({
            category: [...path, categoryName].join('.'),
            confidence: Math.min(1, confidence)
          });
        }
      }
      
      // Check subcategories
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && key !== 'keywords' && key !== 'synonyms') {
            checkCategory(value, key, [...path, categoryName]);
          }
        }
      }
    };
    
    // Check all main categories
    for (const [catKey, catValue] of Object.entries(TravelTaxonomy)) {
      if (typeof catValue === 'object' && catKey !== 'contentCategories' && catKey !== 'helper') {
        checkCategory(catValue, catKey);
      }
    }
    
    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get hierarchical path for a category
   */
  static getCategoryPath(categoryId: string): string[] {
    const path: string[] = [];
    
    const findPath = (obj: any, currentPath: string[] = []): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === categoryId) {
          path.push(...currentPath, key);
          return true;
        }
        if (typeof value === 'object' && value !== null) {
          if (findPath(value, [...currentPath, key])) {
            return true;
          }
        }
      }
      return false;
    };
    
    findPath(TravelTaxonomy);
    return path;
  }
}

// Export complete taxonomy
export const TravelTaxonomy = {
  contentCategories: ContentCategory,
  destination: DestinationTaxonomy,
  activity: ActivityTaxonomy,
  accommodation: AccommodationTaxonomy,
  transportation: TransportationTaxonomy,
  dining: DiningTaxonomy,
  shopping: ShoppingTaxonomy,
  practicalInfo: PracticalInfoTaxonomy,
  helper: TaxonomyHelper
}; 