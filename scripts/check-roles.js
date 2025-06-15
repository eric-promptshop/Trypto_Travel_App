const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function checkRoles() {
  try {
    // Check existing users and their roles
    const users = await prisma.$queryRaw`
      SELECT DISTINCT role 
      FROM users 
      ORDER BY role
    `
    console.log('Existing roles in database:', users)
    
    // Check enum values
    const enumValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'Role'
      )
    `
    console.log('\nAvailable Role enum values:', enumValues)
    
    // Check some users
    const sampleUsers = await prisma.$queryRaw`
      SELECT email, role 
      FROM users 
      LIMIT 5
    `
    console.log('\nSample users:', sampleUsers)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoles()