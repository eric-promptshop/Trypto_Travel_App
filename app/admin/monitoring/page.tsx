'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Activity, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceMetrics {
  service: string;
  timeRange: string;
  timestamp: string;
  metrics: {
    overview: {
      totalTours: number;
      recentTours: number;
      activeTours: number;
      conversionRate: number;
    };
    performance: {
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      errorRate: number;
      requestsPerSecond: number;
    };
    comparison: {
      oldService: {
        avgResponseTime: number;
        errorRate: number;
        requestsPerSecond: number;
      };
      newService: {
        avgResponseTime: number;
        errorRate: number;
        requestsPerSecond: number;
      };
    };
    featureFlag: {
      enabled: boolean;
      rolloutPercentage: number;
      usagePercentage: number;
    };
    alerts: Array<{
      level: 'info' | 'warning' | 'error';
      message: string;
      timestamp: string;
      metric: string;
      value: number;
    }>;
  };
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'error';
  timestamp: string;
  responseTime: string;
  version: string;
  service: string;
  checks: Record<string, any>;
  metadata: {
    environment: string;
    featureFlag: boolean;
    rolloutStrategy: string;
    rolloutPercentage: string;
  };
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');

  const fetchData = async () => {
    try {
      // Fetch metrics
      const metricsResponse = await fetch(`/api/monitoring/service-metrics?service=tour&range=${timeRange}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch health
      const healthResponse = await fetch('/api/v1/tours/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      toast.error('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';
  const performanceImprovement = metrics?.metrics.comparison 
    ? ((metrics.metrics.comparison.oldService.avgResponseTime - metrics.metrics.comparison.newService.avgResponseTime) / metrics.metrics.comparison.oldService.avgResponseTime * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Migration Monitoring</h1>
          <p className="text-muted-foreground">Real-time monitoring of the new tour service rollout</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            Service Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={isHealthy ? "default" : "destructive"}>
                {health?.status || 'Unknown'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className="font-semibold">{health?.responseTime || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-semibold">{health?.version || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Check</p>
              <p className="font-semibold">
                {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rollout Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Rollout Progress</CardTitle>
          <CardDescription>Feature flag and usage statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Rollout Percentage</span>
              <span className="text-sm font-semibold">
                {metrics?.metrics.featureFlag.rolloutPercentage || 0}%
              </span>
            </div>
            <Progress value={metrics?.metrics.featureFlag.rolloutPercentage || 0} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Actual Usage</span>
              <span className="text-sm font-semibold">
                {metrics?.metrics.featureFlag.usagePercentage || 0}%
              </span>
            </div>
            <Progress value={metrics?.metrics.featureFlag.usagePercentage || 0} />
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-muted-foreground">Feature Flag Status</span>
            <Badge variant={metrics?.metrics.featureFlag.enabled ? "default" : "secondary"}>
              {metrics?.metrics.featureFlag.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.performance.avgResponseTime.toFixed(0) || '-'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
            <div className="mt-2 text-xs">
              <span className="text-green-600">
                {performanceImprovement}% faster than old API
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.performance.errorRate.toFixed(2) || '-'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Current error rate
            </p>
            <div className="mt-2 text-xs">
              <span className={metrics?.metrics.performance.errorRate > 2 ? 'text-red-600' : 'text-green-600'}>
                {metrics?.metrics.performance.errorRate > 2 ? 'Above' : 'Below'} threshold
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/sec</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.performance.requestsPerSecond.toFixed(0) || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current throughput
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Old vs New Service Comparison</CardTitle>
          <CardDescription>Performance metrics comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metric</th>
                  <th className="text-right p-2">Old Service</th>
                  <th className="text-right p-2">New Service</th>
                  <th className="text-right p-2">Improvement</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Avg Response Time</td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison.oldService.avgResponseTime.toFixed(0) || '-'}ms
                  </td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison.newService.avgResponseTime.toFixed(0) || '-'}ms
                  </td>
                  <td className="text-right p-2 text-green-600">
                    {performanceImprovement}%
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Error Rate</td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison.oldService.errorRate.toFixed(2) || '-'}%
                  </td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison.newService.errorRate.toFixed(2) || '-'}%
                  </td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison 
                      ? `${((metrics.metrics.comparison.oldService.errorRate - metrics.metrics.comparison.newService.errorRate) / metrics.metrics.comparison.oldService.errorRate * 100).toFixed(0)}%`
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2">Requests/sec</td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison.oldService.requestsPerSecond.toFixed(0) || '-'}
                  </td>
                  <td className="text-right p-2">
                    {metrics?.metrics.comparison.newService.requestsPerSecond.toFixed(0) || '-'}
                  </td>
                  <td className="text-right p-2">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {metrics?.metrics.alerts && metrics.metrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.metrics.alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  {alert.level === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {alert.level === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.metric}: {alert.value} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}