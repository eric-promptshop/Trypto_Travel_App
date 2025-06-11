'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { AuditIssue } from './types'
import { DOMAnalyzer } from './dom-analyzer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Zap,
  Target,
  Type,
  Layout,
  RefreshCw 
} from 'lucide-react'

interface AuditRunnerProps {
  className?: string
}

export function AuditRunner({ className }: AuditRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [issues, setIssues] = useState<AuditIssue[]>([])
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  const runAudit = useCallback(async () => {
    setIsRunning(true)
    setProgress(0)
    setIssues([])

    try {
      const analyzer = new DOMAnalyzer(currentPath)
      
      // Touch targets
      setProgress(25)
      const touchIssues = analyzer.analyzeTouchTargets()
      
      // Readability
      setProgress(50)
      const readabilityIssues = analyzer.analyzeReadability()
      
      // Layout
      setProgress(75)
      const layoutIssues = analyzer.analyzeLayout()
      
      // Combine results
      const allIssues = [...touchIssues, ...readabilityIssues, ...layoutIssues]
      setIssues(allIssues)
      setProgress(100)
      
    } catch (error) {
      console.error('Audit failed:', error)
    } finally {
      setIsRunning(false)
    }
  }, [currentPath])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'touch-target': return Target
      case 'readability': return Type
      case 'overflow': return Layout
      default: return AlertCircle
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const issuesByCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = []
    acc[issue.category]!.push(issue)
    return acc
  }, {} as Record<string, AuditIssue[]>)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Mobile Audit</CardTitle>
            <Button 
              onClick={runAudit} 
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Audit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isRunning && (
            <Progress value={progress} className="mb-4" />
          )}

          {issues.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="destructive">
                  {issues.filter(i => i.severity === 'high').length} High
                </Badge>
                <Badge variant="secondary">
                  {issues.filter(i => i.severity === 'medium').length} Medium
                </Badge>
                <Badge variant="outline">
                  {issues.filter(i => i.severity === 'low').length} Low
                </Badge>
              </div>

              {/* Issues by category */}
              {Object.entries(issuesByCategory).map(([category, categoryIssues]) => {
                const Icon = getCategoryIcon(category)
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium capitalize flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {category.replace('-', ' ')} ({categoryIssues.length})
                    </h4>
                    <div className="space-y-2">
                      {categoryIssues.map((issue) => (
                        <div 
                          key={issue.id}
                          className={`p-3 rounded-lg ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="font-medium">{issue.description}</div>
                          {issue.element && (
                            <code className="text-xs">{issue.element}</code>
                          )}
                          {issue.metrics && (
                            <div className="text-sm mt-1">
                              Current: {issue.metrics.current} → Recommended: {issue.metrics.recommended}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!isRunning && issues.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Click "Run Audit" to analyze this page for mobile usability issues
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 