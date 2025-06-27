import { PrismaClient } from '@prisma/client'
import { googlePlacesService } from '../lib/services/google-places'

const prisma = new PrismaClient()

async function migrateCoordinates() {
  console.log('Starting coordinate migration...')
  
  try {
    // Migrate Tours
    console.log('\n=== Migrating Tour Coordinates ===')
    const tours = await prisma.tour.findMany({
      where: {
        OR: [
          { coordinates: null },
          { googlePlaceId: null }
        ]
      },
      select: {
        id: true,
        destination: true,
        city: true,
        country: true,
        name: true
      }
    })
    
    console.log(`Found ${tours.length} tours without coordinates`)
    
    for (const tour of tours) {
      try {
        const location = tour.city 
          ? `${tour.city}, ${tour.country || tour.destination}`
          : tour.destination
          
        console.log(`Geocoding tour "${tour.name}" - Location: ${location}`)
        
        const result = await googlePlacesService.geocodeLocation(location)
        
        if (result) {
          await prisma.tour.update({
            where: { id: tour.id },
            data: {
              coordinates: {
                lat: result.coordinates.lat,
                lng: result.coordinates.lng
              },
              googlePlaceId: result.placeId,
              city: tour.city || result.city,
              country: tour.country || result.country
            }
          })
          console.log(`✓ Updated tour ${tour.id} with coordinates`)
        } else {
          console.log(`✗ Could not geocode location for tour ${tour.id}`)
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing tour ${tour.id}:`, error)
      }
    }
    
    // Migrate Content
    console.log('\n=== Migrating Content Coordinates ===')
    const contents = await prisma.content.findMany({
      where: {
        OR: [
          { coordinates: null },
          { googlePlaceId: null }
        ]
      },
      select: {
        id: true,
        location: true,
        city: true,
        country: true,
        name: true,
        type: true
      }
    })
    
    console.log(`Found ${contents.length} content items without coordinates`)
    
    for (const content of contents) {
      try {
        const location = content.city 
          ? `${content.city}, ${content.country || content.location}`
          : content.location
          
        console.log(`Geocoding ${content.type} "${content.name}" - Location: ${location}`)
        
        const result = await googlePlacesService.geocodeLocation(location)
        
        if (result) {
          await prisma.content.update({
            where: { id: content.id },
            data: {
              coordinates: {
                lat: result.coordinates.lat,
                lng: result.coordinates.lng
              },
              googlePlaceId: result.placeId,
              city: content.city || result.city,
              country: content.country || result.country
            }
          })
          console.log(`✓ Updated content ${content.id} with coordinates`)
        } else {
          console.log(`✗ Could not geocode location for content ${content.id}`)
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing content ${content.id}:`, error)
      }
    }
    
    // Migrate Leads
    console.log('\n=== Migrating Lead Coordinates ===')
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { destinationCoordinates: null },
          { destinationPlaceId: null }
        ]
      },
      select: {
        id: true,
        destination: true
      }
    })
    
    console.log(`Found ${leads.length} leads without destination coordinates`)
    
    for (const lead of leads) {
      try {
        console.log(`Geocoding lead destination: ${lead.destination}`)
        
        const result = await googlePlacesService.geocodeLocation(lead.destination)
        
        if (result) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              destinationCoordinates: {
                lat: result.coordinates.lat,
                lng: result.coordinates.lng
              },
              destinationPlaceId: result.placeId
            }
          })
          console.log(`✓ Updated lead ${lead.id} with destination coordinates`)
        } else {
          console.log(`✗ Could not geocode destination for lead ${lead.id}`)
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error)
      }
    }
    
    // Migrate Enhanced Leads
    console.log('\n=== Migrating Enhanced Lead Coordinates ===')
    const enhancedLeads = await prisma.leadEnhanced.findMany({
      where: {
        AND: [
          { destination: { not: null } },
          {
            OR: [
              { destinationCoordinates: null },
              { destinationPlaceId: null }
            ]
          }
        ]
      },
      select: {
        id: true,
        destination: true
      }
    })
    
    console.log(`Found ${enhancedLeads.length} enhanced leads without destination coordinates`)
    
    for (const lead of enhancedLeads) {
      try {
        if (!lead.destination) continue
        
        console.log(`Geocoding enhanced lead destination: ${lead.destination}`)
        
        const result = await googlePlacesService.geocodeLocation(lead.destination)
        
        if (result) {
          await prisma.leadEnhanced.update({
            where: { id: lead.id },
            data: {
              destinationCoordinates: {
                lat: result.coordinates.lat,
                lng: result.coordinates.lng
              },
              destinationPlaceId: result.placeId
            }
          })
          console.log(`✓ Updated enhanced lead ${lead.id} with destination coordinates`)
        } else {
          console.log(`✗ Could not geocode destination for enhanced lead ${lead.id}`)
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing enhanced lead ${lead.id}:`, error)
      }
    }
    
    // Migrate Itineraries
    console.log('\n=== Migrating Itinerary Coordinates ===')
    const itineraries = await prisma.itinerary.findMany({
      where: {
        OR: [
          { destinationCoordinates: null },
          { destinationPlaceId: null }
        ]
      },
      select: {
        id: true,
        destination: true,
        title: true
      }
    })
    
    console.log(`Found ${itineraries.length} itineraries without destination coordinates`)
    
    for (const itinerary of itineraries) {
      try {
        console.log(`Geocoding itinerary "${itinerary.title}" - Destination: ${itinerary.destination}`)
        
        const result = await googlePlacesService.geocodeLocation(itinerary.destination)
        
        if (result) {
          await prisma.itinerary.update({
            where: { id: itinerary.id },
            data: {
              destinationCoordinates: {
                lat: result.coordinates.lat,
                lng: result.coordinates.lng
              },
              destinationPlaceId: result.placeId
            }
          })
          console.log(`✓ Updated itinerary ${itinerary.id} with destination coordinates`)
        } else {
          console.log(`✗ Could not geocode destination for itinerary ${itinerary.id}`)
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing itinerary ${itinerary.id}:`, error)
      }
    }
    
    // Migrate Operators
    console.log('\n=== Migrating Operator Coordinates ===')
    const operators = await prisma.operator.findMany({
      where: {
        AND: [
          { address: { not: null } },
          {
            OR: [
              { coordinates: null },
              { googlePlaceId: null }
            ]
          }
        ]
      },
      select: {
        id: true,
        businessName: true,
        address: true
      }
    })
    
    console.log(`Found ${operators.length} operators without coordinates`)
    
    for (const operator of operators) {
      try {
        // Extract address string from JSON
        const addressData = operator.address as any
        let locationString = ''
        
        if (typeof addressData === 'string') {
          locationString = addressData
        } else if (addressData) {
          locationString = [
            addressData.street,
            addressData.city,
            addressData.state,
            addressData.country
          ].filter(Boolean).join(', ')
        }
        
        if (!locationString) continue
        
        console.log(`Geocoding operator "${operator.businessName}" - Address: ${locationString}`)
        
        const result = await googlePlacesService.geocodeLocation(locationString)
        
        if (result) {
          await prisma.operator.update({
            where: { id: operator.id },
            data: {
              coordinates: {
                lat: result.coordinates.lat,
                lng: result.coordinates.lng
              },
              googlePlaceId: result.placeId
            }
          })
          console.log(`✓ Updated operator ${operator.id} with coordinates`)
        } else {
          console.log(`✗ Could not geocode address for operator ${operator.id}`)
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing operator ${operator.id}:`, error)
      }
    }
    
    console.log('\n=== Migration Summary ===')
    const summary = {
      tours: await prisma.tour.count({ where: { coordinates: { not: null } } }),
      contents: await prisma.content.count({ where: { coordinates: { not: null } } }),
      leads: await prisma.lead.count({ where: { destinationCoordinates: { not: null } } }),
      enhancedLeads: await prisma.leadEnhanced.count({ where: { destinationCoordinates: { not: null } } }),
      itineraries: await prisma.itinerary.count({ where: { destinationCoordinates: { not: null } } }),
      operators: await prisma.operator.count({ where: { coordinates: { not: null } } })
    }
    
    console.log('Records with coordinates:', summary)
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateCoordinates()
  .then(() => {
    console.log('\nMigration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nMigration failed:', error)
    process.exit(1)
  })