import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Basic health checks
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'connected',
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      }
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const failedHealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: 'disconnected',
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      }
    };

    return NextResponse.json(failedHealthCheck, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
} 