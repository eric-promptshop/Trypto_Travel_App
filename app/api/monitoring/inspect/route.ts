import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { sentryInspector } from '@/lib/monitoring/sentry-inspector';
import { validateAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  // Require authentication for security
  const auth = await validateAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    // Capture a test event to verify Sentry is working
    Sentry.captureMessage('Sentry inspection initiated', {
      level: 'info',
      tags: {
        component: 'monitoring',
        action: 'inspect',
        user: auth.email,
      },
    });

    // Run comprehensive inspection
    const inspectionReport = await sentryInspector.inspectApplication();

    // Create monitoring dashboard info
    const dashboardInfo = sentryInspector.createMonitoringDashboard();

    // Setup alerts
    sentryInspector.setupAlerts();

    // Test various Sentry features
    const sentryTests = await runSentryTests();

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      sentry: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured' : 'Missing',
        environment: process.env.NODE_ENV,
        tests: sentryTests,
      },
      inspection: inspectionReport,
      monitoring: {
        dashboard: dashboardInfo,
        alerts: 'Configured',
      },
      recommendations: generateActionItems(inspectionReport),
    };

    // Send the report to Sentry as well
    Sentry.captureMessage('Inspection Report Generated', {
      level: 'info',
      contexts: {
        report: {
          health: inspectionReport.health.overall,
          criticalIssues: inspectionReport.health.criticalIssues,
          performanceP95: inspectionReport.performance.apiResponseTime.p95,
        },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    // Capture any errors during inspection
    Sentry.captureException(error, {
      tags: {
        component: 'monitoring',
        action: 'inspect',
        phase: 'execution',
      },
    });

    return NextResponse.json(
      { 
        error: 'Inspection failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        sentryEventId: Sentry.lastEventId(),
      },
      { status: 500 }
    );
  }
}

/**
 * Run various Sentry feature tests
 */
async function runSentryTests() {
  const tests = {
    captureMessage: false,
    captureException: false,
    breadcrumbs: false,
    transactions: false,
    customContext: false,
  };

  try {
    // Test 1: Capture Message
    Sentry.captureMessage('Test message from inspection', 'info');
    tests.captureMessage = true;

    // Test 2: Capture Exception
    try {
      throw new Error('Test exception from inspection');
    } catch (e) {
      Sentry.captureException(e);
      tests.captureException = true;
    }

    // Test 3: Breadcrumbs
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb',
      level: 'info',
    });
    tests.breadcrumbs = true;

    // Test 4: Transactions
    const transaction = Sentry.startTransaction({
      name: 'test-transaction',
      op: 'test',
    });
    transaction.finish();
    tests.transactions = true;

    // Test 5: Custom Context
    Sentry.setContext('inspection', {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
    tests.customContext = true;

  } catch (error) {
    console.error('Sentry test failed:', error);
  }

  return tests;
}

/**
 * Generate actionable items based on inspection
 */
function generateActionItems(inspection: any): ActionItem[] {
  const items: ActionItem[] = [];

  // Critical items
  if (inspection.health.overall === 'unhealthy') {
    items.push({
      priority: 'critical',
      category: 'health',
      action: 'Fix unhealthy services immediately',
      details: `${inspection.health.criticalIssues} services are failing`,
    });
  }

  // Performance items
  if (inspection.performance.apiResponseTime.p95 > 1000) {
    items.push({
      priority: 'high',
      category: 'performance',
      action: 'Optimize API response times',
      details: `P95 latency is ${inspection.performance.apiResponseTime.p95}ms (target: <1000ms)`,
    });
  }

  // Security items
  inspection.security.authenticationIssues.forEach((issue: string) => {
    items.push({
      priority: 'critical',
      category: 'security',
      action: issue,
      details: 'Authentication security must be addressed',
    });
  });

  // Infrastructure items
  inspection.infrastructure.buildIssues.forEach((issue: string) => {
    items.push({
      priority: 'high',
      category: 'infrastructure',
      action: issue,
      details: 'Build and deployment issues affect reliability',
    });
  });

  return items.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  action: string;
  details: string;
}