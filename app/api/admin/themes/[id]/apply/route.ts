import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { ThemeService } from '@/lib/services/admin/theme-service'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/admin/themes/[id]/apply - Apply theme to tenant
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

    // Parse request body
    const body = await request.json()
    
    // Get tenant ID from request or session
    const tenantId = body.tenantId || session.user.tenantId
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    // Check if user has access to modify this tenant
    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Cannot modify other tenants' }, { status: 403 })
    }

    // Apply the theme
    const result = await ThemeService.applyThemeToTenant(tenantId, params.id)

    // Log the action
    if (session.user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'APPLY_THEME',
          resource: 'tenant',
          resourceId: tenantId,
          tenantId: tenantId,
          userId: session.user.id,
          newValues: {
            themeId: params.id,
            theme: result.theme
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Theme applied successfully',
      theme: result.theme
    })
  } catch (error) {
    console.error('Error applying theme:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to apply theme' 
      },
      { status: 500 }
    )
  }
}