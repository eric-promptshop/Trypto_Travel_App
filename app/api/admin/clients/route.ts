import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'

// Validation schema for client creation/update
const ClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  contactEmail: z.string().email('Invalid email format'),
  isActive: z.boolean().default(true),
  theme: z.object({
    id: z.string(),
    name: z.string(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      foreground: z.string()
    }),
    fonts: z.object({
      heading: z.string(),
      body: z.string()
    })
  }),
  features: z.object({
    enabledFeatures: z.array(z.string()),
    customFeatures: z.record(z.boolean()).optional()
  }).optional(),
  billing: z.object({
    plan: z.enum(['starter', 'professional', 'enterprise']),
    status: z.enum(['active', 'suspended', 'trial'])
  }).optional(),
  companyLogo: z.string().optional()
})

// GET /api/admin/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    const whereClause: any = {}
    if (status) {
      whereClause.isActive = status === 'active'
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get clients with pagination
    const [clients, total] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              content: true,
              leads: true,
              itineraries: true
            }
          }
        }
      }),
      prisma.tenant.count({ where: whereClause })
    ])

    // Transform data to match frontend expectations
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      domain: client.domain,
      isActive: client.isActive,
      contactEmail: (client.settings as any)?.contactEmail || '',
      companyLogo: (client.settings as any)?.companyLogo,
      theme: (client.settings as any)?.theme || {
        id: 'default',
        name: 'Default',
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
      features: (client.settings as any)?.features || {
        enabledFeatures: ['itinerary-builder'],
        customFeatures: {}
      },
      billing: (client.settings as any)?.billing || {
        plan: 'starter',
        status: 'trial'
      },
      createdAt: client.createdAt.toISOString(),
      lastModified: client.updatedAt.toISOString(),
      stats: {
        userCount: client._count.users,
        contentCount: client._count.content
      }
    }))

    const response = {
      clients: transformedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ClientSchema.parse(body)

    // Check if domain already exists
    const existingClient = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: validatedData.domain },
          { slug: validatedData.name.toLowerCase().replace(/\s+/g, '-') }
        ]
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Domain or client name already exists' },
        { status: 409 }
      )
    }

    // Create client settings object
    const settings = {
      contactEmail: validatedData.contactEmail,
      companyLogo: validatedData.companyLogo,
      theme: validatedData.theme,
      features: validatedData.features || {
        enabledFeatures: ['itinerary-builder'],
        customFeatures: {}
      },
      billing: validatedData.billing || {
        plan: 'starter',
        status: 'trial'
      },
      domains: {
        customDomain: validatedData.domain,
        verificationStatus: 'pending'
      }
    }

    // Create new client (tenant)
    const newClient = await prisma.tenant.create({
      data: {
        name: validatedData.name,
        slug: validatedData.name.toLowerCase().replace(/\s+/g, '-'),
        domain: validatedData.domain,
        isActive: validatedData.isActive,
        settings: settings
      },
      include: {
        _count: {
          select: {
            users: true,
            content: true
          }
        }
      }
    })

    // Transform response to match frontend expectations
    const responseData = {
      id: newClient.id,
      name: newClient.name,
      domain: newClient.domain,
      isActive: newClient.isActive,
      contactEmail: validatedData.contactEmail,
      companyLogo: validatedData.companyLogo,
      theme: validatedData.theme,
      features: validatedData.features,
      billing: validatedData.billing,
      createdAt: newClient.createdAt.toISOString(),
      lastModified: newClient.updatedAt.toISOString(),
      stats: {
        userCount: newClient._count.users,
        contentCount: newClient._count.content
      }
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
} 