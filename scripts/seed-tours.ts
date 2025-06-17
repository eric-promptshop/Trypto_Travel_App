import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTours() {
  console.log('🌱 Seeding tour data...')
  
  const tours = [
    {
      type: 'activity',
      name: 'Paris City Tour with Eiffel Tower',
      description: 'Experience the best of Paris in one day! Visit the iconic Eiffel Tower, stroll along the Champs-Élysées, and explore the historic Latin Quarter with our expert guides.',
      location: 'Paris',
      city: 'Paris',
      country: 'France',
      price: 120,
      currency: 'EUR',
      duration: 480, // 8 hours in minutes
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a'
      ]),
      amenities: JSON.stringify(['Professional guide', 'Transportation', 'Entry tickets']),
      highlights: JSON.stringify([
        'Skip-the-line Eiffel Tower access',
        'Seine River cruise',
        'Notre-Dame Cathedral visit',
        'Louvre Museum photo stop'
      ]),
      included: JSON.stringify([
        'Hotel pickup and drop-off',
        'Professional English-speaking guide',
        'All entrance fees',
        'Air-conditioned vehicle'
      ]),
      excluded: JSON.stringify([
        'Lunch and beverages',
        'Personal expenses',
        'Gratuities'
      ]),
      metadata: JSON.stringify({
        groupSize: { min: 2, max: 15 },
        languages: ['English', 'French', 'Spanish'],
        difficulty: 'Easy',
        categories: ['City Tour', 'Cultural', 'Sightseeing']
      }),
      tenantId: 'default',
      active: true,
      featured: true
    },
    {
      type: 'activity',
      name: 'Vatican Museums & Sistine Chapel Tour',
      description: 'Skip the lines and explore the Vatican Museums, Sistine Chapel, and St. Peter\'s Basilica with an expert art historian guide.',
      location: 'Vatican City',
      city: 'Rome',
      country: 'Italy',
      price: 95,
      currency: 'EUR',
      duration: 240, // 4 hours
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
        'https://images.unsplash.com/photo-1531572753322-ad063cecc140'
      ]),
      amenities: JSON.stringify(['Expert guide', 'Skip-the-line access', 'Headsets']),
      highlights: JSON.stringify([
        'Michelangelo\'s Sistine Chapel',
        'Raphael Rooms',
        'Gallery of Maps',
        'St. Peter\'s Basilica'
      ]),
      included: JSON.stringify([
        'Skip-the-line tickets',
        'Professional art historian guide',
        'Headsets for clear audio',
        'Small group size (max 20)'
      ]),
      excluded: JSON.stringify([
        'Hotel transfers',
        'Food and drinks',
        'Tips'
      ]),
      metadata: JSON.stringify({
        groupSize: { min: 1, max: 20 },
        languages: ['English', 'Italian'],
        difficulty: 'Easy',
        categories: ['Cultural', 'Art', 'Religious']
      }),
      tenantId: 'default',
      active: true,
      featured: false
    },
    {
      type: 'activity',
      name: 'London Royal Walking Tour',
      description: 'Discover London\'s royal heritage with visits to Buckingham Palace, Westminster Abbey, and the Tower of London.',
      location: 'London',
      city: 'London',
      country: 'United Kingdom',
      price: 75,
      currency: 'GBP',
      duration: 360, // 6 hours
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
        'https://images.unsplash.com/photo-1486299267070-83823f5448dd'
      ]),
      amenities: JSON.stringify(['Walking tour', 'Royal Guard ceremony', 'Historic sites']),
      highlights: JSON.stringify([
        'Changing of the Guard ceremony',
        'Westminster Abbey interior',
        'Tower Bridge views',
        'Crown Jewels viewing'
      ]),
      included: JSON.stringify([
        'Professional Blue Badge guide',
        'Westminster Abbey entry',
        'Tower of London admission',
        'River Thames cruise ticket'
      ]),
      excluded: JSON.stringify([
        'Meals',
        'Hotel pickup',
        'Personal expenses'
      ]),
      metadata: JSON.stringify({
        groupSize: { min: 5, max: 25 },
        languages: ['English'],
        difficulty: 'Moderate',
        categories: ['Walking Tour', 'Historical', 'Royal']
      }),
      tenantId: 'default',
      active: true,
      featured: true
    },
    {
      type: 'activity',
      name: 'Tokyo Food & Culture Experience',
      description: 'Immerse yourself in Tokyo\'s culinary scene with visits to Tsukiji Outer Market, traditional izakayas, and a sushi-making class.',
      location: 'Tokyo',
      city: 'Tokyo',
      country: 'Japan',
      price: 150,
      currency: 'USD',
      duration: 300, // 5 hours
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
        'https://images.unsplash.com/photo-1555881400-74d7acaacd8b'
      ]),
      amenities: JSON.stringify(['Food tastings', 'Cooking class', 'Local guide']),
      highlights: JSON.stringify([
        'Tsukiji Market tour',
        'Sushi making masterclass',
        'Traditional sake tasting',
        'Hidden izakaya experience'
      ]),
      included: JSON.stringify([
        'All food and drinks',
        'Professional chef instructor',
        'Market tour guide',
        'Cooking class materials',
        'Recipe booklet'
      ]),
      excluded: JSON.stringify([
        'Hotel transfers',
        'Additional drinks',
        'Tips'
      ]),
      metadata: JSON.stringify({
        groupSize: { min: 2, max: 12 },
        languages: ['English', 'Japanese'],
        difficulty: 'Easy',
        categories: ['Culinary', 'Cultural', 'Hands-on Experience']
      }),
      tenantId: 'default',
      active: true,
      featured: false
    },
    {
      type: 'activity',
      name: 'Barcelona Sagrada Familia & Park Güell Tour',
      description: 'Explore Antoni Gaudí\'s masterpieces including the iconic Sagrada Familia and the whimsical Park Güell with skip-the-line access.',
      location: 'Barcelona',
      city: 'Barcelona',
      country: 'Spain',
      price: 85,
      currency: 'EUR',
      duration: 270, // 4.5 hours
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216',
        'https://images.unsplash.com/photo-1583422409516-2895a77efded'
      ]),
      amenities: JSON.stringify(['Architecture tour', 'Skip-the-line', 'Expert guide']),
      highlights: JSON.stringify([
        'Sagrada Familia interior and facades',
        'Park Güell monuments zone',
        'Casa Batlló exterior',
        'Las Ramblas walk'
      ]),
      included: JSON.stringify([
        'Skip-the-line tickets to all sites',
        'Licensed guide',
        'Transportation between sites',
        'Wireless audio system'
      ]),
      excluded: JSON.stringify([
        'Food and beverages',
        'Hotel pickup/drop-off',
        'Gratuities'
      ]),
      metadata: JSON.stringify({
        groupSize: { min: 1, max: 25 },
        languages: ['English', 'Spanish', 'Catalan'],
        difficulty: 'Easy',
        categories: ['Architecture', 'Art', 'Walking Tour'],
        createdBy: 'system',
        createdFrom: 'seed'
      }),
      tenantId: 'default',
      active: true,
      featured: false
    }
  ]

  console.log(`Creating ${tours.length} sample tours...`)
  
  for (const tour of tours) {
    try {
      const created = await prisma.content.create({
        data: tour
      })
      console.log(`✅ Created tour: ${created.name}`)
    } catch (error) {
      console.error(`❌ Error creating tour ${tour.name}:`, error)
    }
  }

  console.log('🎉 Tour seeding completed!')
}

// Run the seed function
seedTours()
  .catch((error) => {
    console.error('Seed error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })