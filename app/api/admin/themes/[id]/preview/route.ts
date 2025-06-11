import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { ThemeService } from '@/lib/services/admin/theme-service'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/admin/themes/[id]/preview - Preview theme
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

    // Parse request body for temporary overrides
    const body = await request.json()
    const { temporaryOverrides } = body

    // Get tenant ID from session or request
    const tenantId = body.tenantId || session.user.tenantId || 'default'

    // Preview the theme
    const previewData = await ThemeService.previewTheme({
      tenantId,
      themeId: params.id,
      temporaryOverrides
    })

    return NextResponse.json({
      success: true,
      preview: previewData
    })
  } catch (error) {
    console.error('Error previewing theme:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to preview theme' 
      },
      { status: 500 }
    )
  }
}