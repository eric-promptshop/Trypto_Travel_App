import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals'

type MetricName = 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB'

interface Metric {
  name: MetricName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

// Thresholds based on Google's Web Vitals recommendations
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
}

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

export function reportWebVitals(onReport?: (metric: Metric) => void) {
  const handleReport = (metric: any) => {
    const enhancedMetric: Metric = {
      ...metric,
      rating: getRating(metric.name, metric.value),
      navigationType: metric.navigationType || 'navigate'
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        value: metric.value,
        rating: enhancedMetric.rating,
        delta: metric.delta
      })
    }

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: enhancedMetric.rating
      })
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'web-vitals',
          metric: enhancedMetric,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Silently fail analytics
      })
    }

    // Call custom handler
    if (onReport) {
      onReport(enhancedMetric)
    }
  }

  getCLS(handleReport)
  getFCP(handleReport)
  getFID(handleReport)
  getLCP(handleReport)
  getTTFB(handleReport)
}

// Performance observer for custom metrics
export function measureCustomMetric(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name).pop()
      
      if (measure) {
        // Log custom metric
        if (process.env.NODE_ENV === 'development') {
        }

        // Send to analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'timing_complete', {
            name,
            value: Math.round(measure.duration)
          })
        }

        return measure.duration
      }
    } catch (error) {
      console.error('Error measuring performance:', error)
    }
  }
  return null
}

// Resource timing utilities
export function getResourceTimings() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    return resources.map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0
    }))
  }
  return []
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const markStart = (name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`)
    }
  }

  const markEnd = (name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`)
      return measureCustomMetric(name, `${name}-start`, `${name}-end`)
    }
    return null
  }

  return { markStart, markEnd }
}