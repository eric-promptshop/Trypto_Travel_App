#!/usr/bin/env node
import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { container } from '@/src/core/container';
import { TYPES } from '@/src/core/types';
import { TourApplicationService } from '@/src/core/application/tour/TourApplicationService';
import '@/src/infrastructure/startup';

/**
 * Migration script to update existing tour API routes to use new service architecture
 * Run with: npx tsx scripts/migrate-tour-apis.ts
 */

const prisma = new PrismaClient();

interface MigrationResult {
  endpoint: string;
  oldPath: string;
  newPath: string;
  status: 'success' | 'skipped' | 'failed';
  error?: string;
}

async function migrateAPIs() {
  console.log('🚀 Starting Tour API Migration...\n');

  const results: MigrationResult[] = [];

  // Map old API routes to new ones
  const apiMappings = [
    {
      name: 'Create Tour',
      oldPath: '/api/tour-operator/tours',
      newPath: '/api/v1/tours',
      method: 'POST'
    },
    {
      name: 'Get Tours',
      oldPath: '/api/tour-operator/tours',
      newPath: '/api/v1/tours',
      method: 'GET'
    },
    {
      name: 'Get Tour by ID',
      oldPath: '/api/tour-operator/tours/[tourId]',
      newPath: '/api/v1/tours/[tourId]',
      method: 'GET'
    },
    {
      name: 'Update Tour',
      oldPath: '/api/tour-operator/tours/[tourId]',
      newPath: '/api/v1/tours/[tourId]',
      method: 'PUT'
    },
    {
      name: 'Delete Tour',
      oldPath: '/api/tour-operator/tours/[tourId]',
      newPath: '/api/v1/tours/[tourId]/archive',
      method: 'POST'
    },
    {
      name: 'Search Tours',
      oldPath: '/api/tours/discover',
      newPath: '/api/v1/tours/search',
      method: 'GET'
    }
  ];

  // Log API mappings
  console.log('📋 API Route Mappings:\n');
  apiMappings.forEach(mapping => {
    console.log(`${mapping.name} (${mapping.method})`);
    console.log(`  Old: ${mapping.oldPath}`);
    console.log(`  New: ${mapping.newPath}\n`);
  });

  // Create route mapping file for reference
  const routeMappingContent = `# Tour API Route Mappings

## Migration Date: ${new Date().toISOString()}

| Operation | Method | Old Route | New Route | Status |
|-----------|--------|-----------|-----------|---------|
${apiMappings.map(m => `| ${m.name} | ${m.method} | ${m.oldPath} | ${m.newPath} | ✅ |`).join('\n')}

## Usage Examples

### Before (Old API)
\`\`\`javascript
// Create tour
fetch('/api/tour-operator/tours', {
  method: 'POST',
  body: JSON.stringify(tourData)
})

// Get tours
fetch('/api/tour-operator/tours')

// Update tour
fetch(\`/api/tour-operator/tours/\${tourId}\`, {
  method: 'PUT',
  body: JSON.stringify(updates)
})
\`\`\`

### After (New API)
\`\`\`javascript
// Create tour
fetch('/api/v1/tours', {
  method: 'POST',
  body: JSON.stringify(tourData)
})

// Get tours
fetch('/api/v1/tours')

// Update tour
fetch(\`/api/v1/tours/\${tourId}\`, {
  method: 'PUT',
  body: JSON.stringify(updates)
})

// Publish tour (new endpoint)
fetch(\`/api/v1/tours/\${tourId}/publish\`, {
  method: 'POST'
})

// Archive tour (replaces delete)
fetch(\`/api/v1/tours/\${tourId}/archive\`, {
  method: 'POST'
})
\`\`\`

## Response Format Changes

### Old Format
\`\`\`json
{
  "success": true,
  "data": { ... },
  "error": null
}
\`\`\`

### New Format
\`\`\`json
{
  "id": "...",
  "title": "...",
  "status": "...",
  // Direct response without wrapper
}
\`\`\`

## Error Handling

### Old Format
\`\`\`json
{
  "success": false,
  "error": "Error message"
}
\`\`\`

### New Format
\`\`\`json
{
  "error": "Error message",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
\`\`\`
`;

  // Write mapping file
  await Bun.write('./TOUR_API_MIGRATION_MAP.md', routeMappingContent);
  console.log('✅ Created TOUR_API_MIGRATION_MAP.md\n');

  // Test new service
  console.log('🧪 Testing New Service...\n');
  
  try {
    const tourService = container.get<TourApplicationService>(TYPES.TourApplicationService);
    console.log('✅ Tour service initialized successfully');
    
    // Verify database connection
    const tourCount = await prisma.tour.count();
    console.log(`✅ Database connected. Found ${tourCount} existing tours\n`);
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }

  // Generate migration checklist
  const checklistContent = `# Tour API Migration Checklist

## Pre-Migration
- [ ] Backup database
- [ ] Review existing API usage in frontend
- [ ] Update environment variables
- [ ] Test new endpoints in development

## Migration Steps

### 1. Update Frontend Components
${apiMappings.map(m => `- [ ] Update calls to ${m.oldPath}`).join('\n')}

### 2. Update API Clients
- [ ] Update SDK/client libraries
- [ ] Update mobile app API calls
- [ ] Update third-party integrations

### 3. Enable Feature Flag
\`\`\`bash
# .env.local
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true
\`\`\`

### 4. Monitor During Migration
- [ ] Check error rates
- [ ] Monitor response times
- [ ] Verify email notifications
- [ ] Check analytics tracking

### 5. Post-Migration
- [ ] Remove old API routes
- [ ] Update documentation
- [ ] Remove feature flags
- [ ] Archive old code

## Rollback Plan
1. Set feature flag to false
2. Restart application
3. Investigate issues
4. Fix and retry

## Monitoring Dashboard
- Sentry: Check for new errors
- Analytics: Monitor API usage
- Logs: Check for warnings
`;

  await Bun.write('./TOUR_API_MIGRATION_CHECKLIST.md', checklistContent);
  console.log('✅ Created TOUR_API_MIGRATION_CHECKLIST.md\n');

  // Create component update script
  const componentUpdateScript = `#!/bin/bash
# Script to update API calls in components

echo "🔍 Finding components with old API calls..."

# Find all files with old API calls
grep -r "tour-operator/tours" --include="*.tsx" --include="*.ts" app/ components/ > old_api_usage.txt

echo "📝 Found the following files using old APIs:"
cat old_api_usage.txt

echo "
📋 Manual updates needed:
1. Replace '/api/tour-operator/tours' with '/api/v1/tours'
2. Update DELETE requests to use POST /archive endpoint
3. Add feature flag checks using useFeatureFlag('USE_NEW_TOUR_SERVICE')
4. Replace direct fetch calls with useTours() hook where possible
"

echo "✅ Review old_api_usage.txt for all files that need updating"
`;

  await Bun.write('./scripts/find-old-tour-apis.sh', componentUpdateScript);
  console.log('✅ Created find-old-tour-apis.sh script\n');

  console.log('📊 Migration Summary:');
  console.log(`- ${apiMappings.length} API routes mapped`);
  console.log('- Migration documentation created');
  console.log('- Component update script created');
  console.log('\n✅ Migration preparation complete!');
  console.log('\n📌 Next steps:');
  console.log('1. Run: chmod +x scripts/find-old-tour-apis.sh && ./scripts/find-old-tour-apis.sh');
  console.log('2. Review TOUR_API_MIGRATION_MAP.md');
  console.log('3. Follow TOUR_API_MIGRATION_CHECKLIST.md');
  console.log('4. Update components using old_api_usage.txt as reference');

  await prisma.$disconnect();
}

// Run migration
migrateAPIs().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});