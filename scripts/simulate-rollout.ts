#!/usr/bin/env node

/**
 * Script to simulate the gradual rollout process
 * This helps test the rollout without actual production deployment
 * Run with: npx tsx scripts/simulate-rollout.ts
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

interface RolloutStage {
  name: string;
  env: {
    NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: string;
    NEXT_PUBLIC_ROLLOUT_STRATEGY: string;
    NEXT_PUBLIC_ROLLOUT_PERCENTAGE: string;
  };
  checks: string[];
  metrics: {
    responseTime: number;
    errorRate: number;
    usage: number;
  };
}

const ROLLOUT_STAGES: RolloutStage[] = [
  {
    name: 'Production Deployment (Disabled)',
    env: {
      NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: 'false',
      NEXT_PUBLIC_ROLLOUT_STRATEGY: 'none',
      NEXT_PUBLIC_ROLLOUT_PERCENTAGE: '0'
    },
    checks: [
      'Old API endpoints working',
      'New API health check accessible',
      'No errors in logs',
      'Monitoring dashboard accessible'
    ],
    metrics: {
      responseTime: 250,
      errorRate: 1.5,
      usage: 0
    }
  },
  {
    name: 'Staging Test (Enabled)',
    env: {
      NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: 'true',
      NEXT_PUBLIC_ROLLOUT_STRATEGY: 'all',
      NEXT_PUBLIC_ROLLOUT_PERCENTAGE: '100'
    },
    checks: [
      'Create tour via new API',
      'List tours via new API',
      'Update tour via new API',
      'Email notifications working',
      'Analytics tracking confirmed'
    ],
    metrics: {
      responseTime: 180,
      errorRate: 0.5,
      usage: 100
    }
  },
  {
    name: 'Internal Rollout',
    env: {
      NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: 'false',
      NEXT_PUBLIC_ROLLOUT_STRATEGY: 'internal',
      NEXT_PUBLIC_ROLLOUT_PERCENTAGE: '0'
    },
    checks: [
      'Internal users see new service',
      'External users see old service',
      'No performance degradation',
      'Error rates stable'
    ],
    metrics: {
      responseTime: 200,
      errorRate: 0.8,
      usage: 5
    }
  },
  {
    name: '10% Rollout',
    env: {
      NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: 'false',
      NEXT_PUBLIC_ROLLOUT_STRATEGY: 'percentage',
      NEXT_PUBLIC_ROLLOUT_PERCENTAGE: '10'
    },
    checks: [
      '10% of users on new service',
      'Performance metrics improved',
      'Error rate below 1%',
      'No increase in support tickets'
    ],
    metrics: {
      responseTime: 195,
      errorRate: 0.7,
      usage: 10
    }
  },
  {
    name: '50% Rollout',
    env: {
      NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: 'false',
      NEXT_PUBLIC_ROLLOUT_STRATEGY: 'percentage',
      NEXT_PUBLIC_ROLLOUT_PERCENTAGE: '50'
    },
    checks: [
      'Half of traffic on new service',
      'Database handling load well',
      'Response times consistent',
      'User feedback positive'
    ],
    metrics: {
      responseTime: 185,
      errorRate: 0.6,
      usage: 50
    }
  },
  {
    name: '100% Rollout',
    env: {
      NEXT_PUBLIC_USE_NEW_TOUR_SERVICE: 'true',
      NEXT_PUBLIC_ROLLOUT_STRATEGY: 'all',
      NEXT_PUBLIC_ROLLOUT_PERCENTAGE: '100'
    },
    checks: [
      'All users on new service',
      'Legacy code can be removed',
      'Performance targets met',
      'Migration successful'
    ],
    metrics: {
      responseTime: 175,
      errorRate: 0.5,
      usage: 100
    }
  }
];

async function simulateRollout() {
  console.log('🚀 TripNav Service Rollout Simulator');
  console.log('====================================\n');
  
  let currentStage = 0;

  while (currentStage < ROLLOUT_STAGES.length) {
    const stage = ROLLOUT_STAGES[currentStage];
    
    console.clear();
    console.log(`📍 Stage ${currentStage + 1}/${ROLLOUT_STAGES.length}: ${stage.name}`);
    console.log('='.repeat(50));
    
    // Show environment configuration
    console.log('\n📝 Environment Configuration:');
    Object.entries(stage.env).forEach(([key, value]) => {
      console.log(`  ${key}=${value}`);
    });
    
    // Show metrics
    console.log('\n📊 Simulated Metrics:');
    console.log(`  Response Time: ${stage.metrics.responseTime}ms`);
    console.log(`  Error Rate: ${stage.metrics.errorRate}%`);
    console.log(`  Service Usage: ${stage.metrics.usage}%`);
    
    // Show checklist
    console.log('\n✅ Verification Checklist:');
    stage.checks.forEach((check, index) => {
      console.log(`  ${index + 1}. ${check}`);
    });
    
    // Simulate health check
    console.log('\n🏥 Health Check:');
    await simulateHealthCheck(stage);
    
    // Menu
    console.log('\n📋 Actions:');
    console.log('  1. Run performance test');
    console.log('  2. Check monitoring dashboard');
    console.log('  3. Advance to next stage');
    console.log('  4. Rollback to previous stage');
    console.log('  0. Exit simulation');
    
    const choice = await question('\nSelect action: ');
    
    switch (choice) {
      case '1':
        await runPerformanceTest(stage);
        break;
      case '2':
        await checkMonitoring(stage);
        break;
      case '3':
        if (await confirmAdvance(stage)) {
          currentStage++;
        }
        break;
      case '4':
        if (currentStage > 0) {
          currentStage--;
          console.log('⚠️  Rolled back to previous stage');
        }
        break;
      case '0':
        console.log('\n👋 Exiting simulation');
        rl.close();
        return;
    }
    
    await question('\nPress Enter to continue...');
  }
  
  console.log('\n🎉 Rollout simulation complete!');
  console.log('The new service architecture is now fully deployed.');
  rl.close();
}

async function simulateHealthCheck(stage: RolloutStage) {
  const health = {
    status: stage.metrics.errorRate < 2 ? 'healthy' : 'unhealthy',
    responseTime: `${Math.random() * 10 + 5}ms`,
    metadata: {
      featureFlag: stage.env.NEXT_PUBLIC_USE_NEW_TOUR_SERVICE === 'true',
      rolloutStrategy: stage.env.NEXT_PUBLIC_ROLLOUT_STRATEGY,
      rolloutPercentage: stage.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE
    }
  };
  
  console.log(`  Status: ${health.status}`);
  console.log(`  Response Time: ${health.responseTime}`);
  console.log(`  Feature Flag: ${health.metadata.featureFlag ? 'Enabled' : 'Disabled'}`);
  console.log(`  Rollout: ${health.metadata.rolloutPercentage}% (${health.metadata.rolloutStrategy})`);
}

async function runPerformanceTest(stage: RolloutStage) {
  console.log('\n🧪 Running performance test...');
  
  // Simulate test results
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n📊 Performance Test Results:');
  console.log(`  Old API: ${stage.metrics.responseTime + 50}ms avg`);
  console.log(`  New API: ${stage.metrics.responseTime}ms avg`);
  console.log(`  Improvement: ${Math.round((50 / (stage.metrics.responseTime + 50)) * 100)}%`);
  console.log(`  Error Rate: ${stage.metrics.errorRate}%`);
  console.log(`  ✅ Performance targets met`);
}

async function checkMonitoring(stage: RolloutStage) {
  console.log('\n📊 Monitoring Dashboard:');
  console.log('  URL: http://localhost:3000/admin/monitoring');
  console.log(`  Current Usage: ${stage.metrics.usage}%`);
  console.log(`  Response Time: ${stage.metrics.responseTime}ms`);
  console.log(`  Error Rate: ${stage.metrics.errorRate}%`);
  console.log(`  Active Alerts: ${stage.metrics.errorRate > 2 ? '1 (High error rate)' : '0'}`);
}

async function confirmAdvance(stage: RolloutStage) {
  console.log('\n⚠️  Pre-advance Checklist:');
  stage.checks.forEach((check, index) => {
    console.log(`  ${index + 1}. [?] ${check}`);
  });
  
  const confirm = await question('\nHave all checks passed? (yes/no): ');
  return confirm.toLowerCase() === 'yes';
}

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// Run the simulation
simulateRollout().catch(console.error);