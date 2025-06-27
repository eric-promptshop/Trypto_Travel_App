import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get operator info
    const operator = await prisma.operator.findFirst({
      where: {
        OR: [
          { email: session.user.email! },
          { users: { some: { email: session.user.email! } } }
        ]
      }
    })

    if (!operator) {
      return NextResponse.json({ message: 'Operator not found' }, { status: 404 })
    }

    // Fetch integrations
    const integrations = await prisma.integration.findMany({
      where: {
        operatorId: operator.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ integrations })

  } catch (error) {
    console.error('[Integrations API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}