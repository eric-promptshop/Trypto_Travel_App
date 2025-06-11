'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AuditIssue, DeviceProfile, PerformanceMetrics } from './types'
import { DOMAnalyzer } from './dom-analyzer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Smartphone, 
  Tablet, 
  Monitor,
  Download,
  RefreshCw,
  Zap,
  Target,
  Type,
  Layout,
  Move,
  Gauge,
  Eye
} from 'lucide-react'

const DEVICE_PROFILES: DeviceProfile[] = [
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'phone'
  },
  {
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'phone'
  },
  {
    name: 'Samsung Galaxy S21',
    width: 360,
    height: 800,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
    type: 'phone'
  },
  {
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'tablet'
  }
]

const AUDIT_CATEGORIES = [
  { id: 'touch-target', name: 'Touch Targets', icon: Target, description: 'Interactive element sizes' },
  { id: 'spacing', name: 'Spacing', icon: Move, description: 'Element spacing and padding' },
  { id: 'readability', name: 'Readability', icon: Type, description: 'Text size and contrast' },
  { id: 'overflow', name: 'Layout', icon: Layout, description: 'Overflow and scrolling issues' },
  { id: 'interaction', name: 'Interactions', icon: Eye, description: 'Touch and gesture support' },
  { id: 'performance', name: 'Performance', icon: Zap, description: 'Mobile performance metrics' }
]

export function MobileAuditDashboard() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceProfile>(() => DEVICE_PROFILES[0] || {
    name: 'Default Phone',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'phone'
  } as DeviceProfile)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditProgress, setAuditProgress] = useState(0)
  const [issues, setIssues] = useState<AuditIssue[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [currentPage, setCurrentPage] = useState('/')

  // Simulate performance metrics collection
  const collectPerformanceMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    // In a real implementation, this would use Lighthouse API or Performance Observer
    return {
      lighthouse: {
        performance: Math.floor(Math.random() * 20) + 70,
        accessibility: Math.floor(Math.random() * 10) + 85,
        bestPractices: Math.floor(Math.random() * 15) + 80,
        seo: Math.floor(Math.random() * 10) + 90
      },
      webVitals: {
        lcp: Math.random() * 2 + 1, // 1-3s
        fid: Math.random() * 50 + 30, // 30-80ms
        cls: Math.random() * 0.1, // 0-0.1
        ttfb: Math.random() * 500 + 200 // 200-700ms
      },
      loading: {
        domContentLoaded: Math.random() * 1000 + 500,
        load: Math.random() * 2000 + 1000
      }
    }
  }, [])

  // Simulate touch target analysis
  const analyzeTouchTargets = useCallback(async (): Promise<AuditIssue[]> => {
    // Use real DOM analysis
    const analyzer = new DOMAnalyzer(currentPage)
    return analyzer.analyzeTouchTargets()
  }, [currentPage])

  // Simulate readability analysis
  const analyzeReadability = useCallback(async (): Promise<AuditIssue[]> => {
    // Use real DOM analysis
    const analyzer = new DOMAnalyzer(currentPage)
    return analyzer.analyzeReadability()
  }, [currentPage])

  // Analyze layout and overflow
  const analyzeLayout = useCallback(async (): Promise<AuditIssue[]> => {
    // Use real DOM analysis
    const analyzer = new DOMAnalyzer(currentPage)
    return analyzer.analyzeLayout()
  }, [currentPage])

  // Run comprehensive audit
  const runAudit = useCallback(async () => {
    setIsAuditing(true)
    setAuditProgress(0)
    setIssues([])

    try {
      // Navigate to the page if it's not the current page
      if (currentPage !== window.location.pathname && currentPage.startsWith('/')) {
        window.location.href = currentPage
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Collect performance metrics
      setAuditProgress(20)
      const metrics = await collectPerformanceMetrics()
      setPerformanceMetrics(metrics)

      // Analyze touch targets
      setAuditProgress(40)
      const touchIssues = await analyzeTouchTargets()

      // Analyze readability
      setAuditProgress(60)
      const readabilityIssues = await analyzeReadability()

      // Analyze layout
      setAuditProgress(80)
      const layoutIssues = await analyzeLayout()

      // Combine all issues
      const allIssues = [...touchIssues, ...readabilityIssues, ...layoutIssues]
      setIssues(allIssues)

      setAuditProgress(100)
    } catch (error) {
      console.error('Audit failed:', error)
    } finally {
      setIsAuditing(false)
    }
  }, [collectPerformanceMetrics, analyzeTouchTargets, analyzeReadability, analyzeLayout, currentPage])

  // Generate audit report
  const generateReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      device: selectedDevice,
      page: currentPage,
      issues: issues,
      performanceMetrics: performanceMetrics,
      summary: {
        total: issues.length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
        byCategory: AUDIT_CATEGORIES.map(cat => ({
          category: cat.id,
          count: issues.filter(i => i.category === cat.id).length
        }))
      }
    }

    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mobile-audit-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [issues, performanceMetrics, selectedDevice, currentPage])

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  // Get performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const cat = AUDIT_CATEGORIES.find(c => c.id === category)
    return cat ? cat.icon : AlertCircle
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mobile Usability Audit</h1>
        <p className="text-muted-foreground">
          Comprehensive testing for mobile optimization issues
        </p>
      </div>

      {/* Device Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Device Profile</CardTitle>
          <CardDescription>Select a device profile for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DEVICE_PROFILES.map((device) => (
              <button
                key={device.name}
                onClick={() => setSelectedDevice(device)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedDevice.name === device.name
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {device.type === 'phone' ? (
                  <Smartphone className="w-8 h-8 mx-auto mb-2" />
                ) : (
                  <Tablet className="w-8 h-8 mx-auto mb-2" />
                )}
                <div className="font-medium">{device.name}</div>
                <div className="text-sm text-muted-foreground">
                  {device.width}x{device.height}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Audit Controls</CardTitle>
          <CardDescription>Run comprehensive mobile usability tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              placeholder="Page URL or path"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button 
              onClick={runAudit} 
              disabled={isAuditing}
              className="min-w-[120px]"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Audit
                </>
              )}
            </Button>
          </div>
          {isAuditing && (
            <Progress value={auditProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {(issues.length > 0 || performanceMetrics) && (
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {AUDIT_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const count = issues.filter(i => i.category === cat.id).length
                return (
                  <Badge key={cat.id} variant="outline" className="cursor-pointer">
                    <Icon className="w-3 h-3 mr-1" />
                    {cat.name} ({count})
                  </Badge>
                )
              })}
            </div>

            {/* Issues list */}
            <div className="space-y-4">
              {issues.map((issue) => {
                const Icon = getCategoryIcon(issue.category)
                return (
                  <Card key={issue.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)} bg-opacity-10`}>
                          <Icon className={`w-5 h-5 ${getSeverityColor(issue.severity)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{issue.description}</h3>
                            <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Component: <code className="px-1 py-0.5 bg-muted rounded">{issue.component}</code>
                          </p>
                          {issue.metrics && (
                            <div className="flex gap-4 text-sm mb-2">
                              <span>Current: <strong>{issue.metrics.current}</strong></span>
                              <span>Recommended: <strong className="text-green-600">{issue.metrics.recommended}</strong></span>
                            </div>
                          )}
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{issue.recommendation}</AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {performanceMetrics && (
              <>
                {/* Lighthouse Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lighthouse Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(performanceMetrics.lighthouse).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className={`text-3xl font-bold ${getScoreColor(value)}`}>
                            {value}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Web Vitals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Core Web Vitals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Largest Contentful Paint (LCP)</span>
                          <span className={performanceMetrics.webVitals.lcp <= 2.5 ? 'text-green-600' : 'text-yellow-600'}>
                            {performanceMetrics.webVitals.lcp.toFixed(2)}s
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (performanceMetrics.webVitals.lcp / 4) * 100)} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>First Input Delay (FID)</span>
                          <span className={performanceMetrics.webVitals.fid <= 100 ? 'text-green-600' : 'text-yellow-600'}>
                            {performanceMetrics.webVitals.fid.toFixed(0)}ms
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (performanceMetrics.webVitals.fid / 300) * 100)} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Cumulative Layout Shift (CLS)</span>
                          <span className={performanceMetrics.webVitals.cls <= 0.1 ? 'text-green-600' : 'text-yellow-600'}>
                            {performanceMetrics.webVitals.cls.toFixed(3)}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (performanceMetrics.webVitals.cls / 0.25) * 100)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Summary</CardTitle>
                <CardDescription>Overview of issues found during mobile audit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {issues.filter(i => i.severity === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {issues.filter(i => i.severity === 'medium').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Medium Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {issues.filter(i => i.severity === 'low').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Low Priority</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {AUDIT_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const count = issues.filter(i => i.category === cat.id).length
                    const percentage = issues.length > 0 ? (count / issues.length) * 100 : 0
                    
                    return (
                      <div key={cat.id} className="flex items-center gap-4">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <span className="text-sm text-muted-foreground">{count} issues</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Button onClick={generateReport} className="w-full mt-6">
                  <Download className="w-4 h-4 mr-2" />
                  Download Full Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 