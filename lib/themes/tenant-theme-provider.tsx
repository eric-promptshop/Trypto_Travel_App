'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { TenantInfo } from '@/lib/middleware/tenant-resolver'

interface TenantTheme {
  // Brand colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  
  // Logo and branding
  logo?: string
  logoLight?: string
  logoDark?: string
  brandName: string
  
  // Typography
  fontFamily?: string
  fontSize?: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
  }
  
  // Layout
  borderRadius?: string
  shadows?: boolean
  
  // Custom CSS variables
  cssVariables?: Record<string, string>
}

interface TenantThemeContextType {
  tenant: TenantInfo | null
  theme: TenantTheme | null
  isLoading: boolean
  applyTheme: (theme: TenantTheme) => void
  resetTheme: () => void
}

const TenantThemeContext = createContext<TenantThemeContextType | undefined>(undefined)

// Default theme configuration
const DEFAULT_THEME: TenantTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  brandName: 'Travel Itinerary Builder',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem', 
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  borderRadius: '0.5rem',
  shadows: true
}

// Predefined tenant themes
const TENANT_THEMES: Record<string, Partial<TenantTheme>> = {
  'adventure-tours': {
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    backgroundColor: '#ecfdf5',
    brandName: 'Adventure Tours Co',
    cssVariables: {
      '--theme-adventure': 'true'
    }
  },
  'luxury-escapes': {
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    accentColor: '#fbbf24',
    backgroundColor: '#faf5ff',
    brandName: 'Luxury Escapes',
    shadows: true,
    cssVariables: {
      '--theme-luxury': 'true'
    }
  },
  'budget-backpackers': {
    primaryColor: '#dc2626',
    secondaryColor: '#ef4444',
    accentColor: '#f97316',
    backgroundColor: '#fef2f2',
    brandName: 'Budget Backpackers',
    shadows: false,
    cssVariables: {
      '--theme-budget': 'true'
    }
  }
}

export function TenantThemeProvider({ 
  children,
  initialTenant
}: { 
  children: React.ReactNode
  initialTenant?: TenantInfo | null
}) {
  const [tenant, setTenant] = useState<TenantInfo | null>(initialTenant || null)
  const [theme, setTheme] = useState<TenantTheme | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load tenant information from headers if not provided
  useEffect(() => {
    async function loadTenantFromHeaders() {
      if (tenant) {
        setIsLoading(false)
        return
      }

      try {
        // Try to get tenant info from meta tags set by server
        const tenantId = document.querySelector('meta[name="tenant-id"]')?.getAttribute('content')
        const tenantName = document.querySelector('meta[name="tenant-name"]')?.getAttribute('content')
        const tenantSlug = document.querySelector('meta[name="tenant-slug"]')?.getAttribute('content')
        const tenantDomain = document.querySelector('meta[name="tenant-domain"]')?.getAttribute('content')
        const tenantSettings = document.querySelector('meta[name="tenant-settings"]')?.getAttribute('content')

        if (tenantId && tenantName && tenantSlug && tenantDomain) {
          const resolvedTenant: TenantInfo = {
            id: tenantId,
            name: tenantName,
            slug: tenantSlug,
            domain: tenantDomain,
            isActive: true,
            settings: tenantSettings ? JSON.parse(tenantSettings) : {},
            isCustomDomain: false
          }
          
          setTenant(resolvedTenant)
        }
      } catch (error) {
        console.error('Error loading tenant from headers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTenantFromHeaders()
  }, [tenant])

  // Apply theme when tenant changes
  useEffect(() => {
    if (!tenant) return

    // Get theme from tenant settings or predefined themes
    let tenantTheme: TenantTheme = { ...DEFAULT_THEME }

    // Check if tenant has custom theme in settings
    if (tenant.settings?.theme) {
      tenantTheme = {
        ...tenantTheme,
        ...tenant.settings.theme
      }
    } else if (TENANT_THEMES[tenant.slug]) {
      // Use predefined theme for this tenant
      tenantTheme = {
        ...tenantTheme,
        ...TENANT_THEMES[tenant.slug]
      }
    }

    // Override with brand name from tenant
    tenantTheme.brandName = tenant.name

    setTheme(tenantTheme)
    applyThemeToDOM(tenantTheme)
  }, [tenant])

  const applyThemeToDOM = (themeToApply: TenantTheme) => {
    const root = document.documentElement

    // Apply CSS custom properties
    root.style.setProperty('--primary-color', themeToApply.primaryColor)
    root.style.setProperty('--secondary-color', themeToApply.secondaryColor)
    root.style.setProperty('--accent-color', themeToApply.accentColor)
    root.style.setProperty('--background-color', themeToApply.backgroundColor)
    root.style.setProperty('--text-color', themeToApply.textColor)
    
    if (themeToApply.fontFamily) {
      root.style.setProperty('--font-family', themeToApply.fontFamily)
    }
    
    if (themeToApply.borderRadius) {
      root.style.setProperty('--border-radius', themeToApply.borderRadius)
    }

    // Apply custom CSS variables
    if (themeToApply.cssVariables) {
      Object.entries(themeToApply.cssVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }

    // Add tenant-specific body class
    document.body.className = document.body.className
      .replace(/tenant-\w+/g, '') // Remove existing tenant classes
      .trim()
    
    if (tenant?.slug && tenant.slug !== 'default') {
      document.body.classList.add(`tenant-${tenant.slug}`)
    }

    // Update page title
    if (themeToApply.brandName && themeToApply.brandName !== 'Default Organization') {
      const titleElement = document.querySelector('title')
      if (titleElement && !titleElement.textContent?.includes(themeToApply.brandName)) {
        titleElement.textContent = `${themeToApply.brandName} - Travel Itinerary Builder`
      }
    }
  }

  const applyTheme = (newTheme: TenantTheme) => {
    setTheme(newTheme)
    applyThemeToDOM(newTheme)
  }

  const resetTheme = () => {
    setTheme(DEFAULT_THEME)
    applyThemeToDOM(DEFAULT_THEME)
  }

  const value: TenantThemeContextType = {
    tenant,
    theme,
    isLoading,
    applyTheme,
    resetTheme
  }

  return (
    <TenantThemeContext.Provider value={value}>
      {children}
    </TenantThemeContext.Provider>
  )
}

export function useTenantTheme(): TenantThemeContextType {
  const context = useContext(TenantThemeContext)
  if (context === undefined) {
    throw new Error('useTenantTheme must be used within a TenantThemeProvider')
  }
  return context
}

export function TenantBrandingInjector() {
  const { theme, tenant } = useTenantTheme()

  if (!theme || !tenant) return null

  return (
    <>
      {/* Inject tenant metadata */}
      <meta name="tenant-id" content={tenant.id} />
      <meta name="tenant-name" content={tenant.name} />
      <meta name="tenant-slug" content={tenant.slug} />
      <meta name="tenant-domain" content={tenant.domain} />
      <meta name="tenant-settings" content={JSON.stringify(tenant.settings)} />
      
      {/* Inject theme CSS */}
      <style jsx global>{`
        :root {
          --primary-color: ${theme.primaryColor};
          --secondary-color: ${theme.secondaryColor};
          --accent-color: ${theme.accentColor};
          --background-color: ${theme.backgroundColor};
          --text-color: ${theme.textColor};
          --border-radius: ${theme.borderRadius};
          ${theme.fontFamily ? `--font-family: ${theme.fontFamily};` : ''}
        }
        
        body {
          background-color: var(--background-color);
          color: var(--text-color);
          ${theme.fontFamily ? `font-family: var(--font-family);` : ''}
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
        
        .btn-primary:hover {
          background-color: var(--secondary-color);
          border-color: var(--secondary-color);
        }
        
        .btn-accent {
          background-color: var(--accent-color);
          border-color: var(--accent-color);
        }
        
        .text-primary {
          color: var(--primary-color);
        }
        
        .text-secondary {
          color: var(--secondary-color);
        }
        
        .text-accent {
          color: var(--accent-color);
        }
        
        .bg-primary {
          background-color: var(--primary-color);
        }
        
        .bg-secondary {
          background-color: var(--secondary-color);
        }
        
        .bg-accent {
          background-color: var(--accent-color);
        }
        
        .border-primary {
          border-color: var(--primary-color);
        }
        
        .rounded-theme {
          border-radius: var(--border-radius);
        }
        
        ${!theme.shadows ? `
          .shadow,
          .shadow-sm,
          .shadow-md,
          .shadow-lg,
          .shadow-xl {
            box-shadow: none !important;
          }
        ` : ''}
      `}</style>
    </>
  )
} 