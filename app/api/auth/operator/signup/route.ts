import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOperatorAccount } from '@/lib/auth/operator-auth'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  businessName: z.string().min(2),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    country: z.string().min(1),
    postalCode: z.string().optional(),
  }),
  timezone: z.string(),
  languages: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    try {
      const result = await createOperatorAccount(data)

      // Return success response
      return NextResponse.json({
        message: 'Operator account created successfully',
        operator: {
          id: result.operator.id,
          businessName: result.operator.businessName,
          slug: result.operator.slug,
          status: result.operator.status
        }
      }, { status: 201 })

    } catch (error: any) {
      // Handle specific errors
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      throw error
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create operator account' },
      { status: 500 }
    )
  }
}