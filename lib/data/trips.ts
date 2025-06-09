import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/middleware/tenant'

// Define our own types for now until Prisma client is fully generated
export type TripStatus = 'PLANNED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface TripFilters {
  page?: number
  limit?: number
  status?: TripStatus
  search?: string
  startDate?: Date
  endDate?: Date
  userId?: string
}

export interface TripWithRelations {
  id: string
  title: string
  description?: string | null
  startDate: Date
  endDate: Date
  location: string
  budget?: any
  currency: string
  status: TripStatus
  isPublic: boolean
  metadata?: any
  userId: string
  createdAt: Date
  updatedAt: Date
  activities?: any[]
  participants?: any[]
  documents?: any[]
  user?: any
}

/**
 * Get trips with tenant isolation and filtering
 */
export async function getTrips(
  filters: TripFilters = {}
): Promise<{ trips: any[]; total: number; hasMore: boolean }> {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  const { 
    page = 1, 
    limit = 10, 
    status, 
    search, 
    startDate, 
    endDate,
    userId 
  } = filters
  
  const skip = (page - 1) * limit
  
  // Build where clause with tenant isolation
  const where: any = {
    user: {
      tenantId: tenantContext.tenantId,
      ...(userId && { id: userId })
    }
  }
  
  if (status) {
    where.status = status
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (startDate || endDate) {
    where.startDate = {}
    if (startDate) where.startDate.gte = startDate
    if (endDate) where.startDate.lte = endDate
  }
  
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.trip.count({ where })
  ])
  
  return { 
    trips, 
    total, 
    hasMore: skip + trips.length < total 
  }
}

/**
 * Get a single trip by ID with tenant isolation
 */
export async function getTripById(tripId: string): Promise<any | null> {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  return prisma.trip.findFirst({
    where: {
      id: tripId,
      user: {
        tenantId: tenantContext.tenantId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

/**
 * Create a new trip
 */
export async function createTrip(
  data: any & { userId: string }
): Promise<any> {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  // Verify user belongs to tenant
  const user = await prisma.user.findFirst({
    where: {
      id: data.userId,
      tenantId: tenantContext.tenantId,
      isActive: true
    }
  })

  if (!user) {
    throw new Error('User not found or not authorized')
  }

  const { userId, ...tripData } = data

  return prisma.trip.create({
    data: {
      ...tripData,
      user: {
        connect: { id: userId }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

/**
 * Update a trip
 */
export async function updateTrip(
  tripId: string,
  data: any
): Promise<any | null> {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  // First verify the trip exists and user has access
  const existingTrip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      user: {
        tenantId: tenantContext.tenantId
      }
    }
  })

  if (!existingTrip) {
    return null
  }

  return prisma.trip.update({
    where: { id: tripId },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripId: string): Promise<boolean> {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  // First verify the trip exists and user has access
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      user: {
        tenantId: tenantContext.tenantId
      }
    }
  })

  if (!trip) {
    return false
  }

  await prisma.trip.delete({ 
    where: { id: tripId } 
  })
  
  return true
}

/**
 * Get trip statistics for a user or tenant
 */
export async function getTripStatistics(userId?: string) {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  const where: any = {
    user: {
      tenantId: tenantContext.tenantId,
      ...(userId && { id: userId })
    }
  }

  const [
    totalTrips,
    plannedTrips,
    activeTrips,
    completedTrips,
    cancelledTrips
  ] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.count({ where: { ...where, status: 'PLANNED' } }),
    prisma.trip.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.trip.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.trip.count({ where: { ...where, status: 'CANCELLED' } })
  ])

  return {
    total: totalTrips,
    byStatus: {
      planned: plannedTrips,
      active: activeTrips,
      completed: completedTrips,
      cancelled: cancelledTrips
    }
  }
}

/**
 * Get upcoming trips for a user
 */
export async function getUpcomingTrips(userId?: string, limit = 5) {
  const tenantContext = getTenantContext()
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context required')
  }

  const now = new Date()
  
  return prisma.trip.findMany({
    where: {
      user: {
        tenantId: tenantContext.tenantId,
        ...(userId && { id: userId })
      },
      startDate: {
        gte: now
      }
    },
    take: limit,
    orderBy: { startDate: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
} 