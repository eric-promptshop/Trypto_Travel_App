export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  tags?: Record<string, string>
}

export interface WebVitalsData {
  CLS: number
  FID: number
  FCP: number
  LCP: number
  TTFB: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private apiMetrics: Map<string, number[]> = new Map()

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    }

    this.metrics.push(metric)
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send to monitoring service
    this.sendMetricToService(metric)
  }

  recordAPILatency(endpoint: string, duration: number) {
    if (!this.apiMetrics.has(endpoint)) {
      this.apiMetrics.set(endpoint, [])
    }

    const durations = this.apiMetrics.get(endpoint)!
    durations.push(duration)

    // Keep only last 100 measurements per endpoint
    if (durations.length > 100) {
      durations.splice(0, durations.length - 100)
    }

    this.recordMetric('api_latency', duration, 'ms', { endpoint })
  }

  getAPIStats(endpoint: string) {
    const durations = this.apiMetrics.get(endpoint)
    if (!durations || durations.length === 0) {
      return null
    }

    const sorted = [...durations].sort((a, b) => a - b)
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: durations.length
    }
  }

  getAllAPIStats() {
    const stats: Record<string, any> = {}
    for (const endpoint of this.apiMetrics.keys()) {
      stats[endpoint] = this.getAPIStats(endpoint)
    }
    return stats
  }

  private async sendMetricToService(metric: PerformanceMetric) {
    try {
      // Send to custom metrics endpoint
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.warn('Failed to send metric to monitoring service:', error)
    }
  }

  // Client-side Web Vitals monitoring
  initWebVitalsTracking() {
    if (typeof window === 'undefined') return

    // Dynamic import to avoid SSR issues
    import('web-vitals').then((webVitals) => {
      webVitals.onCLS(this.onCLS.bind(this))
      webVitals.onINP(this.onINP.bind(this))
      webVitals.onFCP(this.onFCP.bind(this))
      webVitals.onLCP(this.onLCP.bind(this))
      webVitals.onTTFB(this.onTTFB.bind(this))
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error)
    })
  }

  private onCLS(metric: any) {
    this.recordMetric('web_vitals_cls', metric.value, 'score', {
      id: metric.id,
      rating: metric.rating
    })
  }

  private onINP(metric: any) {
    this.recordMetric('web_vitals_inp', metric.value, 'ms', {
      id: metric.id,
      rating: metric.rating
    })
  }

  private onFCP(metric: any) {
    this.recordMetric('web_vitals_fcp', metric.value, 'ms', {
      id: metric.id,
      rating: metric.rating
    })
  }

  private onLCP(metric: any) {
    this.recordMetric('web_vitals_lcp', metric.value, 'ms', {
      id: metric.id,
      rating: metric.rating
    })
  }

  private onTTFB(metric: any) {
    this.recordMetric('web_vitals_ttfb', metric.value, 'ms', {
      id: metric.id,
      rating: metric.rating
    })
  }

  // Database performance monitoring
  async monitorDatabaseQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      this.recordMetric('db_query_duration', duration, 'ms', {
        query: queryName,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.recordMetric('db_query_duration', duration, 'ms', {
        query: queryName,
        status: 'error',
        error: error instanceof Error ? error.message : 'unknown'
      })
      
      throw error
    }
  }

  // External API performance monitoring
  async monitorExternalAPI<T>(
    apiName: string, 
    apiFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await apiFn()
      const duration = Date.now() - startTime
      
      this.recordMetric('external_api_duration', duration, 'ms', {
        api: apiName,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.recordMetric('external_api_duration', duration, 'ms', {
        api: apiName,
        status: 'error',
        error: error instanceof Error ? error.message : 'unknown'
      })
      
      throw error
    }
  }

  // Memory usage monitoring
  recordMemoryUsage() {
    if (typeof process !== 'undefined') {
      const memUsage = process.memoryUsage()
      
      this.recordMetric('memory_heap_used', memUsage.heapUsed, 'bytes')
      this.recordMetric('memory_heap_total', memUsage.heapTotal, 'bytes')
      this.recordMetric('memory_external', memUsage.external, 'bytes')
      this.recordMetric('memory_rss', memUsage.rss, 'bytes')
    }
  }

  // CPU usage monitoring (simplified)
  recordCPUUsage() {
    if (typeof process !== 'undefined') {
      const usage = process.cpuUsage()
      
      this.recordMetric('cpu_user', usage.user, 'microseconds')
      this.recordMetric('cpu_system', usage.system, 'microseconds')
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    const recentMetrics = this.metrics.filter(
      m => Date.parse(m.timestamp) > oneMinuteAgo
    )

    const summary: Record<string, any> = {}
    
    // Group metrics by name
    const metricGroups = recentMetrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = []
      }
      groups[metric.name].push(metric.value)
      return groups
    }, {} as Record<string, number[]>)

    // Calculate statistics for each metric
    for (const [name, values] of Object.entries(metricGroups)) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b)
        summary[name] = {
          count: values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)]
        }
      }
    }

    return {
      timeRange: '1 minute',
      metrics: summary,
      api: this.getAllAPIStats()
    }
  }

  // Start automatic monitoring
  startAutomaticMonitoring() {
    // Monitor memory and CPU every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage()
      this.recordCPUUsage()
    }, 30000)

    // Initialize web vitals tracking for client-side
    this.initWebVitalsTracking()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Middleware for automatic API monitoring
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    
    try {
      const result = await fn(...args)
      const duration = Date.now() - startTime
      
      performanceMonitor.recordAPILatency(name, duration)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      performanceMonitor.recordAPILatency(name, duration)
      throw error
    }
  }
}