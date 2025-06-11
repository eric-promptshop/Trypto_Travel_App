#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAdminData() {
  console.log('🌱 Seeding admin data...')

  try {
    // First, create the default tenant if it doesn't exist
    const existingDefault = await prisma.tenant.findUnique({
      where: { id: 'default' }
    })

    if (!existingDefault) {
      await prisma.tenant.create({
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
      console.log('✅ Created default tenant')
    } else {
      console.log('⏭️  Default tenant already exists')
    }

    // Create test tenants (clients)
    const testClients = [
      {
        name: 'Adventure Tours Co',
        slug: 'adventure-tours-co',
        domain: 'adventure-tours.example.com',
        isActive: true,
        settings: {
          contactEmail: 'contact@adventure-tours.com',
          theme: {
            id: 'adventure',
            name: 'Adventure Theme',
            colors: {
              primary: '#1f5582',
              secondary: '#2a6b94',
              accent: '#f97316',
              background: '#ffffff',
              foreground: '#000000'
            },
            fonts: {
              heading: 'Inter',
              body: 'Inter'
            }
          },
          features: {
            enabledFeatures: ['itinerary-builder', 'crm-integration', 'analytics'],
            customFeatures: {}
          },
          billing: {
            plan: 'professional',
            status: 'active'
          }
        }
      },
      {
        name: 'Luxury Escapes',
        slug: 'luxury-escapes',
        domain: 'luxury-escapes.example.com',
        isActive: true,
        settings: {
          contactEmail: 'hello@luxury-escapes.com',
          theme: {
            id: 'luxury',
            name: 'Luxury Theme',
            colors: {
              primary: '#8b5a3c',
              secondary: '#a0785a',
              accent: '#d4af37',
              background: '#faf9f7',
              foreground: '#1a1a1a'
            },
            fonts: {
              heading: 'Playfair Display',
              body: 'Source Sans Pro'
            }
          },
          features: {
            enabledFeatures: ['itinerary-builder', 'payment-processing', 'white-label-branding', 'priority-support'],
            customFeatures: {}
          },
          billing: {
            plan: 'enterprise',
            status: 'active'
          }
        }
      },
      {
        name: 'Budget Backpackers',
        slug: 'budget-backpackers',
        domain: 'budget-backpackers.example.com',
        isActive: false,
        settings: {
          contactEmail: 'info@budget-backpackers.com',
          theme: {
            id: 'minimalist',
            name: 'Minimalist Theme',
            colors: {
              primary: '#2563eb',
              secondary: '#1d4ed8',
              accent: '#059669',
              background: '#ffffff',
              foreground: '#111827'
            },
            fonts: {
              heading: 'Inter',
              body: 'Inter'
            }
          },
          features: {
            enabledFeatures: ['itinerary-builder'],
            customFeatures: {}
          },
          billing: {
            plan: 'starter',
            status: 'trial'
          }
        }
      }
    ]

    // Create the test clients
    for (const clientData of testClients) {
      const existingClient = await prisma.tenant.findFirst({
        where: { domain: clientData.domain }
      })

      if (!existingClient) {
        const client = await prisma.tenant.create({
          data: clientData
        })
        console.log(`✅ Created client: ${client.name} (${client.domain})`)
      } else {
        console.log(`⏭️  Client already exists: ${clientData.name}`)
      }
    }

    // Create some content for the clients
    const adventureTours = await prisma.tenant.findFirst({
      where: { slug: 'adventure-tours-co' }
    })

    if (adventureTours) {
      const existingContent = await prisma.tenantContent.findFirst({
        where: { 
          tenantId: adventureTours.id,
          contentType: 'theme'
        }
      })

      if (!existingContent) {
        await prisma.tenantContent.create({
          data: {
            tenantId: adventureTours.id,
            contentType: 'theme',
            title: 'Custom Adventure Theme',
            content: {
              name: 'Adventure Custom',
              colors: {
                primary: '#1f5582',
                secondary: '#2a6b94',
                accent: '#f97316'
              },
              customizations: [
                'Hero banner with mountain background',
                'Adventure-themed icons',
                'Custom booking flow'
              ]
            },
            status: 'published',
            category: 'branding'
          }
        })
        console.log(`✅ Created content for ${adventureTours.name}`)
      }
    }

    console.log('\n🎉 Admin data seeding completed!')
    console.log('\nYou can now test the admin client management at:')
    console.log('- Local: http://localhost:3000/admin')
    console.log('\nTest clients created:')
    console.log('1. Adventure Tours Co (Professional plan, Active)')
    console.log('2. Luxury Escapes (Enterprise plan, Active)')  
    console.log('3. Budget Backpackers (Starter plan, Trial)')

  } catch (error) {
    console.error('❌ Error seeding admin data:', error)
    throw error
  }
}

async function main() {
  try {
    await seedAdminData()
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { seedAdminData } 