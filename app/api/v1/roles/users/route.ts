import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation, createAuditLog } from '@/lib/middleware/tenant';
import { hasPermission, RESOURCES, ACTIONS } from '@/lib/auth/rbac';

// GET /api/v1/roles/users - Get all user role assignments for tenant
export const GET = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    // Check permissions
    if (tenantContext.userContext && !hasPermission(
      tenantContext.userContext, 
      RESOURCES.USER, 
      ACTIONS.READ
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users in tenant with their roles
    const users = await prisma.user.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' }
    });

    // Transform user data to include role information
    const userRoles = users.map(user => ({
      id: `${user.id}_${user.role}`, // Composite ID for role assignment
      userId: user.id,
      roleId: user.role,
      tenantId: tenantContext.tenantId,
      assignedAt: user.createdAt.toISOString(),
      assignedBy: 'system', // In a real implementation, track who assigned the role
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      role: {
        id: user.role,
        name: user.role,
        description: getRoleDescription(user.role),
      }
    }));

    return NextResponse.json({
      userRoles,
      total: userRoles.length,
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
});

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    'ADMIN': 'Full administrative access to tenant',
    'AGENT': 'Content management and customer interaction',
    'USER': 'Standard user access',
    'TRAVELER': 'Travel-specific features and bookings',
  };
  return descriptions[role] || 'Standard access';
}