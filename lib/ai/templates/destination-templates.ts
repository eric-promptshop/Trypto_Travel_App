// Pre-generated destination templates for instant loading
// These templates are customized by AI based on user preferences

export interface ItineraryTemplate {
  destination: string;
  aliases: string[]; // Alternative names/spellings
  duration: number;
  popularInterests: string[];
  template: {
    days: any[];
    tourOperatorOffers: any[];
    highlights: string[];
    tips: string[];
  };
}

// Lima, Peru template with Peru For Less tours
export const limaPeruTemplate: ItineraryTemplate = {
  destination: "Lima, Peru",
  aliases: ["lima", "lima peru", "peru lima", "lima, peru", "lima,peru"],
  duration: 5,
  popularInterests: ["culture", "food", "history", "adventure"],
  template: {
    days: [
      {
        day: 1,
        title: "Arrival & Historic Center Exploration",
        description: "Discover Lima's colonial heart and culinary scene",
        activities: [
          {
            id: "lima_d1_a1",
            time: "09:00",
            title: "Lima City Tour - Historic Center",
            description: "Explore Plaza Mayor, Cathedral, and Government Palace with expert guide",
            duration: "4 hours",
            location: "Historic Center, Lima",
            price: 65,
            type: "tour",
            provider: "Peru For Less",
            tourOperatorId: "peruforless_lima_city",
            isRecommendedTour: true,
            bookingUrl: "https://www.peruforless.com/packages/lima-city-tour"
          },
          {
            id: "lima_d1_a2",
            time: "14:00",
            title: "Lunch at Central Restaurant",
            description: "Experience world-renowned Peruvian cuisine",
            duration: "2 hours",
            location: "Barranco, Lima",
            price: 150,
            type: "dining"
          },
          {
            id: "lima_d1_a3",
            time: "17:00",
            title: "Barranco Art District Walk",
            description: "Stroll through bohemian streets and colorful murals",
            duration: "2 hours",
            location: "Barranco, Lima",
            price: 0,
            type: "culture"
          }
        ],
        accommodation: {
          name: "Miraflores Park Hotel",
          type: "hotel",
          price: 180,
          location: "Miraflores, Lima"
        },
        meals: [
          { type: "breakfast", venue: "Hotel Restaurant", cuisine: "Continental", price: 0 },
          { type: "lunch", venue: "Central Restaurant", cuisine: "Peruvian Fine Dining", price: 150 },
          { type: "dinner", venue: "La Mar Cebichería", cuisine: "Seafood", price: 45 }
        ],
        totalCost: 440
      },
      {
        day: 2,
        title: "Pre-Columbian History & Culinary Experience",
        description: "Ancient civilizations and modern gastronomy",
        activities: [
          {
            id: "lima_d2_a1",
            time: "09:00",
            title: "Larco Museum Tour",
            description: "Discover Peru's pre-Columbian history with gold and ceramics collection",
            duration: "3 hours",
            location: "Pueblo Libre, Lima",
            price: 45,
            type: "culture",
            provider: "Peru For Less",
            tourOperatorId: "peruforless_larco",
            isRecommendedTour: true
          },
          {
            id: "lima_d2_a2",
            time: "14:00",
            title: "Lima Gourmet Food Tour",
            description: "Market visit, ceviche making, and pisco sour tasting",
            duration: "4 hours",
            location: "Miraflores, Lima",
            price: 89,
            type: "tour",
            provider: "Peru For Less",
            tourOperatorId: "peruforless_food_tour",
            isRecommendedTour: true,
            bookingUrl: "https://www.peruforless.com/packages/lima-food-tour"
          },
          {
            id: "lima_d2_a3",
            time: "20:00",
            title: "Magic Water Circuit",
            description: "Spectacular fountain show with lights and music",
            duration: "1.5 hours",
            location: "Parque de la Reserva, Lima",
            price: 15,
            type: "entertainment"
          }
        ],
        accommodation: {
          name: "Miraflores Park Hotel",
          type: "hotel",
          price: 180,
          location: "Miraflores, Lima"
        },
        meals: [
          { type: "breakfast", venue: "Hotel Restaurant", cuisine: "Continental", price: 0 },
          { type: "lunch", venue: "During Food Tour", cuisine: "Peruvian", price: 0 },
          { type: "dinner", venue: "Maido", cuisine: "Nikkei", price: 120 }
        ],
        totalCost: 449
      },
      {
        day: 3,
        title: "Pachacamac Ruins & Coastal Adventure",
        description: "Ancient temple complex and Pacific coast exploration",
        activities: [
          {
            id: "lima_d3_a1",
            time: "08:00",
            title: "Pachacamac Archaeological Site Tour",
            description: "Visit pre-Inca temple complex with ocean views",
            duration: "4 hours",
            location: "Pachacamac, South Lima",
            price: 75,
            type: "tour",
            provider: "Peru For Less",
            tourOperatorId: "peruforless_pachacamac",
            isRecommendedTour: true,
            bookingUrl: "https://www.peruforless.com/packages/pachacamac-tour"
          },
          {
            id: "lima_d3_a2",
            time: "13:00",
            title: "Lunch in Barranco",
            description: "Traditional Peruvian lunch with ocean view",
            duration: "1.5 hours",
            location: "Barranco, Lima",
            price: 35,
            type: "dining"
          },
          {
            id: "lima_d3_a3",
            time: "15:30",
            title: "Paragliding over Costa Verde",
            description: "Soar above Lima's coastline (weather permitting)",
            duration: "1 hour",
            location: "Miraflores Cliffs",
            price: 120,
            type: "adventure"
          }
        ],
        accommodation: {
          name: "Miraflores Park Hotel",
          type: "hotel",
          price: 180,
          location: "Miraflores, Lima"
        },
        meals: [
          { type: "breakfast", venue: "Hotel Restaurant", cuisine: "Continental", price: 0 },
          { type: "lunch", venue: "Cala Restaurant", cuisine: "Seafood", price: 35 },
          { type: "dinner", venue: "Astrid y Gastón", cuisine: "Contemporary Peruvian", price: 95 }
        ],
        totalCost: 510
      },
      {
        day: 4,
        title: "Lima Markets & Cooking Class",
        description: "Immerse in local culture through food",
        activities: [
          {
            id: "lima_d4_a1",
            time: "08:00",
            title: "Surquillo Market Tour",
            description: "Explore local market with exotic fruits and ingredients",
            duration: "2 hours",
            location: "Surquillo, Lima",
            price: 25,
            type: "culture"
          },
          {
            id: "lima_d4_a2",
            time: "10:30",
            title: "Peruvian Cooking Class",
            description: "Learn to make ceviche, lomo saltado, and pisco sour",
            duration: "4 hours",
            location: "Miraflores, Lima",
            price: 95,
            type: "experience",
            provider: "Peru For Less",
            tourOperatorId: "peruforless_cooking",
            isRecommendedTour: true,
            bookingUrl: "https://www.peruforless.com/packages/cooking-class"
          },
          {
            id: "lima_d4_a3",
            time: "16:00",
            title: "Huaca Pucllana Twilight Tour",
            description: "Pre-Inca pyramid in the heart of Miraflores",
            duration: "1.5 hours",
            location: "Miraflores, Lima",
            price: 20,
            type: "culture"
          }
        ],
        accommodation: {
          name: "Miraflores Park Hotel",
          type: "hotel",
          price: 180,
          location: "Miraflores, Lima"
        },
        meals: [
          { type: "breakfast", venue: "Hotel Restaurant", cuisine: "Continental", price: 0 },
          { type: "lunch", venue: "During Cooking Class", cuisine: "Peruvian", price: 0 },
          { type: "dinner", venue: "Rafael", cuisine: "Contemporary", price: 85 }
        ],
        totalCost: 405
      },
      {
        day: 5,
        title: "Departure Day - Last Minute Shopping",
        description: "Final souvenirs and airport transfer",
        activities: [
          {
            id: "lima_d5_a1",
            time: "09:00",
            title: "Indian Market Shopping",
            description: "Find alpaca wool products, handicrafts, and souvenirs",
            duration: "2 hours",
            location: "Miraflores, Lima",
            price: 0,
            type: "shopping"
          },
          {
            id: "lima_d5_a2",
            time: "12:00",
            title: "Farewell Lunch",
            description: "Final taste of Lima's cuisine",
            duration: "1.5 hours",
            location: "Miraflores, Lima",
            price: 40,
            type: "dining"
          },
          {
            id: "lima_d5_a3",
            time: "15:00",
            title: "Airport Transfer",
            description: "Private transfer to Jorge Chávez International Airport",
            duration: "45 minutes",
            location: "Lima Airport",
            price: 35,
            type: "transport",
            provider: "Peru For Less",
            tourOperatorId: "peruforless_transfer"
          }
        ],
        accommodation: null,
        meals: [
          { type: "breakfast", venue: "Hotel Restaurant", cuisine: "Continental", price: 0 },
          { type: "lunch", venue: "La Lucha", cuisine: "Sandwiches", price: 40 }
        ],
        totalCost: 75
      }
    ],
    tourOperatorOffers: [
      {
        id: "peruforless_lima_highlights",
        operatorName: "Peru For Less",
        tourTitle: "Lima Highlights Package - 5 Days",
        description: "Complete Lima experience including city tours, food experiences, and Pachacamac",
        duration: 120, // 5 days in hours
        price: 580,
        currency: "USD",
        location: "Lima, Peru",
        included: ["All tours mentioned", "Professional guides", "Transportation", "Entrance fees"],
        excluded: ["Accommodation", "Most meals", "Tips"],
        highlights: ["UNESCO Historic Center", "Larco Museum", "Food Tour", "Pachacamac"],
        availability: ["Daily departures"],
        bookingUrl: "https://www.peruforless.com/packages/lima-highlights"
      },
      {
        id: "peruforless_gastronomy",
        operatorName: "Peru For Less",
        tourTitle: "Lima Gastronomy Experience",
        description: "Culinary journey through Lima's world-famous food scene",
        duration: 8,
        price: 189,
        currency: "USD",
        location: "Lima, Peru",
        included: ["Market visit", "Cooking class", "Food tasting", "Pisco sour lesson"],
        excluded: ["Tips", "Additional drinks"],
        highlights: ["Central Market", "Ceviche making", "10+ tastings"],
        availability: ["Tuesday-Sunday"]
      },
      {
        id: "peruforless_day_tours",
        operatorName: "Peru For Less",
        tourTitle: "Lima Day Tour Collection",
        description: "Choose from various half-day and full-day tours",
        duration: 4,
        price: 65,
        currency: "USD",
        location: "Lima, Peru",
        included: ["Guide", "Transportation", "Entrance fees"],
        excluded: ["Meals", "Tips"],
        highlights: ["Flexible scheduling", "Small groups", "Local guides"],
        availability: ["Daily"]
      }
    ],
    highlights: [
      "UNESCO World Heritage Historic Center",
      "World's top culinary destination",
      "Pre-Columbian art at Larco Museum",
      "Bohemian Barranco district",
      "Pacific Ocean paragliding"
    ],
    tips: [
      "Lima weather is mild year-round but bring layers for fog",
      "Book restaurant reservations in advance (Central, Maido)",
      "Airport is 45-60 minutes from Miraflores in traffic",
      "Use registered taxis or Uber for safety",
      "Try ceviche for lunch when fish is freshest"
    ]
  }
};

import { popularTemplates } from './popular-destinations';

// Template collection
export const destinationTemplates: ItineraryTemplate[] = [
  limaPeruTemplate,
  ...popularTemplates
];

// Quick template matcher
export function findTemplate(destination: string): ItineraryTemplate | null {
  const normalized = destination.toLowerCase().trim();
  
  return destinationTemplates.find(template => 
    template.destination.toLowerCase() === normalized ||
    template.aliases.some(alias => alias.toLowerCase() === normalized)
  ) || null;
}