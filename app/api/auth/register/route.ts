import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  role: z.string().default('USER'),
  companyName: z.string().optional(),
  tenantId: z.string().optional(),
  phoneNumber: z.string().optional(),
  onboardingData: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.format() },
        { status: 400 }
      )
    }
    
    const { email, password, name, role, companyName, tenantId, phoneNumber, onboardingData } = validation.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create tenant if it's a tour operator and no tenantId provided
    let finalTenantId = tenantId || 'default'
    
    if (role === 'TOUR_OPERATOR' && companyName && !tenantId) {
      // Create a slug from company name
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Check if tenant with this slug exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug }
      })
      
      if (!existingTenant) {
        // Create new tenant
        const newTenant = await prisma.tenant.create({
          data: {
            name: companyName,
            slug,
            domain: `${slug}.tripnav.com`, // You can customize this
            settings: {
              onboardingData,
              phoneNumber,
              primaryContact: email
            }
          }
        })
        
        finalTenantId = newTenant.id
      } else {
        finalTenantId = existingTenant.id
      }
    }
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        tenantId: finalTenantId,
        // Store hashed password in a separate table or field
        // For now, we'll store it in the Account table
      }
    })
    
    // Create an account record for credentials
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: email,
        // In a real app, you'd store this in a separate password table
        // For demo purposes, we'll use the refresh_token field
        refresh_token: hashedPassword
      }
    })
    
    // If tour operator, store additional onboarding data
    if (role === 'TOUR_OPERATOR' && onboardingData) {
      // Store onboarding data in tenant settings or a separate table
      await prisma.tenant.update({
        where: { id: finalTenantId },
        data: {
          settings: {
            ...(await prisma.tenant.findUnique({ where: { id: finalTenantId } }))?.settings as any,
            onboardingData,
            setupComplete: false
          }
        }
      })
    }
    
    return NextResponse.json({
      message: 'User created successfully',
      userId: user.id,
      tenantId: finalTenantId
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Failed to create user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}