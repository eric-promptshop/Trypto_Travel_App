const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function setupDemoOperator() {
  try {
    console.log('Setting up demo tour operator...\n')
    
    // Check if demo operator exists
    const existingOperator = await prisma.$queryRaw`
      SELECT id, email, role 
      FROM users 
      WHERE email = 'demo-operator@example.com'
    `
    
    if (existingOperator.length === 0) {
      // Create demo operator
      console.log('Creating demo operator user...')
      await prisma.$executeRaw`
        INSERT INTO users (id, email, name, role, "tenantId", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          'demo-operator@example.com',
          'Demo Tour Operator',
          'AGENT',
          'default',
          NOW(),
          NOW()
        )
      `
      console.log('✅ Demo operator created')
    } else {
      console.log('✅ Demo operator already exists')
    }
    
    // Verify setup
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE email = 'demo-operator@example.com') as operator_count,
        (SELECT COUNT(*) FROM content WHERE type = 'activity' AND "tenantId" = 'default') as tour_count,
        (SELECT COUNT(*) FROM leads WHERE "tenantId" = 'default') as lead_count
    `
    
    console.log('\n📊 Demo Data Status:')
    console.log(`- Tour Operator Account: ${stats[0].operator_count > 0 ? '✅' : '❌'}`)
    console.log(`- Demo Tours: ${stats[0].tour_count}`)
    console.log(`- Demo Leads: ${stats[0].lead_count}`)
    
    if (stats[0].tour_count > 0 && stats[0].lead_count > 0) {
      console.log('\n🎉 Tour operator demo is ready!')
      console.log('Login with: demo-operator@example.com / demo123')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDemoOperator()