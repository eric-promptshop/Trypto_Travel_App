import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export interface AuthContext {
  userId: string;
  email: string;
  role?: string;
  operatorId?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  auth: AuthContext;
}

/**
 * Validates that the request has a valid session
 * Returns the user context if authenticated, otherwise returns an error response
 */
export async function validateAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    return {
      userId: session.user.id || '',
      email: session.user.email || '',
      role: session.user.role,
      operatorId: session.user.operatorId
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

/**
 * Validates that the user has operator role
 */
export async function validateOperatorAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await validateAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.role !== 'operator' && authResult.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Operator access required' },
      { status: 403 }
    );
  }

  if (!authResult.operatorId && authResult.role === 'operator') {
    return NextResponse.json(
      { error: 'Invalid operator account - No operator ID found' },
      { status: 403 }
    );
  }

  return authResult;
}

/**
 * Validates that the user has admin role
 */
export async function validateAdminAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await validateAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  return authResult;
}

/**
 * Helper to extract bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Higher-order function that wraps an API handler with authentication
 */
export async function withAuth(
  request: NextRequest, 
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await validateAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Create authenticated request object
  const authenticatedRequest = Object.create(request) as AuthenticatedRequest;
  authenticatedRequest.auth = authResult;

  return handler(authenticatedRequest);
}