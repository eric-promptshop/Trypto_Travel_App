import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { leadService } from '@/lib/services/lead-service'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'

const leadCaptureSchema = z.object({
  email: z.string().email(),
  acceptMarketing: z.boolean().default(true),
  source: z.string(),
  triggerReason: z.enum(['exit_intent', 'time_based', 'scroll', 'save_itinerary']).optional(),
  itineraryContext: z.object({
    destination: z.string().optional(),
    duration: z.number().optional(),
    travelers: z.number().optional()
  }).optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = leadCaptureSchema.safeParse(body)
    
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.')
        }))
      )
    }
    
    const leadData = validation.data
    
    // Generate a temporary user ID for tracking
    const userId = createHash('md5')
      .update(leadData.email + Date.now().toString())
      .digest('hex')
      .substring(0, 16)
    
    // Check if lead already exists
    const existingLead = await leadService.getLeadByEmail(leadData.email)
    
    let lead
    if (existingLead) {
      // Update existing lead with new information
      lead = await leadService.updateLead(existingLead.id, {
        source: leadData.source,
        travelers: 1,
        interests: [],
        tags: generateTags(leadData),
        context: {
          ...existingLead.context,
          lastVisit: new Date().toISOString(),
          userId,
          userAgent: leadData.userAgent,
          referrer: leadData.referrer,
          triggerReason: leadData.triggerReason,
          itineraryContext: leadData.itineraryContext
        }
      })
    } else {
      // Create new lead
      lead = await leadService.createLead({
        email: leadData.email,
        source: leadData.source,
        destination: leadData.itineraryContext?.destination,
        travelers: leadData.itineraryContext?.travelers || 1,
        interests: [],
        tags: generateTags(leadData),
        optInMarketing: leadData.acceptMarketing,
        tenantId: 'default',
        sourceDetails: {
          triggerReason: leadData.triggerReason,
          userAgent: leadData.userAgent,
          referrer: leadData.referrer,
          userId
        },
        context: {
          firstVisit: new Date().toISOString(),
          userId,
          itineraryContext: leadData.itineraryContext
        }
      })
    }
    
    // Send welcome email if new lead and opted in
    if (!existingLead && leadData.acceptMarketing) {
      // TODO: Implement email service integration
      // await emailService.sendWelcomeEmail(lead.email, leadData.itineraryContext)
    }
    
    // If they have an itinerary, prepare to save it
    const response: any = {
      success: true,
      message: 'Successfully captured lead',
      userId
    }
    
    if (leadData.itineraryContext) {
      response.shouldSaveItinerary = true
      response.itineraryToken = createHash('md5')
        .update(userId + JSON.stringify(leadData.itineraryContext))
        .digest('hex')
        .substring(0, 8)
      response.leadId = lead.id
    }
    
    // Trigger webhook if configured
    if (process.env.LEAD_WEBHOOK_URL) {
      // Fire and forget webhook
      fetch(process.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'lead.captured',
          data: lead
        })
      }).catch(err => console.error('Webhook error:', err))
    }
    
    return createSuccessResponse(response)
    
  } catch (error) {
    console.error('Error capturing lead:', error)
    return createErrorResponse(
      'Failed to capture lead',
      error instanceof Error ? { message: error.message } : undefined,
      500
    )
  }
}

// Lead scoring is now handled by the leadService

function generateTags(leadData: z.infer<typeof leadCaptureSchema>): string[] {
  const tags: string[] = []
  
  // Source tags
  tags.push(`source:${leadData.source}`)
  
  // Trigger tags
  if (leadData.triggerReason) {
    tags.push(`trigger:${leadData.triggerReason}`)
  }
  
  // Marketing preference
  tags.push(leadData.acceptMarketing ? 'marketing:yes' : 'marketing:no')
  
  // Itinerary tags
  if (leadData.itineraryContext) {
    tags.push('has_itinerary')
    if (leadData.itineraryContext.destination) {
      tags.push(`destination:${leadData.itineraryContext.destination.toLowerCase().replace(/\s+/g, '_')}`)
    }
    if (leadData.itineraryContext.duration) {
      if (leadData.itineraryContext.duration <= 3) tags.push('trip:short')
      else if (leadData.itineraryContext.duration <= 7) tags.push('trip:week')
      else tags.push('trip:long')
    }
  }
  
  // Device type from user agent
  if (leadData.userAgent) {
    if (/mobile/i.test(leadData.userAgent)) tags.push('device:mobile')
    else if (/tablet/i.test(leadData.userAgent)) tags.push('device:tablet')
    else tags.push('device:desktop')
  }
  
  return tags
}

export async function GET() {
  try {
    // Get lead statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const stats = await leadService.getLeadStats({
      dateFrom: today
    })
    
    const allTimeStats = await leadService.getLeadStats({})
    
    return createSuccessResponse({
      status: 'Lead capture API is running',
      capabilities: [
        'Email capture with validation',
        'Lead scoring algorithm',
        'Itinerary context tracking',
        'Marketing preference management',
        'Webhook notifications',
        'Tag-based segmentation',
        'Database persistence',
        'Duplicate detection'
      ],
      stats: {
        totalLeads: allTimeStats.total,
        todayLeads: stats.total,
        conversionRate: allTimeStats.byStatus.converted 
          ? (allTimeStats.byStatus.converted / allTimeStats.total * 100).toFixed(2) + '%'
          : '0%',
        averageLeadScore: allTimeStats.averageScore.toFixed(1),
        byStatus: allTimeStats.byStatus,
        bySource: allTimeStats.bySource
      }
    })
  } catch (error) {
    console.error('Error fetching lead stats:', error)
    return createErrorResponse(
      'Failed to fetch statistics',
      { status: 'Lead capture API is running (stats unavailable)' },
      500
    )
  }
}