import { NextRequest, NextResponse } from 'next/server';
import { TenantResolver } from '@/lib/middleware/tenant-resolver';
import { getToken } from 'next-auth/jwt';

/**
 * Multi-tenant middleware for handling domain-based and subdomain-based routing
 * Supports: white-label deployments, multi-tenant SaaS, subdomain routing, authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🌐 Middleware processing: ${pathname}`);

  // Skip middleware for static files and API routes that don't need tenant context
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/trips',
    '/itinerary',
    '/itinerary-display',
    '/profile',
    '/settings',
    '/tour-operator',
    '/admin'
  ];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip auth check for auth routes and public pages
  const isAuthRoute = pathname.startsWith('/auth/');
  const isPublicRoute = pathname === '/' || 
                       pathname === '/ui-showcase' || 
                       pathname === '/ui-showcase-v2' ||
                       pathname === '/docs' ||
                       pathname.startsWith('/api/');

  // Check authentication for protected routes
  if (isProtectedRoute && !isAuthRoute) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production' 
      });

      if (!token) {
        console.log(`🔒 Unauthenticated access to protected route: ${pathname}`);
        const url = request.nextUrl.clone();
        url.pathname = '/auth/signin';
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }

      console.log(`✅ Authenticated user accessing: ${pathname}`);
    } catch (error) {
      console.error('Authentication check error:', error);
      // On error, redirect to signin for safety
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  try {
    // Resolve tenant information
    const tenant = await TenantResolver.resolveTenant(request);
    
    console.log(`🏢 Resolved tenant: ${tenant.name} (${tenant.id})`);

    // Create response with tenant information in headers
    const response = NextResponse.next();
    
    // Add tenant info to headers for server components
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-name', tenant.name);
    response.headers.set('x-tenant-slug', tenant.slug);
    response.headers.set('x-tenant-domain', tenant.domain);
    response.headers.set('x-tenant-settings', JSON.stringify(tenant.settings));
    response.headers.set('x-pathname', pathname);

    // Handle tenant-specific routing
    if (tenant.id !== 'default') {
      // For white-label clients, handle special routing
      if (tenant.isCustomDomain || tenant.subdomain) {
        // Custom domain or subdomain - serve branded version
        console.log(`🎨 Serving branded version for tenant: ${tenant.name}`);
        
        // Check authentication for protected routes on tenant domains
        if (isProtectedRoute && !isAuthRoute) {
          try {
            const token = await getToken({ 
              req: request, 
              secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production' 
            });

            if (!token) {
              console.log(`🔒 Unauthenticated access to protected tenant route: ${pathname}`);
              const url = request.nextUrl.clone();
              url.pathname = '/auth/signin';
              url.searchParams.set('callbackUrl', pathname);
              return NextResponse.redirect(url);
            }
          } catch (error) {
            console.error('Tenant auth check error:', error);
            const url = request.nextUrl.clone();
            url.pathname = '/auth/signin';
            url.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(url);
          }
        }
        
        // Add tenant branding headers
        response.headers.set('x-tenant-branded', 'true');
        response.headers.set('x-tenant-custom-domain', tenant.isCustomDomain.toString());
        
        // Block admin routes for non-default tenants
        if (pathname.startsWith('/admin')) {
          console.log(`🚫 Blocking admin access for tenant: ${tenant.name}`);
          return new NextResponse('Access Denied', { status: 403 });
        }
      } else if (pathname.startsWith('/client/')) {
        // Path-based tenant routing - remove /client/slug prefix
        const tenantSlug = pathname.split('/')[2];
        if (tenantSlug === tenant.slug) {
          const newPath = pathname.replace(`/client/${tenantSlug}`, '') || '/';
          console.log(`🔄 Rewriting path from ${pathname} to ${newPath}`);
          
          // Check if the rewritten path is protected
          const isRewrittenProtected = protectedRoutes.some(route => 
            newPath === route || newPath.startsWith(`${route}/`)
          );
          
          if (isRewrittenProtected) {
            try {
              const token = await getToken({ 
                req: request, 
                secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production' 
              });

              if (!token) {
                console.log(`🔒 Unauthenticated access to protected tenant route: ${newPath}`);
                const url = request.nextUrl.clone();
                url.pathname = '/auth/signin';
                url.searchParams.set('callbackUrl', pathname);
                return NextResponse.redirect(url);
              }
            } catch (error) {
              console.error('Tenant path auth check error:', error);
              const url = request.nextUrl.clone();
              url.pathname = '/auth/signin';
              url.searchParams.set('callbackUrl', pathname);
              return NextResponse.redirect(url);
            }
          }
          
          // Rewrite the URL to remove the tenant prefix
          const url = request.nextUrl.clone();
          url.pathname = newPath;
          
          const rewriteResponse = NextResponse.rewrite(url);
          
          // Copy tenant headers to rewritten response
          rewriteResponse.headers.set('x-tenant-id', tenant.id);
          rewriteResponse.headers.set('x-tenant-name', tenant.name);
          rewriteResponse.headers.set('x-tenant-slug', tenant.slug);
          rewriteResponse.headers.set('x-tenant-domain', tenant.domain);
          rewriteResponse.headers.set('x-tenant-settings', JSON.stringify(tenant.settings));
          rewriteResponse.headers.set('x-tenant-branded', 'true');
          rewriteResponse.headers.set('x-pathname', newPath);
          
          return rewriteResponse;
        }
      }
    }

    // For admin routes, ensure proper authentication (placeholder for now)
    if (pathname.startsWith('/admin')) {
      console.log(`👑 Admin route accessed for default tenant`);
      response.headers.set('x-admin-route', 'true');
    }

    return response;

  } catch (error) {
    console.error('❌ Middleware error:', error);
    
    // Fallback to default tenant on error
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', 'default');
    response.headers.set('x-tenant-name', 'Default Organization');
    response.headers.set('x-tenant-slug', 'default');
    response.headers.set('x-tenant-domain', 'localhost:3000');
    response.headers.set('x-tenant-settings', '{}');
    response.headers.set('x-pathname', pathname);
    
    return response;
  }
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};