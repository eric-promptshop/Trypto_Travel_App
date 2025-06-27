import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createOperatorSchema = z.object({
  businessName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  timezone: z.string().default('UTC'),
  languages: z.array(z.string()).default(['English']),
  currencies: z.array(z.string()).default(['USD']),
})

const updateOperatorSchema = createOperatorSchema.partial()

// GET /api/operators - List operators (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Get operators with pagination
    const [operators, total] = await Promise.all([
      prisma.operator.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
              tours: true,
              leads: true,
              bookings: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.operator.count({ where })
    ])
    
    return NextResponse.json({
      operators,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching operators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    )
  }
}

// POST /api/operators - Create new operator (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = createOperatorSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Generate slug from business name
    const baseSlug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Ensure unique slug
    let slug = baseSlug
    let counter = 1
    while (await prisma.operator.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    // Create operator
    const operator = await prisma.operator.create({
      data: {
        ...data,
        slug,
        status: 'pending',
        tenantId: session.user.tenantId || 'default',
        settings: {
          notifications: {
            email: true,
            sms: false,
            webhook: false
          },
          features: {
            aiTourScraping: true,
            leadEnrichment: true,
            widgetBuilder: true,
            integrationHub: true
          }
        }
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'operator',
        resourceId: operator.id,
        tenantId: operator.tenantId,
        userId: session.user.id,
        newValues: operator as any,
      }
    })
    
    return NextResponse.json({ operator }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating operator:', error)
    return NextResponse.json(
      { error: 'Failed to create operator' },
      { status: 500 }
    )
  }
}