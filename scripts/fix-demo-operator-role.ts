import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDemoOperatorRole() {
  try {
    console.log('Updating demo operator role...')
    
    // Update demo operator role to AGENT (which is accepted by the tour operator page)
    const updated = await prisma.user.update({
      where: { email: 'demo-operator@example.com' },
      data: { role: 'AGENT' }
    })
    
    console.log('Updated user:', updated)
    console.log('\nDemo operator can now access the tour operator dashboard!')
    
  } catch (error) {
    console.error('Error updating role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDemoOperatorRole()