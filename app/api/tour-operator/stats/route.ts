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
    
    // Fetch statistics for this tenant
    const [totalTours, activeTours] = await Promise.all([
      prisma.content.count({
        where: { tenantId, type: 'activity' }
      }),
      prisma.content.count({
        where: { tenantId, type: 'activity', active: true }
      })
    ])
    
    // TODO: Implement proper tracking for these metrics
    const stats = {
      totalTours,
      activeTours,
      totalBookings: 0, // Placeholder
      totalRevenue: 0, // Placeholder
      monthlyViews: 0, // Placeholder
      conversionRate: 0 // Placeholder
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