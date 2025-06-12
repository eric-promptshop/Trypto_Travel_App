import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  domain: string
  isActive: boolean
  settings: any
  subdomain?: string
  isCustomDomain: boolean
}

/**
 * Resolves tenant information from the request
 * Supports multiple tenant resolution strategies:
 * 1. Custom domains (e.g., client1.com)
 * 2. Subdomains (e.g., client1.yourdomain.com)
 * 3. Path-based (e.g., yourdomain.com/client1)
 * 4. Default tenant fallback
 */
export class TenantResolver {
  public static defaultTenant: TenantInfo = {
    id: 'default',
    name: 'Default Organization',
    slug: 'default',
    domain: 'localhost:3000',
    isActive: true,
    settings: {},
    isCustomDomain: false
  }

  /**
   * Extract tenant information from the request
   */
  static async resolveTenant(request: NextRequest): Promise<TenantInfo> {
    const host = request.headers.get('host') || 'localhost:3000'
    const pathname = request.nextUrl.pathname

    console.log(`🔍 Resolving tenant for host: ${host}, path: ${pathname}`)

    // Strategy 1: Check for custom domain mapping
    const customDomainTenant = await this.resolveByCustomDomain(host)
    if (customDomainTenant) {
      console.log(`✅ Resolved tenant by custom domain: ${customDomainTenant.name}`)
      return customDomainTenant
    }

    // Strategy 2: Check for subdomain
    const subdomainTenant = await this.resolveBySubdomain(host)
    if (subdomainTenant) {
      console.log(`✅ Resolved tenant by subdomain: ${subdomainTenant.name}`)
      return subdomainTenant
    }

    // Strategy 3: Check for path-based routing (e.g., /client/adventure-tours)
    const pathTenant = await this.resolveByPath(pathname)
    if (pathTenant) {
      console.log(`✅ Resolved tenant by path: ${pathTenant.name}`)
      return pathTenant
    }

    // Strategy 4: Admin routes use default tenant
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      console.log(`✅ Using default tenant for admin route`)
      return this.defaultTenant
    }

    // Fallback: Use default tenant
    console.log(`ℹ️ Using default tenant as fallback`)
    return this.defaultTenant
  }

  /**
   * Resolve tenant by custom domain
   */
  private static async resolveByCustomDomain(host: string): Promise<TenantInfo | null> {
    try {
      // TODO: Replace with API call or edge-compatible solution
      // For now, return null to skip custom domain resolution
      console.log('Custom domain resolution skipped in edge runtime')
      return null
    } catch (error) {
      console.error('Error resolving tenant by custom domain:', error)
    }
    
    return null
  }

  /**
   * Resolve tenant by subdomain (e.g., client1.yourdomain.com)
   */
  private static async resolveBySubdomain(host: string): Promise<TenantInfo | null> {
    // Extract subdomain
    const parts = host.split('.')
    if (parts.length < 3) return null // No subdomain

    const subdomain = parts[0]
    
    // Skip common non-tenant subdomains
    if (['www', 'api', 'admin', 'app', 'localhost'].includes(subdomain)) {
      return null
    }

    try {
      // TODO: Replace with API call or edge-compatible solution
      // For now, return null to skip subdomain resolution
      console.log('Subdomain resolution skipped in edge runtime')
      return null
    } catch (error) {
      console.error('Error resolving tenant by subdomain:', error)
    }
    
    return null
  }

  /**
   * Resolve tenant by path (e.g., /client/adventure-tours)
   */
  private static async resolveByPath(pathname: string): Promise<TenantInfo | null> {
    const pathMatch = pathname.match(/^\/client\/([^\/]+)/)
    if (!pathMatch) return null

    const slug = pathMatch[1]
    if (!slug) return null

    try {
      // Mock tenant data for demo purposes
      // TODO: Replace with API call or edge-compatible solution
      const mockTenants: Record<string, TenantInfo> = {
        'adventure-tours': {
          id: 'adventure-tours',
          name: 'Adventure Tours Co',
          slug: 'adventure-tours',
          domain: 'adventure-tours.example.com',
          isActive: true,
          settings: {
            primaryColor: '#10b981',
            secondaryColor: '#059669'
          },
          isCustomDomain: false
        },
        'luxury-escapes': {
          id: 'luxury-escapes',
          name: 'Luxury Escapes',
          slug: 'luxury-escapes',
          domain: 'luxury-escapes.example.com',
          isActive: true,
          settings: {
            primaryColor: '#8b5cf6',
            secondaryColor: '#7c3aed'
          },
          isCustomDomain: false
        },
        'budget-backpackers': {
          id: 'budget-backpackers',
          name: 'Budget Backpackers',
          slug: 'budget-backpackers',
          domain: 'budget-backpackers.example.com',
          isActive: true,
          settings: {
            primaryColor: '#ef4444',
            secondaryColor: '#dc2626'
          },
          isCustomDomain: false
        }
      }
      
      return mockTenants[slug] || null
    } catch (error) {
      console.error('Error resolving tenant by path:', error)
    }
    
    return null
  }

  /**
   * Get tenant info for server components
   */
  static async getTenantFromHeaders(): Promise<TenantInfo> {
    try {
      const headersList = await headers()
      const host = headersList.get('host') || 'localhost:3000'
      const pathname = headersList.get('x-pathname') || '/'

      // Create a mock request for resolution
      const request = {
        headers: new Map([['host', host]]),
        nextUrl: { pathname }
      } as any as NextRequest

      return await this.resolveTenant(request)
    } catch (error) {
      console.error('Error getting tenant from headers:', error)
      return this.defaultTenant
    }
  }
}

/**
 * Hook for getting current tenant in client components
 */
export function useTenant(): TenantInfo {
  // This will be enhanced with a context provider
  return TenantResolver.defaultTenant
} 