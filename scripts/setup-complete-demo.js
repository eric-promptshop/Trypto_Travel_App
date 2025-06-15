const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function setupCompleteDemo() {
  try {
    console.log('Setting up complete demo...\n')
    
    // 1. Check/create default tenant
    const tenants = await prisma.$queryRaw`SELECT id FROM tenants WHERE id = 'default'`
    
    if (tenants.length === 0) {
      console.log('Creating default tenant...')
      await prisma.$executeRaw`
        INSERT INTO tenants (id, name, slug, domain, "isActive", "createdAt", "updatedAt")
        VALUES (
          'default',
          'Default Organization',
          'default',
          'localhost',
          true,
          NOW(),
          NOW()
        )
      `
      console.log('✅ Default tenant created')
    }
    
    // 2. Create demo operator
    const existingOperator = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = 'demo-operator@example.com'
    `
    
    if (existingOperator.length === 0) {
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
    }
    
    // 3. Verify the setup
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE id = 'default') as tenant_count,
        (SELECT COUNT(*) FROM users WHERE email = 'demo-operator@example.com') as operator_count,
        (SELECT COUNT(*) FROM content WHERE type = 'activity' AND "tenantId" = 'default') as tour_count,
        (SELECT COUNT(*) FROM leads WHERE "tenantId" = 'default') as lead_count
    `
    
    console.log('\n📊 Demo Data Status:')
    console.log(`- Default Tenant: ${stats[0].tenant_count > 0 ? '✅' : '❌'}`)
    console.log(`- Tour Operator Account: ${stats[0].operator_count > 0 ? '✅' : '❌'}`)
    console.log(`- Demo Tours: ${stats[0].tour_count}`)
    console.log(`- Demo Leads: ${stats[0].lead_count}`)
    
    // 4. Update auth config if needed
    console.log('\n⚠️  Important: Update your auth config to handle AGENT role')
    console.log('In lib/auth/config.ts, make sure AGENT role maps to tour-operator dashboard')
    
  } catch (error) {
    console.error('Error:', error.message)
    if (error.meta) {
      console.error('Details:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

setupCompleteDemo()