import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'

// Validation schema for client updates
const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').optional(),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format').optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  isActive: z.boolean().optional(),
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
  }).optional(),
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

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/admin/clients/[id] - Get single client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const client = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            content: true,
            leads: true,
            itineraries: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Transform data to match frontend expectations
    const responseData = {
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
        contentCount: client._count.content,
        leadCount: client._count.leads,
        itineraryCount: client._count.itineraries
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/clients/[id] - Update client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
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
    const validatedData = UpdateClientSchema.parse(body)

    // Check if client exists
    const existingClient = await prisma.tenant.findUnique({
      where: { id: params.id }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if domain is being changed and if it conflicts
    if (validatedData.domain && validatedData.domain !== existingClient.domain) {
      const domainConflict = await prisma.tenant.findFirst({
        where: {
          domain: validatedData.domain,
          id: { not: params.id }
        }
      })

      if (domainConflict) {
        return NextResponse.json(
          { error: 'Domain already exists' },
          { status: 409 }
        )
      }
    }

    // Merge settings
    const currentSettings = (existingClient.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      ...(validatedData.contactEmail && { contactEmail: validatedData.contactEmail }),
      ...(validatedData.companyLogo && { companyLogo: validatedData.companyLogo }),
      ...(validatedData.theme && { theme: validatedData.theme }),
      ...(validatedData.features && { features: validatedData.features }),
      ...(validatedData.billing && { billing: validatedData.billing })
    }

    // Update client
    const updatedClient = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { 
          name: validatedData.name,
          slug: validatedData.name.toLowerCase().replace(/\s+/g, '-')
        }),
        ...(validatedData.domain && { domain: validatedData.domain }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        settings: updatedSettings
      },
      include: {
        _count: {
          select: {
            users: true,
            content: true,
            leads: true,
            itineraries: true
          }
        }
      }
    })

    // Transform response
    const responseData = {
      id: updatedClient.id,
      name: updatedClient.name,
      domain: updatedClient.domain,
      isActive: updatedClient.isActive,
      contactEmail: updatedSettings.contactEmail || '',
      companyLogo: updatedSettings.companyLogo,
      theme: updatedSettings.theme,
      features: updatedSettings.features,
      billing: updatedSettings.billing,
      createdAt: updatedClient.createdAt.toISOString(),
      lastModified: updatedClient.updatedAt.toISOString(),
      stats: {
        userCount: updatedClient._count.users,
        contentCount: updatedClient._count.content,
        leadCount: updatedClient._count.leads,
        itineraryCount: updatedClient._count.itineraries
      }
    }

    return NextResponse.json(responseData)
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

    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/clients/[id] - Delete client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if client exists
    const existingClient = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            content: true,
            leads: true,
            itineraries: true
          }
        }
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Prevent deletion if client has data
    const hasData = existingClient._count.users > 0 || 
                   existingClient._count.content > 0 || 
                   existingClient._count.leads > 0 ||
                   existingClient._count.itineraries > 0

    if (hasData) {
      return NextResponse.json(
        { 
          error: 'Cannot delete client with existing data. Please transfer or delete all associated data first.',
          details: {
            users: existingClient._count.users,
            content: existingClient._count.content,
            leads: existingClient._count.leads,
            itineraries: existingClient._count.itineraries
          }
        },
        { status: 409 }
      )
    }

    // Delete client
    await prisma.tenant.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Client deleted successfully',
      deletedClient: {
        id: existingClient.id,
        name: existingClient.name,
        domain: existingClient.domain
      }
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
} 