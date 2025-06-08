import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserContext, SYSTEM_ROLES, createTenantRole, Role } from '@/lib/auth/rbac'

// Enhanced tenant context with user roles
export interface TenantContext {
  tenantId: string
  userId?: string
  userContext?: UserContext
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
  'TenantContent',
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
    case 'TenantContent':
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
    case 'TenantContent':
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
 * Build user context with tenant-specific roles
 */
async function buildUserContext(userId: string, tenantId: string): Promise<UserContext | null> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId,
        isActive: true,
      }
    });

    if (!user) {
      return null;
    }

    // Get user roles - in a full implementation, these would be stored in a UserRole junction table
    // For now, we'll derive from the user.role field and map to our RBAC system
    const roles: Role[] = [];
    
    switch (user.role) {
      case 'ADMIN':
        // Admins get tenant admin role
        if (SYSTEM_ROLES.TENANT_ADMIN) {
          roles.push(createTenantRole(SYSTEM_ROLES.TENANT_ADMIN, tenantId));
        }
        break;
      case 'AGENT':
        // Agents get content manager role
        if (SYSTEM_ROLES.CONTENT_MANAGER) {
          roles.push(createTenantRole(SYSTEM_ROLES.CONTENT_MANAGER, tenantId));
        }
        break;
      case 'USER':
      case 'TRAVELER':
      default:
        // Regular users get viewer role
        if (SYSTEM_ROLES.VIEWER) {
          roles.push(createTenantRole(SYSTEM_ROLES.VIEWER, tenantId));
        }
    }

    return {
      userId: user.id,
      tenantId: tenantId,
      roles: roles,
      isActive: user.isActive,
    };
  } catch (error) {
    console.error('Error building user context:', error);
    return null;
  }
}

/**
 * Enhanced higher-order function to wrap API handlers with tenant isolation and RBAC
 */
export function withTenantIsolation<T extends any[]>(
  handler: (tenantContext: TenantContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Extract tenant identifier
      const tenantSlug = request.headers.get('x-tenant-slug') || 
                        request.nextUrl.searchParams.get('tenant') ||
                        extractTenantFromDomain(request.headers.get('host'))
      
      if (!tenantSlug) {
        return NextResponse.json({ error: 'Tenant identifier required' }, { status: 400 })
      }

      const tenant = await getTenantByIdentifier(tenantSlug)
      if (!tenant) {
        return NextResponse.json({ error: 'Invalid tenant' }, { status: 404 })
      }

      if (!tenant.isActive) {
        return NextResponse.json({ error: 'Tenant is not active' }, { status: 403 })
      }

      // Extract user information (in a real app, this would come from session/JWT)
      const userId = request.headers.get('x-user-id') || 
                     request.nextUrl.searchParams.get('userId')

      let userContext: UserContext | null = null;
      if (userId) {
        userContext = await buildUserContext(userId, tenant.id);
        if (!userContext) {
          return NextResponse.json({ error: 'Invalid user or insufficient permissions' }, { status: 403 })
        }
      }

      const tenantContext: TenantContext = {
        tenantId: tenant.id,
        ...(userId && { userId }),
        ...(userContext && { userContext }),
        ...(userContext?.roles[0]?.id && { role: userContext.roles[0].id })
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
 * Extract tenant from custom domain
 */
function extractTenantFromDomain(host: string | null): string | null {
  if (!host) return null;
  
  // Handle custom domains by looking up in database
  // For now, return null to force explicit tenant parameter
  return null;
}

/**
 * Get tenant by identifier (slug or domain)
 */
export async function getTenantByIdentifier(identifier: string) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: identifier },
          { domain: identifier },
          { domain: `https://${identifier}` },
          { domain: `http://${identifier}` },
        ]
      }
    })
    return tenant
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  }
}

/**
 * Validate user belongs to tenant
 */
export async function validateUserTenant(userId: string, tenantId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId,
        isActive: true
      }
    })
    return !!user
  } catch (error) {
    console.error('Error validating user tenant:', error)
    return false
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  tenantContext: TenantContext,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: any
) {
  try {
    if (!tenantContext.userId) {
      // Skip audit log if no user context
      return;
    }

    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId: resourceId || '',
        tenantId: tenantContext.tenantId,
        userId: tenantContext.userId,
        newValues: metadata || {},
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw here to avoid breaking the main operation
  }
} 