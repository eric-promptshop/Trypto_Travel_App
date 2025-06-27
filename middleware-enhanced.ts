import { NextRequest, NextResponse } from 'next/server'
import { TenantResolver } from '@/lib/middleware/tenant-resolver'
import { getToken } from 'next-auth/jwt'
import { rateLimit, getRateLimitHeaders } from '@/lib/security/rate-limiter'

// Define rate limit rules for different paths
const rateLimitRules: Array<{
  path: RegExp
  type: 'api' | 'ai' | 'auth' | 'widget' | 'scraping'
}> = [
  { path: /^\/api\/auth\//, type: 'auth' },
  { path: /^\/api\/ai\//, type: 'ai' },
  { path: /^\/api\/widgets\//, type: 'widget' },
  { path: /^\/api\/.*\/scrape/, type: 'scraping' },
  { path: /^\/api\//, type: 'api' } // Default API rate limit
]

/**
 * Enhanced multi-tenant middleware with security features
 * Includes: rate limiting, security headers, authentication, tenant resolution
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rule = rateLimitRules.find(r => r.path.test(pathname))
    
    if (rule) {
      const result = await rateLimit(request, rule.type)
      
      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Please try again later',
            retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...getRateLimitHeaders(result),
              'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
            }
          }
        )
      }
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/trips',
    '/itinerary',
    '/itinerary-display',
    '/profile',
    '/settings',
    '/tour-operator',
    '/operator',
    '/admin'
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Skip auth check for auth routes and public pages
  const isAuthRoute = pathname.startsWith('/auth/')
  const isPublicRoute = pathname === '/' || 
                       pathname === '/ui-showcase' || 
                       pathname === '/ui-showcase-v2' ||
                       pathname === '/docs' ||
                       pathname.startsWith('/api/')

  // Check authentication for protected routes
  if (isProtectedRoute && !isAuthRoute) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production' 
      })

      if (!token) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/signin'
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }

    } catch (error) {
      console.error('Authentication check error:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  try {
    // Resolve tenant information
    const tenant = await TenantResolver.resolveTenant(request)
    

    // Create response with tenant information and security headers
    const response = NextResponse.next()
    
    // Add tenant info to headers for server components
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-tenant-name', tenant.name)
    response.headers.set('x-tenant-slug', tenant.slug)
    response.headers.set('x-tenant-domain', tenant.domain)
    response.headers.set('x-tenant-settings', JSON.stringify(tenant.settings))
    response.headers.set('x-pathname', pathname)

    // Apply security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(self), geolocation=(self)'
    )

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openai.com https://api.replicate.com https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', csp)

    // Add rate limit headers for successful API requests
    if (pathname.startsWith('/api/')) {
      const rule = rateLimitRules.find(r => r.path.test(pathname))
      if (rule) {
        const result = await rateLimit(request, rule.type)
        Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }
    }

    // Handle tenant-specific routing
    if (tenant.id !== 'default') {
      // For white-label clients, handle special routing
      if (tenant.isCustomDomain || tenant.subdomain) {
        
        // Check authentication for protected routes on tenant domains
        if (isProtectedRoute && !isAuthRoute) {
          try {
            const token = await getToken({ 
              req: request, 
              secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production' 
            })

            if (!token) {
              const url = request.nextUrl.clone()
              url.pathname = '/auth/signin'
              url.searchParams.set('callbackUrl', pathname)
              return NextResponse.redirect(url)
            }
          } catch (error) {
            console.error('Tenant auth check error:', error)
            const url = request.nextUrl.clone()
            url.pathname = '/auth/signin'
            url.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(url)
          }
        }
        
        // Add tenant branding headers
        response.headers.set('x-tenant-branded', 'true')
        response.headers.set('x-tenant-custom-domain', tenant.isCustomDomain.toString())
        
        // Block admin routes for non-default tenants
        if (pathname.startsWith('/admin')) {
          return new NextResponse('Access Denied', { status: 403 })
        }
      } else if (pathname.startsWith('/client/')) {
        // Path-based tenant routing - remove /client/slug prefix
        const tenantSlug = pathname.split('/')[2]
        if (tenantSlug === tenant.slug) {
          const newPath = pathname.replace(`/client/${tenantSlug}`, '') || '/'
          
          // Check if the rewritten path is protected
          const isRewrittenProtected = protectedRoutes.some(route => 
            newPath === route || newPath.startsWith(`${route}/`)
          )
          
          if (isRewrittenProtected) {
            try {
              const token = await getToken({ 
                req: request, 
                secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production' 
              })

              if (!token) {
                const url = request.nextUrl.clone()
                url.pathname = '/auth/signin'
                url.searchParams.set('callbackUrl', pathname)
                return NextResponse.redirect(url)
              }
            } catch (error) {
              console.error('Tenant path auth check error:', error)
              const url = request.nextUrl.clone()
              url.pathname = '/auth/signin'
              url.searchParams.set('callbackUrl', pathname)
              return NextResponse.redirect(url)
            }
          }
          
          // Rewrite the URL to remove the tenant prefix
          const url = request.nextUrl.clone()
          url.pathname = newPath
          
          const rewriteResponse = NextResponse.rewrite(url)
          
          // Copy all headers to rewritten response
          response.headers.forEach((value, key) => {
            rewriteResponse.headers.set(key, value)
          })
          
          // Update pathname header
          rewriteResponse.headers.set('x-pathname', newPath)
          
          return rewriteResponse
        }
      }
    }

    // For admin routes, ensure proper authentication
    if (pathname.startsWith('/admin')) {
      response.headers.set('x-admin-route', 'true')
    }

    return response

  } catch (error) {
    console.error('❌ Middleware error:', error)
    
    // Fallback to default tenant on error
    const response = NextResponse.next()
    response.headers.set('x-tenant-id', 'default')
    response.headers.set('x-tenant-name', 'Default Organization')
    response.headers.set('x-tenant-slug', 'default')
    response.headers.set('x-tenant-domain', 'localhost:3000')
    response.headers.set('x-tenant-settings', '{}')
    response.headers.set('x-pathname', pathname)
    
    // Still apply security headers on error
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}