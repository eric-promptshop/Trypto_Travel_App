import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('12').transform(Number),
  search: z.string().optional(),
  category: z.string().optional(),
  destination: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? Number(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? Number(val) : undefined),
  duration: z.enum(['all', 'half-day', 'full-day', 'multi-day']).optional(),
  sortBy: z.enum(['featured', 'price_low', 'price_high', 'rating', 'popular']).default('featured'),
  rating: z.string().optional().transform(val => val ? Number(val) : undefined),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)
    
    const validation = querySchema.safeParse(params)
    if (!validation.success) {
      console.error('Invalid query parameters:', validation.error)
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validation.error.flatten()
        },
        { status: 400 }
      )
    }
    
    const query = validation.data
    const skip = (query.page - 1) * query.limit
    
    // Build where clause for Tour table - only show templates!
    const where: any = {
      isTemplate: true, // CRITICAL: Only show templates, not tour instances
      status: 'published',
    }
    
    // Search filter
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { destination: { contains: query.search, mode: 'insensitive' } }
      ]
    }
    
    // Destination filter
    if (query.destination) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { city: { contains: query.destination, mode: 'insensitive' } },
            { country: { contains: query.destination, mode: 'insensitive' } },
            { destination: { contains: query.destination, mode: 'insensitive' } }
          ]
        }
      ]
    }
    
    // Category filter
    if (query.category && query.category !== 'all') {
      where.categories = {
        has: query.category
      }
    }
    
    // Price filter
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {}
      if (query.minPrice !== undefined) where.price.gte = query.minPrice
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice
    }
    
    // Duration filter
    if (query.duration && query.duration !== 'all') {
      switch (query.duration) {
        case 'half-day':
          where.AND = [
            ...(where.AND || []),
            { duration: { lte: 4 } },
            { durationType: 'hours' }
          ]
          break
        case 'full-day':
          where.AND = [
            ...(where.AND || []),
            { duration: { gte: 4, lte: 8 } },
            { durationType: 'hours' }
          ]
          break
        case 'multi-day':
          where.OR = [
            ...(where.OR || []),
            { durationType: 'days' },
            {
              AND: [
                { duration: { gte: 24 } },
                { durationType: 'hours' }
              ]
            }
          ]
          break
      }
    }
    
    // Rating filter
    if (query.rating) {
      where.rating = { gte: query.rating }
    }
    
    // Get total count
    const total = await prisma.tour.count({ where })
    
    // Build orderBy
    let orderBy: any = []
    switch (query.sortBy) {
      case 'price_low':
        orderBy = [{ price: 'asc' }]
        break
      case 'price_high':
        orderBy = [{ price: 'desc' }]
        break
      case 'rating':
        orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }]
        break
      case 'popular':
        orderBy = [{ bookingCount: 'desc' }, { viewCount: 'desc' }]
        break
      case 'featured':
      default:
        orderBy = [{ featured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }]
    }
    
    // Fetch tour templates with operator info
    const templates = await prisma.tour.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            verifiedAt: true
          }
        }
      },
      skip,
      take: query.limit,
      orderBy
    })
    
    // Transform templates for API response
    const tours = templates.map(template => {
      // Ensure images is an array
      let images = template.images as any
      if (!Array.isArray(images)) {
        images = []
      }
      if (images.length === 0) {
        // Generate placeholder image based on category
        const primaryCategory = template.categories[0] || 'tour'
        images = [`https://source.unsplash.com/400x300/?${primaryCategory},${template.destination}`]
      }
      
      return {
        id: template.id,
        name: template.name,
        description: template.shortDescription || template.description.substring(0, 200) + '...',
        destination: `${template.city || template.destination}, ${template.country || ''}`.trim(),
        city: template.city || template.destination,
        country: template.country || '',
        price: template.price,
        currency: template.currency,
        priceType: template.priceType,
        duration: template.durationType === 'days' ? template.duration * 8 : 
                 template.durationType === 'hours' ? template.duration : 
                 template.duration / 60, // Convert to hours for consistency
        durationDisplay: `${template.duration} ${template.durationType}`,
        images,
        rating: template.rating || 4.5,
        reviews: template.reviewCount || 0,
        operatorName: template.operator.businessName,
        operatorId: template.operator.id,
        operatorLogo: template.operator.logo,
        verified: !!template.operator.verifiedAt,
        featured: template.featured,
        instantBooking: template.metadata && (template.metadata as any).instantBooking,
        category: template.categories[0] || 'general',
        categories: template.categories,
        difficulty: template.difficulty,
        languages: template.languages,
        isTemplate: true,
        templateUsageCount: template.bookingCount || 0, // Using bookingCount to track template usage
        highlights: template.highlights.slice(0, 3) // Show first 3 highlights
      }
    })
    
    return NextResponse.json({
      tours,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
      isTemplateLibrary: true // Indicate this is showing templates
    })
    
  } catch (error) {
    console.error('Error fetching tour templates:', error)
    
    // Return empty result on error instead of demo data
    return NextResponse.json({
      tours: [],
      total: 0,
      page: 1,
      totalPages: 0,
      isTemplateLibrary: true,
      error: 'Failed to fetch tour templates'
    })
  }
}