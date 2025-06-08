#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDefaultTenant() {
  console.log('🏢 Creating default tenant...')

  try {
    // Check if default tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: 'default' }
    })

    if (existingTenant) {
      console.log('✅ Default tenant already exists')
      return existingTenant
    }

    // Create default tenant
    const defaultTenant = await prisma.tenant.create({
      data: {
        id: 'default',
        name: 'Default Organization',
        slug: 'default',
        domain: 'localhost:3000',
        isActive: true,
        settings: {
          contactEmail: 'admin@localhost',
          theme: {
            id: 'default',
            name: 'Default Theme',
            colors: {
              primary: '#3b82f6',
              secondary: '#64748b',
              accent: '#f59e0b',
              background: '#ffffff',
              foreground: '#1f2937'
            },
            fonts: {
              heading: 'Inter',
              body: 'Inter'
            }
          },
          features: {
            enabledFeatures: ['itinerary-builder', 'analytics'],
            customFeatures: {}
          },
          billing: {
            plan: 'enterprise',
            status: 'active'
          }
        }
      }
    })

    console.log('✅ Default tenant created successfully:', defaultTenant.name)
    return defaultTenant

  } catch (error) {
    console.error('❌ Error creating default tenant:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultTenant()
    .then(() => {
      console.log('🎉 Default tenant setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Failed to setup default tenant:', error)
      process.exit(1)
    })
}

export { createDefaultTenant } 