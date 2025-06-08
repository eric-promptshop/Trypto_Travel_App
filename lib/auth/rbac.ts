export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  tenantId?: string; // null for global roles
}

export interface UserContext {
  userId: string;
  tenantId: string;
  roles: Role[];
  isActive: boolean;
}

// Define permission resources and actions
export const RESOURCES = {
  TENANT: 'tenant',
  USER: 'user',
  CONTENT: 'content',
  DEPLOYMENT: 'deployment',
  DOMAIN: 'domain',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  BILLING: 'billing',
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  DEPLOY: 'deploy',
  MANAGE: 'manage',
  VIEW: 'view',
} as const;

// Predefined roles for white-label system
export const SYSTEM_ROLES: Record<string, Omit<Role, 'tenantId'>> = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access across all tenants',
    permissions: [
      { resource: '*', action: '*' }, // Full access
    ],
  },
  TENANT_ADMIN: {
    id: 'tenant_admin',
    name: 'Tenant Administrator',
    description: 'Full access within tenant scope',
    permissions: [
      { resource: RESOURCES.TENANT, action: ACTIONS.READ },
      { resource: RESOURCES.TENANT, action: ACTIONS.UPDATE },
      { resource: RESOURCES.USER, action: '*' },
      { resource: RESOURCES.CONTENT, action: '*' },
      { resource: RESOURCES.DEPLOYMENT, action: '*' },
      { resource: RESOURCES.DOMAIN, action: '*' },
      { resource: RESOURCES.SETTINGS, action: '*' },
      { resource: RESOURCES.ANALYTICS, action: ACTIONS.VIEW },
      { resource: RESOURCES.BILLING, action: ACTIONS.VIEW },
    ],
  },
  CONTENT_MANAGER: {
    id: 'content_manager',
    name: 'Content Manager',
    description: 'Manage content and basic deployment',
    permissions: [
      { resource: RESOURCES.CONTENT, action: '*' },
      { resource: RESOURCES.DEPLOYMENT, action: ACTIONS.CREATE },
      { resource: RESOURCES.DEPLOYMENT, action: ACTIONS.READ },
      { resource: RESOURCES.ANALYTICS, action: ACTIONS.VIEW },
    ],
  },
  CONTENT_EDITOR: {
    id: 'content_editor',
    name: 'Content Editor',
    description: 'Create and edit content',
    permissions: [
      { resource: RESOURCES.CONTENT, action: ACTIONS.CREATE },
      { resource: RESOURCES.CONTENT, action: ACTIONS.READ },
      { resource: RESOURCES.CONTENT, action: ACTIONS.UPDATE },
      { resource: RESOURCES.CONTENT, action: ACTIONS.DELETE, conditions: { 'author': 'self' } },
    ],
  },
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content and analytics',
    permissions: [
      { resource: RESOURCES.CONTENT, action: ACTIONS.READ },
      { resource: RESOURCES.ANALYTICS, action: ACTIONS.VIEW },
    ],
  },
};

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  userContext: UserContext,
  resource: string,
  action: string,
  resourceData?: any
): boolean {
  if (!userContext.isActive) {
    return false;
  }

  return userContext.roles.some(role => {
    return role.permissions.some(permission => {
      // Check resource match (exact or wildcard)
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      
      // Check action match (exact or wildcard)
      const actionMatch = permission.action === '*' || permission.action === action;
      
      if (!resourceMatch || !actionMatch) {
        return false;
      }

      // Check conditions if any
      if (permission.conditions && resourceData) {
        return evaluateConditions(permission.conditions, resourceData, userContext);
      }

      return true;
    });
  });
}

/**
 * Evaluate permission conditions
 */
function evaluateConditions(
  conditions: Record<string, any>,
  resourceData: any,
  userContext: UserContext
): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'author':
        if (value === 'self' && resourceData.authorId !== userContext.userId) {
          return false;
        }
        break;
      case 'tenant':
        if (value === 'same' && resourceData.tenantId !== userContext.tenantId) {
          return false;
        }
        break;
      case 'status':
        if (Array.isArray(value) && !value.includes(resourceData.status)) {
          return false;
        }
        break;
      default:
        // Custom condition evaluation can be added here
        break;
    }
  }
  return true;
}

/**
 * Get effective permissions for a user
 */
export function getEffectivePermissions(userContext: UserContext): Permission[] {
  const permissions: Permission[] = [];
  
  userContext.roles.forEach(role => {
    permissions.push(...role.permissions);
  });

  // Remove duplicates and merge permissions
  const uniquePermissions = permissions.reduce((acc, permission) => {
    const key = `${permission.resource}:${permission.action}`;
    if (!acc.has(key)) {
      acc.set(key, permission);
    }
    return acc;
  }, new Map<string, Permission>());

  return Array.from(uniquePermissions.values());
}

/**
 * Middleware to check permissions for API routes
 */
export function requirePermission(resource: string, action: string) {
  return async (userContext: UserContext, resourceData?: any) => {
    const allowed = hasPermission(userContext, resource, action, resourceData);
    
    if (!allowed) {
      throw new Error(`Insufficient permissions: ${action} on ${resource}`);
    }
    
    return true;
  };
}

/**
 * Create tenant-specific role
 */
export function createTenantRole(
  baseRole: Omit<Role, 'tenantId'>,
  tenantId: string
): Role {
  return {
    ...baseRole,
    tenantId,
    id: `${baseRole.id}_${tenantId}`,
  };
}

/**
 * Check if user can access tenant
 */
export function canAccessTenant(userContext: UserContext, tenantId: string): boolean {
  // Super admin can access any tenant
  if (userContext.roles.some(role => role.id === 'super_admin')) {
    return true;
  }

  // User must be part of the tenant
  return userContext.tenantId === tenantId;
}

/**
 * Get user's highest privilege level
 */
export function getUserPrivilegeLevel(userContext: UserContext): number {
  const privilegeLevels = {
    'super_admin': 100,
    'tenant_admin': 80,
    'content_manager': 60,
    'content_editor': 40,
    'viewer': 20,
  };

  const maxLevel = Math.max(
    ...userContext.roles.map(role => privilegeLevels[role.id as keyof typeof privilegeLevels] || 0)
  );

  return maxLevel;
} 