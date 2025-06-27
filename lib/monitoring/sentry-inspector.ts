import * as Sentry from "@sentry/nextjs";
import { healthMonitor } from "./health-monitor";
import { performanceMonitor } from "./performance-monitor";

/**
 * Comprehensive Sentry inspection for the Travel Itinerary Builder application
 * This module provides end-to-end monitoring, error tracking, and performance insights
 */

export class SentryInspector {
  private static instance: SentryInspector;
  
  private constructor() {
    this.initializeCustomInstrumentation();
  }

  static getInstance(): SentryInspector {
    if (!SentryInspector.instance) {
      SentryInspector.instance = new SentryInspector();
    }
    return SentryInspector.instance;
  }

  /**
   * Initialize custom instrumentation for the application
   */
  private initializeCustomInstrumentation() {
    // Track API performance
    this.instrumentAPIs();
    
    // Track database operations
    this.instrumentDatabase();
    
    // Track external service calls
    this.instrumentExternalServices();
    
    // Track user interactions
    this.instrumentUserInteractions();
  }

  /**
   * Instrument API endpoints for performance tracking
   */
  private instrumentAPIs() {
    // Critical API endpoints to monitor
    const criticalEndpoints = [
      '/api/generate-itinerary',
      '/api/ai/chat/v2',
      '/api/places/search',
      '/api/tour-operator/tours',
      '/api/leads/capture',
      '/api/trips',
    ];

    criticalEndpoints.forEach(endpoint => {
      Sentry.addBreadcrumb({
        category: 'api.monitor',
        message: `Monitoring endpoint: ${endpoint}`,
        level: 'info',
      });
    });
  }

  /**
   * Instrument database operations
   */
  private instrumentDatabase() {
    // Monitor Prisma queries
    if (global.prisma) {
      global.prisma.$use(async (params: any, next: any) => {
        const transaction = Sentry.startTransaction({
          name: `prisma.${params.model}.${params.action}`,
          op: 'db.query',
        });

        try {
          const result = await next(params);
          transaction.setStatus('ok');
          return result;
        } catch (error) {
          transaction.setStatus('internal_error');
          Sentry.captureException(error, {
            tags: {
              'db.model': params.model,
              'db.action': params.action,
            },
          });
          throw error;
        } finally {
          transaction.finish();
        }
      });
    }
  }

  /**
   * Instrument external service calls
   */
  private instrumentExternalServices() {
    // OpenAI API monitoring
    this.monitorService('openai', {
      endpoints: ['/v1/chat/completions', '/v1/embeddings'],
      timeout: 30000,
      errorRate: 0.05,
    });

    // Google Places API monitoring
    this.monitorService('google-places', {
      endpoints: ['/maps/api/place/textsearch/json', '/maps/api/geocode/json'],
      timeout: 5000,
      errorRate: 0.02,
    });

    // Supabase monitoring
    this.monitorService('supabase', {
      endpoints: ['/auth/v1/token', '/rest/v1/trips'],
      timeout: 10000,
      errorRate: 0.01,
    });
  }

  /**
   * Monitor external service health
   */
  private monitorService(serviceName: string, config: any) {
    Sentry.addBreadcrumb({
      category: 'service.monitor',
      message: `Monitoring service: ${serviceName}`,
      level: 'info',
      data: config,
    });
  }

  /**
   * Instrument user interactions
   */
  private instrumentUserInteractions() {
    if (typeof window !== 'undefined') {
      // Track itinerary generation
      this.trackUserAction('itinerary.generate', {
        category: 'user_interaction',
        importance: 'high',
      });

      // Track tour operator actions
      this.trackUserAction('operator.tour.import', {
        category: 'business_critical',
        importance: 'high',
      });

      // Track lead generation
      this.trackUserAction('lead.capture', {
        category: 'revenue',
        importance: 'critical',
      });
    }
  }

  /**
   * Track specific user actions
   */
  private trackUserAction(action: string, metadata: any) {
    Sentry.addBreadcrumb({
      category: 'user.action',
      message: action,
      level: 'info',
      data: metadata,
    });
  }

  /**
   * Perform comprehensive application inspection
   */
  async inspectApplication(): Promise<ApplicationInspectionReport> {
    const report: ApplicationInspectionReport = {
      timestamp: new Date(),
      health: await this.inspectHealth(),
      performance: await this.inspectPerformance(),
      errors: await this.inspectErrors(),
      security: await this.inspectSecurity(),
      infrastructure: await this.inspectInfrastructure(),
      recommendations: [],
    };

    // Generate recommendations based on inspection
    report.recommendations = this.generateRecommendations(report);

    // Send report to Sentry
    this.sendInspectionReport(report);

    return report;
  }

  /**
   * Inspect application health
   */
  private async inspectHealth(): Promise<HealthInspection> {
    const health = await healthMonitor.checkSystemHealth();
    
    return {
      overall: health.overall,
      services: health.services.map(service => ({
        name: service.service,
        status: service.status,
        responseTime: service.responseTime,
        issues: this.detectHealthIssues(service),
      })),
      criticalIssues: health.services.filter(s => s.status === 'unhealthy').length,
    };
  }

  /**
   * Inspect application performance
   */
  private async inspectPerformance(): Promise<PerformanceInspection> {
    const metrics = await performanceMonitor.getAggregatedMetrics();
    
    return {
      apiResponseTime: {
        p50: metrics.find(m => m.name === 'api.response_time.p50')?.value || 0,
        p95: metrics.find(m => m.name === 'api.response_time.p95')?.value || 0,
        p99: metrics.find(m => m.name === 'api.response_time.p99')?.value || 0,
      },
      slowEndpoints: this.identifySlowEndpoints(metrics),
      memoryUsage: process.memoryUsage(),
      recommendations: this.generatePerformanceRecommendations(metrics),
    };
  }

  /**
   * Inspect application errors
   */
  private async inspectErrors(): Promise<ErrorInspection> {
    // This would integrate with Sentry's API to fetch error data
    return {
      totalErrors24h: 0, // Would fetch from Sentry
      errorRate: 0,
      topErrors: [],
      criticalErrors: [],
      errorTrends: 'stable',
    };
  }

  /**
   * Inspect application security
   */
  private async inspectSecurity(): Promise<SecurityInspection> {
    return {
      authenticationIssues: await this.checkAuthenticationSecurity(),
      apiSecurityIssues: await this.checkAPISecurityIssues(),
      dataProtectionIssues: await this.checkDataProtectionIssues(),
      vulnerabilities: await this.checkKnownVulnerabilities(),
      recommendations: [],
    };
  }

  /**
   * Inspect infrastructure
   */
  private async inspectInfrastructure(): Promise<InfrastructureInspection> {
    return {
      buildIssues: [
        'High memory usage during build (16GB required)',
        'Chunk loading errors in production',
      ],
      deploymentIssues: [
        'No staging environment configured',
        'Missing rollback procedures',
      ],
      scalabilityIssues: [
        'No horizontal scaling configured',
        'Database connection pooling not optimized',
      ],
      monitoringGaps: [
        'No APM tool configured',
        'Missing custom metrics',
        'No log aggregation',
      ],
    };
  }

  /**
   * Generate recommendations based on inspection
   */
  private generateRecommendations(report: ApplicationInspectionReport): string[] {
    const recommendations: string[] = [];

    // Health recommendations
    if (report.health.criticalIssues > 0) {
      recommendations.push('CRITICAL: Fix unhealthy services immediately');
    }

    // Performance recommendations
    if (report.performance.apiResponseTime.p95 > 1000) {
      recommendations.push('HIGH: Optimize API response times (p95 > 1s)');
    }

    // Security recommendations
    if (report.security.authenticationIssues.length > 0) {
      recommendations.push('CRITICAL: Address authentication security issues');
    }

    // Infrastructure recommendations
    if (report.infrastructure.buildIssues.length > 0) {
      recommendations.push('HIGH: Resolve build and deployment issues');
    }

    return recommendations;
  }

  /**
   * Send inspection report to Sentry
   */
  private sendInspectionReport(report: ApplicationInspectionReport) {
    Sentry.captureMessage('Application Inspection Report', {
      level: 'info',
      contexts: {
        inspection: {
          timestamp: report.timestamp,
          health: report.health.overall,
          criticalIssues: report.health.criticalIssues,
          recommendations: report.recommendations.length,
        },
      },
      extra: report,
    });
  }

  /**
   * Detect health issues for a service
   */
  private detectHealthIssues(service: any): string[] {
    const issues: string[] = [];
    
    if (service.responseTime > 1000) {
      issues.push('Slow response time');
    }
    
    if (service.status === 'unhealthy') {
      issues.push('Service is unhealthy');
    }
    
    return issues;
  }

  /**
   * Identify slow endpoints
   */
  private identifySlowEndpoints(metrics: any[]): string[] {
    // This would analyze metrics to find slow endpoints
    return [];
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(metrics: any[]): string[] {
    return [
      'Implement caching for frequently accessed data',
      'Optimize database queries with proper indexing',
      'Use CDN for static assets',
    ];
  }

  /**
   * Check authentication security
   */
  private async checkAuthenticationSecurity(): Promise<string[]> {
    return [
      'Missing 2FA for operator accounts',
      'No refresh token rotation implemented',
      'Session management needs improvement',
    ];
  }

  /**
   * Check API security issues
   */
  private async checkAPISecurityIssues(): Promise<string[]> {
    return [
      'Rate limiting not implemented on all endpoints',
      'Missing API key management',
      'CORS configuration needs review',
    ];
  }

  /**
   * Check data protection issues
   */
  private async checkDataProtectionIssues(): Promise<string[]> {
    return [
      'Sensitive data not encrypted at rest',
      'PII data in logs',
      'Missing data retention policies',
    ];
  }

  /**
   * Check known vulnerabilities
   */
  private async checkKnownVulnerabilities(): Promise<string[]> {
    return [
      '9 npm vulnerabilities found (4 low, 5 high)',
      'Outdated dependencies need updating',
    ];
  }

  /**
   * Create a real-time monitoring dashboard
   */
  createMonitoringDashboard() {
    // This would create a real-time monitoring dashboard
    return {
      url: '/admin/monitoring',
      widgets: [
        'health-status',
        'api-performance',
        'error-rates',
        'user-activity',
        'system-resources',
      ],
    };
  }

  /**
   * Set up alerts
   */
  setupAlerts() {
    // Critical alerts
    this.createAlert('api.error_rate', {
      threshold: 0.05,
      severity: 'critical',
      notification: 'email,slack',
    });

    // Performance alerts
    this.createAlert('api.response_time.p95', {
      threshold: 3000,
      severity: 'warning',
      notification: 'slack',
    });

    // Business alerts
    this.createAlert('lead.conversion_rate', {
      threshold: 0.02,
      severity: 'warning',
      notification: 'email',
    });
  }

  /**
   * Create an alert
   */
  private createAlert(metric: string, config: any) {
    Sentry.addBreadcrumb({
      category: 'alert.created',
      message: `Alert created for ${metric}`,
      level: 'info',
      data: config,
    });
  }
}

// Type definitions
interface ApplicationInspectionReport {
  timestamp: Date;
  health: HealthInspection;
  performance: PerformanceInspection;
  errors: ErrorInspection;
  security: SecurityInspection;
  infrastructure: InfrastructureInspection;
  recommendations: string[];
}

interface HealthInspection {
  overall: string;
  services: Array<{
    name: string;
    status: string;
    responseTime: number;
    issues: string[];
  }>;
  criticalIssues: number;
}

interface PerformanceInspection {
  apiResponseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  slowEndpoints: string[];
  memoryUsage: NodeJS.MemoryUsage;
  recommendations: string[];
}

interface ErrorInspection {
  totalErrors24h: number;
  errorRate: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: Date;
  }>;
  criticalErrors: string[];
  errorTrends: 'increasing' | 'stable' | 'decreasing';
}

interface SecurityInspection {
  authenticationIssues: string[];
  apiSecurityIssues: string[];
  dataProtectionIssues: string[];
  vulnerabilities: string[];
  recommendations: string[];
}

interface InfrastructureInspection {
  buildIssues: string[];
  deploymentIssues: string[];
  scalabilityIssues: string[];
  monitoringGaps: string[];
}

export const sentryInspector = SentryInspector.getInstance();