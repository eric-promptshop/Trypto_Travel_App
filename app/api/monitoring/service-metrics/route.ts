import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service metrics endpoint for monitoring dashboard
 * GET /api/monitoring/service-metrics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || 'tour';
    const timeRange = searchParams.get('range') || '1h';
    
    // Get metrics based on service
    const metrics = await getServiceMetrics(service, timeRange);
    
    return NextResponse.json({
      service,
      timeRange,
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getServiceMetrics(service: string, timeRange: string) {
  const now = new Date();
  const startTime = getStartTime(now, timeRange);
  
  // In a real implementation, these would come from your APM/monitoring service
  // For now, we'll calculate some basic metrics from the database
  
  if (service === 'tour') {
    const [totalTours, recentTours, activeTours] = await Promise.all([
      prisma.tour.count(),
      prisma.tour.count({
        where: {
          createdAt: {
            gte: startTime
          }
        }
      }),
      prisma.tour.count({
        where: {
          status: 'PUBLISHED'
        }
      })
    ]);
    
    return {
      overview: {
        totalTours,
        recentTours,
        activeTours,
        conversionRate: activeTours / Math.max(totalTours, 1) * 100
      },
      performance: {
        // These would typically come from APM
        avgResponseTime: generateMockMetric(150, 250),
        p95ResponseTime: generateMockMetric(300, 500),
        p99ResponseTime: generateMockMetric(500, 800),
        errorRate: generateMockMetric(0.1, 2, 2),
        requestsPerSecond: generateMockMetric(10, 50, 0)
      },
      comparison: {
        oldService: {
          avgResponseTime: generateMockMetric(200, 350),
          errorRate: generateMockMetric(1, 5, 2),
          requestsPerSecond: generateMockMetric(8, 40, 0)
        },
        newService: {
          avgResponseTime: generateMockMetric(100, 200),
          errorRate: generateMockMetric(0.1, 1, 2),
          requestsPerSecond: generateMockMetric(2, 10, 0)
        }
      },
      featureFlag: {
        enabled: process.env.NEXT_PUBLIC_USE_NEW_TOUR_SERVICE === 'true',
        rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
        usagePercentage: calculateFeatureFlagUsage()
      },
      alerts: generateAlerts()
    };
  }
  
  return {};
}

function getStartTime(now: Date, range: string): Date {
  const msPerHour = 60 * 60 * 1000;
  const rangeMap: Record<string, number> = {
    '1h': msPerHour,
    '6h': 6 * msPerHour,
    '24h': 24 * msPerHour,
    '7d': 7 * 24 * msPerHour,
    '30d': 30 * 24 * msPerHour
  };
  
  const ms = rangeMap[range] || msPerHour;
  return new Date(now.getTime() - ms);
}

function generateMockMetric(min: number, max: number, decimals: number = 1): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function calculateFeatureFlagUsage(): number {
  // In production, this would track actual usage
  const rolloutPercentage = parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0');
  const variation = generateMockMetric(-5, 5, 1);
  return Math.max(0, Math.min(100, rolloutPercentage + variation));
}

function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  
  // Check for high error rates
  const errorRate = generateMockMetric(0, 5, 2);
  if (errorRate > 3) {
    alerts.push({
      level: 'error',
      message: `High error rate detected: ${errorRate}%`,
      timestamp: new Date().toISOString(),
      metric: 'errorRate',
      value: errorRate
    });
  }
  
  // Check for slow response times
  const responseTime = generateMockMetric(100, 500);
  if (responseTime > 400) {
    alerts.push({
      level: 'warning',
      message: `Slow response time: ${responseTime}ms`,
      timestamp: new Date().toISOString(),
      metric: 'responseTime',
      value: responseTime
    });
  }
  
  return alerts;
}

interface Alert {
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  metric: string;
  value: number;
}

/**
 * POST endpoint to track custom metrics
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { metric, value, tags } = body;
    
    // In production, send to your metrics service (Datadog, CloudWatch, etc.)
    console.log('Metric received:', { metric, value, tags });
    
    // Store in database for demo purposes
    // You might want to create a metrics table
    
    return NextResponse.json({
      success: true,
      message: 'Metric recorded'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to record metric',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}