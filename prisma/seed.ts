import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { seedTourOperatorDemoData } from '../scripts/seed-tour-operator-demo-data'

const prisma = new PrismaClient()

async function main() {

  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    },
  })


  // Create sample content for Peru and Brazil
  const destinations = [
    {
      type: 'destination',
      name: 'Lima, Peru',
      description: 'The capital city of Peru, known for its colonial architecture, world-class cuisine, and vibrant culture.',
      location: 'Lima, Peru',
      city: 'Lima',
      country: 'Peru',
      images: JSON.stringify(['/images/lima-peru.png']),
    },
    {
      type: 'destination',
      name: 'Cusco, Peru',
      description: 'Former capital of the Inca Empire, gateway to Machu Picchu, and a UNESCO World Heritage site.',
      location: 'Cusco, Peru',
      city: 'Cusco',
      country: 'Peru',
      images: JSON.stringify(['/images/cusco-peru.png']),
    },
    {
      type: 'destination',
      name: 'Rio de Janeiro, Brazil',
      description: 'Iconic beach city known for Christ the Redeemer, Copacabana Beach, and vibrant carnival celebrations.',
      location: 'Rio de Janeiro, Brazil',
      city: 'Rio de Janeiro',
      country: 'Brazil',
      images: JSON.stringify(['/images/rio-de-janeiro.png']),
    },
  ]

  for (const destination of destinations) {
    await prisma.content.create({ data: destination })
  }

  // Create sample activities
  const activities = [
    {
      type: 'activity',
      name: 'Machu Picchu Day Tour',
      description: 'Full day guided tour of the ancient Inca citadel, including train transportation from Cusco.',
      location: 'Machu Picchu, Peru',
      city: 'Cusco',
      country: 'Peru',
      price: 350,
      duration: 720, // 12 hours
      images: JSON.stringify(['/images/machu-picchu.png']),
      included: JSON.stringify(['Round-trip train tickets', 'Entrance fees', 'Professional guide', 'Lunch']),
      excluded: JSON.stringify(['Hotel pickup', 'Tips', 'Personal expenses']),
    },
    {
      type: 'activity',
      name: 'Sacred Valley Tour',
      description: 'Explore the heart of the Inca Empire with visits to Pisac, Ollantaytambo, and local markets.',
      location: 'Sacred Valley, Peru',
      city: 'Cusco',
      country: 'Peru',
      price: 85,
      duration: 480, // 8 hours
      images: JSON.stringify(['/images/sacred-valley.png']),
      included: JSON.stringify(['Transportation', 'Guide', 'Entrance fees']),
      excluded: JSON.stringify(['Lunch', 'Tips']),
    },
    {
      type: 'activity',
      name: 'Christ the Redeemer & Sugarloaf Tour',
      description: 'Visit Rio\'s most famous landmarks with breathtaking views of the city and beaches.',
      location: 'Rio de Janeiro, Brazil',
      city: 'Rio de Janeiro',
      country: 'Brazil',
      price: 120,
      duration: 360, // 6 hours
      images: JSON.stringify(['/images/rio-de-janeiro.png']),
      included: JSON.stringify(['Transportation', 'Entrance fees', 'Guide']),
      excluded: JSON.stringify(['Meals', 'Tips']),
    },
  ]

  for (const activity of activities) {
    await prisma.content.create({ data: activity })
  }

  // Create sample accommodations
  const accommodations = [
    {
      type: 'accommodation',
      name: 'Hotel Oro Verde Cusco',
      description: 'Comfortable 3-star hotel in the heart of Cusco, walking distance to main attractions.',
      location: 'Cusco, Peru',
      city: 'Cusco',
      country: 'Peru',
      price: 65,
      images: JSON.stringify([]),
      amenities: JSON.stringify(['Free WiFi', 'Breakfast included', '24-hour reception', 'Tour desk']),
    },
    {
      type: 'accommodation',
      name: 'Copacabana Palace',
      description: 'Iconic 5-star beachfront hotel on Copacabana Beach with luxury amenities.',
      location: 'Rio de Janeiro, Brazil',
      city: 'Rio de Janeiro',
      country: 'Brazil',
      price: 450,
      images: JSON.stringify([]),
      amenities: JSON.stringify(['Beach access', 'Pool', 'Spa', 'Multiple restaurants', 'Fitness center']),
    },
  ]

  for (const accommodation of accommodations) {
    await prisma.content.create({ data: accommodation })
  }


  // Create a sample trip for the test user
  const sampleTrip = await prisma.trip.create({
    data: {
      title: 'Peru & Brazil Adventure',
      destination: 'Peru and Brazil',
      startDate: new Date('2025-03-15'),
      endDate: new Date('2025-03-28'),
      budget: 4500,
      travelers: 2,
      userId: testUser.id,
      itinerary: JSON.stringify({
        days: [
          {
            day: 1,
            date: '2025-03-15',
            title: 'Arrival in Lima',
            activities: ['Airport transfer', 'Check-in to hotel', 'Welcome dinner'],
          },
          {
            day: 2,
            date: '2025-03-16',
            title: 'Lima City Tour',
            activities: ['Historic center tour', 'Larco Museum', 'Barranco district'],
          },
        ],
      }),
    },
  })


  // Seed tour operator demo data
  try {
    await seedTourOperatorDemoData()
  } catch (error) {
    console.error('Error seeding tour operator data:', error)
    // Continue even if tour operator seeding fails
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })