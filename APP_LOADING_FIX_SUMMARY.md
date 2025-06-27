# Travel Itinerary Builder - App Loading & Timeout Fixes

## Issues Identified

### 1. Localhost vs Network Access Issue
**Problem**: The app doesn't load on localhost but works on network
**Root Cause**: 
- NEXTAUTH_URL is hardcoded to `http://localhost:3000`
- Complex tenant resolution in middleware
- Authentication redirects conflict with localhost access

### 2. Itinerary Generation Timeout
**Problem**: Itinerary generation times out
**Root Causes**:
- Geocoding API calls in the synchronous request flow
- Creating complex sample content for each request
- No timeout handling in the API route

### 3. Webpack Chunk Loading Error
**Problem**: ChunkLoadError preventing app from starting
**Root Cause**: Stale webpack chunks after build changes

## Fixes Applied

### 1. Simplified Middleware for Development (`/middleware.ts`)
- Added development mode bypass for localhost
- Automatically sets default tenant for localhost requests
- Skips complex tenant resolution in development

### 2. Optimized Itinerary Generation (`/app/api/generate-itinerary/route.ts`)
- Added 10-second timeout for entire request
- Added 2-second timeout for geocoding operations
- Skip geocoding in development mode for faster responses
- Use default coordinates (Paris) as fallback

### 3. Development Environment Configuration (`/.env.development`)
- Added development-specific flags:
  - `DISABLE_TENANT_RESOLUTION=true`
  - `SKIP_GEOCODING_DEV=true`
  - `API_TIMEOUT_MS=10000`
  - `GEOCODING_TIMEOUT_MS=2000`

### 4. Created Development Tools
- `/scripts/clear-dev-cache.sh` - Clears all development caches
- `/scripts/diagnose-app.ts` - Diagnostic tool to check app health
- `/app/health/route.ts` - Health check endpoint

## How to Fix Your Development Environment

### Step 1: Clear All Caches
```bash
./scripts/clear-dev-cache.sh
```

### Step 2: Run Diagnostics
```bash
npx tsx scripts/diagnose-app.ts
```

### Step 3: Start Fresh Development Server
```bash
npm run dev
```

### Step 4: Test the App
1. Visit http://localhost:3000/health - Should return JSON with status "ok"
2. Visit http://localhost:3000 - Should load the home page
3. Clear browser cache if needed (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Step 5: Test Itinerary Generation
1. Navigate to http://localhost:3000/plan
2. Enter any destination (e.g., "Paris")
3. Select dates and click generate
4. Should complete within 10 seconds

## Additional Troubleshooting

### If the app still doesn't load:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Try incognito/private browsing mode
4. Check if port 3000 is already in use: `lsof -ti:3000`

### If itinerary generation still times out:
1. Check the browser's Network tab for the `/api/generate-itinerary` request
2. Look for any 500 errors or timeout messages
3. Check server logs in the terminal

### For network access (e.g., 192.168.x.x):
1. Update NEXTAUTH_URL in .env.local to your network IP
2. Or use ngrok for public tunneling: `npx ngrok http 3000`

## Files Modified
1. `/middleware.ts` - Added development mode bypass
2. `/app/api/generate-itinerary/route.ts` - Added timeout handling
3. `/.env.development` - Added development flags
4. `/scripts/clear-dev-cache.sh` - Cache clearing script
5. `/scripts/diagnose-app.ts` - Diagnostic tool
6. `/app/health/route.ts` - Health check endpoint

## Next Steps
After applying these fixes, the app should:
- Load properly on localhost
- Generate itineraries without timing out
- Handle both localhost and network access gracefully

## Critical Fix for ChunkLoadError

If you're still seeing ChunkLoadError, this is due to stale webpack chunks in your browser cache. Follow these steps:

### Option 1: Quick Fix
```bash
./scripts/fix-chunk-error.sh
```

### Option 2: Manual Fix
1. **Kill all Node processes**:
   ```bash
   killall node
   pkill -f "next dev"
   ```

2. **Clear all caches**:
   ```bash
   rm -rf .next node_modules/.cache .eslintcache
   ```

3. **Clear browser storage completely**:
   - Open Chrome DevTools (F12)
   - Go to Application tab
   - Storage section → Clear site data
   - **OR** use an incognito/private browsing window

4. **Start fresh**:
   ```bash
   npm run dev
   ```

### Why This Happens
The ChunkLoadError occurs when:
- Webpack chunk files are cached in the browser
- The app is rebuilt with different chunk IDs
- Browser tries to load old chunks that no longer exist

### Prevention
- Always use incognito mode during development
- Clear browser cache after major changes
- Use the simplified layout.tsx for development