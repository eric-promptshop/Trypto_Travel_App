import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Operator-specific authentication configuration
export const operatorAuthOptions: Partial<NextAuthOptions> = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { 
            operator: true,
            profile: true 
          }
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        // Check if user is an operator
        if (!user.operator) {
          throw new Error('Not an operator account')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Check if operator is active
        if (user.operator.status !== 'active' && user.operator.status !== 'pending') {
          throw new Error('Operator account is not active')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.email,
          role: 'TOUR_OPERATOR',
          operatorId: user.operator.id,
          operatorStatus: user.operator.status,
          image: user.profile?.avatar
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'TOUR_OPERATOR'
        token.operatorId = user.operatorId
        token.operatorStatus = user.operatorStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.operatorId = token.operatorId as string
        session.user.operatorStatus = token.operatorStatus as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/operator/signin',
    error: '/auth/operator/error'
  }
}

// Helper function to check if user is authenticated as operator
export async function requireOperatorAuth(userId: string): Promise<{
  operator: any
  user: any
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      operator: {
        include: {
          tours: true,
          leads: true,
          bookings: true
        }
      },
      profile: true
    }
  })

  if (!user || !user.operator) {
    throw new Error('Not authorized as operator')
  }

  if (user.operator.status !== 'active') {
    throw new Error('Operator account is not active')
  }

  return { operator: user.operator, user }
}

// Create operator account
export async function createOperatorAccount(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  businessName: string
  website?: string
  phone?: string
  description?: string
  address: {
    street?: string
    city: string
    state?: string
    country: string
    postalCode?: string
  }
  timezone: string
  languages?: string[]
}) {
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12)

  // Generate operator slug
  const baseSlug = data.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  
  let slug = baseSlug
  let counter = 1
  while (await prisma.operator.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  // Create user, profile, and operator in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        emailVerified: null, // Require email verification
        tenantId: 'default'
      }
    })

    // Create profile
    const profile = await tx.profile.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      }
    })

    // Create operator
    const operator = await tx.operator.create({
      data: {
        businessName: data.businessName,
        slug,
        email: data.email,
        phone: data.phone,
        website: data.website,
        description: data.description,
        address: data.address,
        timezone: data.timezone,
        languages: data.languages || ['English'],
        currencies: ['USD'],
        status: 'pending', // Require admin approval
        tenantId: 'default',
        settings: {
          notifications: {
            email: true,
            sms: false,
            webhook: false
          },
          features: {
            aiTourScraping: true,
            leadEnrichment: true,
            widgetBuilder: true,
            integrationHub: true
          },
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          }
        },
        users: {
          connect: { id: user.id }
        }
      }
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'create',
        resource: 'operator',
        resourceId: operator.id,
        tenantId: 'default',
        userId: user.id,
        newValues: {
          businessName: operator.businessName,
          email: operator.email,
          status: operator.status
        }
      }
    })

    return { user, profile, operator }
  })

  // Send welcome email
  try {
    const { emailService } = await import('@/lib/email/email-service')
    const baseUrl = process.env.NEXTAUTH_URL || 'https://tripnav.ai'
    
    await emailService.sendWelcomeOperator({
      operatorEmail: data.email,
      operatorName: data.firstName,
      businessName: data.businessName,
      dashboardUrl: `${baseUrl}/operator/dashboard`,
      setupGuideUrl: `${baseUrl}/operator/setup-guide`
    })
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError)
    // Don't fail the signup if email fails
  }

  return result
}