import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'

// Validation schema for theme colors
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

// Validation schema for theme creation/update
const ThemeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Theme name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  colors: z.object({
    primary: ColorPaletteSchema,
    secondary: ColorPaletteSchema,
    accent: ColorPaletteSchema,
    neutral: ColorPaletteSchema,
    success: ColorPaletteSchema,
    warning: ColorPaletteSchema,
    error: ColorPaletteSchema,
  }),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  spacing: z.object({
    unit: z.number().default(4),
    scale: z.array(z.number()).default([0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128]),
  }).optional(),
  borderRadius: z.object({
    none: z.string().default('0'),
    sm: z.string().default('0.125rem'),
    md: z.string().default('0.375rem'),
    lg: z.string().default('0.5rem'),
    xl: z.string().default('0.75rem'),
    '2xl': z.string().default('1rem'),
    '3xl': z.string().default('1.5rem'),
    full: z.string().default('9999px'),
  }).optional(),
  shadows: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }).optional(),
})

// GET /api/admin/themes - List all themes
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
    const tenantId = searchParams.get('tenantId')
    const includeDefaults = searchParams.get('includeDefaults') !== 'false'

    // Build where clause
    const whereClause: any = {
      contentType: 'theme',
    }

    if (tenantId) {
      if (includeDefaults) {
        whereClause.OR = [
          { tenantId: tenantId },
          { tenantId: 'default' }
        ]
      } else {
        whereClause.tenantId = tenantId
      }
    } else if (session.user.role === 'SUPER_ADMIN') {
      // Super admins can see all themes
    } else {
      // Regular admins only see their tenant's themes and defaults
      whereClause.OR = [
        { tenantId: session.user.tenantId },
        { tenantId: 'default' }
      ]
    }

    // Get themes from TenantContent table
    const themes = await prisma.tenantContent.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' }, // 'default' themes first
        { updatedAt: 'desc' }
      ],
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

    // Transform themes to match frontend expectations
    const transformedThemes = themes.map(theme => {
      const content = theme.content as any || {}
      return {
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
        }
      }
    })

    return NextResponse.json({ themes: transformedThemes })
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/themes - Create new theme
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
    const validatedData = ThemeSchema.parse(body)

    // Determine tenant ID
    const tenantId = body.tenantId || session.user.tenantId || 'default'

    // Check if theme ID already exists for this tenant
    const existingTheme = await prisma.tenantContent.findFirst({
      where: {
        contentType: 'theme',
        tenantId: tenantId,
        title: validatedData.name,
      }
    })

    if (existingTheme) {
      return NextResponse.json(
        { error: 'Theme with this name already exists' },
        { status: 409 }
      )
    }

    // Create the theme
    const newTheme = await prisma.tenantContent.create({
      data: {
        contentType: 'theme',
        title: validatedData.name,
        content: {
          id: validatedData.id,
          description: validatedData.description,
          colors: validatedData.colors,
          fonts: validatedData.fonts,
          spacing: validatedData.spacing,
          borderRadius: validatedData.borderRadius,
          shadows: validatedData.shadows,
        },
        status: 'draft',
        category: validatedData.isDefault ? 'default' : 'custom',
        tenantId: tenantId,
        authorId: session.user.id,
        metadata: {
          version: '1.0.0',
          lastDeployedAt: null,
        }
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
    if (session.user.id && tenantId) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          resource: 'theme',
          resourceId: newTheme.id,
          tenantId: tenantId,
          userId: session.user.id,
          newValues: body,
        }
      })
    }

    // Transform response
    const responseData = {
      id: newTheme.id,
      name: newTheme.title,
      description: (newTheme.content as any).description,
      isDefault: newTheme.category === 'default',
      isActive: newTheme.status === 'published',
      tenantId: newTheme.tenantId,
      tenantName: newTheme.tenant.name,
      ...(newTheme.content as any),
      metadata: {
        author: newTheme.author,
        createdAt: newTheme.createdAt.toISOString(),
        updatedAt: newTheme.updatedAt.toISOString(),
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

    console.error('Error creating theme:', error)
    return NextResponse.json(
      { error: 'Failed to create theme' },
      { status: 500 }
    )
  }
}