import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/crm/services/webhook-service';
import { CrmType } from '@/lib/crm/types/crm-integration';

/**
 * CRM Webhook Handler
 * 
 * Receives webhooks from various CRM systems.
 * URL pattern: /api/webhooks/crm?source=hubspot&event=contact.created
 */
export async function POST(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') as CrmType;
    const event = searchParams.get('event');
    
    // Validate parameters
    if (!source || !event) {
      return NextResponse.json(
        { error: 'Missing required parameters: source and event' },
        { status: 400 }
      );
    }
    
    // Validate CRM type
    const validTypes: CrmType[] = ['hubspot', 'salesforce', 'zoho'];
    if (!validTypes.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get signature header (CRM-specific)
    let signature: string | undefined;
    switch (source) {
      case 'hubspot':
        signature = request.headers.get('X-HubSpot-Signature-v3') || undefined;
        break;
      case 'salesforce':
        signature = request.headers.get('X-SFDC-Signature') || undefined;
        break;
      case 'zoho':
        signature = request.headers.get('X-Zoho-Signature') || undefined;
        break;
    }
    
    // Parse request body
    const payload = await request.json();
    
    // Log webhook receipt
    console.log(`[Webhook] Received ${source} webhook:`, {
      event,
      hasSignature: !!signature,
      payloadKeys: Object.keys(payload)
    });
    
    // Process webhook
    const webhookService = WebhookService.getInstance();
    const result = await webhookService.handleIncomingWebhook(
      source,
      event,
      payload,
      signature
    );
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        metadata: result.metadata
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to process webhook' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Webhook verification endpoint
 * Some CRMs require a GET endpoint for webhook verification
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source');
    const challenge = searchParams.get('challenge');
    
    // HubSpot webhook verification
    if (source === 'hubspot' && challenge) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Salesforce webhook verification
    if (source === 'salesforce') {
      return NextResponse.json({ verified: true });
    }
    
    // Default response
    return NextResponse.json({
      status: 'ready',
      message: 'CRM webhook endpoint is active',
      supportedSources: ['hubspot', 'salesforce', 'zoho']
    });
  } catch (error) {
    console.error('[Webhook] Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 