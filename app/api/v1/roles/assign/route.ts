import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation, createAuditLog } from '@/lib/middleware/tenant';
import { hasPermission, RESOURCES, ACTIONS } from '@/lib/auth/rbac';

// POST /api/v1/roles/assign - Assign role to user
export const POST = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    // Check permissions
    if (tenantContext.userContext && !hasPermission(
      tenantContext.userContext, 
      RESOURCES.USER, 
      ACTIONS.MANAGE
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and role ID are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ADMIN', 'AGENT', 'USER', 'TRAVELER'];
    if (!validRoles.includes(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
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

    // Prevent users from changing their own role to prevent lockout
    if (userId === tenantContext.userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: roleId },
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
      'ASSIGN_ROLE',
      'user',
      userId,
      {
        newRole: roleId,
        previousRole: user.role,
        assignedBy: tenantContext.userId,
      }
    );

    return NextResponse.json({
      message: 'Role assigned successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
});