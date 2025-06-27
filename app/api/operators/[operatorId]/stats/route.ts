import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns'

interface RouteParams {
  params: {
    operatorId: string
  }
}

// GET /api/operators/[operatorId]/stats - Get operator statistics
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { operatorId } = params
    
    // Check permissions
    const isAdmin = session.user?.role === 'ADMIN'
    const isOperatorUser = session.user?.operatorId === operatorId
    
    if (!isAdmin && !isOperatorUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const compareWith = searchParams.get('compareWith') === 'true'
    
    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date
    
    switch (period) {
      case '7d':
        startDate = subDays(now, 7)
        previousStartDate = subDays(now, 14)
        previousEndDate = subDays(now, 7)
        break
      case '90d':
        startDate = subDays(now, 90)
        previousStartDate = subDays(now, 180)
        previousEndDate = subDays(now, 90)
        break
      case '1y':
        startDate = subDays(now, 365)
        previousStartDate = subDays(now, 730)
        previousEndDate = subDays(now, 365)
        break
      default: // 30d
        startDate = subDays(now, 30)
        previousStartDate = subDays(now, 60)
        previousEndDate = subDays(now, 30)
    }
    
    // Get current period stats
    const [
      totalTours,
      activeTours,
      totalBookings,
      confirmedBookings,
      totalRevenue,
      totalLeads,
      newLeads,
      convertedLeads,
      averageRating,
      totalReviews,
      widgetViews
    ] = await Promise.all([
      // Tours
      prisma.tour.count({ where: { operatorId } }),
      prisma.tour.count({ where: { operatorId, status: 'active' } }),
      
      // Bookings
      prisma.booking.count({
        where: {
          operatorId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.booking.count({
        where: {
          operatorId,
          status: 'confirmed',
          createdAt: { gte: startDate }
        }
      }),
      
      // Revenue
      prisma.booking.aggregate({
        where: {
          operatorId,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      }),
      
      // Leads
      prisma.leadEnhanced.count({ where: { operatorId } }),
      prisma.leadEnhanced.count({
        where: {
          operatorId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.leadEnhanced.count({
        where: {
          operatorId,
          createdAt: { gte: startDate },
          bookings: { some: {} }
        }
      }),
      
      // Reviews
      prisma.review.aggregate({
        where: {
          tour: { operatorId },
          status: 'published'
        },
        _avg: { rating: true }
      }),
      prisma.review.count({
        where: {
          tour: { operatorId },
          createdAt: { gte: startDate }
        }
      }),
      
      // Widget analytics (placeholder - implement actual tracking)
      Promise.resolve(Math.floor(Math.random() * 10000))
    ])
    
    // Calculate comparison data if requested
    let comparison = null
    if (compareWith) {
      const [
        prevBookings,
        prevRevenue,
        prevLeads,
        prevReviews
      ] = await Promise.all([
        prisma.booking.count({
          where: {
            operatorId,
            createdAt: {
              gte: previousStartDate,
              lt: previousEndDate
            }
          }
        }),
        prisma.booking.aggregate({
          where: {
            operatorId,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: {
              gte: previousStartDate,
              lt: previousEndDate
            }
          },
          _sum: { totalPrice: true }
        }),
        prisma.leadEnhanced.count({
          where: {
            operatorId,
            createdAt: {
              gte: previousStartDate,
              lt: previousEndDate
            }
          }
        }),
        prisma.review.count({
          where: {
            tour: { operatorId },
            createdAt: {
              gte: previousStartDate,
              lt: previousEndDate
            }
          }
        })
      ])
      
      comparison = {
        bookings: calculatePercentageChange(totalBookings, prevBookings),
        revenue: calculatePercentageChange(totalRevenue._sum.totalPrice || 0, prevRevenue._sum.totalPrice || 0),
        leads: calculatePercentageChange(newLeads, prevLeads),
        reviews: calculatePercentageChange(totalReviews, prevReviews)
      }
    }
    
    // Get top performing tours
    const topTours = await prisma.tour.findMany({
      where: { operatorId, status: 'active' },
      select: {
        id: true,
        name: true,
        destination: true,
        bookingCount: true,
        viewCount: true,
        rating: true,
        price: true,
        currency: true
      },
      orderBy: { bookingCount: 'desc' },
      take: 5
    })
    
    // Get recent activity
    const recentActivity = await getRecentActivity(operatorId, 10)
    
    // Calculate key metrics
    const conversionRate = totalLeads > 0 ? (convertedLeads / newLeads) * 100 : 0
    const averageBookingValue = confirmedBookings > 0 ? 
      (totalRevenue._sum.totalPrice || 0) / confirmedBookings : 0
    
    return NextResponse.json({
      overview: {
        totalTours,
        activeTours,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalLeads,
        averageRating: averageRating._avg.rating || 0,
        widgetViews
      },
      period: {
        bookings: totalBookings,
        revenue: totalRevenue._sum.totalPrice || 0,
        leads: newLeads,
        reviews: totalReviews,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100
      },
      comparison,
      topTours,
      recentActivity,
      charts: {
        bookingsOverTime: await getBookingsOverTime(operatorId, startDate),
        revenueOverTime: await getRevenueOverTime(operatorId, startDate),
        leadsBySource: await getLeadsBySource(operatorId, startDate),
        tourPerformance: await getTourPerformance(operatorId)
      }
    })
    
  } catch (error) {
    console.error('Error fetching operator stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

async function getRecentActivity(operatorId: string, limit: number) {
  const activities = []
  
  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { operatorId },
    select: {
      id: true,
      bookingNumber: true,
      tour: { select: { name: true } },
      totalPrice: true,
      currency: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
  
  recentBookings.forEach(booking => {
    activities.push({
      type: 'booking',
      title: `New booking for ${booking.tour.name}`,
      amount: `${booking.currency} ${booking.totalPrice}`,
      timestamp: booking.createdAt,
      id: booking.id
    })
  })
  
  // Get recent leads
  const recentLeads = await prisma.leadEnhanced.findMany({
    where: { operatorId },
    select: {
      id: true,
      email: true,
      destination: true,
      score: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
  
  recentLeads.forEach(lead => {
    activities.push({
      type: 'lead',
      title: `New lead interested in ${lead.destination || 'your tours'}`,
      score: lead.score,
      timestamp: lead.createdAt,
      id: lead.id
    })
  })
  
  // Sort by timestamp and return top items
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

async function getBookingsOverTime(operatorId: string, startDate: Date) {
  // Simplified - in production, group by day/week/month based on period
  const bookings = await prisma.booking.groupBy({
    by: ['createdAt'],
    where: {
      operatorId,
      createdAt: { gte: startDate }
    },
    _count: { id: true }
  })
  
  // Transform to chart data
  return bookings.map(day => ({
    date: day.createdAt,
    count: day._count.id
  }))
}

async function getRevenueOverTime(operatorId: string, startDate: Date) {
  // Simplified - in production, group by day/week/month based on period
  const revenue = await prisma.booking.groupBy({
    by: ['createdAt'],
    where: {
      operatorId,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: { gte: startDate }
    },
    _sum: { totalPrice: true }
  })
  
  return revenue.map(day => ({
    date: day.createdAt,
    amount: day._sum.totalPrice || 0
  }))
}

async function getLeadsBySource(operatorId: string, startDate: Date) {
  const leads = await prisma.leadEnhanced.groupBy({
    by: ['source'],
    where: {
      operatorId,
      createdAt: { gte: startDate }
    },
    _count: { id: true }
  })
  
  return leads.map(source => ({
    source: source.source,
    count: source._count.id
  }))
}

async function getTourPerformance(operatorId: string) {
  const tours = await prisma.tour.findMany({
    where: { operatorId, status: 'active' },
    select: {
      name: true,
      bookingCount: true,
      viewCount: true,
      rating: true
    },
    orderBy: { bookingCount: 'desc' },
    take: 10
  })
  
  return tours.map(tour => ({
    name: tour.name,
    bookings: tour.bookingCount || 0,
    views: tour.viewCount || 0,
    conversionRate: tour.viewCount ? (tour.bookingCount || 0) / tour.viewCount * 100 : 0,
    rating: tour.rating || 0
  }))
}