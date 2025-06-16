import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDemoUser() {
  try {
    // Check demo operator
    const demoOperator = await prisma.user.findUnique({
      where: { email: 'demo-operator@example.com' }
    })
    console.log('Demo operator user:', demoOperator)
    
    // Check all users
    const allUsers = await prisma.user.findMany()
    console.log('\nAll users:')
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (role: ${user.role})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDemoUser()