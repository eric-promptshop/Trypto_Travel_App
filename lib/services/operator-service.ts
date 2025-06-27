import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
export const operatorSchema = z.object({
  businessName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  timezone: z.string().default('UTC'),
  languages: z.array(z.string()).default(['English']),
  currencies: z.array(z.string()).default(['USD']),
})

export type OperatorInput = z.infer<typeof operatorSchema>

export class OperatorService {
  /**
   * Create a new operator
   */
  async createOperator(data: OperatorInput, tenantId: string = 'default') {
    // Generate unique slug
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
    
    return prisma.operator.create({
      data: {
        ...data,
        slug,
        tenantId,
        status: 'pending',
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
            secondaryColor: '#1E40AF',
            fontFamily: 'Inter',
            logoPosition: 'left'
          }
        }
      }
    })
  }

  /**
   * Get operator by ID with related data
   */
  async getOperatorById(operatorId: string, includeRelations = true) {
    return prisma.operator.findUnique({
      where: { id: operatorId },
      include: includeRelations ? {
        _count: {
          select: {
            users: true,
            tours: true,
            leads: true,
            bookings: true,
            widgetConfigs: true,
            integrations: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            isActive: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        tours: {
          where: { status: 'active' },
          select: {
            id: true,
            name: true,
            destination: true,
            price: true,
            currency: true,
            rating: true,
            bookingCount: true,
          },
          take: 10,
          orderBy: { bookingCount: 'desc' }
        }
      } : undefined
    })
  }

  /**
   * Update operator
   */
  async updateOperator(operatorId: string, data: Partial<OperatorInput>) {
    return prisma.operator.update({
      where: { id: operatorId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Verify operator
   */
  async verifyOperator(
    operatorId: string,
    verified: boolean,
    verifiedBy: string,
    notes?: string,
    details?: any
  ) {
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    })
    
    if (!operator) {
      throw new Error('Operator not found')
    }
    
    return prisma.operator.update({
      where: { id: operatorId },
      data: {
        status: verified ? 'verified' : 'rejected',
        verifiedAt: verified ? new Date() : null,
        settings: {
          ...operator.settings as any,
          verification: {
            verifiedBy,
            verifiedAt: new Date(),
            notes,
            details
          }
        }
      }
    })
  }

  /**
   * Get operator statistics
   */
  async getOperatorStats(operatorId: string, period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    
    const [
      totalTours,
      activeTours,
      totalBookings,
      periodBookings,
      totalRevenue,
      totalLeads,
      periodLeads,
      averageRating
    ] = await Promise.all([
      prisma.tour.count({ where: { operatorId } }),
      prisma.tour.count({ where: { operatorId, status: 'active' } }),
      prisma.booking.count({ where: { operatorId } }),
      prisma.booking.count({
        where: {
          operatorId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.booking.aggregate({
        where: {
          operatorId,
          status: 'confirmed',
          paymentStatus: 'paid'
        },
        _sum: { totalPrice: true }
      }),
      prisma.leadEnhanced.count({ where: { operatorId } }),
      prisma.leadEnhanced.count({
        where: {
          operatorId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.review.aggregate({
        where: {
          tour: { operatorId },
          status: 'published'
        },
        _avg: { rating: true }
      })
    ])
    
    return {
      overview: {
        totalTours,
        activeTours,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalLeads,
        averageRating: averageRating._avg.rating || 0
      },
      period: {
        bookings: periodBookings,
        leads: periodLeads
      }
    }
  }

  /**
   * Add user to operator
   */
  async addUserToOperator(operatorId: string, userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { operatorId }
    })
  }

  /**
   * Remove user from operator
   */
  async removeUserFromOperator(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { operatorId: null }
    })
  }

  /**
   * Get operator's top tours
   */
  async getTopTours(operatorId: string, limit = 5) {
    return prisma.tour.findMany({
      where: { operatorId, status: 'active' },
      select: {
        id: true,
        name: true,
        destination: true,
        price: true,
        currency: true,
        rating: true,
        bookingCount: true,
        viewCount: true,
      },
      orderBy: { bookingCount: 'desc' },
      take: limit
    })
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(operatorId: string, limit = 20) {
    const [bookings, leads] = await Promise.all([
      prisma.booking.findMany({
        where: { operatorId },
        select: {
          id: true,
          bookingNumber: true,
          tour: { select: { name: true } },
          totalPrice: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.leadEnhanced.findMany({
        where: { operatorId },
        select: {
          id: true,
          email: true,
          destination: true,
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ])
    
    // Combine and sort activities
    const activities = [
      ...bookings.map(booking => ({
        type: 'booking' as const,
        id: booking.id,
        title: `New booking for ${booking.tour.name}`,
        amount: `${booking.currency} ${booking.totalPrice}`,
        timestamp: booking.createdAt
      })),
      ...leads.map(lead => ({
        type: 'lead' as const,
        id: lead.id,
        title: `New lead interested in ${lead.destination || 'your tours'}`,
        score: lead.score,
        timestamp: lead.createdAt
      }))
    ]
    
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Create operator onboarding tasks
   */
  async createOnboardingTasks(operatorId: string) {
    const tasks = [
      {
        title: 'Complete business profile',
        description: 'Add your logo, description, and business details',
        completed: false,
        order: 1
      },
      {
        title: 'Add your first tour',
        description: 'Create a tour listing or import from your website',
        completed: false,
        order: 2
      },
      {
        title: 'Set up payment integration',
        description: 'Connect your payment processor to receive bookings',
        completed: false,
        order: 3
      },
      {
        title: 'Configure lead notifications',
        description: 'Set up email alerts for new leads and bookings',
        completed: false,
        order: 4
      },
      {
        title: 'Install widget on website',
        description: 'Add the AI itinerary builder to your website',
        completed: false,
        order: 5
      }
    ]
    
    // Store in operator settings
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    })
    
    if (operator) {
      await prisma.operator.update({
        where: { id: operatorId },
        data: {
          settings: {
            ...operator.settings as any,
            onboarding: {
              tasks,
              completedAt: null
            }
          }
        }
      })
    }
  }
}

// Export singleton instance
export const operatorService = new OperatorService()