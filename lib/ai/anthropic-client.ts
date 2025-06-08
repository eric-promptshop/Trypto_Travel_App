import Anthropic from '@anthropic-ai/sdk';
import { GeneratedItinerary, UserPreferences, Activity, Accommodation } from '@/lib/types/itinerary';
import { prisma } from '@/lib/prisma';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ItineraryGenerationContext {
  preferences: UserPreferences;
  availableContent: {
    activities: any[];
    accommodations: any[];
    destinations: any[];
  };
}

/**
 * Generate a structured prompt for Anthropic
 */
function generateItineraryPrompt(context: ItineraryGenerationContext): string {
  const { preferences } = context;
  const tripDuration = Math.ceil(
    (new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  ) + 1;

  return `You are an expert travel planner. Create a detailed ${tripDuration}-day itinerary for ${preferences.primaryDestination} based on these preferences:

TRAVELER INFORMATION:
- Adults: ${preferences.adults}
- Children: ${preferences.children || 0}
- Infants: ${preferences.infants || 0}
- Travel Dates: ${preferences.startDate} to ${preferences.endDate}
- Budget Range: $${preferences.budgetMin} - $${preferences.budgetMax} ${preferences.budgetCurrency} per person
- Interests: ${preferences.interests?.join(', ') || 'general sightseeing'}
- Pace Preference: ${preferences.pacePreference || 'moderate'}
- Accommodation Type: ${preferences.accommodationType || 'hotel'}
- Transportation: ${preferences.transportationPreference || 'mixed'}

REQUIREMENTS:
1. Create a day-by-day itinerary with specific activities, times, and locations
2. Include breakfast, lunch, and dinner recommendations
3. Consider travel time between locations
4. Respect the budget constraints
5. Balance activities based on interests
6. Include practical tips and notes
7. Suggest specific accommodations if possible
8. Account for any children/infants in activity selection

FORMAT YOUR RESPONSE AS A VALID JSON OBJECT with this structure:
{
  "title": "Trip title",
  "description": "Brief trip description",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "activities": [
        {
          "time": "HH:MM",
          "duration": minutes,
          "title": "Activity name",
          "description": "Activity description",
          "location": "Specific location",
          "cost": estimated_cost_per_person,
          "category": "sightseeing|cultural|adventure|relaxation|culinary|shopping",
          "bookingRequired": true/false,
          "familyFriendly": true/false,
          "tips": "Practical tips"
        }
      ],
      "meals": [
        {
          "type": "breakfast|lunch|dinner",
          "time": "HH:MM",
          "restaurant": "Restaurant name",
          "cuisine": "Cuisine type",
          "estimatedCost": cost_per_person,
          "location": "Address or area",
          "reservationRequired": true/false
        }
      ],
      "accommodation": {
        "name": "Hotel/accommodation name",
        "type": "hotel|hostel|airbnb|resort",
        "location": "Address",
        "estimatedCost": cost_per_night,
        "amenities": ["wifi", "breakfast", "pool", etc]
      },
      "transportationNotes": "How to get around this day",
      "totalEstimatedCost": total_for_day_per_person
    }
  ],
  "highlights": ["Top 5-10 trip highlights"],
  "packingTips": ["Essential items to pack"],
  "generalTips": ["Important travel tips"],
  "totalEstimatedCost": total_trip_cost_per_person,
  "alternativeOptions": ["Budget-saving alternatives"]
}

Ensure all costs are in ${preferences.budgetCurrency} and the total stays within budget.`;
}

/**
 * Parse AI response and structure it into GeneratedItinerary format
 */
async function parseAIResponse(
  aiResponse: string, 
  preferences: UserPreferences,
  context: ItineraryGenerationContext
): Promise<GeneratedItinerary> {
  try {
    // Extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Map AI response to our GeneratedItinerary structure
    const itinerary: GeneratedItinerary = {
      id: `itin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: parsedResponse.title,
      description: parsedResponse.description,
      destinations: [{
        id: 'dest_1',
        title: preferences.primaryDestination || 'Unknown',
        description: `Exploring ${preferences.primaryDestination}`,
        location: preferences.primaryDestination || 'Unknown',
        coordinates: { lat: 0, lng: 0 }, // Would be geocoded in production
        countryCode: 'XX',
        region: 'Unknown',
        timeZone: 'UTC',
        averageTemperature: { celsius: 20, fahrenheit: 68 },
        bestVisitingMonths: [],
        languagesSpoken: [],
        currency: preferences.budgetCurrency || 'USD',
        safetyRating: 8,
        touristRating: 8,
        costLevel: 'moderate',
        tags: []
      }],
      days: parsedResponse.days.map((day: any, index: number) => ({
        id: `day_${index + 1}`,
        dayNumber: day.dayNumber,
        date: day.date,
        title: day.title,
        location: preferences.primaryDestination || 'Unknown',
        coordinates: { lat: 0, lng: 0 },
        activities: day.activities.map((activity: any, actIndex: number) => ({
          id: `act_${index}_${actIndex}`,
          title: activity.title,
          description: activity.description,
          category: activity.category,
          location: activity.location,
          coordinates: { lat: 0, lng: 0 },
          timeSlot: {
            startTime: activity.time,
            endTime: '', // Calculate based on duration
            duration: activity.duration
          },
          difficulty: 'easy',
          indoorOutdoor: 'both',
          accessibility: {
            wheelchairAccessible: false,
            mobilityRequirements: 'walking',
            visuallyImpairedSupport: false,
            hearingImpairedSupport: false
          },
          seasonality: ['spring', 'summer', 'fall', 'winter'],
          bookingRequired: activity.bookingRequired,
          cost: { 
            amount: activity.cost, 
            currency: preferences.budgetCurrency || 'USD' 
          },
          tags: [activity.category],
          familyFriendly: activity.familyFriendly,
          tips: activity.tips
        })),
        accommodation: day.accommodation ? {
          id: `acc_${index}`,
          title: day.accommodation.name,
          description: '',
          type: day.accommodation.type,
          location: day.accommodation.location,
          coordinates: { lat: 0, lng: 0 },
          starRating: 3,
          amenities: day.accommodation.amenities || [],
          roomTypes: [{
            type: 'standard',
            capacity: preferences.adults + preferences.children,
            priceRange: { 
              min: day.accommodation.estimatedCost * 0.8, 
              max: day.accommodation.estimatedCost * 1.2 
            },
            amenities: []
          }],
          checkInTime: '15:00',
          checkOutTime: '11:00',
          cancellationPolicy: '24 hours',
          contactInfo: {
            phone: '',
            email: '',
            website: ''
          },
          cost: { 
            amount: day.accommodation.estimatedCost, 
            currency: preferences.budgetCurrency || 'USD' 
          },
          tags: []
        } : undefined,
        transportation: [],
        meals: day.meals.map((meal: any) => ({
          type: meal.type,
          time: meal.time,
          venue: {
            name: meal.restaurant,
            cuisine: meal.cuisine,
            location: meal.location,
            priceRange: { 
              min: meal.estimatedCost * 0.8, 
              max: meal.estimatedCost * 1.2 
            },
            reservationRequired: meal.reservationRequired
          }
        })),
        totalEstimatedCost: { 
          amount: day.totalEstimatedCost, 
          currency: preferences.budgetCurrency || 'USD' 
        },
        pacing: preferences.pacePreference || 'moderate',
        notes: day.transportationNotes
      })),
      totalDuration: parsedResponse.days.length,
      totalEstimatedCost: { 
        amount: parsedResponse.totalEstimatedCost, 
        currency: preferences.budgetCurrency || 'USD' 
      },
      summary: {
        highlights: parsedResponse.highlights || [],
        totalActivities: parsedResponse.days.reduce((sum: number, day: any) => 
          sum + day.activities.length, 0
        ),
        uniqueDestinations: 1,
        avgDailyCost: { 
          amount: parsedResponse.totalEstimatedCost / parsedResponse.days.length, 
          currency: preferences.budgetCurrency || 'USD' 
        },
        recommendedBudget: { 
          amount: parsedResponse.totalEstimatedCost * 1.15, 
          currency: preferences.budgetCurrency || 'USD' 
        },
        physicalDemand: 'moderate',
        culturalImmersion: 'high',
        packingTips: parsedResponse.packingTips || [],
        generalTips: parsedResponse.generalTips || [],
        alternativeOptions: parsedResponse.alternativeOptions || []
      },
      metadata: {
        generationTime: 0,
        aiModel: 'claude-3',
        confidenceScore: 0.9,
        optimizationFlags: ['ai_generated', 'personalized']
      },
      preferences,
      generatedAt: new Date(),
      version: '2.0.0'
    };

    return itinerary;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI-generated itinerary');
  }
}

/**
 * Generate itinerary using Anthropic AI
 */
export async function generateAIItinerary(
  preferences: UserPreferences
): Promise<GeneratedItinerary> {
  try {
    // Load available content from database
    const [activities, accommodations, content] = await Promise.all([
      prisma.content.findMany({
        where: { 
          type: 'activity',
          location: {
            contains: preferences.primaryDestination,
            mode: 'insensitive'
          },
          active: true
        },
        take: 50
      }),
      prisma.content.findMany({
        where: { 
          type: 'accommodation',
          location: {
            contains: preferences.primaryDestination,
            mode: 'insensitive'
          },
          active: true
        },
        take: 20
      }),
      prisma.content.findMany({
        where: { 
          type: 'destination',
          location: {
            contains: preferences.primaryDestination,
            mode: 'insensitive'
          },
          active: true
        },
        take: 10
      })
    ]);

    const context: ItineraryGenerationContext = {
      preferences,
      availableContent: {
        activities,
        accommodations,
        destinations: content
      }
    };

    // Generate prompt
    const prompt = generateItineraryPrompt(context);

    // Call Anthropic API
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract text content from the response
    const aiResponse = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    // Parse and structure the response
    const itinerary = await parseAIResponse(aiResponse, preferences, context);

    return itinerary;
  } catch (error) {
    console.error('AI itinerary generation failed:', error);
    throw new Error('Failed to generate AI itinerary');
  }
}

/**
 * Stream itinerary generation for better UX
 */
export async function* streamAIItinerary(
  preferences: UserPreferences
): AsyncGenerator<{ type: string; data: any }, GeneratedItinerary, unknown> {
  try {
    yield { type: 'status', data: 'Loading destination information...' };
    
    // Load content
    const content = await prisma.content.findMany({
      where: { 
        location: {
          contains: preferences.primaryDestination,
          mode: 'insensitive'
        },
        active: true
      }
    });

    yield { type: 'status', data: 'Generating personalized itinerary...' };

    // Generate itinerary
    const itinerary = await generateAIItinerary(preferences);

    yield { type: 'status', data: 'Finalizing your travel plan...' };

    return itinerary;
  } catch (error) {
    yield { type: 'error', data: error instanceof Error ? error.message : 'Generation failed' };
    throw error;
  }
}