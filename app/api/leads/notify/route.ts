import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email/email-service'
import { z } from 'zod'

const notifySchema = z.object({
  leadId: z.string(),
  operatorId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // This endpoint can be called by the system or authenticated users
    const body = await request.json()
    const validation = notifySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { leadId, operatorId } = validation.data

    // Fetch lead with operator details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        operator: {
          include: {
            users: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify operator if specified
    if (operatorId && lead.operatorId !== operatorId) {
      return NextResponse.json(
        { error: 'Lead does not belong to specified operator' },
        { status: 403 }
      )
    }

    // Check if operator has email notifications enabled
    const operatorSettings = lead.operator.settings as any
    if (operatorSettings?.notifications?.email === false) {
      return NextResponse.json({
        message: 'Email notifications disabled for this operator',
        notificationSent: false
      })
    }

    // Get primary operator user (first user associated with operator)
    const operatorUser = lead.operator.users[0]
    if (!operatorUser) {
      return NextResponse.json(
        { error: 'No user found for operator' },
        { status: 404 }
      )
    }

    // Parse lead data
    const leadData = lead.data as any || {}
    const interests = leadData.interests || []
    const travelDates = leadData.startDate && leadData.endDate
      ? `${new Date(leadData.startDate).toLocaleDateString()} - ${new Date(leadData.endDate).toLocaleDateString()}`
      : leadData.travelDates

    // Construct dashboard URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://tripnav.ai'
    const dashboardUrl = `${baseUrl}/operator/leads/${lead.id}`

    // Send email notification
    try {
      await emailService.sendLeadNotification({
        operatorEmail: lead.operator.email,
        operatorName: operatorUser.profile?.firstName || lead.operator.businessName,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone || undefined,
        destination: leadData.destination || 'Unknown destination',
        travelDates,
        travelers: leadData.travelers,
        interests,
        message: leadData.message,
        leadScore: lead.score || undefined,
        dashboardUrl
      })

      // Update lead to mark notification as sent
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          data: {
            ...leadData,
            notificationSent: true,
            notificationSentAt: new Date().toISOString()
          }
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'notify',
          resource: 'lead',
          resourceId: lead.id,
          tenantId: lead.tenantId,
          userId: session?.user?.id || 'system',
          metadata: {
            operatorId: lead.operatorId,
            emailSent: true
          }
        }
      })

      return NextResponse.json({
        message: 'Lead notification sent successfully',
        notificationSent: true,
        leadId: lead.id
      })

    } catch (emailError) {
      console.error('Failed to send lead notification email:', emailError)
      
      // Log the failure but don't fail the request
      await prisma.auditLog.create({
        data: {
          action: 'notify_failed',
          resource: 'lead',
          resourceId: lead.id,
          tenantId: lead.tenantId,
          userId: session?.user?.id || 'system',
          metadata: {
            operatorId: lead.operatorId,
            error: emailError instanceof Error ? emailError.message : 'Unknown error'
          }
        }
      })

      return NextResponse.json({
        message: 'Lead notification failed',
        notificationSent: false,
        error: 'Email service error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Lead notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send lead notification' },
      { status: 500 }
    )
  }
}