import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Parse stored JSON strings safely
function parseJsonField(field: string | null, defaultValue: any = []): any {
  if (!field) return defaultValue
  try {
    return JSON.parse(field)
  } catch (e) {
    console.warn(`Failed to parse JSON field: ${field}`)
    return defaultValue
  }
}

// Extract coordinates from various formats
function extractCoordinates(coordinates: any, location: string): { lat: number, lng: number } | null {
  // Try to parse if it's a JSON string
  if (typeof coordinates === 'string') {
    try {
      coordinates = JSON.parse(coordinates)
    } catch (e) {
      // Not JSON, ignore
    }
  }

  // Check if it has lat/lng
  if (coordinates && typeof coordinates === 'object' && 'lat' in coordinates && 'lng' in coordinates) {
    return {
      lat: parseFloat(coordinates.lat),
      lng: parseFloat(coordinates.lng)
    }
  }

  // TODO: Could use geocoding service here to get coordinates from location string
  return null
}

// Extract tour duration in minutes and type
function extractDuration(durationMinutes: number | null): { duration: number, durationType: string } {
  if (!durationMinutes) {
    return { duration: 1, durationType: 'days' }
  }

  // Convert minutes to appropriate unit
  if (durationMinutes < 60) {
    return { duration: durationMinutes, durationType: 'minutes' }
  } else if (durationMinutes < 1440) { // Less than 24 hours
    return { duration: Math.round(durationMinutes / 60), durationType: 'hours' }
  } else {
    return { duration: Math.round(durationMinutes / 1440), durationType: 'days' }
  }
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

async function migrateContentToTours() {
  console.log('Starting migration from Content to Tour table...')

  try {
    // First, check if we need to create any operators for orphaned content
    const defaultOperator = await prisma.operator.upsert({
      where: { email: 'default@tripnav.com' },
      update: {},
      create: {
        email: 'default@tripnav.com',
        businessName: 'TripNav Default Tours',
        slug: 'tripnav-default',
        description: 'Default tour operator for migrated content',
        languages: ['en'],
        currencies: ['USD', 'EUR'],
        status: 'verified',
        verifiedAt: new Date()
      }
    })

    console.log('Default operator ready:', defaultOperator.id)

    // Fetch all activity content that should be tours
    const activities = await prisma.content.findMany({
      where: {
        type: 'activity'
      }
    })

    console.log(`Found ${activities.length} activities to migrate`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const activity of activities) {
      try {
        // Check if already migrated (by name and location)
        const existingTour = await prisma.tour.findFirst({
          where: {
            name: activity.name,
            destination: activity.location
          }
        })

        if (existingTour) {
          console.log(`Skipping "${activity.name}" - already migrated`)
          skipped++
          continue
        }

        // Parse metadata to extract additional fields
        const metadata = parseJsonField(activity.metadata, {})
        const { duration, durationType } = extractDuration(activity.duration)

        // Determine operator - if content has a tenantId, try to find matching operator
        let operatorId = defaultOperator.id
        if (activity.tenantId && activity.tenantId !== 'default') {
          const tenantOperator = await prisma.operator.findFirst({
            where: { tenantId: activity.tenantId }
          })
          if (tenantOperator) {
            operatorId = tenantOperator.id
          }
        }

        // Extract categories from metadata or create default
        let categories: string[] = metadata.categories || []
        if (categories.length === 0) {
          // Try to infer category from name/description
          const text = `${activity.name} ${activity.description}`.toLowerCase()
          if (text.includes('food') || text.includes('culinary') || text.includes('wine')) {
            categories.push('Food & Wine')
          } else if (text.includes('history') || text.includes('museum') || text.includes('cultural')) {
            categories.push('Cultural')
          } else if (text.includes('adventure') || text.includes('hiking') || text.includes('outdoor')) {
            categories.push('Adventure')
          } else {
            categories.push('Sightseeing')
          }
        }

        // Create the tour
        const tour = await prisma.tour.create({
          data: {
            operatorId,
            name: activity.name,
            slug: generateSlug(activity.name),
            description: activity.description || 'Experience the best of local tourism',
            shortDescription: activity.description?.substring(0, 200),
            destination: activity.location,
            city: activity.city || activity.location.split(',')[0]?.trim(),
            country: activity.country || activity.location.split(',').pop()?.trim(),
            coordinates: extractCoordinates(activity.coordinates, activity.location),
            googlePlaceId: activity.googlePlaceId,
            duration,
            durationType,
            price: activity.price || 0,
            currency: activity.currency || 'USD',
            priceType: 'per_person',
            groupSize: metadata.groupSize || { min: 1, max: 20 },
            categories,
            difficulty: metadata.difficulty || 'Easy',
            languages: metadata.languages || ['English'],
            images: parseJsonField(activity.images, []),
            highlights: parseJsonField(activity.highlights, []),
            included: parseJsonField(activity.included, []),
            excluded: parseJsonField(activity.excluded, []),
            itinerary: metadata.itinerary,
            startingPoint: metadata.startingPoint,
            endingPoint: metadata.endingPoint,
            meetingInstructions: metadata.meetingInstructions,
            cancellationPolicy: metadata.cancellationPolicy || '24 hour cancellation policy',
            healthAndSafety: metadata.healthAndSafety,
            accessibility: metadata.accessibility,
            schedule: metadata.schedule,
            availability: metadata.availability,
            metadata: {
              migratedFrom: 'content_table',
              originalId: activity.id,
              migratedAt: new Date().toISOString(),
              createdBy: metadata.createdBy,
              createdFrom: metadata.createdFrom
            },
            seoTitle: `${activity.name} - ${activity.location}`,
            seoDescription: activity.description?.substring(0, 160),
            seoKeywords: [...categories, activity.city, activity.country].filter(Boolean) as string[],
            status: activity.active ? 'published' : 'draft',
            publishedAt: activity.active ? activity.createdAt : null,
            featured: activity.featured,
            externalId: activity.id,
            sourceUrl: metadata.sourceUrl,
            lastScrapedAt: metadata.lastScrapedAt ? new Date(metadata.lastScrapedAt) : null,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
          }
        })

        console.log(`Migrated: "${tour.name}" (${tour.id})`)
        migrated++

      } catch (error) {
        console.error(`Error migrating "${activity.name}":`, error)
        errors++
      }
    }

    console.log('\nMigration Summary:')
    console.log(`- Total activities found: ${activities.length}`)
    console.log(`- Successfully migrated: ${migrated}`)
    console.log(`- Skipped (already exists): ${skipped}`)
    console.log(`- Errors: ${errors}`)

    // Now update the Content records to mark them as migrated
    if (migrated > 0) {
      console.log('\nMarking migrated content...')
      await prisma.content.updateMany({
        where: {
          type: 'activity',
          metadata: {
            not: {
              contains: '"migratedToTours":true'
            }
          }
        },
        data: {
          metadata: prisma.validator.json(`{"migratedToTours": true, "migrationDate": "${new Date().toISOString()}"}`)
        }
      })
    }

    console.log('\nMigration complete!')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateContentToTours()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })