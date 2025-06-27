import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for tour update
const updateTourSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  duration: z.number().optional(),
  highlights: z.string().optional(), // JSON string
  included: z.string().optional(), // JSON string
  excluded: z.string().optional(), // JSON string
  images: z.string().optional(), // JSON string
  metadata: z.string().optional(), // JSON string
  active: z.boolean().optional(),
  featured: z.boolean().optional()
})

// GET single tour
export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const tour = await prisma.content.findUnique({
      where: {
        id: params.tourId,
        type: 'activity'
      }
    })
    
    if (!tour) {
      return NextResponse.json({ message: 'Tour not found' }, { status: 404 })
    }
    
    // Check if user has access to this tour
    if (tour.tenantId !== session.user?.tenantId && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }
    
    return NextResponse.json({ tour })
  } catch (error) {
    console.error('[Get Tour API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch tour' },
      { status: 500 }
    )
  }
}

// UPDATE tour
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validation = updateTourSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    // Check if tour exists and user has access
    const existingTour = await prisma.content.findUnique({
      where: {
        id: params.tourId,
        type: 'activity'
      }
    })
    
    if (!existingTour) {
      return NextResponse.json({ message: 'Tour not found' }, { status: 404 })
    }
    
    if (existingTour.tenantId !== session.user?.tenantId && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }
    
    // Update tour
    const updatedTour = await prisma.content.update({
      where: {
        id: params.tourId
      },
      data: validation.data
    })
    
    
    return NextResponse.json({ 
      tour: updatedTour,
      message: 'Tour updated successfully' 
    })
  } catch (error) {
    console.error('[Update Tour API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to update tour' },
      { status: 500 }
    )
  }
}

// DELETE tour
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if tour exists and user has access
    const existingTour = await prisma.content.findUnique({
      where: {
        id: params.tourId,
        type: 'activity'
      }
    })
    
    if (!existingTour) {
      return NextResponse.json({ message: 'Tour not found' }, { status: 404 })
    }
    
    if (existingTour.tenantId !== session.user?.tenantId && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }
    
    // Delete tour
    await prisma.content.delete({
      where: {
        id: params.tourId
      }
    })
    
    
    return NextResponse.json({ 
      message: 'Tour deleted successfully' 
    })
  } catch (error) {
    console.error('[Delete Tour API] Error:', error)
    return NextResponse.json(
      { message: 'Failed to delete tour' },
      { status: 500 }
    )
  }
}