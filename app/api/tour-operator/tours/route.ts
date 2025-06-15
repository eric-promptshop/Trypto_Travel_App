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
    
    console.log('Tour API - Session:', {
      email: session.user?.email,
      role: session.user?.role,
      tenantId: tenantId
    })
    
    // Fetch tours from content table for this tenant
    console.log('Fetching tours with tenantId:', tenantId)
    
    const tours = await prisma.content.findMany({
      where: {
        tenantId,
        type: 'activity'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('Tours found:', tours.length)
    
    // Transform content to tour format
    const formattedTours = tours.map(content => ({
      id: content.id,
      name: content.name,
      destination: content.location || 'Unknown',
      duration: `${content.duration || 1} days`,
      price: content.price || 0,
      currency: content.currency || 'USD',
      status: content.active ? 'active' : 'draft',
      views: 0, // TODO: Implement view tracking
      bookings: 0, // TODO: Implement booking tracking
      nextDeparture: null
    }))
    
    return NextResponse.json({ tours: formattedTours })
    
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json(
      { message: 'Failed to fetch tours', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}