import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get operator info
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator) {
      return NextResponse.json({ message: 'Operator not found' }, { status: 404 })
    }

    // Fetch tour templates (tours marked as templates)
    const templates = await prisma.tour.findMany({
      where: {
        isTemplate: true,
        status: 'published',
        OR: [
          { operatorId: operator.id }, // Own templates
          { metadata: { path: ['isPublicTemplate'], equals: true } } // Public templates
        ]
      },
      orderBy: [
        { featured: 'desc' },
        { bookingCount: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    })

    // Transform to match frontend interface
    const transformedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.shortDescription || template.description.substring(0, 200),
      destination: template.destination,
      category: template.categories[0] || 'General',
      duration: `${template.duration} ${template.durationType}`,
      price: {
        amount: template.price,
        currency: template.currency,
        perPerson: template.priceType === 'per_person'
      },
      groupSize: template.groupSize as any || { min: 1, max: 20 },
      difficulty: template.difficulty || 'Easy',
      languages: template.languages,
      highlights: template.highlights,
      included: template.included,
      excluded: template.excluded,
      imageUrl: Array.isArray(template.images) && template.images.length > 0 
        ? (template.images as any[])[0] 
        : undefined,
      rating: template.rating,
      usageCount: template.bookingCount || 0,
      isAiGenerated: template.metadata && (template.metadata as any).aiGenerated,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    }))

    return NextResponse.json({ templates: transformedTemplates })

  } catch (error) {
    console.error('[Templates API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// Create a new template from an existing tour
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tourId, makePublic = false } = body

    if (!tourId) {
      return NextResponse.json({ message: 'Tour ID is required' }, { status: 400 })
    }

    // Get operator info
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator) {
      return NextResponse.json({ message: 'Operator not found' }, { status: 404 })
    }

    // Find the source tour
    const sourceTour = await prisma.tour.findUnique({
      where: { id: tourId }
    })

    if (!sourceTour || sourceTour.operatorId !== operator.id) {
      return NextResponse.json({ message: 'Tour not found or access denied' }, { status: 404 })
    }

    // Create a template from the tour
    const template = await prisma.tour.create({
      data: {
        ...sourceTour,
        id: undefined, // Let Prisma generate new ID
        slug: `${sourceTour.slug}-template-${Date.now()}`,
        name: `${sourceTour.name} Template`,
        isTemplate: true,
        templateId: null,
        status: 'published',
        publishedAt: new Date(),
        metadata: {
          ...(sourceTour.metadata as any || {}),
          isPublicTemplate: makePublic,
          sourceTourId: tourId,
          createdAsTemplate: true
        },
        bookingCount: 0,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      template: {
        id: template.id,
        name: template.name
      }
    })

  } catch (error) {
    console.error('[Create Template API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// Use a template to create a new tour
const createTourFromTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  price: z.number().optional(),
  customizations: z.object({
    duration: z.number().optional(),
    groupSize: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    included: z.array(z.string()).optional(),
    excluded: z.array(z.string()).optional()
  }).optional()
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createTourFromTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { templateId, name, startDate, endDate, price, customizations } = validation.data

    // Get operator info
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator) {
      return NextResponse.json({ message: 'Operator not found' }, { status: 404 })
    }

    // Find the template
    const template = await prisma.tour.findUnique({
      where: { id: templateId }
    })

    if (!template || !template.isTemplate) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 })
    }

    // Check access to template
    const hasAccess = template.operatorId === operator.id || 
                     (template.metadata as any)?.isPublicTemplate === true

    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied to this template' }, { status: 403 })
    }

    // Create new tour from template
    const newTour = await prisma.tour.create({
      data: {
        ...template,
        id: undefined, // Let Prisma generate new ID
        operatorId: operator.id, // Set to current operator
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        name,
        isTemplate: false,
        templateId: templateId,
        status: 'draft',
        publishedAt: null,
        price: price || template.price,
        groupSize: customizations?.groupSize || template.groupSize,
        included: customizations?.included || template.included,
        excluded: customizations?.excluded || template.excluded,
        duration: customizations?.duration || template.duration,
        schedule: startDate && endDate ? {
          startDate,
          endDate,
          frequency: 'once'
        } : template.schedule,
        metadata: {
          ...(template.metadata as any || {}),
          createdFromTemplate: templateId,
          createdAt: new Date().toISOString()
        },
        bookingCount: 0,
        viewCount: 0,
        rating: null,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update template usage count
    await prisma.tour.update({
      where: { id: templateId },
      data: {
        bookingCount: {
          increment: 1 // Using bookingCount to track usage
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      tour: {
        id: newTour.id,
        name: newTour.name,
        status: newTour.status
      }
    })

  } catch (error) {
    console.error('[Use Template API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to create tour from template' },
      { status: 500 }
    )
  }
}