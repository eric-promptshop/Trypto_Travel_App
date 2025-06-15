import OpenAI from 'openai';
import prisma from '@/lib/prisma';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TourOperatorOffering {
  id: string;
  operatorName: string;
  tourTitle: string;
  description: string;
  duration: number; // in hours
  price: number;
  currency: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  included: string[];
  excluded: string[];
  highlights: string[];
  availability: string[];
  minGroupSize?: number;
  maxGroupSize?: number;
  cancellationPolicy?: string;
  rating?: number;
  reviews?: number;
}

interface EnhancedItineraryDay {
  day: number;
  date: string;
  title: string;
  description: string;
  activities: {
    id: string;
    time: string;
    title: string;
    description: string;
    duration: string;
    location: string;
    coordinates?: { lat: number; lng: number };
    price?: number;
    type: string;
    provider?: string; // Tour operator name if applicable
    bookingUrl?: string;
    tourOperatorId?: string;
    isRecommendedTour?: boolean;
  }[];
  accommodation?: {
    name: string;
    type: string;
    price: number;
    location: string;
    coordinates?: { lat: number; lng: number };
  };
  meals: {
    type: string;
    venue: string;
    cuisine: string;
    price: number;
    location?: string;
  }[];
  transportation?: {
    type: string;
    details: string;
    cost?: number;
  }[];
  totalCost: number;
  highlights: string[];
  images?: string[];
}

export async function generateEnhancedItinerary(tripData: any) {
  try {
    // 1. Fetch tour operator offerings for the destination
    const tourOperatorContent = await prisma.content.findMany({
      where: {
        OR: [
          { location: { contains: tripData.destination, mode: 'insensitive' } },
          { city: { contains: tripData.destination, mode: 'insensitive' } },
          { country: { contains: tripData.destination, mode: 'insensitive' } }
        ],
        type: { in: ['tour', 'activity', 'experience'] },
        active: true
      },
      include: {
        // If you have a relation to tour operators, include it here
      }
    });

    // 2. Parse tour operator offerings
    const tourOfferings: TourOperatorOffering[] = tourOperatorContent.map(content => {
      const metadata = content.metadata ? JSON.parse(content.metadata) : {};
      const amenities = content.amenities ? JSON.parse(content.amenities) : [];
      const included = content.included ? JSON.parse(content.included) : [];
      const excluded = content.excluded ? JSON.parse(content.excluded) : [];
      const highlights = content.highlights ? JSON.parse(content.highlights) : [];

      return {
        id: content.id,
        operatorName: metadata.operatorName || 'Local Tour Operator',
        tourTitle: content.name,
        description: content.description || '',
        duration: content.duration || 180, // Default 3 hours
        price: content.price || 0,
        currency: content.currency || 'USD',
        location: content.location || tripData.destination,
        coordinates: metadata.coordinates,
        included,
        excluded,
        highlights,
        availability: metadata.availability || ['daily'],
        minGroupSize: metadata.minGroupSize,
        maxGroupSize: metadata.maxGroupSize,
        cancellationPolicy: metadata.cancellationPolicy,
        rating: metadata.rating,
        reviews: metadata.reviews
      };
    });

    // 3. Create enhanced prompt with tour operator context
    const enhancedPrompt = createEnhancedPrompt(tripData, tourOfferings);

    // 4. Generate itinerary with OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      max_tokens: parseInt(process.env.MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      messages: [
        {
          role: 'system',
          content: `You are a professional travel planner with access to local tour operator offerings. 
Your goal is to create personalized itineraries that blend self-guided exploration with curated tour experiences from verified local operators.
Always include specific tour recommendations when they match the traveler's interests and budget.
Respond with valid JSON only.`
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ]
    });

    // 5. Parse and enhance the response
    const aiResponse = completion.choices[0]?.message?.content || '';
    const itinerary = parseEnhancedItinerary(aiResponse, tourOfferings);

    // 6. Fetch images for each day using Unsplash API
    const enhancedDays = await enhanceDaysWithImages(itinerary.days, tripData.destination);

    return {
      ...itinerary,
      days: enhancedDays,
      tourOperatorOffers: tourOfferings.slice(0, 10) // Include top 10 relevant tours
    };

  } catch (error) {
    console.error('Enhanced itinerary generation failed:', error);
    throw error;
  }
}

function createEnhancedPrompt(tripData: any, tourOfferings: TourOperatorOffering[]): string {
  const startDate = new Date(tripData.dates?.from || tripData.startDate);
  const endDate = new Date(tripData.dates?.to || tripData.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Format tour offerings for the prompt
  const tourList = tourOfferings.slice(0, 20).map(tour => 
    `- "${tour.tourTitle}" by ${tour.operatorName}: ${tour.description} (${tour.duration}h, $${tour.price} pp)`
  ).join('\n');

  return `Create a ${duration}-day itinerary for ${tripData.destination} incorporating these verified tour operator offerings where appropriate:

AVAILABLE TOURS & EXPERIENCES:
${tourList}

TRAVELER DETAILS:
- Travelers: ${tripData.travelers}
- Dates: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
- Budget: $${tripData.budget?.[0] || 1000}-${tripData.budget?.[1] || 5000} per person
- Interests: ${tripData.interests?.join(', ') || 'general sightseeing'}
- Accommodation: ${tripData.accommodation || 'any'}

REQUIREMENTS:
1. Intelligently mix self-guided activities with tour operator offerings
2. Recommend specific tours that match interests and budget
3. Include tour operator names and IDs when suggesting their tours
4. Balance paid tours with free/low-cost activities
5. Consider travel time and tour durations
6. Provide booking recommendations (advance booking vs. walk-in)

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "destination": "${tripData.destination}",
  "duration": ${duration},
  "startDate": "${startDate.toISOString().split('T')[0]}",
  "endDate": "${endDate.toISOString().split('T')[0]}",
  "travelers": ${tripData.travelers},
  "totalBudget": ${tripData.budget?.[1] || 5000},
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "description": "Day overview",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Description",
          "duration": "2 hours",
          "location": "Location",
          "price": 50,
          "type": "tour|activity|dining|transport",
          "provider": "Tour operator name (if applicable)",
          "tourOperatorId": "ID from available tours (if applicable)",
          "isRecommendedTour": true/false,
          "bookingUrl": "booking link if tour"
        }
      ],
      "accommodation": {
        "name": "Hotel name",
        "type": "hotel",
        "price": 100,
        "location": "Area"
      },
      "meals": [
        {
          "type": "breakfast|lunch|dinner",
          "venue": "Restaurant",
          "cuisine": "Type",
          "price": 25
        }
      ],
      "transportation": [
        {
          "type": "taxi|bus|train|boat",
          "details": "From/to details",
          "cost": 10
        }
      ],
      "totalCost": 300,
      "highlights": ["Key experiences"]
    }
  ],
  "highlights": ["Top 5-10 trip highlights"],
  "tips": ["Practical tips"],
  "recommendedTours": ["IDs of must-do tours"],
  "estimatedTotalCost": ${duration * 200 * tripData.travelers}
}`;
}

function parseEnhancedItinerary(aiResponse: string, tourOfferings: TourOperatorOffering[]): any {
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Enhance activities with full tour operator details
    if (parsed.days) {
      parsed.days = parsed.days.map((day: any) => {
        if (day.activities) {
          day.activities = day.activities.map((activity: any) => {
            // If this is a recommended tour, enrich with full details
            if (activity.tourOperatorId) {
              const tour = tourOfferings.find(t => t.id === activity.tourOperatorId);
              if (tour) {
                return {
                  ...activity,
                  id: `activity-${day.day}-${activity.time.replace(':', '')}`,
                  provider: tour.operatorName,
                  included: tour.included,
                  excluded: tour.excluded,
                  cancellationPolicy: tour.cancellationPolicy,
                  rating: tour.rating,
                  coordinates: tour.coordinates
                };
              }
            }
            return {
              ...activity,
              id: `activity-${day.day}-${activity.time.replace(':', '')}`
            };
          });
        }
        return day;
      });
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse enhanced itinerary:', error);
    throw error;
  }
}

async function enhanceDaysWithImages(days: EnhancedItineraryDay[], destination: string): Promise<EnhancedItineraryDay[]> {
  try {
    // Fetch images for each day
    const enhancedDays = await Promise.all(days.map(async (day, index) => {
      try {
        // Create search query based on day highlights or title
        const searchQuery = day.highlights?.[0] || `${destination} ${day.title}`;
        
        const response = await fetch(`/api/images?query=${encodeURIComponent(searchQuery)}&count=3`);
        if (response.ok) {
          const data = await response.json();
          return {
            ...day,
            images: data.images?.map((img: any) => img.url) || []
          };
        }
      } catch (error) {
        console.error(`Failed to fetch images for day ${day.day}:`, error);
      }
      return day;
    }));

    return enhancedDays;
  } catch (error) {
    console.error('Failed to enhance days with images:', error);
    return days;
  }
}

// Helper function to find tours by interests
export function matchToursToInterests(
  tours: TourOperatorOffering[], 
  interests: string[]
): TourOperatorOffering[] {
  if (!interests || interests.length === 0) return tours;

  return tours.filter(tour => {
    const tourText = `${tour.tourTitle} ${tour.description} ${tour.highlights.join(' ')}`.toLowerCase();
    return interests.some(interest => tourText.includes(interest.toLowerCase()));
  }).sort((a, b) => {
    // Sort by rating if available
    if (a.rating && b.rating) return b.rating - a.rating;
    return 0;
  });
}

// Export functions for use in the app
export {
  type TourOperatorOffering,
  type EnhancedItineraryDay
};