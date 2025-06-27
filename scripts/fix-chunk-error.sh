#!/bin/bash

echo "🔧 Fixing ChunkLoadError issue..."

# Kill all Node processes
echo "1. Killing all Node processes..."
killall node 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Clear all caches
echo "2. Clearing all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .eslintcache

# Clear browser storage (instructions)
echo ""
echo "3. IMPORTANT: Clear browser storage"
echo "   Open Chrome DevTools (F12) > Application tab > Storage > Clear site data"
echo "   Or use incognito/private browsing mode"
echo ""

# Start fresh
echo "4. Starting fresh development server..."
npm run dev