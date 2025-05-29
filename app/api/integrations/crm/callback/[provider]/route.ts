import { NextRequest, NextResponse } from 'next/server'
import { crmManager } from '@/lib/integrations/crm-manager'
import { CRMProvider } from '@/lib/integrations/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=missing_code_or_state`
      )
    }

    // Extract tenant ID from state
    const [tenantId] = state.split('-')
    if (!tenantId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=invalid_state`
      )
    }

    const provider = params.provider.toUpperCase() as CRMProvider
    if (!Object.values(CRMProvider).includes(provider)) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=invalid_provider`
      )
    }

    // Default CRM settings - these would typically come from user input
    const defaultSettings = {
      syncDirection: 'bidirectional' as const,
      syncFrequency: 60, // 1 hour
      fieldMappings: [
        {
          internalField: 'email',
          crmField: 'email',
          direction: 'bidirectional' as const
        },
        {
          internalField: 'firstName',
          crmField: 'firstname',
          direction: 'bidirectional' as const
        },
        {
          internalField: 'lastName',
          crmField: 'lastname',
          direction: 'bidirectional' as const
        }
      ],
      enableRealTimeSync: true
    }

    // Create the CRM connection
    const connection = await crmManager.createConnection(
      tenantId,
      provider,
      code,
      defaultSettings
    )

    // Test the connection
    const isValid = await crmManager.testConnection(connection.id)
    if (!isValid) {
      await crmManager.deleteConnection(connection.id)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=connection_test_failed`
      )
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=true&provider=${provider.toLowerCase()}&connection=${connection.id}`
    )

  } catch (error: any) {
    console.error('CRM callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent(error.message || 'callback_failed')}`
    )
  }
} 