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

// POST /api/admin/themes/[id]/deploy - Deploy theme
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
    const { deployToProduction = false } = body

    // Get tenant ID from session or request
    const tenantId = body.tenantId || session.user.tenantId
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    // Deploy the theme
    const deploymentResult = await ThemeService.deployTheme({
      tenantId,
      themeId: params.id,
      deployToProduction
    })

    // Log the deployment
    if (session.user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'DEPLOY',
          resource: 'theme',
          resourceId: params.id,
          tenantId: tenantId,
          userId: session.user.id,
          newValues: {
            deployToProduction,
            ...deploymentResult.deploymentInfo
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      deployment: deploymentResult.deploymentInfo
    })
  } catch (error) {
    console.error('Error deploying theme:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to deploy theme' 
      },
      { status: 500 }
    )
  }
}