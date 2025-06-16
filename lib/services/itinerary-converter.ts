import { Itinerary, DayPlan, TimeSlot, POI } from '@/store/planStore'
import { v4 as uuidv4 } from 'uuid'

interface AIActivity {
  time: string
  title: string
  description: string
  duration: string
  location: string
  price?: number
  type: string
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
  meals: {
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
  travelers: number
  totalBudget: number
  days: AIDay[]
  highlights: string[]
  tips: string[]
  estimatedTotalCost: number
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

// Extract coordinates from location string or generate mock ones
function extractCoordinates(location: string, destination: string): { lat: number, lng: number } {
  // In a real implementation, you would use a geocoding service
  // For now, we'll use approximate coordinates based on popular destinations
  const cityCoordinates: Record<string, { lat: number, lng: number }> = {
    'paris': { lat: 48.8566, lng: 2.3522 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'rome': { lat: 41.9028, lng: 12.4964 },
    'barcelona': { lat: 41.3851, lng: 2.1734 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'dubai': { lat: 25.2048, lng: 55.2708 },
    'singapore': { lat: 1.3521, lng: 103.8198 },
    'sydney': { lat: -33.8688, lng: 151.2093 },
    'san francisco': { lat: 37.7749, lng: -122.4194 },
    'los angeles': { lat: 34.0522, lng: -118.2437 },
    'miami': { lat: 25.7617, lng: -80.1918 },
    'bangkok': { lat: 13.7563, lng: 100.5018 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'madrid': { lat: 40.4168, lng: -3.7038 },
    'vienna': { lat: 48.2082, lng: 16.3738 },
    'prague': { lat: 50.0755, lng: 14.4378 },
    'budapest': { lat: 47.4979, lng: 19.0402 },
    'lisbon': { lat: 38.7223, lng: -9.1393 }
  }
  
  const destLower = destination.toLowerCase()
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (destLower.includes(city)) {
      // Add small random offset for different locations within the city
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.05,
        lng: coords.lng + (Math.random() - 0.5) * 0.05
      }
    }
  }
  
  // Default coordinates if destination not found
  return { lat: 48.8566, lng: 2.3522 } // Paris as default
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
export function convertAIItineraryToStoreFormat(
  aiItinerary: AIItinerary,
  tripId: string
): Itinerary {
  const pois: POI[] = []
  const days: DayPlan[] = []
  
  // Process each day
  aiItinerary.days.forEach((aiDay) => {
    const dayId = `day-${aiDay.day}`
    const slots: TimeSlot[] = []
    
    // Convert activities to POIs and time slots
    aiDay.activities.forEach((activity, index) => {
      const poiId = uuidv4()
      const duration = parseDuration(activity.duration)
      const category = typeToCategory[activity.type.toLowerCase()] || 'attraction'
      
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
        rating: 4.5 + Math.random() * 0.5, // Mock rating between 4.5 and 5
        image: undefined, // Will be fetched by Unsplash
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
      const coords = extractCoordinates(activity.location, aiItinerary.destination)
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
    })
    
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
      
      const coords = extractCoordinates(aiDay.accommodation.location, aiItinerary.destination)
      accommodationPoi.location.lat = coords.lat
      accommodationPoi.location.lng = coords.lng
      
      pois.push(accommodationPoi)
    }
    
    // Add meals as POIs
    aiDay.meals.forEach((meal) => {
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
      
      const coords = extractCoordinates(meal.venue, aiItinerary.destination)
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
    })
    
    // Create day plan
    const dayPlan: DayPlan = {
      id: dayId,
      date: new Date(aiDay.date),
      dayNumber: aiDay.day,
      slots: slots,
      notes: aiDay.description
    }
    
    days.push(dayPlan)
  })
  
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