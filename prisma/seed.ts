import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Travel Agency',
      slug: 'demo',
      description: 'Demo tenant for testing multi-tenant functionality',
      domain: 'demo.travel-crm.local',
      isActive: true,
      settings: {
        branding: {
          primaryColor: '#3B82F6',
          logo: '/logos/demo-logo.png'
        }
      }
    }
  })

  console.log('✅ Demo tenant created:', demoTenant.name)

  // Create global settings
  await prisma.globalSettings.upsert({
    where: { settingKey: 'DEFAULT_CURRENCY' },
    update: {},
    create: {
      settingKey: 'DEFAULT_CURRENCY',
      settingValue: 'USD',
      description: 'Default currency for new trips'
    }
  })

  console.log('✅ Global settings created')

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.travel-crm.local' },
    update: {},
    create: {
      email: 'admin@demo.travel-crm.local',
      name: 'Demo Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      tenantId: demoTenant.id
    }
  })

  const travelerUser = await prisma.user.upsert({
    where: { email: 'traveler@demo.travel-crm.local' },
    update: {},
    create: {
      email: 'traveler@demo.travel-crm.local',
      name: 'Demo Traveler',
      passwordHash: hashedPassword,
      role: 'USER',
      isActive: true,
      tenantId: demoTenant.id
    }
  })

  console.log('✅ Demo users created')

  // Create tenant-specific settings
  await prisma.tenantSettings.upsert({
    where: {
      tenantId_settingKey: {
        tenantId: demoTenant.id,
        settingKey: 'PRIMARY_COLOR'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      settingKey: 'PRIMARY_COLOR',
      settingValue: '#3B82F6',
      overridesGlobal: false
    }
  })

  console.log('✅ Tenant settings created')

  // Create trip template (no unique constraint, so use create instead of upsert)
  await prisma.tripTemplate.create({
    data: {
      title: '3-Day Paris Getaway',
      description: 'A romantic 3-day trip to Paris with classic attractions',
      category: 'Romantic',
      duration: 3,
      estimatedCost: 1200.00,
      currency: 'EUR',
      tenantId: demoTenant.id,
      activities: {
        'day1': [
          { time: '09:00', activity: 'Visit Eiffel Tower', duration: '2 hours' }
        ]
      }
    }
  })

  console.log('✅ Trip templates created')

  // Create demo trip
  const demoTrip = await prisma.trip.create({
    data: {
      title: 'Summer Vacation in Barcelona',
      description: 'A week-long exploration of Barcelona\'s culture, food, and architecture',
      startDate: new Date('2024-07-15T00:00:00Z'),
      endDate: new Date('2024-07-22T00:00:00Z'),
      location: 'Barcelona, Spain',
      budget: 1500.00,
      currency: 'EUR',
      status: 'PLANNED',
      isPublic: false,
      userId: travelerUser.id,
      metadata: {
        travelers: 2,
        tripType: 'leisure'
      }
    }
  })

  console.log('✅ Demo trip created')

  // Create demo activities
  await prisma.activity.create({
    data: {
      title: 'Visit Sagrada Familia',
      description: 'Guided tour of Gaudí\'s masterpiece basilica',
      date: new Date('2024-07-16T10:00:00Z'),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Sagrada Familia, Barcelona',
      cost: 45.00,
      currency: 'EUR',
      category: 'ATTRACTION',
      isBooked: true,
      bookingRef: 'SF240716001',
      tripId: demoTrip.id
    }
  })

  await prisma.activity.create({
    data: {
      title: 'Beach Day at Barceloneta',
      description: 'Relax at Barcelona\'s most famous beach',
      date: new Date('2024-07-19T14:00:00Z'),
      startTime: '14:00',
      endTime: '18:00',
      location: 'Barceloneta Beach, Barcelona',
      cost: 0.00,
      currency: 'EUR',
      category: 'GENERAL',
      isBooked: false,
      tripId: demoTrip.id,
      notes: 'Bring sunscreen and towels'
    }
  })

  console.log('✅ Demo activities created')

  // Create trip participants
  await prisma.tripParticipant.upsert({
    where: {
      tripId_email: {
        tripId: demoTrip.id,
        email: travelerUser.email
      }
    },
    update: {},
    create: {
      tripId: demoTrip.id,
      email: travelerUser.email,
      name: travelerUser.name,
      role: 'ORGANIZER',
      isConfirmed: true,
      confirmedAt: new Date()
    }
  })

  console.log('✅ Trip participants added')

  // Create demo integration (use correct field names)
  await prisma.integration.create({
    data: {
      provider: 'HUBSPOT',
      name: 'Demo HubSpot Integration',
      tenantId: demoTenant.id,
      isActive: true,
      configuration: {
        syncContacts: true,
        syncDeals: true
      },
      credentials: {
        apiKey: 'demo-api-key-encrypted',
        hubId: '12345678'
      }
    }
  })

  console.log('✅ Demo integration created')

  // Create audit log entry (use correct field names)
  await prisma.auditLog.create({
    data: {
      tenantId: demoTenant.id,
      userId: travelerUser.id,
      action: 'CREATE',
      resource: 'trips',
      resourceId: demoTrip.id,
      newValues: {
        title: demoTrip.title,
        status: demoTrip.status,
        budget: demoTrip.budget
      }
    }
  })

  console.log('✅ Audit log entry created')

  console.log('')
  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   • Tenant: ${demoTenant.name} (${demoTenant.domain})`)
  console.log(`   • Users: 2 (1 admin, 1 traveler)`)
  console.log(`   • Trip: 1 with 2 activities`)
  console.log(`   • Template: 1 trip template`)
  console.log(`   • Integration: 1 HubSpot demo integration`)
  console.log('')
  console.log('🔐 Demo login credentials:')
  console.log('   • admin@demo.travel-crm.local : demo123')
  console.log('   • traveler@demo.travel-crm.local : demo123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 