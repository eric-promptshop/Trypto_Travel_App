import { NextRequest, NextResponse } from 'next/server';
import { TenantResolver } from '@/lib/middleware/tenant-resolver';

/**
 * Multi-tenant middleware for handling domain-based and subdomain-based routing
 * Supports: white-label deployments, multi-tenant SaaS, subdomain routing
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