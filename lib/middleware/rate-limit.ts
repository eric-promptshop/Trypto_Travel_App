import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api/response';

// Simple in-memory rate limiter for development
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: NextRequest) => string; // Function to generate key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later.',
};

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

/**
 * Default key generator - uses IP address or x-forwarded-for header
 */
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const pathname = new URL(req.url).pathname;
  return `${ip}:${pathname}`;
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const keyGenerator = finalConfig.keyGenerator || defaultKeyGenerator;

  return function rateLimit(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
      const key = keyGenerator(request);
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);
      
      if (!entry || entry.resetTime <= now) {
        // Create new entry or reset expired one
        entry = {
          count: 0,
          resetTime: now + finalConfig.windowMs,
        };
        rateLimitStore.set(key, entry);
      }

      // Check if limit exceeded
      if (entry.count >= finalConfig.max) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        
        const response = createErrorResponse(
          finalConfig.message || 'Too many requests',
          {
            limit: finalConfig.max,
            windowMs: finalConfig.windowMs,
            retryAfter,
          },
          429
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', finalConfig.max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
        response.headers.set('Retry-After', retryAfter.toString());

        return response;
      }

      // Increment counter
      entry.count++;

      // Execute handler
      const response = await handler(request, ...args);

      // Add rate limit headers to successful responses
      const remaining = Math.max(0, finalConfig.max - entry.count);
      response.headers.set('X-RateLimit-Limit', finalConfig.max.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

      // Handle skip options
      const isSuccess = response.status >= 200 && response.status < 300;
      const isFailed = response.status >= 400;

      if (
        (finalConfig.skipSuccessfulRequests && isSuccess) ||
        (finalConfig.skipFailedRequests && isFailed)
      ) {
        // Decrement counter if we should skip this request
        entry.count--;
      }

      return response;
    };
  };
}

/**
 * Create rate limiter with different limits for different user types
 */
export function withTieredRateLimit(
  getLimit: (req: NextRequest) => number,
  windowMs: number = 60 * 1000
) {
  return withRateLimit({
    windowMs,
    max: 1000, // Set high default, actual limit comes from getLimit
    keyGenerator: (req) => {
      const defaultKey = defaultKeyGenerator(req);
      const limit = getLimit(req);
      return `${defaultKey}:${limit}`;
    },
  });
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict limit for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  },
  
  // Standard API limit
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },
  
  // Generous limit for content endpoints
  content: {
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute
  },
  
  // Very strict limit for expensive operations
  expensive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'This operation is rate limited. Please try again later.',
  },
};