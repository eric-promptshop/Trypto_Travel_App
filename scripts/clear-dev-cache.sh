#!/bin/bash

echo "🧹 Clearing development caches..."

# Clear Next.js build cache
echo "📦 Removing .next directory..."
rm -rf .next

# Clear node_modules cache
echo "🗑️  Clearing node_modules cache..."
rm -rf node_modules/.cache

# Clear any service worker caches from browser (instructions)
echo ""
echo "🌐 To clear browser caches:"
echo "1. Open Chrome DevTools (F12)"
echo "2. Go to Application tab"
echo "3. Storage -> Clear site data"
echo "4. Or right-click refresh button and select 'Empty Cache and Hard Reload'"
echo ""

# Kill any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next dev" || true

echo "✅ Development caches cleared!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Clear your browser cache as instructed above"
echo "3. Navigate to http://localhost:3000"