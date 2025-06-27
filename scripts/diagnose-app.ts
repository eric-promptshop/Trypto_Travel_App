#!/usr/bin/env tsx

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { execSync } from 'child_process'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env.development' })

console.log('🔍 Travel Itinerary Builder - Diagnostic Tool\n')

// Check Node.js version
console.log('1️⃣ Node.js Version Check:')
const nodeVersion = process.version
console.log(`   Current: ${nodeVersion}`)
console.log(`   Required: >= 18.0.0`)
console.log(`   Status: ${nodeVersion >= 'v18.0.0' ? '✅ OK' : '❌ Please upgrade Node.js'}\n`)

// Check environment files
console.log('2️⃣ Environment Files:')
const envFiles = ['.env', '.env.local', '.env.development']
envFiles.forEach(file => {
  const exists = existsSync(file)
  console.log(`   ${file}: ${exists ? '✅ Found' : '❌ Missing'}`)
})
console.log()

// Check critical environment variables
console.log('3️⃣ Critical Environment Variables:')
const criticalEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'GOOGLE_PLACES_API_KEY'
]

criticalEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    const masked = varName.includes('KEY') || varName.includes('SECRET') 
      ? value.substring(0, 10) + '...' 
      : value
    console.log(`   ${varName}: ✅ Set (${masked})`)
  } else {
    console.log(`   ${varName}: ❌ Not set`)
  }
})
console.log()

// Check Next.js build status
console.log('4️⃣ Next.js Build Status:')
const hasNextBuild = existsSync('.next')
console.log(`   .next directory: ${hasNextBuild ? '✅ Found' : '⚠️  Not found (run npm run dev)'}\n`)

// Check for port conflicts
console.log('5️⃣ Port Availability (3000):')
try {
  execSync('lsof -ti:3000', { stdio: 'pipe' })
  console.log('   ❌ Port 3000 is in use!')
  console.log('   Run: pkill -f "next dev" to stop existing process')
} catch {
  console.log('   ✅ Port 3000 is available')
}
console.log()

// Check database connection
console.log('6️⃣ Database Connection:')
if (process.env.DATABASE_URL) {
  console.log('   ✅ DATABASE_URL is configured')
  console.log('   Run "npm run db:push" to ensure schema is up to date')
} else {
  console.log('   ❌ DATABASE_URL not found')
}
console.log()

// Recommendations
console.log('📋 Recommendations:')
console.log('1. Run: ./scripts/clear-dev-cache.sh')
console.log('2. Run: npm install')
console.log('3. Run: npm run db:push')
console.log('4. Run: npm run dev')
console.log('5. Visit: http://localhost:3000/health')
console.log('\nIf issues persist, check the browser console for errors.')