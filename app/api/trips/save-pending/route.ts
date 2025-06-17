import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pendingItinerary = await request.json()
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create the trip in the database
    const trip = await prisma.trip.create({
      data: {
        id: pendingItinerary.tripId,
        title: pendingItinerary.tripTitle,
        description: `Trip to ${pendingItinerary.destination}`,
        destination: pendingItinerary.destination,
        startDate: new Date(pendingItinerary.startDate),
        endDate: new Date(pendingItinerary.endDate),
        userId: user.id,
        metadata: {
          itinerary: pendingItinerary.itinerary,
          createdFrom: 'ai-generation',
          savedAfterSignup: true
        },
        status: 'PLANNING'
      }
    })

    return NextResponse.json({
      success: true,
      tripId: trip.id,
      message: 'Itinerary saved successfully'
    })
    
  } catch (error) {
    console.error('Error saving pending itinerary:', error)
    
    // If the trip already exists, update it
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      try {
        const pendingItinerary = await request.json()
        const session = await getServerSession(authOptions)
        
        const user = await prisma.user.findUnique({
          where: { email: session?.user?.email || '' }
        })
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }
        
        const trip = await prisma.trip.update({
          where: { id: pendingItinerary.tripId },
          data: {
            userId: user.id,
            metadata: {
              itinerary: pendingItinerary.itinerary,
              createdFrom: 'ai-generation',
              savedAfterSignup: true
            }
          }
        })
        
        return NextResponse.json({
          success: true,
          tripId: trip.id,
          message: 'Itinerary updated successfully'
        })
      } catch (updateError) {
        console.error('Error updating trip:', updateError)
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to save itinerary' },
      { status: 500 }
    )
  }
}