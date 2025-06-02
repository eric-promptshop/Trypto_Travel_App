"use client"

import { useEffect } from 'react'
import { TripProvider } from '../contexts/TripContext'
import { useNetworkCondition } from '../components/images/network-detection'
import { useWebVitals } from '../components/performance/use-web-vitals'
import { ThemeProvider } from "@/components/theme-provider"
import { OrientationBanner } from "@/components/OrientationBanner"
import { BatteryStatusBanner } from "@/components/BatteryStatusBanner"
import { GeolocationBanner } from "@/components/GeolocationBanner"

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
  useRegisterServiceWorker()
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      useWebVitals()
    }
  }, [])
  return (
    <>
      <OrientationBanner />
      <BatteryStatusBanner />
      <GeolocationBanner />
      <OfflineStatusBanner />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TripProvider>
          {children}
        </TripProvider>
      </ThemeProvider>
    </>
  )
} 