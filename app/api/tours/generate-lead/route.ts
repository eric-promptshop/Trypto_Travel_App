import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const leadRequestSchema = z.object({
  tourId: z.string().min(1),
  tourName: z.string().min(1),
  operatorName: z.string().min(1),
  travelerInfo: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    travelers: z.number().min(1),
    preferredDate: z.string().optional(),
    message: z.string().optional()
  }),
  itineraryContext: z.object({
    destination: z.string(),
    duration: z.number(),
    totalBudget: z.number().optional(),
    travelDates: z.object({
      startDate: z.string(),
      endDate: z.string()
    }),
    interests: z.array(z.string()).optional()
  }),
  leadSource: z.enum(['skeleton_itinerary', 'tour_search', 'recommendations']).default('skeleton_itinerary')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = leadRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const leadData = validation.data
    
    // Generate lead in database
    const lead = await generateLead(leadData)
    
    // Send notification to tour operator (in production)
    await notifyTourOperator(lead)
    
    return NextResponse.json({ 
      success: true, 
      leadId: lead.id,
      message: 'Lead generated successfully' 
    })
    
  } catch (error) {
    console.error('Error generating lead:', error)
    return NextResponse.json(
      { error: 'Failed to generate lead' },
      { status: 500 }
    )
  }
}

async function generateLead(data: z.infer<typeof leadRequestSchema>) {
  try {
    // For now, skip database operations due to schema mismatch
    // In production, this would create the lead in the database
    console.log('[Generate Lead] Creating lead:', {
      tourId: data.tourId,
      tourName: data.tourName,
      operatorName: data.operatorName,
      travelers: data.travelerInfo.travelers,
      destination: data.itineraryContext.destination
    })
    
    // Return lead object
    return {
      id: `lead-${Date.now()}`,
      tourId: data.tourId,
      tourName: data.tourName,
      operatorName: data.operatorName,
      travelerEmail: data.travelerInfo.email,
      travelerName: data.travelerInfo.name,
      numberOfTravelers: data.travelerInfo.travelers,
      destination: data.itineraryContext.destination,
      leadQuality: calculateLeadQuality(data),
      status: 'new',
      createdAt: new Date()
    }
    
  } catch (error) {
    console.error('Error creating lead:', error)
    throw error
  }
}

function calculateLeadQuality(data: z.infer<typeof leadRequestSchema>): 'hot' | 'warm' | 'cold' {
  let score = 0
  
  // Contact information provided
  if (data.travelerInfo.email) score += 30
  if (data.travelerInfo.name) score += 20
  if (data.travelerInfo.phone) score += 25
  
  // Travel details specificity
  if (data.travelerInfo.preferredDate) score += 20
  if (data.travelerInfo.message) score += 10
  
  // Trip planning completeness
  if (data.itineraryContext.totalBudget) score += 15
  if (data.itineraryContext.interests && data.itineraryContext.interests.length > 0) score += 10
  
  // Multi-traveler groups typically convert better
  if (data.travelerInfo.travelers >= 2) score += 10
  if (data.travelerInfo.travelers >= 4) score += 5
  
  // Longer trips indicate higher engagement
  if (data.itineraryContext.duration >= 7) score += 10
  if (data.itineraryContext.duration >= 14) score += 5
  
  // Lead source quality
  if (data.leadSource === 'skeleton_itinerary') score += 15 // High intent
  if (data.leadSource === 'recommendations') score += 10 // Medium intent
  if (data.leadSource === 'tour_search') score += 5 // Lower intent
  
  // Classify lead quality
  if (score >= 80) return 'hot'
  if (score >= 50) return 'warm'
  return 'cold'
}

async function notifyTourOperator(lead: any) {
  try {
    // In production, this would:
    // 1. Send email notification to tour operator
    // 2. Create dashboard notification
    // 3. Integrate with CRM system
    // 4. Send SMS for hot leads
    
    console.log('[Generate Lead] Notifying tour operator:', {
      tourName: lead.tourName,
      travelers: lead.numberOfTravelers,
      destination: lead.destination,
      email: lead.travelerEmail,
      leadId: lead.id
    })
    
    // Simulate external notification
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_lead',
          lead: {
            id: lead.id,
            quality: lead.leadQuality,
            tourName: lead.tourName,
            operatorName: lead.operatorName,
            travelers: lead.numberOfTravelers,
            destination: lead.destination,
            email: lead.travelerEmail
          }
        })
      })
    }
    
  } catch (error) {
    console.error('Failed to notify tour operator:', error)
    // Don't throw - lead generation should succeed even if notification fails
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get lead statistics for analytics
    const { searchParams } = new URL(request.url)
    const operatorName = searchParams.get('operator')
    const days = parseInt(searchParams.get('days') || '30')
    
    // Return demo stats for now
    // In production, this would query the actual database
    const stats = [
      { leadQuality: 'hot', status: 'new', _count: { id: 5 } },
      { leadQuality: 'warm', status: 'new', _count: { id: 12 } },
      { leadQuality: 'cold', status: 'new', _count: { id: 8 } },
      { leadQuality: 'hot', status: 'contacted', _count: { id: 3 } },
      { leadQuality: 'warm', status: 'contacted', _count: { id: 7 } }
    ]
    
    return NextResponse.json({ 
      stats,
      operatorName,
      days,
      note: 'Demo data - production would query actual lead database'
    })
    
  } catch (error) {
    console.error('Error fetching lead stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead statistics' },
      { status: 500 }
    )
  }
} 