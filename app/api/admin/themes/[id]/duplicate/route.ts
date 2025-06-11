import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { ThemeService } from '@/lib/services/admin/theme-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const DuplicateThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  targetTenantId: z.string().optional()
})

// POST /api/admin/themes/[id]/duplicate - Duplicate theme
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = DuplicateThemeSchema.parse(body)
    
    // Determine target tenant
    const targetTenantId = validatedData.targetTenantId || session.user.tenantId || 'default'
    
    // Check if user has access to create themes in target tenant
    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== targetTenantId) {
      return NextResponse.json({ error: 'Cannot create themes in other tenants' }, { status: 403 })
    }

    // Check if a theme with the same name already exists in the target tenant
    const existingTheme = await prisma.tenantContent.findFirst({
      where: {
        contentType: 'theme',
        title: validatedData.name,
        tenantId: targetTenantId
      }
    })

    if (existingTheme) {
      return NextResponse.json(
        { error: 'A theme with this name already exists' },
        { status: 409 }
      )
    }

    // Duplicate the theme
    const duplicatedTheme = await ThemeService.duplicateTheme(
      params.id,
      validatedData.name,
      targetTenantId,
      session.user.id
    )

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'DUPLICATE',
        resource: 'theme',
        resourceId: duplicatedTheme.id,
        tenantId: targetTenantId,
        userId: session.user.id,
        newValues: {
          duplicatedFrom: params.id,
          newName: validatedData.name
        }
      }
    })

    // Transform response
    const content = duplicatedTheme.content as any || {}
    const responseData = {
      id: duplicatedTheme.id,
      name: duplicatedTheme.title,
      description: content.description,
      isDefault: false,
      isActive: duplicatedTheme.status === 'published',
      tenantId: duplicatedTheme.tenantId,
      ...content,
      metadata: {
        createdAt: duplicatedTheme.createdAt.toISOString(),
        updatedAt: duplicatedTheme.updatedAt.toISOString(),
        duplicatedFrom: params.id,
        version: '1.0.0'
      }
    }

    return NextResponse.json({
      success: true,
      theme: responseData
    })
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

    console.error('Error duplicating theme:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to duplicate theme' 
      },
      { status: 500 }
    )
  }
}