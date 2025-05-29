import { NextResponse, NextRequest } from 'next/server';
import { ApiResponse, ApiError } from '@/lib/types/api';

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = { data, meta };
  return NextResponse.json(response, { status });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  details?: any,
  status: number = 400
): NextResponse {
  const response: ApiResponse<never> = { error, details };
  return NextResponse.json(response, { status });
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: ApiError[],
  status: number = 422
): NextResponse {
  return createErrorResponse(
    'Validation failed',
    { errors },
    status
  );
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedResponse(): NextResponse {
  return createErrorResponse(
    'Unauthorized',
    { code: 'UNAUTHORIZED' },
    401
  );
}

/**
 * Create forbidden error response
 */
export function createForbiddenResponse(): NextResponse {
  return createErrorResponse(
    'Forbidden',
    { code: 'FORBIDDEN' },
    403
  );
}

/**
 * Create not found error response
 */
export function createNotFoundResponse(resource?: string): NextResponse {
  return createErrorResponse(
    resource ? `${resource} not found` : 'Resource not found',
    { code: 'NOT_FOUND' },
    404
  );
}

/**
 * Create internal server error response
 */
export function createInternalServerErrorResponse(
  message: string = 'Internal server error'
): NextResponse {
  return createErrorResponse(
    message,
    { code: 'INTERNAL_SERVER_ERROR' },
    500
  );
}

/**
 * Handle async route with error catching
 */
export function withErrorHandling(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        return createInternalServerErrorResponse(error.message);
      }
      
      return createInternalServerErrorResponse();
    }
  };
} 