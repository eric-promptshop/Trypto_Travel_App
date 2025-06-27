"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import { TripProvider } from '@/contexts/TripContext'
import { TemplateProvider } from '@/contexts/TemplateContext'
import { AssetManagerProvider } from '@/contexts/AssetManagerContext'
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext'
import { ThemeProvider } from "@/components/theme-provider"
import { useNetworkCondition } from '@/components/images/network-detection'
import { useWebVitals } from '@/components/performance/use-web-vitals'
import { OrientationBanner } from "@/components/OrientationBanner"
import { BatteryStatusBanner } from "@/components/BatteryStatusBanner"
import { GeolocationBanner } from "@/components/GeolocationBanner"
import { MainHeader } from '@/components/layout/MainHeader'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { ErrorBoundary } from '@/components/error-handling/error-boundary'
import { analytics } from '@/lib/analytics/analytics-service'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { ThumbZoneWrapper } from '@/components/ThumbZoneWrapper'
import { FloatingActionContainer } from '@/components/FloatingActionContainer'

function OfflineStatusBanner() {
  const { isOnline } = useNetworkCondition(5000)
  if (isOnline) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }} className="bg-red-600 text-white text-center py-2 shadow-md">
      <span>⚠️ You are offline. Some features may be unavailable.</span>
    </div>
  )
}

function useRegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        if (process.env.NODE_ENV === 'development') {
        }
      })
    }
  }, [])
}

export default function ClientAppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  
  // Always call the hook, but only use its value in production
  const webVitals = useWebVitals()
  const shouldTrackVitals = process.env.NODE_ENV === 'production'
  
  useRegisterServiceWorker()
  
  // Determine if banners should be shown based on the current route
  const shouldShowBanners = !['/', '/onboarding', '/docs', '/admin', '/plan'].some(path => 
    pathname === path || pathname.startsWith('/onboarding/')
  )
  
  useEffect(() => {
    setMounted(true)
    
    // Initialize analytics and monitoring in the background
    if (typeof window !== 'undefined') {
      // Defer analytics initialization to not block rendering
      setTimeout(() => {
        analytics.initialize({})
        performanceMonitor.startAutomaticMonitoring()
        
        // Track initial page view
        analytics.page(window.location.pathname)
      }, 100)
    }
  }, [])

  // Remove the loading state here to prevent double loading screens
  if (!mounted) {
    return null
  }

  return (
    <SessionProvider>
      <ThemeProvider>
        <CustomThemeProvider>
          <TripProvider>
            <TemplateProvider>
              <AssetManagerProvider>
                <ErrorBoundary>
                  <ThumbZoneWrapper priority="high">
                    <div className="min-h-screen bg-background">
                      {shouldShowBanners && (
                        <>
                          <OrientationBanner />
                          <BatteryStatusBanner />
                          <GeolocationBanner />
                        </>
                      )}
                      <OfflineStatusBanner />
                      
                      <MainHeader />
                      
                      {/* Add spacing for fixed header */}
                      <div className="pt-20" />
                      
                      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
                        {children}
                      </main>
                      
                      <MobileBottomNav />
                      <FloatingActionContainer />
                    </div>
                    <Toaster />
                    <HotToaster position="top-center" />
                  </ThumbZoneWrapper>
                </ErrorBoundary>
              </AssetManagerProvider>
            </TemplateProvider>
          </TripProvider>
        </CustomThemeProvider>
      </ThemeProvider>
    </SessionProvider>
  )
} 