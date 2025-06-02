'use client';

import React, { 
  Suspense, 
  lazy, 
  useState, 
  useEffect, 
  useCallback,
  ComponentType,
  LazyExoticComponent 
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Zap,
  Clock,
  Download,
  CheckCircle,
  AlertTriangle,
  Package,
  Timer,
  Gauge,
  Activity,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

// Advanced lazy loading with performance tracking
interface LazyLoadConfig {
  timeout?: number;
  retries?: number;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  onLoad?: (componentName: string, loadTime: number) => void;
  onError?: (componentName: string, error: Error) => void;
}

interface LoadMetrics {
  componentName: string;
  loadTime: number;
  bundleSize?: number;
  timestamp: Date;
  status: 'loading' | 'loaded' | 'error';
  retries: number;
}

class LazyLoadManager {
  private static instance: LazyLoadManager;
  private metrics: Map<string, LoadMetrics> = new Map();
  private preloadQueue: Set<string> = new Set();
  private listeners: Set<(metrics: LoadMetrics[]) => void> = new Set();

  static getInstance(): LazyLoadManager {
    if (!LazyLoadManager.instance) {
      LazyLoadManager.instance = new LazyLoadManager();
    }
    return LazyLoadManager.instance;
  }

  addListener(callback: (metrics: LoadMetrics[]) => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: (metrics: LoadMetrics[]) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners() {
    const metricsArray = Array.from(this.metrics.values());
    this.listeners.forEach(callback => callback(metricsArray));
  }

  updateMetrics(componentName: string, updates: Partial<LoadMetrics>) {
    const existing = this.metrics.get(componentName) || {
      componentName,
      loadTime: 0,
      timestamp: new Date(),
      status: 'loading' as const,
      retries: 0
    };

    this.metrics.set(componentName, { ...existing, ...updates });
    this.notifyListeners();
  }

  getMetrics(): LoadMetrics[] {
    return Array.from(this.metrics.values());
  }

  preload(componentName: string) {
    this.preloadQueue.add(componentName);
  }

  isPreloaded(componentName: string): boolean {
    return this.preloadQueue.has(componentName);
  }
}

const lazyLoadManager = LazyLoadManager.getInstance();

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  config: LazyLoadConfig = {}
): LazyExoticComponent<T> {
  const {
    timeout = 5000,
    retries = 3,
    preload = false,
    priority = 'medium',
    onLoad,
    onError
  } = config;

  const enhancedImportFn = async (): Promise<{ default: T }> => {
    const startTime = performance.now();
    let attemptCount = 0;

    lazyLoadManager.updateMetrics(componentName, {
      status: 'loading',
      timestamp: new Date(),
      retries: 0
    });

    const attemptLoad = async (): Promise<{ default: T }> => {
      try {
        attemptCount++;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Component ${componentName} load timeout`)), timeout);
        });

        const loadPromise = importFn();
        const result = await Promise.race([loadPromise, timeoutPromise]);
        
        const loadTime = performance.now() - startTime;
        
        lazyLoadManager.updateMetrics(componentName, {
          status: 'loaded',
          loadTime,
          retries: attemptCount - 1
        });

        onLoad?.(componentName, loadTime);
        return result;
      } catch (error) {
        if (attemptCount < retries) {
          console.warn(`Retrying component ${componentName} load (attempt ${attemptCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
          return attemptLoad();
        }

        const loadTime = performance.now() - startTime;
        lazyLoadManager.updateMetrics(componentName, {
          status: 'error',
          loadTime,
          retries: attemptCount
        });

        onError?.(componentName, error as Error);
        throw error;
      }
    };

    return attemptLoad();
  };

  const LazyComponent = lazy(enhancedImportFn);

  // Preload if requested
  if (preload) {
    lazyLoadManager.preload(componentName);
    if (typeof window !== 'undefined') {
      // Preload after a short delay to not block initial render
      setTimeout(() => {
        enhancedImportFn().catch(() => {
          // Ignore preload errors
        });
      }, priority === 'high' ? 100 : priority === 'medium' ? 500 : 1000);
    }
  }

  return LazyComponent;
}

// Smart loading fallback component
interface SmartLoadingProps {
  componentName: string;
  estimatedLoadTime?: number;
  showProgress?: boolean;
  className?: string;
}

function SmartLoading({ 
  componentName, 
  estimatedLoadTime = 1000, 
  showProgress = true,
  className 
}: SmartLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show loading indicator only after a delay to avoid flash
    const showTimer = setTimeout(() => setIsVisible(true), 150);
    
    if (showProgress && estimatedLoadTime > 0) {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + (100 / (estimatedLoadTime / 100)), 95));
      }, 100);

      return () => {
        clearTimeout(showTimer);
        clearInterval(interval);
      };
    }

    return () => clearTimeout(showTimer);
  }, [estimatedLoadTime, showProgress]);

  if (!isVisible) return null;

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Loading {componentName}...
        </span>
      </div>
      {showProgress && (
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<LoadMetrics[]>([]);

  useEffect(() => {
    const updateMetrics = (newMetrics: LoadMetrics[]) => {
      setMetrics(newMetrics);
    };

    lazyLoadManager.addListener(updateMetrics);
    setMetrics(lazyLoadManager.getMetrics());

    return () => {
      lazyLoadManager.removeListener(updateMetrics);
    };
  }, []);

  return {
    metrics,
    totalComponents: metrics.length,
    loadedComponents: metrics.filter(m => m.status === 'loaded').length,
    erroredComponents: metrics.filter(m => m.status === 'error').length,
    averageLoadTime: metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length 
      : 0
  };
}

// Demo components for testing
const LazyHeavyComponent = createLazyComponent(
  () => new Promise<{ default: React.ComponentType }>(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Heavy Component Loaded!</h3>
            <p className="text-muted-foreground">
              This component simulates a heavy import with animations, charts, or complex logic.
            </p>
          </Card>
        )
      });
    }, 2000);
  }),
  'HeavyComponent',
  { 
    priority: 'low',
    preload: false,
    onLoad: (name, time) => console.log(`${name} loaded in ${time}ms`)
  }
);

const LazyMapComponent = createLazyComponent(
  () => new Promise<{ default: React.ComponentType }>(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Map Component Loaded!</h3>
            <p className="text-muted-foreground">
              This simulates loading a map library like Mapbox GL or Google Maps.
            </p>
            <div className="mt-4 h-48 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Interactive Map Placeholder</span>
            </div>
          </Card>
        )
      });
    }, 1500);
  }),
  'MapComponent',
  { 
    priority: 'medium',
    preload: true,
    onLoad: (name, time) => console.log(`${name} loaded in ${time}ms`)
  }
);

const LazyChartsComponent = createLazyComponent(
  () => new Promise<{ default: React.ComponentType }>(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Charts Component Loaded!</h3>
            <p className="text-muted-foreground">
              This simulates loading a chart library like Recharts or Chart.js.
            </p>
            <div className="mt-4 h-32 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Charts Placeholder</span>
            </div>
          </Card>
        )
      });
    }, 1000);
  }),
  'ChartsComponent',
  { 
    priority: 'high',
    preload: true,
    onLoad: (name, time) => console.log(`${name} loaded in ${time}ms`)
  }
);

export default function CodeSplittingDemo() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const performanceData = usePerformanceMonitor();

  const components = [
    { 
      name: 'ChartsComponent', 
      component: LazyChartsComponent, 
      description: 'High-priority component with charts',
      estimatedTime: 1000
    },
    { 
      name: 'MapComponent', 
      component: LazyMapComponent, 
      description: 'Medium-priority map component',
      estimatedTime: 1500
    },
    { 
      name: 'HeavyComponent', 
      component: LazyHeavyComponent, 
      description: 'Low-priority heavy component',
      estimatedTime: 2000
    }
  ];

  const loadComponent = useCallback((componentName: string) => {
    setActiveComponent(componentName);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loaded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Code Splitting & Lazy Loading
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Advanced code splitting with performance monitoring and smart loading
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{performanceData.totalComponents}</p>
              <p className="text-sm text-muted-foreground">Total Components</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{performanceData.loadedComponents}</p>
              <p className="text-sm text-muted-foreground">Loaded</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{performanceData.erroredComponents}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Timer className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {Math.round(performanceData.averageLoadTime)}ms
              </p>
              <p className="text-sm text-muted-foreground">Avg Load Time</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Lazy Loading</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {components.map(({ name, description, estimatedTime }) => (
                <Button
                  key={name}
                  variant={activeComponent === name ? "default" : "outline"}
                  onClick={() => loadComponent(name)}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">{name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {description}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    ~{estimatedTime}ms
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Component Display */}
      {activeComponent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Active Component: {activeComponent}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <SmartLoading
                  componentName={activeComponent}
                  estimatedLoadTime={
                    components.find(c => c.name === activeComponent)?.estimatedTime || 1000
                  }
                  showProgress={true}
                />
              }
            >
              {activeComponent === 'ChartsComponent' && <LazyChartsComponent />}
              {activeComponent === 'MapComponent' && <LazyMapComponent />}
              {activeComponent === 'HeavyComponent' && <LazyHeavyComponent />}
            </Suspense>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {performanceData.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceData.metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <p className="font-medium">{metric.componentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {metric.timestamp.toLocaleTimeString()}
                        {metric.retries > 0 && ` • ${metric.retries} retries`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(metric.status))}
                    >
                      {metric.status}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(metric.loadTime)}ms
                    </Badge>
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