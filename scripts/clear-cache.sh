#!/bin/bash

echo "🧹 Clearing all caches..."

# Clear Next.js cache
echo "Removing .next directory..."
rm -rf .next

# Clear node_modules cache
echo "Removing node_modules cache..."
rm -rf node_modules/.cache

# Clear package manager caches
echo "Clearing npm cache..."
npm cache clean --force

# Clear any other potential caches
echo "Removing other cache directories..."
rm -rf .cache
rm -rf .turbo
rm -rf .parcel-cache

# Clear browser cache reminder
echo ""
echo "✅ Local caches cleared!"
echo ""
echo "⚠️  Don't forget to:"
echo "1. Clear your browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)"
echo "2. Close all browser tabs with the app"
echo "3. Restart the dev server"
echo ""