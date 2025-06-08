import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import ClientAppShell from '@/components/ClientAppShell'
import { TenantThemeProvider, TenantBrandingInjector } from '@/lib/themes/tenant-theme-provider'
import { TenantInfo } from '@/lib/middleware/tenant-resolver'

const inter = Inter({ subsets: ['latin'] })

// Dynamic metadata based on tenant
export async function generateMetadata(): Promise<Metadata> {
  try {
    const headersList = await headers()
    const tenantName = headersList.get('x-tenant-name') || 'Travel Itinerary Builder'
    const tenantSlug = headersList.get('x-tenant-slug') || 'default'
    
    // Tenant-specific metadata
    const isDefaultTenant = tenantSlug === 'default'
    
    return {
      title: isDefaultTenant ? 'Travel Itinerary Builder' : `${tenantName} - Travel Planning`,
      description: isDefaultTenant 
        ? 'AI-powered custom trip builder for travel professionals'
        : `Plan amazing trips with ${tenantName} - powered by AI`,
      keywords: isDefaultTenant
        ? ['travel', 'itinerary', 'AI', 'trip planning', 'custom travel']
        : ['travel', 'itinerary', tenantName.toLowerCase(), 'trip planning'],
      openGraph: {
        title: isDefaultTenant ? 'Travel Itinerary Builder' : `${tenantName} - Travel Planning`,
        description: isDefaultTenant 
          ? 'AI-powered custom trip builder'
          : `Plan amazing trips with ${tenantName}`,
        siteName: tenantName,
      },
      twitter: {
        title: isDefaultTenant ? 'Travel Itinerary Builder' : `${tenantName} - Travel Planning`,
        description: isDefaultTenant 
          ? 'AI-powered custom trip builder'
          : `Plan amazing trips with ${tenantName}`,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Travel Itinerary Builder',
      description: 'AI-powered custom trip builder',
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get tenant information from middleware headers
  let tenantInfo: TenantInfo | null = null
  
  try {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')
    const tenantName = headersList.get('x-tenant-name')
    const tenantSlug = headersList.get('x-tenant-slug')
    const tenantDomain = headersList.get('x-tenant-domain')
    const tenantSettings = headersList.get('x-tenant-settings')
    const isCustomDomain = headersList.get('x-tenant-custom-domain') === 'true'

    if (tenantId && tenantName && tenantSlug && tenantDomain) {
      tenantInfo = {
        id: tenantId,
        name: tenantName,
        slug: tenantSlug,
        domain: tenantDomain,
        isActive: true,
        settings: tenantSettings ? JSON.parse(tenantSettings) : {},
        isCustomDomain
      }
    }
  } catch (error) {
    console.error('Error reading tenant headers in layout:', error)
  }

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        
        {/* Tenant metadata injection */}
        {tenantInfo && (
          <>
            <meta name="tenant-id" content={tenantInfo.id} />
            <meta name="tenant-name" content={tenantInfo.name} />
            <meta name="tenant-slug" content={tenantInfo.slug} />
            <meta name="tenant-domain" content={tenantInfo.domain} />
            <meta name="tenant-settings" content={JSON.stringify(tenantInfo.settings)} />
            {tenantInfo.isCustomDomain && <meta name="tenant-custom-domain" content="true" />}
          </>
        )}
        
        {/* Resource Hints for Performance */}
        {/* Preconnect and DNS Prefetch for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Preconnect and DNS Prefetch for Cloudinary */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Preconnect for Google Maps API */}
        <link rel="preconnect" href="https://maps.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        {/* Prefetch a likely-to-be-used route (example) */}
        <link rel="prefetch" href="/itinerary-display" as="document" />
      </head>
      <body className={inter.className}>
        <TenantThemeProvider initialTenant={tenantInfo}>
          <TenantBrandingInjector />
          <ClientAppShell>{children}</ClientAppShell>
        </TenantThemeProvider>
      </body>
    </html>
  )
}
