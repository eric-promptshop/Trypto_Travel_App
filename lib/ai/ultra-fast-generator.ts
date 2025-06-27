import OpenAI from 'openai';
import { findTemplate } from './templates/destination-templates';
import { getCachedItinerary, cacheItinerary } from '@/lib/cache/redis-cache';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ultra-lightweight in-memory cache (L1 cache)
const miniCache = new Map<string, any>();

export async function generateUltraFastItinerary(tripData: any) {
  const startTime = Date.now();

  try {
    // Step 1: Check for exact template match (instant)
    const template = findTemplate(tripData.destination);
    if (template) {
      const customized = await customizeTemplate(template, tripData, startTime);
      // Cache in Redis for next time
      await cacheItinerary(tripData, customized, { ttl: 7200 }); // 2 hour TTL for templates
      return customized;
    }

    // Step 2: Check Redis cache (L2 cache)
    const redisCache = await getCachedItinerary(tripData);
    if (redisCache) {
      // Also store in L1 cache
      const cacheKey = `${tripData.destination}_${calculateDuration(tripData)}`;
      miniCache.set(cacheKey, redisCache);
      return redisCache;
    }

    // Step 3: Check in-memory cache (L1 cache)
    const cacheKey = `${tripData.destination}_${calculateDuration(tripData)}`;
    const cached = miniCache.get(cacheKey);
    if (cached) {
      return customizeBasicItinerary(cached, tripData);
    }

    // Step 4: Generate minimal itinerary with GPT-3.5-turbo
    const duration = calculateDuration(tripData);
    const itinerary = await generateMinimalItinerary(tripData, duration);
    
    // Cache in both L1 and L2
    miniCache.set(cacheKey, itinerary);
    if (miniCache.size > 50) {
      // Keep L1 cache small
      const firstKey = miniCache.keys().next().value;
      miniCache.delete(firstKey);
    }
    
    // Cache in Redis
    await cacheItinerary(tripData, itinerary, { ttl: 3600 }); // 1 hour TTL for AI-generated

    return itinerary;

  } catch (error) {
    console.error('❌ Ultra-fast generation failed:', error);
    return generateInstantFallback(tripData);
  }
}

async function customizeTemplate(template: any, tripData: any, startTime: number) {
  // Adjust template based on actual trip duration
  const requestedDuration = calculateDuration(tripData);
  const startDate = new Date(tripData.dates?.from || tripData.startDate);
  
  // If duration matches, use template as-is with date adjustments
  if (requestedDuration === template.duration) {
    const customized = {
      ...template.template,
      destination: template.destination,
      duration: requestedDuration,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date(startDate.getTime() + (requestedDuration - 1) * 86400000).toISOString().split('T')[0],
      travelers: tripData.travelers || 2,
      totalBudget: tripData.budget?.[1] || 5000,
      days: template.template.days.map((day: any, index: number) => ({
        ...day,
        date: new Date(startDate.getTime() + index * 86400000).toISOString().split('T')[0]
      }))
    };
    
    return customized;
  }

  // For different durations, use AI to adjust
  try {
    const prompt = `Adjust this ${template.duration}-day ${template.destination} itinerary to ${requestedDuration} days.
Keep the best activities. Budget: $${tripData.budget?.[1] || 5000}.
Return ONLY a JSON array of ${requestedDuration} days with this structure:
[{"day":1,"title":"Day Title","activities":[{"time":"HH:MM","title":"Activity","duration":"X hours","price":0}],"totalCost":0}]`;

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Adjust travel itineraries. Return only JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);

    const response = (completion as any).choices[0]?.message?.content || '[]';
    const adjustedDays = JSON.parse(response);

    const customized = {
      ...template.template,
      destination: template.destination,
      duration: requestedDuration,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date(startDate.getTime() + (requestedDuration - 1) * 86400000).toISOString().split('T')[0],
      travelers: tripData.travelers || 2,
      totalBudget: tripData.budget?.[1] || 5000,
      days: adjustedDays.map((day: any, index: number) => ({
        ...day,
        date: new Date(startDate.getTime() + index * 86400000).toISOString().split('T')[0],
        accommodation: template.template.days[0].accommodation,
        meals: template.template.days[0].meals
      }))
    };

    return customized;

  } catch (error) {
    // Fallback: repeat or trim template days
    const customized = {
      ...template.template,
      destination: template.destination,
      duration: requestedDuration,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date(startDate.getTime() + (requestedDuration - 1) * 86400000).toISOString().split('T')[0],
      travelers: tripData.travelers || 2,
      totalBudget: tripData.budget?.[1] || 5000,
      days: Array.from({ length: requestedDuration }, (_, i) => {
        const templateDay = template.template.days[i % template.template.days.length];
        return {
          ...templateDay,
          day: i + 1,
          date: new Date(startDate.getTime() + i * 86400000).toISOString().split('T')[0]
        };
      })
    };

    return customized;
  }
}

async function generateMinimalItinerary(tripData: any, duration: number) {
  const prompt = `Create a ${duration}-day itinerary for ${tripData.destination}.
Budget: $${tripData.budget?.[1] || 5000} total.
Return a JSON array of days. Each day needs: day number, title, 2 activities with time/title/price.
Example: [{"day":1,"title":"Arrival","activities":[{"time":"10:00","title":"City Tour","price":50}]}]
Be brief. No descriptions.`;

  const completion = await Promise.race([
    openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Create brief travel itineraries. JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.5
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 7000))
  ]);

  const response = (completion as any).choices[0]?.message?.content || '[]';
  const days = JSON.parse(response);
  const startDate = new Date(tripData.dates?.from || tripData.startDate);

  return {
    destination: tripData.destination,
    duration,
    startDate: startDate.toISOString().split('T')[0],
    endDate: new Date(startDate.getTime() + (duration - 1) * 86400000).toISOString().split('T')[0],
    travelers: tripData.travelers || 2,
    totalBudget: tripData.budget?.[1] || 5000,
    days: days.map((day: any, index: number) => ({
      day: day.day || index + 1,
      date: new Date(startDate.getTime() + index * 86400000).toISOString().split('T')[0],
      title: day.title || `Day ${index + 1}`,
      description: `Explore ${tripData.destination}`,
      activities: (day.activities || []).map((act: any, i: number) => ({
        id: `act_${index}_${i}`,
        time: act.time || `${9 + i * 4}:00`,
        title: act.title || 'Activity',
        description: '',
        duration: '3 hours',
        location: tripData.destination,
        price: act.price || 50,
        type: 'activity'
      })),
      accommodation: {
        name: 'Recommended Hotel',
        type: 'hotel',
        price: 150,
        location: tripData.destination
      },
      meals: [
        { type: 'breakfast', venue: 'Hotel', cuisine: 'Continental', price: 20 },
        { type: 'lunch', venue: 'Local Restaurant', cuisine: 'Local', price: 30 },
        { type: 'dinner', venue: 'Restaurant', cuisine: 'International', price: 40 }
      ],
      totalCost: 350,
      highlights: []
    })),
    tourOperatorOffers: [],
    highlights: [`Explore ${tripData.destination}`, 'Local experiences', 'Cultural immersion'],
    tips: ['Book accommodations early', 'Check weather forecast', 'Learn basic phrases']
  };
}

function customizeBasicItinerary(basic: any, tripData: any) {
  const startDate = new Date(tripData.dates?.from || tripData.startDate);
  return {
    ...basic,
    startDate: startDate.toISOString().split('T')[0],
    endDate: new Date(startDate.getTime() + (basic.duration - 1) * 86400000).toISOString().split('T')[0],
    travelers: tripData.travelers || 2,
    totalBudget: tripData.budget?.[1] || basic.totalBudget,
    days: basic.days.map((day: any, index: number) => ({
      ...day,
      date: new Date(startDate.getTime() + index * 86400000).toISOString().split('T')[0]
    }))
  };
}

function generateInstantFallback(tripData: any) {
  const duration = calculateDuration(tripData);
  const startDate = new Date(tripData.dates?.from || tripData.startDate);
  
  return {
    destination: tripData.destination,
    duration,
    startDate: startDate.toISOString().split('T')[0],
    endDate: new Date(startDate.getTime() + (duration - 1) * 86400000).toISOString().split('T')[0],
    travelers: tripData.travelers || 2,
    totalBudget: tripData.budget?.[1] || 5000,
    days: Array.from({ length: duration }, (_, i) => ({
      day: i + 1,
      date: new Date(startDate.getTime() + i * 86400000).toISOString().split('T')[0],
      title: `Day ${i + 1} in ${tripData.destination}`,
      description: 'Discover local attractions',
      activities: [
        {
          id: `act_${i}_1`,
          time: '09:00',
          title: 'Morning Exploration',
          description: '',
          duration: '3 hours',
          location: tripData.destination,
          price: 50,
          type: 'sightseeing'
        },
        {
          id: `act_${i}_2`,
          time: '14:00',
          title: 'Afternoon Activity',
          description: '',
          duration: '3 hours',
          location: tripData.destination,
          price: 75,
          type: 'activity'
        }
      ],
      accommodation: {
        name: 'City Hotel',
        type: 'hotel',
        price: 120,
        location: tripData.destination
      },
      meals: [
        { type: 'breakfast', venue: 'Hotel', cuisine: 'Continental', price: 15 },
        { type: 'lunch', venue: 'Local Cafe', cuisine: 'Local', price: 25 },
        { type: 'dinner', venue: 'Restaurant', cuisine: 'International', price: 35 }
      ],
      totalCost: 320,
      highlights: []
    })),
    tourOperatorOffers: [],
    highlights: ['Local attractions', 'Cultural experiences', 'Comfortable accommodations'],
    tips: ['Research local customs', 'Book in advance', 'Stay flexible']
  };
}

function calculateDuration(tripData: any): number {
  if (tripData.dates?.from && tripData.dates?.to) {
    const start = new Date(tripData.dates.from);
    const end = new Date(tripData.dates.to);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  return 5; // Default
}

// Export for monitoring
export function getPerformanceStats() {
  return {
    cacheSize: miniCache.size,
    cachedDestinations: Array.from(miniCache.keys())
  };
}