import { Itinerary, DayPlan, TimeSlot, POI } from '@/store/planStore'
import { v4 as uuidv4 } from 'uuid'
import { GeocodingService } from './geocoding-service'

interface AIActivity {
  id?: string
  time: string
  title: string
  description: string
  duration: string
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
  category?: 'dining' | 'activity' | 'transport' | 'accommodation' | 'tour'
  price?: number
  type?: string
  placeId?: string
  imageUrl?: string
  rating?: number
  tips?: string[]
}

interface AIDay {
  day: number
  date: string
  title: string
  description: string
  activities: AIActivity[]
  accommodation?: {
    name: string
    type: string
    price: number
    location: string
  }
  meals?: {
    type: string
    venue: string
    cuisine: string
    price: number
  }[]
  totalCost: number
}

interface AIItinerary {
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: number | { adults: number; children: number }
  totalBudget?: number
  days: AIDay[]
  highlights: string[]
  tips: string[]
  estimatedTotalCost?: number
  metadata?: {
    generatedAt: string
    version: string
    interests: string[]
  }
}

// Map AI activity types to our POI categories
const typeToCategory: Record<string, POI['category']> = {
  'sightseeing': 'attraction',
  'museum': 'art-museums',
  'restaurant': 'restaurant',
  'dining': 'restaurant',
  'breakfast': 'cafe-bakery',
  'lunch': 'restaurant',
  'dinner': 'restaurant',
  'cafe': 'cafe-bakery',
  'bar': 'bars-nightlife',
  'nightlife': 'bars-nightlife',
  'shopping': 'shopping',
  'transport': 'transport',
  'hotel': 'hotel',
  'accommodation': 'hotel',
  'activity': 'attraction',
  'tour': 'attraction',
  'beach': 'attraction',
  'park': 'attraction',
  'market': 'shopping',
  'spa': 'beauty-fashion',
  'wellness': 'beauty-fashion'
}

// Parse duration string to minutes
function parseDuration(duration: string): number {
  const hoursMatch = duration.match(/(\d+)\s*hour/i)
  const minutesMatch = duration.match(/(\d+)\s*min/i)
  
  let totalMinutes = 0
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1])
  }
  
  // Default to 2 hours if no duration specified
  return totalMinutes || 120
}

// Calculate end time from start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

// Extract coordinates from location string or use destination coordinates
async function extractCoordinates(
  location: string, 
  destination: string, 
  destinationCoords?: { lat: number, lng: number },
  providedCoords?: { lat: number, lng: number }
): Promise<{ lat: number, lng: number }> {
  // If coordinates are explicitly provided, use them
  if (providedCoords && providedCoords.lat && providedCoords.lng) {
    return providedCoords
  }
  
  // If we already have destination coordinates, use them with a small offset
  if (destinationCoords && destinationCoords.lat && destinationCoords.lng) {
    return {
      lat: destinationCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: destinationCoords.lng + (Math.random() - 0.5) * 0.02
    }
  }
  
  // Try to geocode the specific location
  try {
    const searchQuery = `${location}, ${destination}`
    const results = await GeocodingService.searchLocations(searchQuery)
    
    if (results.length > 0 && results[0].lat && results[0].lng) {
      return {
        lat: results[0].lat,
        lng: results[0].lng
      }
    }
  } catch (error) {
    console.error('Geocoding error for location:', location, error)
  }
  
  // Fallback to searching just the destination
  try {
    const results = await GeocodingService.searchLocations(destination)
    
    if (results.length > 0 && results[0].lat && results[0].lng) {
      // Add small random offset for different locations within the city
      return {
        lat: results[0].lat + (Math.random() - 0.5) * 0.02,
        lng: results[0].lng + (Math.random() - 0.5) * 0.02
      }
    }
  } catch (error) {
    console.error('Geocoding error for destination:', destination, error)
  }
  
  // Last resort: return a default (we should rarely get here)
  return { lat: 0, lng: 0 }
}

// Determine price level from price number
function getPriceLevel(price?: number): POI['price'] {
  if (!price) return 2
  if (price < 20) return 1
  if (price < 50) return 2
  if (price < 100) return 3
  return 4
}

// Convert AI-generated itinerary to our store format
export async function convertAIItineraryToStoreFormat(
  aiItinerary: AIItinerary,
  tripId: string
): Promise<Itinerary> {
  const pois: POI[] = []
  const days: DayPlan[] = []
  
  // First, geocode the destination to get base coordinates
  let destinationCoords: { lat: number, lng: number } | undefined
  try {
    const destResults = await GeocodingService.searchLocations(aiItinerary.destination)
    if (destResults.length > 0 && destResults[0].lat && destResults[0].lng) {
      destinationCoords = {
        lat: destResults[0].lat,
        lng: destResults[0].lng
      }
    }
  } catch (error) {
    console.error('[Itinerary Converter] Failed to geocode destination:', aiItinerary.destination, error)
  }
  
  // Process each day
  for (const aiDay of aiItinerary.days) {
    const dayId = `day-${aiDay.day}`
    const slots: TimeSlot[] = []
    
    // Convert activities to POIs and time slots
    for (const [index, activity] of aiDay.activities.entries()) {
      const poiId = activity.id || uuidv4()
      const duration = parseDuration(activity.duration)
      
      // Use category from activity if available, otherwise map from type
      let category: POI['category'] = 'attraction'
      if (activity.category) {
        // Map new category format to POI categories
        const categoryMap: Record<string, POI['category']> = {
          'dining': 'restaurant',
          'activity': 'attraction',
          'transport': 'transport',
          'accommodation': 'hotel',
          'tour': 'attraction'
        }
        category = categoryMap[activity.category] || 'attraction'
      } else if (activity.type) {
        category = typeToCategory[activity.type.toLowerCase()] || 'attraction'
      }
      
      // Create POI
      const poi: POI = {
        id: poiId,
        name: activity.title,
        category,
        location: {
          lat: 0,
          lng: 0,
          address: activity.location
        },
        description: activity.description,
        price: getPriceLevel(activity.price),
        rating: activity.rating || (4.5 + Math.random() * 0.5), // Use provided rating or mock
        image: activity.imageUrl, // Use provided image URL
        tips: activity.tips,
        placeId: activity.placeId,
        openingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '17:00' },
          sunday: { open: '10:00', close: '17:00' }
        }
      }
      
      // Get coordinates based on location and destination
      const coords = await extractCoordinates(
        activity.location, 
        aiItinerary.destination, 
        destinationCoords,
        activity.coordinates
      )
      poi.location.lat = coords.lat
      poi.location.lng = coords.lng
      
      pois.push(poi)
      
      // Create time slot
      const slot: TimeSlot = {
        id: uuidv4(),
        startTime: activity.time || `${9 + index * 3}:00`, // Default times if not specified
        endTime: calculateEndTime(activity.time || `${9 + index * 3}:00`, duration),
        poiId: poiId,
        duration: duration,
        transportTime: index < aiDay.activities.length - 1 ? 30 : 0 // 30 min between activities
      }
      
      slots.push(slot)
    }
    
    // Add accommodation as a POI if available
    if (aiDay.accommodation) {
      const accommodationId = uuidv4()
      const accommodationPoi: POI = {
        id: accommodationId,
        name: aiDay.accommodation.name,
        category: 'hotel',
        location: {
          lat: 0,
          lng: 0,
          address: aiDay.accommodation.location
        },
        description: `${aiDay.accommodation.type} accommodation`,
        price: getPriceLevel(aiDay.accommodation.price),
        rating: 4.3 + Math.random() * 0.7,
        image: undefined
      }
      
      const coords = await extractCoordinates(aiDay.accommodation.location, aiItinerary.destination, destinationCoords, undefined)
      accommodationPoi.location.lat = coords.lat
      accommodationPoi.location.lng = coords.lng
      
      pois.push(accommodationPoi)
    }
    
    // Add meals as POIs
    if (aiDay.meals && Array.isArray(aiDay.meals)) {
      for (const meal of aiDay.meals) {
      const mealId = uuidv4()
      const mealPoi: POI = {
        id: mealId,
        name: meal.venue,
        category: meal.type === 'breakfast' ? 'cafe-bakery' : 'restaurant',
        location: {
          lat: 0,
          lng: 0,
          address: aiItinerary.destination
        },
        description: `${meal.cuisine} cuisine for ${meal.type}`,
        price: getPriceLevel(meal.price),
        rating: 4.2 + Math.random() * 0.8,
        image: undefined
      }
      
      const coords = await extractCoordinates(meal.venue, aiItinerary.destination, destinationCoords, undefined)
      mealPoi.location.lat = coords.lat
      mealPoi.location.lng = coords.lng
      
      pois.push(mealPoi)
      
      // Add meal to timeline if it's lunch or dinner
      if (meal.type === 'lunch' || meal.type === 'dinner') {
        const mealTime = meal.type === 'lunch' ? '12:30' : '19:00'
        const mealSlot: TimeSlot = {
          id: uuidv4(),
          startTime: mealTime,
          endTime: calculateEndTime(mealTime, 90), // 1.5 hours for meals
          poiId: mealId,
          duration: 90,
          transportTime: 30
        }
        
        // Insert meal slot at appropriate position
        const insertIndex = slots.findIndex(s => s.startTime > mealTime)
        if (insertIndex === -1) {
          slots.push(mealSlot)
        } else {
          slots.splice(insertIndex, 0, mealSlot)
        }
      }
    }
    }
    
    // Create day plan
    const dayPlan: DayPlan = {
      id: dayId,
      date: new Date(aiDay.date),
      dayNumber: aiDay.day,
      slots: slots,
      notes: aiDay.description
    }
    
    days.push(dayPlan)
  }
  
  // Create the complete itinerary
  const itinerary: Itinerary = {
    id: uuidv4(),
    tripId,
    destination: aiItinerary.destination,
    startDate: new Date(aiItinerary.startDate),
    endDate: new Date(aiItinerary.endDate),
    days,
    pois
  }
  
  return itinerary
}

// Store itinerary metadata for later use
export function storeItineraryMetadata(aiItinerary: AIItinerary) {
  const metadata = {
    highlights: aiItinerary.highlights,
    tips: aiItinerary.tips,
    estimatedTotalCost: aiItinerary.estimatedTotalCost,
    travelers: aiItinerary.travelers,
    totalBudget: aiItinerary.totalBudget
  }
  
  localStorage.setItem('itineraryMetadata', JSON.stringify(metadata))
  return metadata
}