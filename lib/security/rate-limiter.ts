import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { NextRequest } from 'next/server'

// Initialize Redis client (requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Different rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }) : null,

  // AI endpoints: 20 requests per minute (more expensive)
  ai: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:ai',
  }) : null,

  // Auth endpoints: 5 attempts per minute
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }) : null,

  // Widget API: 1000 requests per minute per API key
  widget: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    analytics: true,
    prefix: 'ratelimit:widget',
  }) : null,

  // Tour scraping: 10 requests per minute
  scraping: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:scraping',
  }) : null,
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

// Get identifier from request
export function getIdentifier(req: NextRequest): string {
  // Try to get user ID from session/auth
  const userId = req.headers.get('x-user-id')
  if (userId) return `user:${userId}`

  // Try to get API key for widgets
  const apiKey = req.headers.get('x-widget-api-key')
  if (apiKey) return `api:${apiKey}`

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous'
  return `ip:${ip}`
}

// Rate limit middleware
export async function rateLimit(
  req: NextRequest,
  type: keyof typeof rateLimiters = 'api'
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests (for development)
  if (!redis || !rateLimiters[type]) {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: new Date(Date.now() + 60000)
    }
  }

  const identifier = getIdentifier(req)
  const result = await rateLimiters[type]!.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset)
  }
}

// Rate limit response headers
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    'X-RateLimit-Reset-After': Math.max(0, Math.floor((result.reset.getTime() - Date.now()) / 1000)).toString()
  }
}

// IP-based rate limiting for specific actions
export class IPRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 5, windowMinutes: number = 15) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMinutes * 60 * 1000
  }

  isAllowed(ip: string): boolean {
    this.cleanup()
    
    const now = Date.now()
    const record = this.attempts.get(ip)

    if (!record || now > record.resetAt) {
      this.attempts.set(ip, {
        count: 1,
        resetAt: now + this.windowMs
      })
      return true
    }

    if (record.count >= this.maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  reset(ip: string): void {
    this.attempts.delete(ip)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [ip, record] of this.attempts.entries()) {
      if (now > record.resetAt) {
        this.attempts.delete(ip)
      }
    }
  }
}

// Create singleton instances for different purposes
export const loginRateLimiter = new IPRateLimiter(5, 15) // 5 attempts per 15 minutes
export const signupRateLimiter = new IPRateLimiter(3, 60) // 3 attempts per hour
export const passwordResetRateLimiter = new IPRateLimiter(3, 60) // 3 attempts per hour