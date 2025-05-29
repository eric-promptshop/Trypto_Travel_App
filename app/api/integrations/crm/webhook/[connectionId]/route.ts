import { NextRequest, NextResponse } from 'next/server'
import { crmManager } from '@/lib/integrations/crm-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const { connectionId } = params
    
    // Get the raw payload
    const payload = await request.json()
    
    // Verify webhook signature if needed (provider-specific)
    // TODO: Implement signature verification for security
    
    // Process the webhook
    const webhookData = await crmManager.processWebhook(connectionId, payload)
    
    console.log('Processed webhook:', {
      provider: webhookData.provider,
      eventType: webhookData.eventType,
      objectType: webhookData.objectType,
      objectId: webhookData.objectId,
      changeType: webhookData.changeType
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      eventId: `${webhookData.provider}-${webhookData.objectId}-${Date.now()}`
    })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    
    // Return 200 to prevent webhook retries for unrecoverable errors
    // Return 500 for temporary errors that should be retried
    const shouldRetry = error.message?.includes('temporary') || error.message?.includes('timeout')
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        shouldRetry 
      }, 
      { status: shouldRetry ? 500 : 200 }
    )
  }
}

// Handle webhook verification (GET request)
export async function GET(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    
    // HubSpot webhook verification
    const hubspotToken = searchParams.get('hub.verify_token')
    const hubspotChallenge = searchParams.get('hub.challenge')
    
    if (hubspotToken && hubspotChallenge) {
      // Verify the token matches what we expect
      const expectedToken = process.env.HUBSPOT_WEBHOOK_VERIFY_TOKEN
      
      if (hubspotToken === expectedToken) {
        return new NextResponse(hubspotChallenge)
      } else {
        return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 })
      }
    }
    
    // Salesforce webhook verification (different pattern)
    // Add other provider-specific verification logic here
    
    return NextResponse.json({ error: 'Unsupported verification method' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Webhook verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 