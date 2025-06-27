import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const verifyOperatorSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  notes: z.string().optional(),
  verificationDetails: z.object({
    businessRegistration: z.boolean(),
    insuranceCoverage: z.boolean(),
    licenseValid: z.boolean(),
    financialStanding: z.boolean(),
    customerReviews: z.boolean(),
  }).optional(),
})

interface RouteParams {
  params: {
    operatorId: string
  }
}

// POST /api/operators/[operatorId]/verify - Verify operator (admin only)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can verify operators
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { operatorId } = params
    const body = await request.json()
    const validation = verifyOperatorSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { status, notes, verificationDetails } = validation.data
    
    // Get current operator
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    })
    
    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }
    
    if (operator.status === 'verified') {
      return NextResponse.json(
        { error: 'Operator is already verified' },
        { status: 400 }
      )
    }
    
    // Update operator verification status
    const updatedOperator = await prisma.operator.update({
      where: { id: operatorId },
      data: {
        status,
        verifiedAt: status === 'verified' ? new Date() : null,
        settings: {
          ...operator.settings as any,
          verification: {
            verifiedBy: session.user.id,
            verifiedAt: new Date(),
            notes,
            details: verificationDetails
          }
        }
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'verify',
        resource: 'operator',
        resourceId: operatorId,
        tenantId: operator.tenantId,
        userId: session.user.id,
        oldValues: { status: operator.status },
        newValues: { status, notes, verificationDetails },
      }
    })
    
    // Send notification email to operator
    if (status === 'verified') {
      await sendVerificationEmail(operator.email, operator.businessName, true)
    } else {
      await sendVerificationEmail(operator.email, operator.businessName, false, notes)
    }
    
    // If verified, create welcome content
    if (status === 'verified') {
      await createWelcomeContent(operatorId)
    }
    
    return NextResponse.json({
      operator: updatedOperator,
      message: `Operator ${status === 'verified' ? 'verified' : 'rejected'} successfully`
    })
    
  } catch (error) {
    console.error('Error verifying operator:', error)
    return NextResponse.json(
      { error: 'Failed to verify operator' },
      { status: 500 }
    )
  }
}

// Helper function to send verification emails
async function sendVerificationEmail(
  email: string,
  businessName: string,
  verified: boolean,
  notes?: string
) {
  // In production, integrate with email service
  // TODO: Implement actual email sending via SendGrid/SES/etc
}

// Helper function to create welcome content for new operators
async function createWelcomeContent(operatorId: string) {
  try {
    // Create sample tours
    const sampleTours = [
      {
        operatorId,
        name: 'Sample City Tour',
        slug: 'sample-city-tour',
        description: 'This is a sample tour to help you get started. Feel free to edit or delete it.',
        shortDescription: 'A sample tour to demonstrate the platform features',
        destination: 'Your City',
        duration: 240, // 4 hours
        durationType: 'hours',
        price: 50,
        currency: 'USD',
        priceType: 'per_person',
        categories: ['Sample', 'City Tour'],
        languages: ['English'],
        images: {
          main: '/placeholder.jpg',
          gallery: []
        },
        highlights: [
          'This is a sample highlight',
          'Edit this tour to add your own content',
          'Use AI scraping to import tours from your website'
        ],
        included: ['Professional guide', 'Transportation'],
        excluded: ['Meals', 'Personal expenses'],
        status: 'draft',
        metadata: {
          isWelcomeSample: true
        }
      }
    ]
    
    await prisma.tour.createMany({
      data: sampleTours
    })
    
    // Create welcome lead
    await prisma.leadEnhanced.create({
      data: {
        email: 'sample@traveler.com',
        firstName: 'Sample',
        lastName: 'Lead',
        source: 'welcome_sample',
        destination: 'Paris, France',
        travelers: 2,
        interests: ['culture', 'food', 'history'],
        score: 75,
        status: 'new',
        operatorId,
        tenantId: 'default',
        context: {
          isWelcomeSample: true,
          message: 'This is a sample lead to demonstrate the lead management features.'
        }
      }
    })
    
  } catch (error) {
    console.error('Error creating welcome content:', error)
  }
}