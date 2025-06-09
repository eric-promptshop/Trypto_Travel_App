import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation, createAuditLog } from '@/lib/middleware/tenant';
import { hasPermission, RESOURCES, ACTIONS } from '@/lib/auth/rbac';

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE /api/admin/roles/revoke/[id] - Revoke role from user
export const DELETE = withTenantIsolation(async (tenantContext, request: NextRequest, { params }: RouteParams) => {
  try {
    // Check permissions
    if (tenantContext.userContext && !hasPermission(
      tenantContext.userContext, 
      RESOURCES.USER, 
      ACTIONS.MANAGE
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse the composite ID to get userId
    const userRoleId = params.id;
    const userId = userRoleId.split('_')[0]; // Extract userId from composite ID

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user role ID' },
        { status: 400 }
      );
    }

    // Check if user exists and belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantContext.tenantId,
        isActive: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or not in tenant' },
        { status: 404 }
      );
    }

    // Prevent users from revoking their own role
    if (userId === tenantContext.userId) {
      return NextResponse.json(
        { error: 'Cannot revoke your own role' },
        { status: 400 }
      );
    }

    // Check if this would remove the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          tenantId: tenantContext.tenantId,
          role: 'ADMIN',
          isActive: true,
        }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot revoke the last admin role in tenant' },
          { status: 400 }
        );
      }
    }

    // Reset user role to default (USER)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      }
    });

    // Create audit log
    await createAuditLog(
      tenantContext,
      'REVOKE_ROLE',
      'user',
      userId,
      {
        previousRole: user.role,
        newRole: 'USER',
        revokedBy: tenantContext.userId,
      }
    );

    return NextResponse.json({
      message: 'Role revoked successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error revoking role:', error);
    return NextResponse.json(
      { error: 'Failed to revoke role' },
      { status: 500 }
    );
  }
});