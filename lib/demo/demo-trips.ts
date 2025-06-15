import { Trip } from '@/hooks/use-trips'

export const demoTravelerTrips: Trip[] = [
  {
    id: 'demo-trip-1',
    title: 'Italian Adventure',
    description: 'A wonderful journey through Rome, Florence, and Venice',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days from now
    location: 'Italy',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'demo-traveler-001',
    travelers: 2,
    totalPrice: 4500,
    currency: 'USD'
  },
  {
    id: 'demo-trip-2',
    title: 'Japan Cultural Experience',
    description: 'Exploring Tokyo, Kyoto, and Osaka',
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    endDate: new Date(Date.now() + 74 * 24 * 60 * 60 * 1000).toISOString(), // 74 days from now
    location: 'Japan',
    status: 'draft',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'demo-traveler-001',
    travelers: 4,
    totalPrice: 8000,
    currency: 'USD'
  },
  {
    id: 'demo-trip-3',
    title: 'Peru & Machu Picchu Trek',
    description: 'Adventure through the Sacred Valley and ancient ruins',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    endDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
    location: 'Peru',
    status: 'completed',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'demo-traveler-001',
    travelers: 3,
    totalPrice: 3200,
    currency: 'USD'
  },
  {
    id: 'demo-trip-4',
    title: 'Iceland Northern Lights',
    description: 'Chasing auroras and exploring glaciers',
    startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString(), // 97 days from now
    location: 'Iceland',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'demo-traveler-001',
    travelers: 2,
    totalPrice: 5500,
    currency: 'USD'
  }
]

export const demoOperatorTours = [
  {
    id: 'demo-tour-1',
    name: 'Classic Italy Tour',
    description: '10-day guided tour through Rome, Florence, and Venice',
    duration: 10,
    maxParticipants: 20,
    price: 2200,
    currency: 'USD',
    destinations: ['Rome', 'Florence', 'Venice'],
    status: 'active',
    bookings: 15,
    availability: 5
  },
  {
    id: 'demo-tour-2',
    name: 'Japan Cultural Journey',
    description: '14-day immersive experience in Japanese culture',
    duration: 14,
    maxParticipants: 16,
    price: 3500,
    currency: 'USD',
    destinations: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima'],
    status: 'active',
    bookings: 12,
    availability: 4
  },
  {
    id: 'demo-tour-3',
    name: 'Peru Adventure Trek',
    description: '8-day Inca Trail and Machu Picchu expedition',
    duration: 8,
    maxParticipants: 12,
    price: 1800,
    currency: 'USD',
    destinations: ['Cusco', 'Sacred Valley', 'Machu Picchu'],
    status: 'active',
    bookings: 10,
    availability: 2
  },
  {
    id: 'demo-tour-4',
    name: 'Iceland Winter Wonders',
    description: '7-day Northern Lights and glacier exploration',
    duration: 7,
    maxParticipants: 15,
    price: 2800,
    currency: 'USD',
    destinations: ['Reykjavik', 'Golden Circle', 'South Coast'],
    status: 'draft',
    bookings: 0,
    availability: 15
  }
]