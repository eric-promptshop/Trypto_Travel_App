import OpenAI from 'openai';
import prisma from '@/lib/prisma';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TourOperatorOffering {
  id: string;
  operatorName: string;
  tourTitle: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  included: string[];
  excluded: string[];
  highlights: string[];
  availability: string[];
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
    provider?: string;
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

// Optimized cache key generation
function getCacheKey(tripData: any): string {
  const key = `${tripData.destination}_${tripData.dates?.from}_${tripData.dates?.to}_${tripData.interests?.join(',')}_${tripData.budget?.[1]}`;
  return key.toLowerCase().replace(/\s+/g, '_');
}

// Check and clean expired cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expires < now) {
      cache.delete(key);
    }
  }
}

export async function generateEnhancedItinerary(tripData: any) {
  const genStart = Date.now();
  
  try {
    // Check cache first
    const cacheKey = getCacheKey(tripData);
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Clean expired entries periodically
    if (cache.size > 100) cleanCache();

    // 1. Fetch tour operator offerings with reduced timeout
    const tourOperatorContent = await Promise.race([
      prisma.content.findMany({
        where: {
          OR: [
            { location: { contains: tripData.destination, mode: 'insensitive' } },
            { city: { contains: tripData.destination, mode: 'insensitive' } },
            { country: { contains: tripData.destination, mode: 'insensitive' } }
          ],
          type: { in: ['tour', 'activity', 'experience'] },
          active: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          duration: true,
          location: true,
          highlights: true,
          included: true,
          metadata: true
        },
        take: 10 // Reduced from 20
      }),
      new Promise<any[]>((resolve) => 
        setTimeout(() => resolve([]), 3000) // 3s timeout, return empty array
      )
    ]);


    // 2. Format tour offerings (simplified)
    const tourOfferings: TourOperatorOffering[] = tourOperatorContent
      .filter(content => content.price && content.price > 0)
      .map(content => ({
        id: content.id,
        operatorName: 'Local Tour Operator',
        tourTitle: content.name,
        description: content.description.slice(0, 150) + '...', // Truncate description
        duration: content.duration || 240,
        price: content.price || 100,
        currency: content.currency || 'USD',
        location: content.location || tripData.destination,
        included: [],
        excluded: [],
        highlights: [],
        availability: []
      }));

    // 3. Create optimized prompt (reduced size)
    const startDate = new Date(tripData.dates?.from || tripData.startDate);
    const endDate = new Date(tripData.dates?.to || tripData.endDate);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const optimizedPrompt = `Create a ${duration}-day itinerary for ${tripData.destination}.
Travelers: ${tripData.travelers || 2}
Budget: $${tripData.budget?.[1] || 5000} total
Interests: ${tripData.interests?.slice(0, 3).join(', ') || 'general sightseeing'}

${tourOfferings.length > 0 ? `Include these tours where relevant:
${tourOfferings.slice(0, 5).map(t => `- ${t.tourTitle}: $${t.price}`).join('\n')}` : ''}

Return a JSON array with ${duration} days. Each day should have:
{
  "day": number,
  "date": "YYYY-MM-DD",
  "title": string,
  "activities": [
    {
      "time": "HH:MM",
      "title": string,
      "description": string (max 100 chars),
      "duration": string,
      "location": string,
      "price": number,
      "type": string
    }
  ],
  "totalCost": number
}

Be concise. Include 2-3 activities per day.`;

    // 4. Call OpenAI with optimized settings
    const apiStart = Date.now();
    
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Faster model
        max_tokens: 2000, // Reduced from 4000
        temperature: 0.5, // More deterministic
        messages: [
          {
            role: 'system',
            content: 'You are a travel planner. Return only valid JSON arrays. Be concise.'
          },
          {
            role: 'user',
            content: optimizedPrompt
          }
        ]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 15000) // 15s timeout
      )
    ]);


    // 5. Parse response
    const aiResponse = (completion as any).choices[0]?.message?.content || '[]';
    let days;
    
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      days = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response, using fallback');
      days = generateFallbackDays(tripData, duration, startDate);
    }

    // 6. Build final itinerary
    const itinerary = {
      destination: tripData.destination,
      duration,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      travelers: tripData.travelers || 2,
      totalBudget: tripData.budget?.[1] || 5000,
      days: days.map((day: any, index: number) => ({
        ...day,
        day: index + 1,
        date: day.date || new Date(startDate.getTime() + index * 86400000).toISOString().split('T')[0],
        activities: (day.activities || []).map((act: any) => ({
          id: `act_${index}_${Math.random().toString(36).substr(2, 9)}`,
          ...act,
          coordinates: undefined // Remove to reduce size
        })),
        accommodation: {
          name: `Hotel in ${tripData.destination}`,
          type: 'hotel',
          price: 150,
          location: tripData.destination
        },
        meals: [
          { type: 'breakfast', venue: 'Hotel', cuisine: 'Continental', price: 20 },
          { type: 'lunch', venue: 'Local Restaurant', cuisine: 'Local', price: 30 },
          { type: 'dinner', venue: 'Restaurant', cuisine: 'International', price: 40 }
        ],
        totalCost: day.totalCost || 350,
        highlights: []
      })),
      tourOperatorOffers: tourOfferings.slice(0, 5)
    };

    // Cache the result
    cache.set(cacheKey, {
      data: itinerary,
      expires: Date.now() + CACHE_TTL
    });

    return itinerary;

  } catch (error) {
    console.error(`❌ Generation failed after ${Date.now() - genStart}ms:`, error);
    
    // Return basic fallback
    const startDate = new Date(tripData.dates?.from || tripData.startDate);
    const endDate = new Date(tripData.dates?.to || tripData.endDate);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      destination: tripData.destination,
      duration,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      travelers: tripData.travelers || 2,
      totalBudget: tripData.budget?.[1] || 5000,
      days: generateFallbackDays(tripData, duration, startDate),
      tourOperatorOffers: []
    };
  }
}

function generateFallbackDays(tripData: any, duration: number, startDate: Date) {
  return Array.from({ length: duration }, (_, i) => {
    const dayDate = new Date(startDate.getTime() + i * 86400000);
    return {
      day: i + 1,
      date: dayDate.toISOString().split('T')[0],
      title: `Day ${i + 1} in ${tripData.destination}`,
      description: `Explore ${tripData.destination}`,
      activities: [
        {
          id: `act_${i}_1`,
          time: '09:00',
          title: 'Morning Activity',
          description: 'Explore local attractions',
          duration: '3 hours',
          location: tripData.destination,
          price: 50,
          type: 'sightseeing'
        },
        {
          id: `act_${i}_2`,
          time: '14:00',
          title: 'Afternoon Activity',
          description: 'Cultural experience',
          duration: '3 hours',
          location: tripData.destination,
          price: 75,
          type: 'culture'
        }
      ],
      accommodation: {
        name: 'Recommended Hotel',
        type: 'hotel',
        price: 150,
        location: tripData.destination
      },
      meals: [
        { type: 'breakfast', venue: 'Hotel', cuisine: 'Continental', price: 20 },
        { type: 'lunch', venue: 'Local Cafe', cuisine: 'Local', price: 30 },
        { type: 'dinner', venue: 'Restaurant', cuisine: 'International', price: 40 }
      ],
      totalCost: 365,
      highlights: [`Explore ${tripData.destination}`, 'Local cuisine', 'Cultural sites']
    };
  });
}

// Export utilities for monitoring
export function getCacheStats() {
  cleanCache();
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}

export function clearCache() {
  cache.clear();
}