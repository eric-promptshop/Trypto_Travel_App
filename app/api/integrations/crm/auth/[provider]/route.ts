import { NextRequest, NextResponse } from 'next/server'
import { crmManager } from '@/lib/integrations/crm-manager'
import { CRMProvider } from '@/lib/integrations/types'

// Simple session validation - replace with your actual auth implementation
async function getSession(request: NextRequest) {
  // This is a placeholder - implement based on your auth system
  // For now, we'll assume tenant ID is passed in headers
  const tenantId = request.headers.get('x-tenant-id')
  const userId = request.headers.get('x-user-id')
  
  if (!tenantId || !userId) {
    return null
  }
  
  return {
    user: {
      id: userId,
      tenantId: tenantId
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = params.provider.toUpperCase() as CRMProvider
    if (!Object.values(CRMProvider).includes(provider)) {
      return NextResponse.json({ error: 'Invalid CRM provider' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const redirectUri = searchParams.get('redirect_uri') || `${process.env.NEXTAUTH_URL}/api/integrations/crm/callback/${provider.toLowerCase()}`
    const state = searchParams.get('state') || `${session.user.tenantId}-${Date.now()}`

    const authUrl = crmManager.getAuthorizationUrl(provider, redirectUri, state)

    return NextResponse.json({
      authUrl,
      state,
      provider
    })
  } catch (error: any) {
    console.error('CRM auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error.message },
      { status: 500 }
    )
  }
} 