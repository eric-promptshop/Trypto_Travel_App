#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting production build...\n');

// Step 1: Clean previous builds
console.log('1️⃣ Cleaning previous builds...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  console.log('✅ Build cache cleaned\n');
} catch (error) {
  console.error('❌ Failed to clean build cache\n');
}

// Step 2: Check environment variables
console.log('2️⃣ Checking environment variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.log('Please set these in your .env.local file\n');
  process.exit(1);
}
console.log('✅ Environment variables OK\n');

// Step 3: Run TypeScript check (optional, can be skipped for faster builds)
console.log('3️⃣ Running TypeScript check...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed\n');
} catch (error) {
  console.warn('⚠️ TypeScript check failed, continuing with build...\n');
}

// Step 4: Run the build with optimized settings
console.log('4️⃣ Building production bundle...');
console.log('This may take a few minutes...\n');

const buildEnv = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=8192', // 8GB memory limit
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_ENV: 'production',
};

try {
  execSync('next build', { 
    stdio: 'inherit',
    env: buildEnv
  });
  console.log('\n✅ Build completed successfully!\n');
} catch (error) {
  console.error('\n❌ Build failed!');
  console.error('Error:', error.message);
  process.exit(1);
}

// Step 5: Show build output size
console.log('5️⃣ Build Summary:');
try {
  const buildManifest = path.join('.next', 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    const stats = fs.statSync('.next');
    console.log(`📦 Build size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }
  
  // Check if static pages were generated
  const pagesManifest = path.join('.next', 'server', 'pages-manifest.json');
  if (fs.existsSync(pagesManifest)) {
    const manifest = JSON.parse(fs.readFileSync(pagesManifest, 'utf8'));
    const pageCount = Object.keys(manifest).length;
    console.log(`📄 Pages generated: ${pageCount}`);
  }
  
  console.log('\n🎉 Build completed successfully!');
  console.log('You can now deploy the .next folder to your hosting provider.\n');
} catch (error) {
  console.log('Unable to read build statistics\n');
}