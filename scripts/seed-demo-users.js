const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo users...')

  try {
    // Check if demo traveler exists
    const existingTraveler = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    })

    if (!existingTraveler) {
      // Create demo traveler user
      const demoTraveler = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo Traveler',
          role: 'USER',
          tenantId: 'default'
        }
      })

      // Create credentials for demo traveler
      const hashedPassword = await bcrypt.hash('demo123', 10)
      await prisma.account.create({
        data: {
          userId: demoTraveler.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: demoTraveler.email,
          refresh_token: hashedPassword, // Temporary solution
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null
        }
      })

      console.log('✅ Created demo traveler user: demo@example.com')
    } else {
      console.log('ℹ️  Demo traveler already exists')
    }

    // Check if demo tour operator exists
    const existingOperator = await prisma.user.findUnique({
      where: { email: 'demo-operator@example.com' }
    })

    if (!existingOperator) {
      // Create demo tour operator user
      const demoOperator = await prisma.user.create({
        data: {
          email: 'demo-operator@example.com',
          name: 'Demo Tour Operator',
          role: 'TOUR_OPERATOR',
          tenantId: 'default'
        }
      })

      // Create credentials for demo tour operator
      const hashedPassword = await bcrypt.hash('demo123', 10)
      await prisma.account.create({
        data: {
          userId: demoOperator.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: demoOperator.email,
          refresh_token: hashedPassword, // Temporary solution
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null
        }
      })

      console.log('✅ Created demo tour operator user: demo-operator@example.com')
    } else {
      console.log('ℹ️  Demo tour operator already exists')
    }

    console.log('\n🎉 Demo users seeding completed!')
    console.log('\nDemo accounts:')
    console.log('  Traveler: demo@example.com / demo123')
    console.log('  Tour Operator: demo-operator@example.com / demo123')
  } catch (error) {
    console.error('❌ Error seeding demo users:', error)
    throw error
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