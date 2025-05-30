import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Authenticate a request using NextAuth session
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      return {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role || 'user',
        tenantId: session.user.tenantId || ''
      };
    }

    // Fallback to Authorization header for API key/JWT
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // TODO: Implement JWT verification logic
      // For now, return null - will be implemented when JWT is set up
      return null;
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string): boolean {
  const roleHierarchy = {
    admin: 3,
    user: 2,
    traveler: 1
  };

  const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Check if user belongs to the same tenant or is admin
 */
export function hasAccessToTenant(user: AuthenticatedUser, tenantId: string): boolean {
  return user.role === 'admin' || user.tenantId === tenantId;
}

/**
 * Extract pagination parameters from request
 */
export function extractPaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  return {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
    cursor: searchParams.get('cursor') || undefined
  };
}

/**
 * Extract query parameters and convert to object
 */
export function extractQueryParams(request: NextRequest): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
} 