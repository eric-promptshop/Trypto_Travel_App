'use client'

import { useEffect, useState } from 'react'
import type { Metric } from 'web-vitals'

export interface WebVitalsMetrics {
  lcp?: number // Largest Contentful Paint
  inp?: number // Interaction to Next Paint (replaced FID)
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
}

export function useWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reportWebVitals = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals')

        onCLS((metric: Metric) => {
          setMetrics((prev) => ({ ...prev, cls: metric.value }))
          console.log('CLS:', metric.value)
        })

        onINP((metric: Metric) => {
          setMetrics((prev) => ({ ...prev, inp: metric.value }))
          console.log('INP:', metric.value)
        })

        onLCP((metric: Metric) => {
          setMetrics((prev) => ({ ...prev, lcp: metric.value }))
          console.log('LCP:', metric.value)
        })

        onFCP((metric: Metric) => {
          setMetrics((prev) => ({ ...prev, fcp: metric.value }))
          console.log('FCP:', metric.value)
        })

        onTTFB((metric: Metric) => {
          setMetrics((prev) => ({ ...prev, ttfb: metric.value }))
          console.log('TTFB:', metric.value)
        })
      } catch (error) {
        console.error('Failed to load web-vitals:', error)
      }
    }

    reportWebVitals()
  }, [])

  return metrics
}

// Performance observer for custom metrics
export function usePerformanceObserver() {
  const [customMetrics, setCustomMetrics] = useState<Record<string, number>>({})

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    // Observe navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          setCustomMetrics((prev) => ({
            ...prev,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            domInteractive: navEntry.domInteractive - navEntry.fetchStart,
          }))
        }
      }
    })

    // Observe resource timing for images
    const resourceObserver = new PerformanceObserver((list) => {
      const imageEntries = list.getEntries().filter(
        (entry) => entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
      )
      
      if (imageEntries.length > 0) {
        const avgImageLoadTime = imageEntries.reduce((sum, entry) => sum + entry.duration, 0) / imageEntries.length
        setCustomMetrics((prev) => ({
          ...prev,
          avgImageLoadTime,
          totalImages: (prev.totalImages || 0) + imageEntries.length
        }))
      }
    })

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] })
      resourceObserver.observe({ entryTypes: ['resource'] })
    } catch (error) {
      console.error('PerformanceObserver error:', error)
    }

    return () => {
      navigationObserver.disconnect()
      resourceObserver.disconnect()
    }
  }, [])

  return customMetrics
} 