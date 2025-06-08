import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'

// Reuse the validation schema from parent route
const ColorPaletteSchema = z.object({
  50: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  100: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  200: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  300: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  400: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  500: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  600: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  700: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  800: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  900: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  950: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

const UpdateThemeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  colors: z.object({
    primary: ColorPaletteSchema,
    secondary: ColorPaletteSchema,
    accent: ColorPaletteSchema,
    neutral: ColorPaletteSchema,
    success: ColorPaletteSchema,
    warning: ColorPaletteSchema,
    error: ColorPaletteSchema,
  }).optional(),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }).optional(),
  spacing: z.object({
    unit: z.number(),
    scale: z.array(z.number()),
  }).optional(),
  borderRadius: z.object({
    none: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
    '2xl': z.string(),
    '3xl': z.string(),
    full: z.string(),
  }).optional(),
  shadows: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }).optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/admin/themes/[id] - Get single theme
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

    const theme = await prisma.tenantContent.findUnique({
      where: { 
        id: params.id,
        contentType: 'theme'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Check if user has access to this theme
    if (session.user.role !== 'SUPER_ADMIN' && 
        theme.tenantId !== session.user.tenantId && 
        theme.tenantId !== 'default') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Transform response
    const content = theme.content as any || {}
    const responseData = {
      id: theme.id,
      name: theme.title,
      description: content.description,
      isDefault: theme.category === 'default',
      isActive: theme.status === 'published',
      tenantId: theme.tenantId,
      tenantName: theme.tenant.name,
      ...content,
      metadata: {
        author: theme.author,
        createdAt: theme.createdAt.toISOString(),
        updatedAt: theme.updatedAt.toISOString(),
        version: theme.metadata ? (theme.metadata as any).version : '1.0.0',
        lastDeployedAt: theme.metadata ? (theme.metadata as any).lastDeployedAt : null,
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching theme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/themes/[id] - Update theme
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
    const validatedData = UpdateThemeSchema.parse(body)

    // Check if theme exists
    const existingTheme = await prisma.tenantContent.findUnique({
      where: { 
        id: params.id,
        contentType: 'theme'
      }
    })

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Check if user has access to this theme
    if (session.user.role !== 'SUPER_ADMIN' && 
        existingTheme.tenantId !== session.user.tenantId && 
        existingTheme.category === 'default') {
      return NextResponse.json({ error: 'Cannot modify default themes' }, { status: 403 })
    }

    // Prepare content update
    const currentContent = (existingTheme.content as any) || {}
    const updatedContent = {
      ...currentContent,
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.colors && { colors: validatedData.colors }),
      ...(validatedData.fonts && { fonts: validatedData.fonts }),
      ...(validatedData.spacing && { spacing: validatedData.spacing }),
      ...(validatedData.borderRadius && { borderRadius: validatedData.borderRadius }),
      ...(validatedData.shadows && { shadows: validatedData.shadows }),
    }

    // Update theme
    const updatedTheme = await prisma.tenantContent.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { title: validatedData.name }),
        content: updatedContent,
        updatedAt: new Date(),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Log the action
    if (session.user.id && existingTheme.tenantId) {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          resource: 'theme',
          resourceId: params.id,
          tenantId: existingTheme.tenantId,
          userId: session.user.id,
          oldValues: existingTheme.content,
          newValues: updatedContent,
        }
      })
    }

    // Transform response
    const responseData = {
      id: updatedTheme.id,
      name: updatedTheme.title,
      description: updatedContent.description,
      isDefault: updatedTheme.category === 'default',
      isActive: updatedTheme.status === 'published',
      tenantId: updatedTheme.tenantId,
      tenantName: updatedTheme.tenant.name,
      ...updatedContent,
      metadata: {
        author: updatedTheme.author,
        createdAt: updatedTheme.createdAt.toISOString(),
        updatedAt: updatedTheme.updatedAt.toISOString(),
        version: updatedTheme.metadata ? (updatedTheme.metadata as any).version : '1.0.0',
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

    console.error('Error updating theme:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/themes/[id] - Delete theme
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

    // Check if theme exists
    const existingTheme = await prisma.tenantContent.findUnique({
      where: { 
        id: params.id,
        contentType: 'theme'
      }
    })

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Prevent deletion of default themes
    if (existingTheme.category === 'default') {
      return NextResponse.json({ error: 'Cannot delete default themes' }, { status: 403 })
    }

    // Check if user has access to this theme
    if (session.user.role !== 'SUPER_ADMIN' && 
        existingTheme.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if theme is in use
    const tenantsUsingTheme = await prisma.tenant.findMany({
      where: {
        settings: {
          path: ['theme', 'id'],
          equals: existingTheme.id
        }
      }
    })

    if (tenantsUsingTheme.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete theme that is currently in use',
          details: {
            usedBy: tenantsUsingTheme.map(t => ({ id: t.id, name: t.name }))
          }
        },
        { status: 409 }
      )
    }

    // Delete theme
    await prisma.tenantContent.delete({
      where: { id: params.id }
    })

    // Log the action
    if (session.user.id && existingTheme.tenantId) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          resource: 'theme',
          resourceId: params.id,
          tenantId: existingTheme.tenantId,
          userId: session.user.id,
          oldValues: existingTheme.content,
        }
      })
    }

    return NextResponse.json({ 
      message: 'Theme deleted successfully',
      deletedTheme: {
        id: existingTheme.id,
        name: existingTheme.title,
      }
    })
  } catch (error) {
    console.error('Error deleting theme:', error)
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    )
  }
}

// POST /api/admin/themes/[id]/publish - Publish/activate theme
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action !== 'publish' && action !== 'unpublish') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if theme exists
    const theme = await prisma.tenantContent.findUnique({
      where: { 
        id: params.id,
        contentType: 'theme'
      }
    })

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Check if user has access to this theme
    if (session.user.role !== 'SUPER_ADMIN' && 
        theme.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update theme status
    const updatedTheme = await prisma.tenantContent.update({
      where: { id: params.id },
      data: {
        status: action === 'publish' ? 'published' : 'draft',
        metadata: {
          ...(theme.metadata as any || {}),
          lastDeployedAt: action === 'publish' ? new Date().toISOString() : null,
        }
      }
    })

    // Log the action
    if (session.user.id && theme.tenantId) {
      await prisma.auditLog.create({
        data: {
          action: action === 'publish' ? 'PUBLISH' : 'UNPUBLISH',
          resource: 'theme',
          resourceId: params.id,
          tenantId: theme.tenantId,
          userId: session.user.id,
        }
      })
    }

    return NextResponse.json({ 
      message: `Theme ${action === 'publish' ? 'published' : 'unpublished'} successfully`,
      status: updatedTheme.status
    })
  } catch (error) {
    console.error('Error publishing theme:', error)
    return NextResponse.json(
      { error: 'Failed to publish theme' },
      { status: 500 }
    )
  }
}