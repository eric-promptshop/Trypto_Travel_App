export interface AuditIssue {
  id: string
  component: string
  page: string
  category: 'touch-target' | 'spacing' | 'readability' | 'overflow' | 'interaction' | 'performance'
  severity: 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  element?: string
  metrics?: {
    current: number | string
    recommended: number | string
  }
}

export interface DeviceProfile {
  name: string
  width: number
  height: number
  deviceScaleFactor: number
  userAgent: string
  type: 'phone' | 'tablet'
}

export interface PerformanceMetrics {
  lighthouse: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  webVitals: {
    lcp: number
    fid: number
    cls: number
    ttfb: number
  }
  loading: {
    domContentLoaded: number
    load: number
  }
} 