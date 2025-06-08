import prisma from '../lib/prisma'

async function checkLead() {
  const lead = await prisma.lead.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      destination: true,
      status: true,
      score: true,
      createdAt: true
    }
  })
  
  console.log('Latest lead:', lead)
  
  const leadCount = await prisma.lead.count()
  console.log('Total leads:', leadCount)
  
  await prisma.$disconnect()
}

checkLead().catch(console.error)