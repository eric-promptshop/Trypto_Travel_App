#!/bin/bash

# Script to remove legacy code after successful migration
# DO NOT RUN until migration is 100% complete and verified!

echo "⚠️  WARNING: Legacy Code Cleanup Script"
echo "======================================"
echo "This script will permanently remove old tour service code."
echo "Only run this after:"
echo "- 100% rollout is complete"
echo "- All users are on new service"
echo "- No rollback is needed"
echo ""
read -p "Are you absolutely sure? Type 'DELETE LEGACY CODE' to proceed: " confirmation

if [ "$confirmation" != "DELETE LEGACY CODE" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo "🗑️  Starting legacy code cleanup..."

# Create backup branch
echo "📸 Creating backup branch..."
git checkout -b backup/pre-legacy-cleanup-$(date +%Y%m%d)
git push origin backup/pre-legacy-cleanup-$(date +%Y%m%d)
git checkout main

# Files to remove
LEGACY_FILES=(
    # Old API routes
    "app/api/tour-operator/tours/route.ts"
    "app/api/tour-operator/tours/[tourId]/route.ts"
    "app/api/tour-operator/tours/extract/route.ts"
    "app/api/tour-operator/tours/import/route.ts"
    "app/api/tour-operator/tours/scrape/route.ts"
    "app/api/tours/discover/route.ts"
    
    # Old service files
    "lib/services/tour-service.ts"
    "lib/services/tour-import-service.ts"
    
    # Migration files
    "lib/migration/tour-adapter.ts"
    "scripts/migrate-tour-apis.ts"
    "scripts/find-old-tour-apis.sh"
    
    # Documentation
    "TOUR_API_MIGRATION_MAP.md"
    "TOUR_API_MIGRATION_CHECKLIST.md"
    "COMPONENT_MIGRATION_EXAMPLE.md"
    "SERVICE_MIGRATION_PLAN.md"
    "SERVICE_MIGRATION_STATUS.md"
)

# Remove files
for file in "${LEGACY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🗑️  Removing: $file"
        git rm "$file"
    fi
done

# Update components to remove feature flags
echo ""
echo "📝 Updating components to remove feature flags..."

# List of components to update
COMPONENTS=(
    "components/tour-operator/TourOperatorDashboard.tsx"
    "components/tour-operator/TourUploadModal.tsx"
    "components/tour-operator/TourImportModal.tsx"
    "components/tour-operator/TourUrlImportModal.tsx"
    "components/tour-operator/TourDetailModal.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        echo "📝 Updating: $component"
        # Remove feature flag imports and conditionals
        # This is a simplified example - in practice, use a proper code mod tool
        sed -i '' '/useFeatureFlag/d' "$component"
        sed -i '' '/USE_NEW_TOUR_SERVICE/d' "$component"
    fi
done

# Update environment files
echo ""
echo "📝 Updating environment configuration..."

# Remove feature flags from env files
sed -i '' '/NEXT_PUBLIC_USE_NEW_TOUR_SERVICE/d' .env.example 2>/dev/null || true
sed -i '' '/NEXT_PUBLIC_USE_NEW_TOUR_SERVICE/d' .env.service-migration 2>/dev/null || true
sed -i '' '/NEXT_PUBLIC_ROLLOUT_/d' .env.example 2>/dev/null || true

# Create commit
echo ""
echo "💾 Creating cleanup commit..."
git add -A
git commit -m "chore: remove legacy tour service code after successful migration

- Removed old API routes
- Removed migration adapters
- Removed feature flags from components
- Cleaned up migration documentation
- Updated environment configuration

The new service architecture is now the only implementation."

echo ""
echo "✅ Legacy code cleanup complete!"
echo ""
echo "📌 Next steps:"
echo "1. Review the changes: git diff HEAD~1"
echo "2. Run tests: npm test"
echo "3. Deploy to staging first"
echo "4. Monitor for any issues"
echo "5. Deploy to production"
echo ""
echo "🔙 To undo this cleanup:"
echo "   git reset --hard HEAD~1"
echo "   OR"
echo "   git checkout backup/pre-legacy-cleanup-$(date +%Y%m%d)"