import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    })

    if (existingUser) {
      console.log('Demo user already exists')
      
      // Check if demo user has any trips
      const existingTrips = await prisma.trip.count({
        where: { userId: existingUser.id }
      })
      
      if (existingTrips === 0) {
        // Create a sample trip for the existing demo user
        const sampleTrip = await prisma.trip.create({
          data: {
            userId: existingUser.id,
            title: 'Amazing Peru Adventure',
            destination: 'Peru',
            startDate: new Date('2024-06-15'),
            endDate: new Date('2024-06-25'),
            budget: 3500,
            travelers: 2,
            itinerary: JSON.stringify({
              days: [
                {
                  day: 1,
                  location: 'Lima',
                  activities: ['Arrive in Lima', 'Explore Miraflores district', 'Visit Barranco neighborhood']
                },
                {
                  day: 2,
                  location: 'Cusco',
                  activities: ['Fly to Cusco', 'Acclimatization day', 'Explore San Pedro Market']
                },
                {
                  day: 3,
                  location: 'Sacred Valley',
                  activities: ['Visit Pisac ruins', 'Ollantaytambo fortress', 'Stay in Aguas Calientes']
                }
              ]
            })
          }
        })
        
        console.log('Sample trip created for existing user:', sampleTrip)
      }
      
      return
    }

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'user',
        isActive: true,
      }
    })

    console.log('Demo user created successfully:', demoUser)

    // Create a sample trip for the demo user
    const sampleTrip = await prisma.trip.create({
      data: {
        userId: demoUser.id,
        title: 'Amazing Peru Adventure',
        destination: 'Peru',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-25'),
        budget: 3500,
        travelers: 2,
        itinerary: JSON.stringify({
          days: [
            {
              day: 1,
              location: 'Lima',
              activities: ['Arrive in Lima', 'Explore Miraflores district', 'Visit Barranco neighborhood']
            },
            {
              day: 2,
              location: 'Cusco',
              activities: ['Fly to Cusco', 'Acclimatization day', 'Explore San Pedro Market']
            },
            {
              day: 3,
              location: 'Sacred Valley',
              activities: ['Visit Pisac ruins', 'Ollantaytambo fortress', 'Stay in Aguas Calientes']
            }
          ]
        })
      }
    })

    console.log('Sample trip created:', sampleTrip)

  } catch (error) {
    console.error('Error seeding demo user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })