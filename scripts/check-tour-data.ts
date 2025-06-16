import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTourData() {
  try {
    console.log('Checking tour operator data...\n')
    
    // Check content table
    const allContent = await prisma.content.findMany()
    console.log('Total content items:', allContent.length)
    
    // Group by tenant and type
    const contentByTenantAndType = allContent.reduce((acc, item) => {
      const key = `${item.tenantId} - ${item.type}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('\nContent by tenant and type:')
    Object.entries(contentByTenantAndType).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} items`)
    })
    
    // Check specific activity content
    const activities = await prisma.content.findMany({
      where: { type: 'activity' }
    })
    
    console.log('\nActivities found:', activities.length)
    activities.forEach(activity => {
      console.log(`  - ${activity.name} (tenant: ${activity.tenantId}, active: ${activity.active})`)
    })
    
    // Check users with tour operator role
    const tourOperators = await prisma.user.findMany({
      where: {
        role: { in: ['TOUR_OPERATOR', 'AGENT'] }
      }
    })
    
    console.log('\nTour operators found:', tourOperators.length)
    tourOperators.forEach(operator => {
      console.log(`  - ${operator.email} (role: ${operator.role})`)
    })
    
    // Check leads
    const leads = await prisma.lead.findMany()
    console.log('\nLeads found:', leads.length)
    
  } catch (error) {
    console.error('Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTourData()