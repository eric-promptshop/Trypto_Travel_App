import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'AGENT' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = session.user?.tenantId || 'default'
    
    let stats = {
      totalTours: 0,
      activeTours: 0,
      totalBookings: 0,
      totalRevenue: 0,
      monthlyViews: 0,
      conversionRate: 0
    }
    
    try {
      // Fetch statistics for this tenant
      const [totalTours, activeTours] = await Promise.all([
        prisma.content.count({
          where: { tenantId, type: 'activity' }
        }),
        prisma.content.count({
          where: { tenantId, type: 'activity', active: true }
        })
      ])
      
      stats = {
        totalTours,
        activeTours,
        totalBookings: Math.floor(Math.random() * 200) + 50, // Demo data
        totalRevenue: Math.floor(Math.random() * 50000) + 10000, // Demo data
        monthlyViews: Math.floor(Math.random() * 5000) + 1000, // Demo data
        conversionRate: Math.floor(Math.random() * 20) + 5 // Demo data
      }
    } catch (dbError) {
      console.error('Database error, using demo stats:', dbError)
      // Use demo stats if database is not available
      stats = {
        totalTours: 5,
        activeTours: 4,
        totalBookings: 154,
        totalRevenue: 28450,
        monthlyViews: 3567,
        conversionRate: 12
      }
    }
    
    return NextResponse.json({ stats })
    
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch stats', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}