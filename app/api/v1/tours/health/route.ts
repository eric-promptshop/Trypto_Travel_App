import { NextResponse } from 'next/server';
import { container } from '@/src/core/container';
import { TYPES } from '@/src/core/types';
import { TourApplicationService } from '@/src/core/application/tour/TourApplicationService';
import { PrismaClient } from '@prisma/client';
import '@/src/infrastructure/startup';

/**
 * Health check endpoint for the new Tour service
 * GET /api/v1/tours/health
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, any> = {};

  try {
    // Check 1: Service initialization
    checks.serviceInitialization = await checkServiceInitialization();
    
    // Check 2: Database connectivity
    checks.database = await checkDatabase();
    
    // Check 3: Dependency injection container
    checks.container = await checkContainer();
    
    // Check 4: External services
    checks.externalServices = await checkExternalServices();
    
    // Calculate overall health
    const allHealthy = Object.values(checks).every(check => check.healthy);
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '1.0.0',
      service: 'tour-service',
      checks,
      metadata: {
        environment: process.env.NODE_ENV,
        featureFlag: process.env.NEXT_PUBLIC_USE_NEW_TOUR_SERVICE === 'true',
        rolloutStrategy: process.env.NEXT_PUBLIC_ROLLOUT_STRATEGY || 'none',
        rolloutPercentage: process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'
      }
    };
    
    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 });
  }
}

async function checkServiceInitialization(): Promise<HealthCheckResult> {
  try {
    const tourService = container.get<TourApplicationService>(TYPES.TourApplicationService);
    return {
      healthy: true,
      message: 'Service initialized successfully',
      duration: '0ms'
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Service initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  const prisma = new PrismaClient();
  
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if Tour table exists and is accessible
    const tourCount = await prisma.tour.count();
    
    return {
      healthy: true,
      message: 'Database connected',
      duration: `${Date.now() - start}ms`,
      metadata: {
        tourCount
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Date.now() - start}ms`
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function checkContainer(): Promise<HealthCheckResult> {
  try {
    // Check if all required services are registered
    const requiredServices = [
      TYPES.TourApplicationService,
      TYPES.TourService,
      TYPES.TourRepository,
      TYPES.EmailService,
      TYPES.AnalyticsService,
      TYPES.Logger,
      TYPES.EventBus
    ];
    
    const missingServices = [];
    for (const service of requiredServices) {
      try {
        container.get(service);
      } catch {
        missingServices.push(service.toString());
      }
    }
    
    if (missingServices.length === 0) {
      return {
        healthy: true,
        message: 'All services registered',
        metadata: {
          registeredServices: requiredServices.length
        }
      };
    } else {
      return {
        healthy: false,
        message: 'Some services missing',
        metadata: {
          missingServices
        }
      };
    }
  } catch (error) {
    return {
      healthy: false,
      message: 'Container check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkExternalServices(): Promise<HealthCheckResult> {
  const checks: Record<string, boolean> = {};
  
  // Check environment variables for external services
  checks.email = !!process.env.RESEND_API_KEY;
  checks.auth = !!process.env.NEXTAUTH_SECRET;
  checks.analytics = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  checks.monitoring = !!process.env.SENTRY_DSN;
  
  const allHealthy = Object.values(checks).every(v => v);
  
  return {
    healthy: allHealthy,
    message: allHealthy ? 'All external services configured' : 'Some external services not configured',
    metadata: checks
  };
}

interface HealthCheckResult {
  healthy: boolean;
  message: string;
  error?: string;
  duration?: string;
  metadata?: Record<string, any>;
}