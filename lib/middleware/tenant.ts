import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Tenant context storage
export interface TenantContext {
  tenantId: string
  userId?: string
  role?: string
}

// Models that should be isolated by tenant
const TENANT_ISOLATED_MODELS = [
  'User',
  'Trip',
  'Activity', 
  'TripParticipant',
  'TripDocument',
  'TripTemplate',
  'Integration',
  'TenantSettings',
  'AuditLog'
]

// Models that are shared across tenants (no isolation)
const GLOBAL_MODELS = [
  'Tenant',
  'GlobalSettings',
  'Account',
  'Session',
  'VerificationToken'
]

/**
 * Middleware to enforce tenant isolation at the database level
 * This would be applied to the Prisma client instance
 */
export function createTenantMiddleware() {
  return async (params: any, next: (params: any) => Promise<any>) => {
    const tenantContext = getTenantContext()
    
    if (!tenantContext?.tenantId) {
      // Allow operations on global models without tenant context
      if (GLOBAL_MODELS.includes(params.model || '')) {
        return next(params)
      }
      throw new Error('Tenant context is required for this operation')
    }

    // Skip tenant filtering for global models
    if (GLOBAL_MODELS.includes(params.model || '')) {
      return next(params)
    }

    // Apply tenant isolation for tenant-specific models
    if (TENANT_ISOLATED_MODELS.includes(params.model || '')) {
      switch (params.action) {
        case 'findUnique':
        case 'findUniqueOrThrow':
        case 'findFirst':
        case 'findFirstOrThrow':
        case 'findMany':
        case 'count':
        case 'aggregate':
        case 'groupBy':
          params.args.where = addTenantFilter(params.model!, params.args.where, tenantContext.tenantId)
          break
          
        case 'create':
        case 'createMany':
          params.args.data = addTenantData(params.model!, params.args.data, tenantContext.tenantId)
          break
          
        case 'update':
        case 'updateMany':
        case 'upsert':
          params.args.where = addTenantFilter(params.model!, params.args.where, tenantContext.tenantId)
          break
          
        case 'delete':
        case 'deleteMany':
          params.args.where = addTenantFilter(params.model!, params.args.where, tenantContext.tenantId)
          break
      }
    }

    return next(params)
  }
}

/**
 * Add tenant filter to where clause based on model type
 */
function addTenantFilter(model: string, where: any, tenantId: string): any {
  if (!where) where = {}

  switch (model) {
    case 'User':
    case 'TripTemplate':
    case 'Integration':
    case 'TenantSettings':
    case 'AuditLog':
      where.tenantId = tenantId
      break
      
    case 'Trip':
    case 'Activity':
    case 'TripParticipant':
    case 'TripDocument':
      // These models are isolated through the user relationship
      if (!where.user && !where.trip) {
        where.user = { tenantId }
      }
      break
  }

  return where
}

/**
 * Add tenant data to create/update operations
 */
function addTenantData(model: string, data: any, tenantId: string): any {
  if (Array.isArray(data)) {
    return data.map(item => addTenantData(model, item, tenantId))
  }

  switch (model) {
    case 'User':
    case 'TripTemplate':
    case 'Integration':
    case 'TenantSettings':
    case 'AuditLog':
      data.tenantId = tenantId
      break
  }

  return data
}

/**
 * Store tenant context in async local storage or request context
 * This is a simplified version - in production, you'd use AsyncLocalStorage
 */
let currentTenantContext: TenantContext | null = null

export function setTenantContext(context: TenantContext) {
  currentTenantContext = context
}

export function getTenantContext(): TenantContext | null {
  return currentTenantContext
}

export function clearTenantContext() {
  currentTenantContext = null
}

/**
 * Higher-order function to wrap API handlers with tenant isolation
 * Note: Requires NextAuth.js configuration to be implemented
 */
export function withTenantIsolation<T extends any[]>(
  handler: (tenantContext: TenantContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // TODO: Implement session validation once NextAuth.js is configured
      // For now, extract tenant from request headers or query params
      const tenantSlug = request.headers.get('x-tenant-slug') || 
                        request.nextUrl.searchParams.get('tenant')
      
      if (!tenantSlug) {
        return NextResponse.json({ error: 'Tenant identifier required' }, { status: 400 })
      }

      const tenant = await getTenantByIdentifier(tenantSlug)
      if (!tenant) {
        return NextResponse.json({ error: 'Invalid tenant' }, { status: 404 })
      }

      const tenantContext: TenantContext = {
        tenantId: tenant.id,
        // userId and role would come from session once auth is implemented
      }

      // Set tenant context for this request
      setTenantContext(tenantContext)

      try {
        return await handler(tenantContext, ...args)
      } finally {
        // Clean up tenant context
        clearTenantContext()
      }
    } catch (error) {
      console.error('Tenant isolation error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Get tenant by slug or domain
 */
export async function getTenantByIdentifier(identifier: string) {
  return prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { domain: identifier }
      ],
      isActive: true
    }
  })
}

/**
 * Validate user belongs to tenant
 */
export async function validateUserTenant(userId: string, tenantId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
      isActive: true
    }
  })
  
  return !!user
} 