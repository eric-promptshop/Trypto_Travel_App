#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function seedTourOperatorDemoData() {
  console.log('🌱 Seeding tour operator demo data...')

  try {
    // First ensure demo tour operator exists
    let demoOperator = await prisma.user.findUnique({
      where: { email: 'demo-operator@example.com' }
    })

    if (!demoOperator) {
      console.log('Creating demo tour operator user...')
      demoOperator = await prisma.user.create({
        data: {
          email: 'demo-operator@example.com',
          name: 'Demo Tour Operator',
          role: 'TOUR_OPERATOR',
          tenantId: 'default'
        }
      })

      // Create credentials
      const hashedPassword = await bcrypt.hash('demo123', 10)
      await prisma.account.create({
        data: {
          userId: demoOperator.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: demoOperator.email,
          refresh_token: hashedPassword,
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null
        }
      })
    }

    // Create demo tour content for the operator
    const demoTours = [
      {
        tenantId: 'default',
        type: 'activity',
        name: 'Classic Italy Tour - Rome, Florence & Venice',
        description: '10-day guided tour through Italy\'s most iconic cities. Experience the Colosseum, Vatican City, Renaissance art in Florence, and romantic Venice canals.',
        location: 'Italy',
        city: 'Rome',
        country: 'Italy',
        price: 2499,
        currency: 'USD',
        duration: 10,
        active: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
          'https://images.unsplash.com/photo-1534445867742-43195f401b6c',
          'https://images.unsplash.com/photo-1514896856000-91cb6de818e0'
        ]),
        included: JSON.stringify([
          '9 nights accommodation in 4-star hotels',
          'Daily breakfast',
          'Professional English-speaking guide',
          'All entrance fees to monuments',
          'High-speed train between cities',
          'Airport transfers'
        ]),
        excluded: JSON.stringify([
          'International flights',
          'Lunches and dinners',
          'Personal expenses',
          'Travel insurance',
          'Tips and gratuities'
        ]),
        metadata: JSON.stringify({
          maxParticipants: 20,
          minParticipants: 8,
          difficulty: 'easy',
          groupType: 'mixed',
          languages: ['English', 'Spanish'],
          departurePoint: 'Rome Fiumicino Airport',
          arrivalPoint: 'Venice Marco Polo Airport',
          bookingDeadline: 30,
          cancellationPolicy: 'Free cancellation up to 30 days before departure'
        }),
        featured: true
      },
      {
        tenantId: 'default',
        type: 'activity',
        name: 'Japan Cultural Journey - Tokyo to Kyoto',
        description: '14-day immersive experience exploring Japan\'s ancient traditions and modern marvels. From bustling Tokyo to serene Kyoto temples.',
        location: 'Japan',
        city: 'Tokyo',
        country: 'Japan',
        price: 3799,
        currency: 'USD',
        duration: 14,
        active: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
          'https://images.unsplash.com/photo-1528360983277-13d401cdc186',
          'https://images.unsplash.com/photo-1545569341-9eb8b30979d9'
        ]),
        included: JSON.stringify([
          '13 nights accommodation (mix of hotels and ryokans)',
          'Daily breakfast and 4 traditional dinners',
          'JR Pass for unlimited train travel',
          'Expert bilingual guide',
          'All temple and shrine entrance fees',
          'Traditional tea ceremony experience',
          'Sumo wrestling tournament tickets (seasonal)'
        ]),
        excluded: JSON.stringify([
          'International flights',
          'Most lunches and dinners',
          'Personal expenses',
          'Travel insurance'
        ]),
        metadata: JSON.stringify({
          maxParticipants: 16,
          minParticipants: 6,
          difficulty: 'moderate',
          groupType: 'small group',
          languages: ['English'],
          departurePoint: 'Narita International Airport',
          arrivalPoint: 'Kansai International Airport',
          bookingDeadline: 45,
          cancellationPolicy: 'Free cancellation up to 45 days before departure',
          seasonalHighlights: {
            spring: 'Cherry blossoms',
            autumn: 'Fall foliage',
            winter: 'Snow monkeys'
          }
        }),
        featured: true
      },
      {
        tenantId: 'default',
        type: 'activity',
        name: 'Peru Adventure - Machu Picchu & Sacred Valley',
        description: '8-day adventure including the classic Inca Trail trek to Machu Picchu. Experience ancient ruins, local culture, and breathtaking landscapes.',
        location: 'Peru',
        city: 'Cusco',
        country: 'Peru',
        price: 1899,
        currency: 'USD',
        duration: 8,
        active: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1526392060635-9d6019884377',
          'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca',
          'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4'
        ]),
        included: JSON.stringify([
          '7 nights accommodation (hotels and camping)',
          'All meals during trek',
          'Professional trekking guide and porters',
          'Inca Trail permits',
          'Machu Picchu entrance',
          'Train ticket from Aguas Calientes',
          'Sacred Valley tour'
        ]),
        excluded: JSON.stringify([
          'International flights',
          'Sleeping bag (rental available)',
          'Walking poles (rental available)',
          'Travel insurance',
          'Tips for guides and porters'
        ]),
        metadata: JSON.stringify({
          maxParticipants: 12,
          minParticipants: 4,
          difficulty: 'challenging',
          groupType: 'adventure',
          languages: ['English', 'Spanish'],
          departurePoint: 'Cusco',
          arrivalPoint: 'Cusco',
          bookingDeadline: 60,
          cancellationPolicy: 'Non-refundable after permits are secured',
          fitnessLevel: 'Good physical condition required',
          altitude: 'Max 4,200m - acclimatization recommended'
        }),
        featured: false
      },
      {
        tenantId: 'default',
        type: 'activity',
        name: 'Egypt Nile Cruise & Pyramids',
        description: '12-day journey through ancient Egypt including 4-night Nile cruise, pyramids of Giza, Valley of the Kings, and Abu Simbel.',
        location: 'Egypt',
        city: 'Cairo',
        country: 'Egypt',
        price: 2299,
        currency: 'USD',
        duration: 12,
        active: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1539650116574-8efeb43e2750',
          'https://images.unsplash.com/photo-1553913861-c0fddf2619ee',
          'https://images.unsplash.com/photo-1572252009286-268acec5ca0a'
        ]),
        included: JSON.stringify([
          '11 nights accommodation (hotels and cruise ship)',
          'Full board on cruise, breakfast in hotels',
          'Egyptologist guide throughout',
          'All entrance fees',
          'Domestic flight to Abu Simbel',
          'Airport and cruise transfers',
          'Felucca sailing experience'
        ]),
        excluded: JSON.stringify([
          'International flights',
          'Egypt visa',
          'Drinks and personal expenses',
          'Optional hot air balloon ride',
          'Tips'
        ]),
        metadata: JSON.stringify({
          maxParticipants: 24,
          minParticipants: 10,
          difficulty: 'easy',
          groupType: 'cultural',
          languages: ['English', 'German', 'French'],
          departurePoint: 'Cairo International Airport',
          arrivalPoint: 'Cairo International Airport',
          bookingDeadline: 30,
          cancellationPolicy: 'Free cancellation up to 30 days before departure',
          bestTimeToVisit: 'October to April'
        }),
        featured: false
      },
      {
        tenantId: 'default',
        type: 'activity',
        name: 'Iceland Ring Road Adventure',
        description: '10-day self-drive tour around Iceland\'s Ring Road. Witness waterfalls, glaciers, black sand beaches, and the chance to see Northern Lights.',
        location: 'Iceland',
        city: 'Reykjavik',
        country: 'Iceland',
        price: 2799,
        currency: 'USD',
        duration: 10,
        active: false, // Draft tour
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1504829857797-ddff29c27927',
          'https://images.unsplash.com/photo-1490650404312-a2175773bbf5',
          'https://images.unsplash.com/photo-1522071901873-411886a10004'
        ]),
        included: JSON.stringify([
          '9 nights accommodation in hotels/guesthouses',
          'Rental 4x4 vehicle with insurance',
          'Daily breakfast',
          'Detailed itinerary and maps',
          'Glacier hike with guide',
          'Blue Lagoon entrance',
          '24/7 local support'
        ]),
        excluded: JSON.stringify([
          'International flights',
          'Fuel for vehicle',
          'Lunches and dinners',
          'Optional activities',
          'Personal expenses'
        ]),
        metadata: JSON.stringify({
          maxParticipants: 4,
          minParticipants: 2,
          difficulty: 'moderate',
          groupType: 'self-drive',
          languages: ['English'],
          departurePoint: 'Keflavik International Airport',
          arrivalPoint: 'Keflavik International Airport',
          bookingDeadline: 45,
          cancellationPolicy: 'Variable based on components',
          drivingDistance: '1,332 km total',
          vehicleType: 'Toyota RAV4 or similar'
        }),
        featured: false
      }
    ]

    // Delete existing demo tours to avoid duplicates
    await prisma.content.deleteMany({
      where: {
        tenantId: 'default',
        type: 'activity',
        name: {
          in: demoTours.map(t => t.name)
        }
      }
    })

    // Create the demo tours
    for (const tour of demoTours) {
      await prisma.content.create({ data: tour })
    }

    console.log(`✅ Created ${demoTours.length} demo tours`)

    // Create some demo leads for the tour operator
    const demoLeads = [
      {
        email: 'sarah.johnson@example.com',
        name: 'Sarah Johnson',
        phone: '+1-555-0123',
        destination: 'Italy',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        travelers: 2,
        budgetMin: 4000,
        budgetMax: 6000,
        interests: JSON.stringify(['history', 'art', 'food', 'wine']),
        tripData: JSON.stringify({
          preferredAccommodation: '4-star hotels',
          dietaryRestrictions: 'Vegetarian',
          specialRequests: 'Interested in cooking class in Florence'
        }),
        score: 85,
        status: 'new',
        tenantId: 'default'
      },
      {
        email: 'michael.chen@example.com',
        name: 'Michael Chen',
        phone: '+1-555-0456',
        destination: 'Japan',
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        endDate: new Date(Date.now() + 74 * 24 * 60 * 60 * 1000), // 74 days from now
        travelers: 4,
        budgetMin: 12000,
        budgetMax: 16000,
        interests: JSON.stringify(['culture', 'temples', 'technology', 'cuisine']),
        tripData: JSON.stringify({
          preferredAccommodation: 'Mix of hotels and ryokans',
          groupComposition: '2 adults, 2 teenagers',
          specialInterests: 'Anime/manga culture, traditional crafts'
        }),
        score: 92,
        status: 'contacted',
        tenantId: 'default'
      },
      {
        email: 'emma.wilson@example.com',
        name: 'Emma Wilson',
        phone: '+44-20-5555-0789',
        destination: 'Peru',
        startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        endDate: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000), // 98 days from now
        travelers: 6,
        budgetMin: 10000,
        budgetMax: 12000,
        interests: JSON.stringify(['adventure', 'hiking', 'culture', 'photography']),
        tripData: JSON.stringify({
          fitnessLevel: 'Very active group',
          previousTrekking: 'Yes - Nepal and Patagonia',
          specialRequests: 'Professional photography guide for one day'
        }),
        score: 88,
        status: 'qualified',
        tenantId: 'default'
      },
      {
        email: 'david.martinez@example.com',
        name: 'David Martinez',
        phone: '+1-555-0321',
        destination: 'Egypt',
        startDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        endDate: new Date(Date.now() + 132 * 24 * 60 * 60 * 1000), // 132 days from now
        travelers: 2,
        budgetMin: 4000,
        budgetMax: 5500,
        interests: JSON.stringify(['history', 'archaeology', 'desert', 'cruise']),
        tripData: JSON.stringify({
          preferredCabinType: 'Balcony suite on Nile cruise',
          mobilityIssues: 'None',
          specialInterests: 'Hieroglyphics workshop'
        }),
        score: 78,
        status: 'proposal_sent',
        tenantId: 'default'
      },
      {
        email: 'lisa.anderson@example.com',
        name: 'Lisa Anderson',
        phone: '+1-555-0654',
        destination: 'Iceland',
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        endDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000), // 55 days from now
        travelers: 2,
        budgetMin: 5000,
        budgetMax: 7000,
        interests: JSON.stringify(['nature', 'photography', 'northern lights', 'hot springs']),
        tripData: JSON.stringify({
          drivingExperience: 'Comfortable with winter driving',
          photographyLevel: 'Advanced - bringing professional equipment',
          accommodation: 'Prefer unique stays - glass igloos if possible'
        }),
        score: 95,
        status: 'won',
        tenantId: 'default'
      }
    ]

    // Delete existing demo leads
    await prisma.lead.deleteMany({
      where: {
        email: {
          in: demoLeads.map(lead => lead.email)
        }
      }
    })

    // Create the demo leads
    for (const lead of demoLeads) {
      await prisma.lead.create({ data: lead })
    }

    console.log(`✅ Created ${demoLeads.length} demo leads`)

    // Summary of created data
    const [tourCount, leadCount] = await Promise.all([
      prisma.content.count({
        where: {
          tenantId: 'default',
          type: 'activity'
        }
      }),
      prisma.lead.count({
        where: {
          tenantId: 'default'
        }
      })
    ])

    console.log('\n🎉 Tour operator demo data seeding completed!')
    console.log(`\nDemo account: demo-operator@example.com / demo123`)
    console.log(`Created ${tourCount} tours (${demoTours.filter(t => t.active).length} active, ${demoTours.filter(t => !t.active).length} draft)`)
    console.log(`Created ${leadCount} leads with various statuses`)
    console.log('\nYou can now log in as the tour operator to see:')
    console.log('- Dashboard with statistics')
    console.log('- Tours management')
    console.log('- Customer leads')
    console.log('- Analytics (placeholder data)')

  } catch (error) {
    console.error('❌ Error seeding tour operator demo data:', error)
    throw error
  }
}

async function main() {
  try {
    await seedTourOperatorDemoData()
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
main()

export { seedTourOperatorDemoData }