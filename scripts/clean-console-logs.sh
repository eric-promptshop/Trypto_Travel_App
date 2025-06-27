#!/bin/bash

# Script to remove console.log, console.error, console.debug, console.trace statements
# Keeps only critical error logging where necessary

echo "Starting console statement cleanup..."

# Count initial console statements
initial_count=$(grep -r "console\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | grep -v node_modules | grep -v ".next" | wc -l)
echo "Found $initial_count console statements initially"

# Remove console.log statements
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./scripts/*" \
  -exec sed -i '' '/console\.log(/d' {} \;

# Remove console.debug statements
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./scripts/*" \
  -exec sed -i '' '/console\.debug(/d' {} \;

# Remove console.trace statements  
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./scripts/*" \
  -exec sed -i '' '/console\.trace(/d' {} \;

# Remove console.info statements
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./scripts/*" \
  -exec sed -i '' '/console\.info(/d' {} \;

# Remove console.warn statements (keep only critical ones)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./scripts/*" \
  -not -path "./lib/auth/*" \
  -not -path "./lib/middleware/*" \
  -exec sed -i '' '/console\.warn(/d' {} \;

# Count remaining console statements
final_count=$(grep -r "console\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | grep -v node_modules | grep -v ".next" | wc -l)
echo "Reduced to $final_count console statements"
echo "Removed $((initial_count - final_count)) console statements"

echo "Console cleanup complete!"