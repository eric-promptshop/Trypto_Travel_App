"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Activity } from "lucide-react"

export default function SentryInspectionDemo() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runInspection = async () => {
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const response = await fetch('/api/monitoring/inspect')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Inspection failed')
      }

      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const triggerTestError = () => {
    throw new Error("Test error from Sentry inspection demo")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sentry Application Inspection
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive monitoring and error tracking analysis
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={runInspection}
            disabled={loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Inspection...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Run Full Inspection
              </>
            )}
          </Button>
          
          <Button
            onClick={triggerTestError}
            variant="destructive"
            size="lg"
          >
            Trigger Test Error
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-6">
            {/* Sentry Configuration */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Sentry Configuration</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">DSN Status</p>
                  <p className="font-medium">{report.sentry.dsn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="font-medium">{report.sentry.environment}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Feature Tests</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(report.sentry.tests).map(([test, status]) => (
                    <div key={test} className="flex items-center gap-2">
                      {status ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Health Status */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Health Status</h2>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                report.inspection.health.overall === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : report.inspection.health.overall === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  report.inspection.health.overall === 'healthy' 
                    ? 'bg-green-500' 
                    : report.inspection.health.overall === 'degraded'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`} />
                {report.inspection.health.overall.toUpperCase()}
              </div>
              
              <div className="mt-4 space-y-2">
                {report.inspection.health.services.map((service: any) => (
                  <div key={service.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{service.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{service.responseTime}ms</span>
                      <span className={`text-sm font-medium ${
                        service.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">P50 Response Time</p>
                  <p className="text-2xl font-bold">{report.inspection.performance.apiResponseTime.p50}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">P95 Response Time</p>
                  <p className="text-2xl font-bold">{report.inspection.performance.apiResponseTime.p95}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">P99 Response Time</p>
                  <p className="text-2xl font-bold">{report.inspection.performance.apiResponseTime.p99}ms</p>
                </div>
              </div>
            </Card>

            {/* Action Items */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Action Items</h2>
              <div className="space-y-3">
                {report.recommendations.map((item: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    item.priority === 'critical' 
                      ? 'bg-red-50 border-red-200' 
                      : item.priority === 'high'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        item.priority === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : item.priority === 'high'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Raw Report Data */}
            <details className="mt-8">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                View Raw Report Data
              </summary>
              <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-xs">
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}