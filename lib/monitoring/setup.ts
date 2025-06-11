import { NextRequest } from 'next/server';

/**
 * Monitoring Setup for Production
 * Integrates with various monitoring services
 */

// Sentry Error Tracking
export function initSentry() {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' && process.env.SENTRY_DSN) {
    // Dynamic import to avoid loading in development
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
        tracesSampleRate: 0.1,
        debug: false,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        beforeSend(event, hint) {
          // Filter out non-critical errors
          if (event.level === 'log' || event.level === 'debug') {
            return null;
          }
          return event;
        },
      });
    });
  }
}

// Custom Performance Monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }

    // Send to monitoring service
    this.sendToMonitoring(label, value);
  }

  private sendToMonitoring(label: string, value: number) {
    if (process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true') {
      // Send to your monitoring service (DataDog, New Relic, etc.)
      fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: label,
          value,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

// Health Check Monitoring
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    redis?: boolean;
    external?: boolean;
  };
  uptime: number;
  timestamp: string;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const services: HealthCheckResult['services'] = {
    database: false,
  };

  // Check database
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    services.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Check Redis if configured
  if (process.env.REDIS_URL) {
    try {
      // Add Redis check here
      services.redis = true;
    } catch (error) {
      services.redis = false;
    }
  }

  // Determine overall status
  const healthyServices = Object.values(services).filter(Boolean).length;
  const totalServices = Object.keys(services).length;
  
  let status: HealthCheckResult['status'] = 'healthy';
  if (healthyServices === 0) {
    status = 'unhealthy';
  } else if (healthyServices < totalServices) {
    status = 'degraded';
  }

  return {
    status,
    services,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

// Request Logging Middleware
export function logRequest(request: NextRequest) {
  if (process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'info') {
    const logData = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    };

    // In production, send to log aggregation service
    if (process.env.NODE_ENV === 'production') {
      // Send to CloudWatch, LogDNA, etc.
      console.log(JSON.stringify(logData));
    } else {
      console.log('Request:', logData);
    }
  }
}

// Initialize monitoring on app start
export function initializeMonitoring() {
  // Initialize Sentry
  initSentry();

  // Set up performance monitoring
  if (typeof window !== 'undefined') {
    // Browser-side monitoring
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      PerformanceMonitor.getInstance().recordMetric('page.load', perfData.loadEventEnd - perfData.fetchStart);
      PerformanceMonitor.getInstance().recordMetric('page.domReady', perfData.domContentLoadedEventEnd - perfData.fetchStart);
      PerformanceMonitor.getInstance().recordMetric('page.firstPaint', perfData.responseEnd - perfData.fetchStart);
    });

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            PerformanceMonitor.getInstance().recordMetric('longTask', entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Server-side monitoring setup
  if (typeof window === 'undefined') {
    // Set up graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      // Add cleanup logic here
      process.exit(0);
    });

    // Monitor unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Send to error tracking
    });
  }
}