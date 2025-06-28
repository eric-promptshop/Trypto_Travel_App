#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

/**
 * Interactive rollout manager for gradual service deployment
 * Run with: npx tsx scripts/rollout-manager.ts
 */

const prisma = new PrismaClient();

interface RolloutPhase {
  name: string;
  description: string;
  strategy: 'internal' | 'percentage' | 'allowlist' | 'all';
  percentage?: number;
  allowlist?: string[];
  checklistItems: string[];
}

const ROLLOUT_PHASES: RolloutPhase[] = [
  {
    name: 'Phase 0: Pre-deployment',
    description: 'Deploy with feature disabled',
    strategy: 'percentage',
    percentage: 0,
    checklistItems: [
      'Code deployed to production',
      'Feature flag set to false',
      'Health check endpoint accessible',
      'Monitoring dashboard configured',
      'Team notified of deployment'
    ]
  },
  {
    name: 'Phase 1: Internal Testing',
    description: 'Enable for internal team only',
    strategy: 'internal',
    checklistItems: [
      'Enable for @tripnav.com emails',
      'Test all CRUD operations',
      'Verify email notifications',
      'Check analytics tracking',
      'Monitor error rates'
    ]
  },
  {
    name: 'Phase 2: 10% Rollout',
    description: 'Enable for 10% of users',
    strategy: 'percentage',
    percentage: 10,
    checklistItems: [
      'Update rollout percentage to 10%',
      'Monitor performance metrics',
      'Check error rates remain low',
      'Gather user feedback',
      'Verify no increase in support tickets'
    ]
  },
  {
    name: 'Phase 3: 50% Rollout',
    description: 'Enable for half of users',
    strategy: 'percentage',
    percentage: 50,
    checklistItems: [
      'Update rollout percentage to 50%',
      'Compare old vs new API performance',
      'Ensure database can handle load',
      'Monitor user engagement metrics',
      'Prepare rollback plan'
    ]
  },
  {
    name: 'Phase 4: 100% Rollout',
    description: 'Enable for all users',
    strategy: 'percentage',
    percentage: 100,
    checklistItems: [
      'Update rollout percentage to 100%',
      'Monitor for edge cases',
      'Document any issues found',
      'Plan legacy code removal',
      'Update API documentation'
    ]
  },
  {
    name: 'Phase 5: Cleanup',
    description: 'Remove legacy code',
    strategy: 'all',
    checklistItems: [
      'Remove old API routes',
      'Delete legacy implementations',
      'Remove feature flags',
      'Update all documentation',
      'Archive migration guides'
    ]
  }
];

class RolloutManager {
  private rl: readline.Interface;
  private currentPhase: number = 0;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 TripNav Service Rollout Manager');
    console.log('==================================\n');

    await this.loadCurrentPhase();
    await this.showMenu();
  }

  private async loadCurrentPhase() {
    // In production, load from database or config service
    // For now, check environment variable
    const rolloutPercentage = parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0');
    
    if (rolloutPercentage === 0) {
      this.currentPhase = 0;
    } else if (rolloutPercentage < 10) {
      this.currentPhase = 1;
    } else if (rolloutPercentage < 50) {
      this.currentPhase = 2;
    } else if (rolloutPercentage < 100) {
      this.currentPhase = 3;
    } else {
      this.currentPhase = 4;
    }
  }

  private async showMenu() {
    const phase = ROLLOUT_PHASES[this.currentPhase];
    
    console.log(`\n📍 Current Phase: ${phase.name}`);
    console.log(`📝 ${phase.description}\n`);

    console.log('Options:');
    console.log('1. View current status');
    console.log('2. Complete checklist item');
    console.log('3. Advance to next phase');
    console.log('4. Rollback to previous phase');
    console.log('5. View metrics');
    console.log('6. Generate report');
    console.log('0. Exit');

    const answer = await this.question('\nSelect option: ');

    switch (answer) {
      case '1':
        await this.viewStatus();
        break;
      case '2':
        await this.completeChecklistItem();
        break;
      case '3':
        await this.advancePhase();
        break;
      case '4':
        await this.rollbackPhase();
        break;
      case '5':
        await this.viewMetrics();
        break;
      case '6':
        await this.generateReport();
        break;
      case '0':
        this.exit();
        return;
      default:
        console.log('Invalid option');
    }

    await this.showMenu();
  }

  private async viewStatus() {
    const phase = ROLLOUT_PHASES[this.currentPhase];
    
    console.log('\n📊 Rollout Status');
    console.log('=================');
    console.log(`Phase: ${phase.name}`);
    console.log(`Strategy: ${phase.strategy}`);
    if (phase.percentage !== undefined) {
      console.log(`Percentage: ${phase.percentage}%`);
    }
    
    console.log('\n✅ Checklist:');
    phase.checklistItems.forEach((item, index) => {
      console.log(`  ${index + 1}. [ ] ${item}`);
    });
    
    // Show current metrics
    const metrics = await this.fetchMetrics();
    console.log('\n📈 Current Metrics:');
    console.log(`  Active Tours: ${metrics.totalTours}`);
    console.log(`  Error Rate: ${metrics.errorRate}%`);
    console.log(`  Avg Response Time: ${metrics.avgResponseTime}ms`);
  }

  private async completeChecklistItem() {
    const phase = ROLLOUT_PHASES[this.currentPhase];
    
    console.log('\n✅ Checklist Items:');
    phase.checklistItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    
    const itemNumber = await this.question('\nWhich item to mark complete? ');
    const index = parseInt(itemNumber) - 1;
    
    if (index >= 0 && index < phase.checklistItems.length) {
      console.log(`✅ Marked complete: ${phase.checklistItems[index]}`);
      // In production, save this to database
    }
  }

  private async advancePhase() {
    if (this.currentPhase >= ROLLOUT_PHASES.length - 1) {
      console.log('Already at final phase');
      return;
    }
    
    const nextPhase = ROLLOUT_PHASES[this.currentPhase + 1];
    console.log(`\n⚠️  Advancing to: ${nextPhase.name}`);
    
    const confirm = await this.question('Are you sure? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled');
      return;
    }
    
    // Generate environment update script
    console.log('\n📝 Update environment variables:');
    console.log('```bash');
    console.log(`export NEXT_PUBLIC_ROLLOUT_STRATEGY="${nextPhase.strategy}"`);
    if (nextPhase.percentage !== undefined) {
      console.log(`export NEXT_PUBLIC_ROLLOUT_PERCENTAGE="${nextPhase.percentage}"`);
    }
    console.log('```');
    
    console.log('\n✅ Phase advanced. Restart application to apply changes.');
    this.currentPhase++;
  }

  private async rollbackPhase() {
    if (this.currentPhase === 0) {
      console.log('Already at initial phase');
      return;
    }
    
    console.log('\n⚠️  EMERGENCY ROLLBACK');
    const reason = await this.question('Reason for rollback: ');
    
    // Log rollback event
    console.log(`\n📝 Rollback logged: ${reason}`);
    
    const prevPhase = ROLLOUT_PHASES[this.currentPhase - 1];
    console.log('\n📝 Update environment variables:');
    console.log('```bash');
    console.log(`export NEXT_PUBLIC_ROLLOUT_STRATEGY="${prevPhase.strategy}"`);
    if (prevPhase.percentage !== undefined) {
      console.log(`export NEXT_PUBLIC_ROLLOUT_PERCENTAGE="${prevPhase.percentage}"`);
    }
    console.log('```');
    
    console.log('\n✅ Rollback prepared. Restart application to apply changes.');
    this.currentPhase--;
  }

  private async viewMetrics() {
    console.log('\n📊 Fetching metrics...');
    
    const metrics = await this.fetchMetrics();
    
    console.log('\n📈 Service Metrics');
    console.log('==================');
    console.log(`Total Tours: ${metrics.totalTours}`);
    console.log(`Tours Created (24h): ${metrics.recentTours}`);
    console.log(`Active Tours: ${metrics.activeTours}`);
    console.log(`Error Rate: ${metrics.errorRate}%`);
    console.log(`Avg Response Time: ${metrics.avgResponseTime}ms`);
    console.log(`Feature Flag Usage: ${metrics.featureFlagUsage}%`);
    
    if (metrics.alerts.length > 0) {
      console.log('\n⚠️  Alerts:');
      metrics.alerts.forEach(alert => {
        console.log(`  - ${alert}`);
      });
    }
  }

  private async generateReport() {
    const phase = ROLLOUT_PHASES[this.currentPhase];
    const metrics = await this.fetchMetrics();
    
    const report = {
      timestamp: new Date().toISOString(),
      currentPhase: phase.name,
      rolloutPercentage: phase.percentage || 0,
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };
    
    const filename = `rollout-report-${Date.now()}.json`;
    await Bun.write(filename, JSON.stringify(report, null, 2));
    
    console.log(`\n✅ Report generated: ${filename}`);
  }

  private async fetchMetrics() {
    // In production, fetch from monitoring service
    // For demo, return mock data
    const [totalTours, recentTours, activeTours] = await Promise.all([
      prisma.tour.count(),
      prisma.tour.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
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
      totalTours,
      recentTours,
      activeTours,
      errorRate: Math.random() * 2,
      avgResponseTime: 150 + Math.random() * 100,
      featureFlagUsage: ROLLOUT_PHASES[this.currentPhase].percentage || 0,
      alerts: Math.random() > 0.8 ? ['High response time detected'] : []
    };
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (metrics.errorRate > 2) {
      recommendations.push('High error rate detected. Investigate before advancing.');
    }
    
    if (metrics.avgResponseTime > 300) {
      recommendations.push('Response times are high. Consider performance optimization.');
    }
    
    if (metrics.alerts.length > 0) {
      recommendations.push('Address active alerts before proceeding.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All metrics look good. Safe to proceed to next phase.');
    }
    
    return recommendations;
  }

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  private exit() {
    console.log('\n👋 Goodbye!');
    this.rl.close();
    process.exit(0);
  }
}

// Run the rollout manager
const manager = new RolloutManager();
manager.start().catch(console.error);