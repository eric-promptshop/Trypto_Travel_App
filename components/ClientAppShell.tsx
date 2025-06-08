"use client"

import { useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
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
import { MainNavigation } from '@/components/layout/MainNavigation'
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
          console.warn('Service worker registration failed:', err)
        }
      })
    }
  }, [])
}

export default function ClientAppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  // Call useWebVitals at the component level (only in production)
  const webVitals = process.env.NODE_ENV === 'production' ? useWebVitals() : null
  
  useRegisterServiceWorker()
  
  useEffect(() => {
    setMounted(true)
    
    // Initialize analytics and monitoring
    if (typeof window !== 'undefined') {
      analytics.initialize({})
      performanceMonitor.startAutomaticMonitoring()
      
      // Track initial page view
      analytics.page(window.location.pathname)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CustomThemeProvider>
          <TripProvider>
            <TemplateProvider>
              <AssetManagerProvider>
                <ErrorBoundary>
                  <ThumbZoneWrapper priority="high">
                    <div className="min-h-screen bg-background">
                      <OrientationBanner />
                      <BatteryStatusBanner />
                      <GeolocationBanner />
                      <OfflineStatusBanner />
                      
                      <MainHeader />
                      <MainNavigation />
                      
                      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
                        {children}
                      </main>
                      
                      <MobileBottomNav />
                      <FloatingActionContainer />
                    </div>
                    <Toaster />
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