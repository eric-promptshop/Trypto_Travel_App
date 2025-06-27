#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

interface VerificationResult {
  component: string
  status: 'exists' | 'missing' | 'partial'
  details: string[]
}

const results: VerificationResult[] = []

function checkFile(filePath: string, component: string): boolean {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  
  if (exists) {
    console.log(`${colors.green}✓${colors.reset} ${component}: ${filePath}`)
  } else {
    console.log(`${colors.red}✗${colors.reset} ${component}: ${filePath} - MISSING`)
  }
  
  return exists
}

function verifyPhase0() {
  console.log(`\n${colors.blue}${colors.bright}PHASE 0: Infrastructure Verification${colors.reset}\n`)
  
  const phase0Files = [
    // Database migrations
    {
      path: 'prisma/migrations/20250623_add_operators_and_enhanced_tours/migration.sql',
      component: 'Database Migration'
    },
    {
      path: 'prisma/schema.prisma',
      component: 'Updated Prisma Schema'
    },
    // Supabase Edge Functions
    {
      path: 'supabase/functions/ai-itinerary-generator/index.ts',
      component: 'AI Itinerary Generator'
    },
    {
      path: 'supabase/functions/ai-tour-scraper/index.ts',
      component: 'AI Tour Scraper'
    },
    {
      path: 'supabase/functions/ai-lead-enrichment/index.ts',
      component: 'AI Lead Enrichment'
    },
    {
      path: 'supabase/config.toml',
      component: 'Supabase Configuration'
    },
    // Replicate Integration
    {
      path: 'lib/services/replicate-service.ts',
      component: 'Replicate Service'
    },
    // Documentation
    {
      path: 'docs/SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md',
      component: 'Edge Functions Documentation'
    },
    {
      path: 'docs/REPLICATE_INTEGRATION_GUIDE.md',
      component: 'Replicate Integration Guide'
    }
  ]
  
  let phase0Passed = true
  phase0Files.forEach(file => {
    if (!checkFile(file.path, file.component)) {
      phase0Passed = false
    }
  })
  
  results.push({
    component: 'Phase 0: Infrastructure',
    status: phase0Passed ? 'exists' : 'partial',
    details: phase0Files.map(f => f.component)
  })
  
  // Check Prisma schema for new models
  console.log(`\n${colors.yellow}Checking Prisma Schema for new models...${colors.reset}`)
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma')
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')
    const newModels = ['Operator', 'Tour', 'LeadEnhanced', 'LeadActivity', 'Booking', 'Review', 'WidgetConfig', 'Integration']
    
    newModels.forEach(model => {
      if (schemaContent.includes(`model ${model}`)) {
        console.log(`${colors.green}✓${colors.reset} Model ${model} found in schema`)
      } else {
        console.log(`${colors.red}✗${colors.reset} Model ${model} NOT found in schema`)
      }
    })
  }
}

function verifyPhase1() {
  console.log(`\n\n${colors.blue}${colors.bright}PHASE 1: Core Operator Experience Verification${colors.reset}\n`)
  
  const phase1Components = {
    'Operator Management': [
      'app/api/operators/route.ts',
      'app/api/operators/[operatorId]/route.ts',
      'app/api/operators/[operatorId]/verify/route.ts',
      'app/api/operators/[operatorId]/stats/route.ts',
      'components/operator/OperatorDashboard.tsx',
      'app/operator/page.tsx',
      'lib/services/operator-service.ts'
    ],
    'Lead Management': [
      'app/api/leads/enhanced/route.ts',
      'app/api/leads/enhanced/[leadId]/route.ts',
      'app/api/leads/enhanced/[leadId]/activities/route.ts',
      'app/api/leads/enhanced/[leadId]/enrich/route.ts',
      'components/leads/LeadManagementDashboard.tsx'
    ],
    'Tour Scraping': [
      'app/api/tour-operator/tours/scrape/route.ts',
      'app/api/tour-operator/tours/batch-import/route.ts'
    ]
  }
  
  Object.entries(phase1Components).forEach(([component, files]) => {
    console.log(`\n${colors.yellow}${component}:${colors.reset}`)
    let allExist = true
    const componentDetails: string[] = []
    
    files.forEach(file => {
      const exists = checkFile(file, path.basename(file))
      if (!exists) allExist = false
      componentDetails.push(`${path.basename(file)}: ${exists ? 'exists' : 'missing'}`)
    })
    
    results.push({
      component: `Phase 1: ${component}`,
      status: allExist ? 'exists' : 'partial',
      details: componentDetails
    })
  })
}

function checkAPIEndpoints() {
  console.log(`\n\n${colors.blue}${colors.bright}API Endpoints Summary${colors.reset}\n`)
  
  const endpoints = [
    // Phase 0
    { method: 'POST', path: '/functions/v1/ai-itinerary-generator', desc: 'Generate AI itineraries' },
    { method: 'POST', path: '/functions/v1/ai-tour-scraper', desc: 'Scrape tour information' },
    { method: 'POST', path: '/functions/v1/ai-lead-enrichment', desc: 'Enrich lead data' },
    
    // Phase 1 - Operators
    { method: 'GET', path: '/api/operators', desc: 'List operators (admin)' },
    { method: 'POST', path: '/api/operators', desc: 'Create operator (admin)' },
    { method: 'GET', path: '/api/operators/[id]', desc: 'Get operator details' },
    { method: 'PATCH', path: '/api/operators/[id]', desc: 'Update operator' },
    { method: 'DELETE', path: '/api/operators/[id]', desc: 'Delete operator (admin)' },
    { method: 'POST', path: '/api/operators/[id]/verify', desc: 'Verify operator (admin)' },
    { method: 'GET', path: '/api/operators/[id]/stats', desc: 'Get operator statistics' },
    
    // Phase 1 - Leads
    { method: 'GET', path: '/api/leads/enhanced', desc: 'List leads with filtering' },
    { method: 'POST', path: '/api/leads/enhanced', desc: 'Create enhanced lead' },
    { method: 'GET', path: '/api/leads/enhanced/[id]', desc: 'Get lead details' },
    { method: 'PATCH', path: '/api/leads/enhanced/[id]', desc: 'Update lead' },
    { method: 'DELETE', path: '/api/leads/enhanced/[id]', desc: 'Delete lead' },
    { method: 'GET', path: '/api/leads/enhanced/[id]/activities', desc: 'Get lead activities' },
    { method: 'POST', path: '/api/leads/enhanced/[id]/activities', desc: 'Add lead activity' },
    { method: 'GET', path: '/api/leads/enhanced/[id]/enrich', desc: 'Get enrichment status' },
    { method: 'POST', path: '/api/leads/enhanced/[id]/enrich', desc: 'Trigger AI enrichment' },
    
    // Phase 1 - Tours
    { method: 'POST', path: '/api/tour-operator/tours/scrape', desc: 'Scrape single tour' },
    { method: 'POST', path: '/api/tour-operator/tours/batch-import', desc: 'Batch import tours' },
    { method: 'GET', path: '/api/tour-operator/tours/batch-import', desc: 'Get import status' }
  ]
  
  console.log('Available API Endpoints:')
  endpoints.forEach(ep => {
    console.log(`  ${colors.green}${ep.method.padEnd(6)}${colors.reset} ${ep.path.padEnd(45)} - ${ep.desc}`)
  })
}

function generateSummary() {
  console.log(`\n\n${colors.blue}${colors.bright}VERIFICATION SUMMARY${colors.reset}\n`)
  
  const phase0Results = results.filter(r => r.component.includes('Phase 0'))
  const phase1Results = results.filter(r => r.component.includes('Phase 1'))
  
  const phase0Complete = phase0Results.every(r => r.status === 'exists')
  const phase1Complete = phase1Results.every(r => r.status === 'exists')
  
  console.log(`Phase 0 (Infrastructure): ${phase0Complete ? colors.green + 'COMPLETE' : colors.yellow + 'PARTIAL'}${colors.reset}`)
  console.log(`Phase 1 (Core Operator): ${phase1Complete ? colors.green + 'COMPLETE' : colors.yellow + 'PARTIAL'}${colors.reset}`)
  
  if (!phase0Complete || !phase1Complete) {
    console.log(`\n${colors.yellow}Missing Components:${colors.reset}`)
    results.filter(r => r.status !== 'exists').forEach(r => {
      console.log(`\n  ${r.component}:`)
      r.details.filter(d => d.includes('missing')).forEach(d => {
        console.log(`    - ${d}`)
      })
    })
  }
  
  // Save results
  const reportPath = path.join(process.cwd(), 'phase-0-1-verification-report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    phase0Complete,
    phase1Complete,
    results
  }, null, 2))
  
  console.log(`\n${colors.green}Detailed report saved to: phase-0-1-verification-report.json${colors.reset}`)
}

// Main execution
console.log(`${colors.bright}AI Travel Planner - Phase 0 & 1 Implementation Verification${colors.reset}`)
console.log('='.repeat(60))

verifyPhase0()
verifyPhase1()
checkAPIEndpoints()
generateSummary()

console.log('\n')