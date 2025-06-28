#!/usr/bin/env node
import { performance } from 'perf_hooks';

/**
 * Performance comparison script for old vs new Tour API
 * Run with: npx tsx scripts/performance-comparison.ts
 */

interface PerformanceResult {
  endpoint: string;
  method: string;
  oldApi: {
    avgTime: number;
    minTime: number;
    maxTime: number;
    errorRate: number;
  };
  newApi: {
    avgTime: number;
    minTime: number;
    maxTime: number;
    errorRate: number;
  };
  improvement: {
    avgTime: string;
    errorRate: string;
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_ITERATIONS = 100;
const CONCURRENT_REQUESTS = 10;

async function measureEndpoint(
  url: string,
  options: RequestInit = {}
): Promise<{ time: number; error: boolean }> {
  const start = performance.now();
  let error = false;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN || ''}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      error = true;
    }
    
    // Consume response body to ensure complete request
    await response.text();
  } catch (e) {
    error = true;
  }
  
  const time = performance.now() - start;
  return { time, error };
}

async function runPerformanceTest(
  name: string,
  oldUrl: string,
  newUrl: string,
  options: RequestInit = {}
): Promise<PerformanceResult> {
  console.log(`\n📊 Testing: ${name}`);
  console.log(`Old API: ${oldUrl}`);
  console.log(`New API: ${newUrl}`);
  
  // Test old API
  const oldResults = await testEndpoint(oldUrl, options);
  console.log(`✅ Old API tested (${TEST_ITERATIONS} requests)`);
  
  // Test new API
  const newResults = await testEndpoint(newUrl, options);
  console.log(`✅ New API tested (${TEST_ITERATIONS} requests)`);
  
  // Calculate metrics
  const oldMetrics = calculateMetrics(oldResults);
  const newMetrics = calculateMetrics(newResults);
  
  // Calculate improvement
  const avgImprovement = ((oldMetrics.avgTime - newMetrics.avgTime) / oldMetrics.avgTime * 100).toFixed(1);
  const errorImprovement = ((oldMetrics.errorRate - newMetrics.errorRate) / Math.max(oldMetrics.errorRate, 0.01) * 100).toFixed(1);
  
  return {
    endpoint: name,
    method: options.method || 'GET',
    oldApi: oldMetrics,
    newApi: newMetrics,
    improvement: {
      avgTime: `${avgImprovement}%`,
      errorRate: `${errorImprovement}%`
    }
  };
}

async function testEndpoint(
  url: string,
  options: RequestInit
): Promise<Array<{ time: number; error: boolean }>> {
  const results = [];
  
  // Run tests in batches to simulate concurrent load
  for (let i = 0; i < TEST_ITERATIONS; i += CONCURRENT_REQUESTS) {
    const batch = [];
    
    for (let j = 0; j < CONCURRENT_REQUESTS && i + j < TEST_ITERATIONS; j++) {
      batch.push(measureEndpoint(url, options));
    }
    
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

function calculateMetrics(results: Array<{ time: number; error: boolean }>) {
  const times = results.filter(r => !r.error).map(r => r.time);
  const errorCount = results.filter(r => r.error).length;
  
  if (times.length === 0) {
    return {
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
      errorRate: 100
    };
  }
  
  return {
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    errorRate: (errorCount / results.length) * 100
  };
}

async function main() {
  console.log('🚀 Tour API Performance Comparison');
  console.log('================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Iterations per endpoint: ${TEST_ITERATIONS}`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
  
  const results: PerformanceResult[] = [];
  
  // Test GET Tours
  results.push(await runPerformanceTest(
    'Get Tours',
    `${BASE_URL}/api/tour-operator/tours`,
    `${BASE_URL}/api/v1/tours`
  ));
  
  // Test Create Tour
  const testTourData = {
    title: 'Performance Test Tour',
    description: 'This is a test tour for performance comparison',
    duration: 5,
    price: { amount: 999, currency: 'USD' },
    destinations: ['Test City'],
    activities: ['Testing'],
    maxParticipants: 10,
    minParticipants: 1
  };
  
  results.push(await runPerformanceTest(
    'Create Tour',
    `${BASE_URL}/api/tour-operator/tours`,
    `${BASE_URL}/api/v1/tours`,
    {
      method: 'POST',
      body: JSON.stringify(testTourData)
    }
  ));
  
  // Test Health Check (new API only)
  const healthResult = await measureEndpoint(`${BASE_URL}/api/v1/tours/health`);
  console.log(`\n🏥 Health Check: ${healthResult.time.toFixed(2)}ms`);
  
  // Display results
  console.log('\n📈 Performance Comparison Results');
  console.log('=================================\n');
  
  console.table(results.map(r => ({
    Endpoint: r.endpoint,
    Method: r.method,
    'Old API Avg (ms)': r.oldApi.avgTime.toFixed(2),
    'New API Avg (ms)': r.newApi.avgTime.toFixed(2),
    'Improvement': r.improvement.avgTime,
    'Old Error Rate': `${r.oldApi.errorRate.toFixed(1)}%`,
    'New Error Rate': `${r.newApi.errorRate.toFixed(1)}%`
  })));
  
  // Summary
  const avgOldTime = results.reduce((sum, r) => sum + r.oldApi.avgTime, 0) / results.length;
  const avgNewTime = results.reduce((sum, r) => sum + r.newApi.avgTime, 0) / results.length;
  const overallImprovement = ((avgOldTime - avgNewTime) / avgOldTime * 100).toFixed(1);
  
  console.log('\n📊 Overall Summary');
  console.log('==================');
  console.log(`Average Old API Response Time: ${avgOldTime.toFixed(2)}ms`);
  console.log(`Average New API Response Time: ${avgNewTime.toFixed(2)}ms`);
  console.log(`Overall Performance Improvement: ${overallImprovement}%`);
  
  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');
  
  if (parseFloat(overallImprovement) > 0) {
    console.log('✅ New API shows performance improvements');
    console.log('✅ Safe to proceed with gradual rollout');
  } else {
    console.log('⚠️  New API may be slower than old API');
    console.log('⚠️  Investigate performance bottlenecks before rollout');
  }
  
  // Check error rates
  const hasHighErrorRate = results.some(r => r.newApi.errorRate > 5);
  if (hasHighErrorRate) {
    console.log('❌ High error rate detected in new API');
    console.log('❌ Fix errors before proceeding with rollout');
  }
  
  // Export results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    configuration: {
      baseUrl: BASE_URL,
      iterations: TEST_ITERATIONS,
      concurrentRequests: CONCURRENT_REQUESTS
    },
    results,
    summary: {
      avgOldTime,
      avgNewTime,
      overallImprovement: `${overallImprovement}%`
    }
  };
  
  await Bun.write(
    './performance-comparison-report.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n✅ Report saved to performance-comparison-report.json');
}

// Run the comparison
main().catch(console.error);