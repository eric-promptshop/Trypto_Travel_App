#!/bin/bash
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