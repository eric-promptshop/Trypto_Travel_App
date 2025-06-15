import { ItineraryTemplate } from './destination-templates';

// Paris, France - 4 day template
export const parisFranceTemplate: ItineraryTemplate = {
  destination: "Paris, France",
  aliases: ["paris", "paris france", "france paris", "paris, france"],
  duration: 4,
  popularInterests: ["culture", "art", "food", "romance", "history"],
  template: {
    days: [
      {
        day: 1,
        title: "Iconic Paris Landmarks",
        description: "Eiffel Tower and Champs-Élysées",
        activities: [
          {
            id: "paris_d1_a1",
            time: "09:00",
            title: "Eiffel Tower Visit",
            description: "Skip-the-line access to all levels",
            duration: "3 hours",
            location: "Eiffel Tower",
            price: 85,
            type: "sightseeing"
          },
          {
            id: "paris_d1_a2",
            time: "14:00",
            title: "Arc de Triomphe & Champs-Élysées",
            description: "Walk the famous avenue and climb the Arc",
            duration: "3 hours",
            location: "Champs-Élysées",
            price: 25,
            type: "sightseeing"
          },
          {
            id: "paris_d1_a3",
            time: "19:00",
            title: "Seine River Dinner Cruise",
            description: "Gourmet meal with Paris illuminations",
            duration: "2.5 hours",
            location: "Seine River",
            price: 120,
            type: "dining"
          }
        ],
        accommodation: {
          name: "Hotel des Grands Boulevards",
          type: "hotel",
          price: 200,
          location: "Central Paris"
        },
        meals: [
          { type: "breakfast", venue: "Café de Flore", cuisine: "French", price: 25 },
          { type: "lunch", venue: "Bistro near Eiffel", cuisine: "French", price: 35 },
          { type: "dinner", venue: "Seine Cruise", cuisine: "French Fine Dining", price: 120 }
        ],
        totalCost: 410
      }
    ],
    tourOperatorOffers: [],
    highlights: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Montmartre", "Versailles"],
    tips: ["Book skip-the-line tickets", "Learn basic French phrases", "Validate metro tickets"]
  }
};

// Tokyo, Japan - 5 day template
export const tokyoJapanTemplate: ItineraryTemplate = {
  destination: "Tokyo, Japan",
  aliases: ["tokyo", "tokyo japan", "japan tokyo", "tokyo, japan"],
  duration: 5,
  popularInterests: ["culture", "technology", "food", "anime", "tradition"],
  template: {
    days: [
      {
        day: 1,
        title: "Modern Tokyo",
        description: "Shibuya, Harajuku, and Shinjuku",
        activities: [
          {
            id: "tokyo_d1_a1",
            time: "09:00",
            title: "Shibuya Crossing & Hachiko",
            description: "World's busiest crossing",
            duration: "2 hours",
            location: "Shibuya",
            price: 0,
            type: "sightseeing"
          },
          {
            id: "tokyo_d1_a2",
            time: "11:30",
            title: "Harajuku & Takeshita Street",
            description: "Youth culture and shopping",
            duration: "3 hours",
            location: "Harajuku",
            price: 0,
            type: "culture"
          },
          {
            id: "tokyo_d1_a3",
            time: "18:00",
            title: "Robot Restaurant Show",
            description: "Only in Tokyo experience",
            duration: "2 hours",
            location: "Shinjuku",
            price: 90,
            type: "entertainment"
          }
        ],
        accommodation: {
          name: "Shinjuku Granbell Hotel",
          type: "hotel",
          price: 150,
          location: "Shinjuku"
        },
        meals: [
          { type: "breakfast", venue: "Hotel", cuisine: "Continental", price: 0 },
          { type: "lunch", venue: "Ramen Street", cuisine: "Ramen", price: 15 },
          { type: "dinner", venue: "Izakaya", cuisine: "Japanese", price: 40 }
        ],
        totalCost: 295
      }
    ],
    tourOperatorOffers: [],
    highlights: ["Senso-ji Temple", "Tokyo Skytree", "Tsukiji Market", "Mount Fuji day trip"],
    tips: ["Get a JR Pass", "Download translation app", "Cash is king", "Remove shoes indoors"]
  }
};

// Rome, Italy - 3 day template
export const romeItalyTemplate: ItineraryTemplate = {
  destination: "Rome, Italy",
  aliases: ["rome", "rome italy", "italy rome", "roma", "rome, italy"],
  duration: 3,
  popularInterests: ["history", "art", "food", "architecture", "religion"],
  template: {
    days: [
      {
        day: 1,
        title: "Ancient Rome",
        description: "Colosseum, Forum, and Palatine",
        activities: [
          {
            id: "rome_d1_a1",
            time: "08:30",
            title: "Colosseum Skip-the-Line Tour",
            description: "Gladiator entrance and arena floor",
            duration: "3 hours",
            location: "Colosseum",
            price: 65,
            type: "history"
          },
          {
            id: "rome_d1_a2",
            time: "12:00",
            title: "Roman Forum & Palatine Hill",
            description: "Heart of ancient Rome",
            duration: "3 hours",
            location: "Roman Forum",
            price: 30,
            type: "history"
          },
          {
            id: "rome_d1_a3",
            time: "17:00",
            title: "Sunset at Capitoline Hill",
            description: "Views over the Forum",
            duration: "1.5 hours",
            location: "Capitoline Hill",
            price: 0,
            type: "sightseeing"
          }
        ],
        accommodation: {
          name: "Hotel de Russie",
          type: "hotel",
          price: 250,
          location: "Central Rome"
        },
        meals: [
          { type: "breakfast", venue: "Local Café", cuisine: "Italian", price: 15 },
          { type: "lunch", venue: "Trattoria", cuisine: "Roman", price: 30 },
          { type: "dinner", venue: "Trastevere", cuisine: "Italian", price: 45 }
        ],
        totalCost: 435
      }
    ],
    tourOperatorOffers: [],
    highlights: ["Vatican City", "Sistine Chapel", "Trevi Fountain", "Pantheon", "Spanish Steps"],
    tips: ["Book Vatican early", "Avoid August heat", "Validate bus tickets", "Dress modestly for churches"]
  }
};

// Export all templates
export const popularTemplates = [
  parisFranceTemplate,
  tokyoJapanTemplate,
  romeItalyTemplate
];