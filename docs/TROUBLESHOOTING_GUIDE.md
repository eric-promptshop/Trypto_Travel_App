# Troubleshooting Guide - Travel Itinerary Builder

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Development Issues](#development-issues)
4. [Production Issues](#production-issues)
5. [Database Problems](#database-problems)
6. [API Errors](#api-errors)
7. [Authentication Issues](#authentication-issues)
8. [Performance Problems](#performance-problems)
9. [Deployment Failures](#deployment-failures)
10. [Third-Party Service Issues](#third-party-service-issues)
11. [Debug Tools & Commands](#debug-tools--commands)
12. [Emergency Procedures](#emergency-procedures)

## Quick Diagnostics

### System Health Check

```bash
# Run comprehensive health check
curl https://app.travelitinerary.com/api/health | jq

# Expected response
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency": 23 },
    "redis": { "status": "up" },
    "openai": { "status": "up" },
    "cloudinary": { "status": "up" }
  }
}
```

### Quick Debug Checklist

1. **Check Service Status**
   ```bash
   # Vercel status
   curl https://www.vercel-status.com/api/v2/status.json
   
   # Supabase status
   curl https://status.supabase.com/api/v2/status.json
   ```

2. **Verify Environment**
   ```bash
   # Check environment variables
   vercel env pull
   cat .env.local
   
   # Verify Node version
   node --version  # Should be 18.x or higher
   ```

3. **Test Database Connection**
   ```bash
   npx prisma db pull
   ```

## Common Issues

### Issue: "Application won't start"

**Symptoms:**
- Blank page or 500 error
- Console errors about missing dependencies

**Solutions:**

1. **Clear cache and reinstall**
   ```bash
   rm -rf node_modules .next
   npm cache clean --force
   npm install
   npm run dev
   ```

2. **Check environment variables**
   ```bash
   # Ensure all required vars are set
   npx dotenv-checker
   
   # Common missing variables
   DATABASE_URL
   NEXTAUTH_URL
   NEXTAUTH_SECRET
   ```

3. **Verify database connection**
   ```bash
   # Test connection
   npx prisma db pull
   
   # Reset database if needed
   npx prisma migrate reset
   ```

### Issue: "TypeScript errors during build"

**Symptoms:**
- Build fails with type errors
- Red squiggly lines in IDE

**Solutions:**

1. **Update TypeScript definitions**
   ```bash
   npm install --save-dev @types/node@latest
   npm run type-check
   ```

2. **Clear TypeScript cache**
   ```bash
   rm -rf node_modules/.cache/typescript
   npx tsc --build --clean
   ```

3. **Fix common type issues**
   ```typescript
   // Add type assertions for dynamic imports
   const Component = dynamic(() => 
     import('./Component') as Promise<any>
   );
   
   // Fix missing types
   declare module 'problematic-package' {
     export function someFunction(): void;
   }
   ```

### Issue: "Styles not loading correctly"

**Symptoms:**
- Broken layout
- Missing CSS
- Flash of unstyled content

**Solutions:**

1. **Rebuild CSS**
   ```bash
   # Clear CSS cache
   rm -rf .next/cache
   
   # Rebuild
   npm run build
   ```

2. **Check Tailwind configuration**
   ```javascript
   // tailwind.config.ts
   module.exports = {
     content: [
       './app/**/*.{js,ts,jsx,tsx}',
       './components/**/*.{js,ts,jsx,tsx}',
       // Add any missing paths
     ],
   }
   ```

3. **Verify CSS import order**
   ```css
   /* app/globals.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   /* Custom styles below Tailwind imports */
   ```

## Development Issues

### Issue: "Hot reload not working"

**Solutions:**

1. **Check file watching limits (Linux/WSL)**
   ```bash
   # Increase watchers
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server**
   ```bash
   # Kill all Node processes
   pkill -f node
   
   # Start fresh
   npm run dev
   ```

3. **Clear Next.js cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

### Issue: "Cannot find module"

**Solutions:**

1. **Verify import paths**
   ```typescript
   // Use absolute imports
   import { Component } from '@/components/Component'
   
   // Not relative imports in deep files
   import { Component } from '../../../components/Component'
   ```

2. **Check tsconfig paths**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"],
         "@/components/*": ["./components/*"]
       }
     }
   }
   ```

3. **Reinstall dependencies**
   ```bash
   npm install
   npm dedupe
   ```

### Issue: "Prisma Client out of sync"

**Solutions:**

1. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Sync schema with database**
   ```bash
   # Pull current schema from database
   npx prisma db pull
   
   # Or push schema to database
   npx prisma db push
   ```

3. **Reset and migrate**
   ```bash
   # Development only
   npx prisma migrate reset
   npx prisma migrate dev
   ```

## Production Issues

### Issue: "High memory usage"

**Symptoms:**
- Serverless function timeouts
- Out of memory errors
- Slow response times

**Solutions:**

1. **Optimize imports**
   ```typescript
   // Bad - imports entire library
   import _ from 'lodash';
   
   // Good - imports only needed function
   import debounce from 'lodash/debounce';
   ```

2. **Increase function limits**
   ```json
   // vercel.json
   {
     "functions": {
       "app/api/generate-itinerary/route.ts": {
         "maxDuration": 60,
         "memory": 3008
       }
     }
   }
   ```

3. **Implement caching**
   ```typescript
   import { unstable_cache } from 'next/cache';
   
   const getCachedData = unstable_cache(
     async (id) => {
       return await fetchExpensiveData(id);
     },
     ['cache-key'],
     { revalidate: 3600 } // 1 hour
   );
   ```

### Issue: "Slow page loads"

**Solutions:**

1. **Enable static generation**
   ```typescript
   // app/page.tsx
   export const dynamic = 'force-static';
   export const revalidate = 3600; // ISR
   ```

2. **Optimize images**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={800}
     height={600}
     loading="lazy"
     placeholder="blur"
   />
   ```

3. **Reduce JavaScript bundle**
   ```bash
   # Analyze bundle
   npm run build -- --analyze
   
   # Find large dependencies
   npm list --depth=0 | grep -E "^\+|^\`" | sort -k2 -hr
   ```

### Issue: "Database connection pool exhausted"

**Symptoms:**
- "Too many connections" errors
- Intermittent database failures

**Solutions:**

1. **Configure connection pooling**
   ```typescript
   // lib/prisma.ts
   const prismaClientSingleton = () => {
     return new PrismaClient({
       datasources: {
         db: {
           url: process.env.DATABASE_URL,
         },
       },
       log: ['error'],
     });
   };
   
   declare global {
     var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
   }
   
   const prisma = globalThis.prisma ?? prismaClientSingleton();
   
   if (process.env.NODE_ENV !== 'production') {
     globalThis.prisma = prisma;
   }
   ```

2. **Add connection string parameters**
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30"
   ```

## Database Problems

### Issue: "Migration failures"

**Solutions:**

1. **Check migration status**
   ```bash
   npx prisma migrate status
   ```

2. **Resolve failed migrations**
   ```bash
   # Mark as resolved
   npx prisma migrate resolve --applied "20240120123456_migration_name"
   
   # Or rollback
   npx prisma migrate resolve --rolled-back "20240120123456_migration_name"
   ```

3. **Manual migration**
   ```sql
   -- Create manual migration
   BEGIN;
   
   -- Your SQL changes here
   ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
   
   -- Update migration history
   INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
   VALUES ('manual_001', 'checksum', NOW(), '20240120_manual_migration', NOW(), 1);
   
   COMMIT;
   ```

### Issue: "Query performance problems"

**Solutions:**

1. **Add indexes**
   ```prisma
   model Trip {
     id          String   @id
     userId      String
     destination String
     startDate   DateTime
     
     @@index([userId])
     @@index([destination, startDate])
   }
   ```

2. **Optimize queries**
   ```typescript
   // Bad - N+1 query
   const trips = await prisma.trip.findMany();
   for (const trip of trips) {
     const user = await prisma.user.findUnique({
       where: { id: trip.userId }
     });
   }
   
   // Good - Single query with relation
   const trips = await prisma.trip.findMany({
     include: { user: true }
   });
   ```

3. **Use query analysis**
   ```sql
   -- Analyze query performance
   EXPLAIN ANALYZE
   SELECT * FROM trips
   WHERE destination = 'Peru'
   AND start_date > '2024-01-01';
   ```

## API Errors

### Issue: "401 Unauthorized"

**Solutions:**

1. **Check authentication token**
   ```typescript
   // Debug auth headers
   console.log('Auth header:', request.headers.get('authorization'));
   
   // Verify token
   import { getToken } from 'next-auth/jwt';
   const token = await getToken({ req });
   console.log('Token:', token);
   ```

2. **Verify NextAuth configuration**
   ```typescript
   // app/api/auth/[...nextauth]/route.ts
   export const authOptions = {
     providers: [...],
     callbacks: {
       jwt: async ({ token, user }) => {
         console.log('JWT callback:', { token, user });
         return token;
       }
     },
     debug: true, // Enable in development
   };
   ```

### Issue: "429 Rate Limited"

**Solutions:**

1. **Implement exponential backoff**
   ```typescript
   async function fetchWithRetry(url: string, options = {}, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         const response = await fetch(url, options);
         if (response.status === 429) {
           const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
           await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
           continue;
         }
         return response;
       } catch (error) {
         if (i === retries - 1) throw error;
       }
     }
   }
   ```

2. **Adjust rate limits**
   ```typescript
   // lib/middleware/rate-limit.ts
   const limiter = new RateLimiter({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Increase limit
     standardHeaders: true,
     legacyHeaders: false,
   });
   ```

### Issue: "500 Internal Server Error"

**Debug steps:**

1. **Check server logs**
   ```bash
   # Vercel logs
   vercel logs --follow
   
   # Local logs
   npm run dev 2>&1 | tee debug.log
   ```

2. **Add error boundaries**
   ```typescript
   // app/error.tsx
   'use client';
   
   export default function Error({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     console.error('Error boundary caught:', error);
     
     return (
       <div>
         <h2>Something went wrong!</h2>
         <details>
           <summary>Error details</summary>
           <pre>{error.message}</pre>
           <pre>{error.stack}</pre>
         </details>
         <button onClick={reset}>Try again</button>
       </div>
     );
   }
   ```

3. **Enable detailed logging**
   ```typescript
   // Add to API routes
   export async function POST(request: Request) {
     const startTime = Date.now();
     
     try {
       console.log('Request:', {
         url: request.url,
         method: request.method,
         headers: Object.fromEntries(request.headers),
       });
       
       // Your logic here
       
     } catch (error) {
       console.error('API Error:', {
         error,
         duration: Date.now() - startTime,
         stack: error.stack,
       });
       
       throw error;
     }
   }
   ```

## Authentication Issues

### Issue: "Session not persisting"

**Solutions:**

1. **Check cookie settings**
   ```typescript
   // app/api/auth/[...nextauth]/route.ts
   export const authOptions = {
     cookies: {
       sessionToken: {
         name: `__Secure-next-auth.session-token`,
         options: {
           httpOnly: true,
           sameSite: 'lax',
           path: '/',
           secure: process.env.NODE_ENV === 'production',
         },
       },
     },
   };
   ```

2. **Verify NEXTAUTH_URL**
   ```bash
   # Must match your domain exactly
   NEXTAUTH_URL=https://app.travelitinerary.com
   
   # For local development
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Debug session**
   ```typescript
   // In any server component
   import { getServerSession } from 'next-auth';
   
   const session = await getServerSession(authOptions);
   console.log('Session:', session);
   ```

### Issue: "OAuth callback errors"

**Solutions:**

1. **Verify callback URLs**
   ```bash
   # Check provider settings
   # Google: https://console.cloud.google.com
   # GitHub: https://github.com/settings/developers
   
   # Callback URL format:
   https://app.travelitinerary.com/api/auth/callback/provider
   ```

2. **Debug OAuth flow**
   ```typescript
   callbacks: {
     signIn: async ({ user, account, profile }) => {
       console.log('OAuth Sign In:', { user, account, profile });
       return true;
     },
   }
   ```

## Performance Problems

### Issue: "Slow API responses"

**Diagnosis:**

1. **Add timing logs**
   ```typescript
   export async function GET(request: Request) {
     const timings = {
       start: Date.now(),
       auth: 0,
       database: 0,
       processing: 0,
       total: 0,
     };
     
     // Auth
     const authStart = Date.now();
     const session = await getServerSession();
     timings.auth = Date.now() - authStart;
     
     // Database
     const dbStart = Date.now();
     const data = await prisma.trip.findMany();
     timings.database = Date.now() - dbStart;
     
     // Processing
     const procStart = Date.now();
     const processed = processData(data);
     timings.processing = Date.now() - procStart;
     
     timings.total = Date.now() - timings.start;
     
     return NextResponse.json({
       data: processed,
       _timings: process.env.NODE_ENV === 'development' ? timings : undefined,
     });
   }
   ```

2. **Profile database queries**
   ```typescript
   // Enable query logging
   const prisma = new PrismaClient({
     log: [
       { emit: 'event', level: 'query' },
     ],
   });
   
   prisma.$on('query', (e) => {
     console.log(`Query: ${e.query}`);
     console.log(`Duration: ${e.duration}ms`);
   });
   ```

### Issue: "High memory usage in development"

**Solutions:**

1. **Limit worker processes**
   ```json
   // package.json
   {
     "scripts": {
       "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
     }
   }
   ```

2. **Disable source maps in development**
   ```javascript
   // next.config.mjs
   const config = {
     productionBrowserSourceMaps: false,
     webpack: (config, { dev }) => {
       if (dev) {
         config.devtool = 'eval-cheap-module-source-map';
       }
       return config;
     },
   };
   ```

## Deployment Failures

### Issue: "Build fails on Vercel"

**Solutions:**

1. **Check build logs**
   ```bash
   # Get detailed logs
   vercel logs --follow --debug
   ```

2. **Reproduce locally**
   ```bash
   # Use same Node version as Vercel
   nvm use 18
   
   # Build with production env
   npm run build
   ```

3. **Common fixes**
   ```json
   // package.json
   {
     "scripts": {
       "build": "prisma generate && next build",
       "postinstall": "prisma generate"
     }
   }
   ```

### Issue: "Environment variables not available"

**Solutions:**

1. **Verify variable names**
   ```typescript
   // Public variables must start with NEXT_PUBLIC_
   const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✓
   const secret = process.env.API_SECRET; // ✗ (not available client-side)
   ```

2. **Check Vercel configuration**
   ```bash
   # List all env vars
   vercel env ls
   
   # Pull to local
   vercel env pull
   ```

3. **Debug in production**
   ```typescript
   // app/api/debug/env/route.ts (remove after debugging)
   export async function GET() {
     return NextResponse.json({
       nodeEnv: process.env.NODE_ENV,
       hasDatabase: !!process.env.DATABASE_URL,
       hasNextAuth: !!process.env.NEXTAUTH_SECRET,
       // Don't log actual values!
     });
   }
   ```

## Third-Party Service Issues

### Issue: "OpenAI API errors"

**Solutions:**

1. **Handle rate limits**
   ```typescript
   async function callOpenAI(prompt: string, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         const response = await openai.createCompletion({
           model: "gpt-4",
           prompt,
           max_tokens: 1000,
         });
         return response;
       } catch (error) {
         if (error.response?.status === 429) {
           const waitTime = Math.pow(2, i) * 1000;
           await new Promise(resolve => setTimeout(resolve, waitTime));
           continue;
         }
         throw error;
       }
     }
   }
   ```

2. **Implement fallbacks**
   ```typescript
   async function generateItinerary(params: any) {
     try {
       return await generateWithOpenAI(params);
     } catch (error) {
       console.error('OpenAI failed:', error);
       return await generateWithFallback(params);
     }
   }
   ```

### Issue: "Cloudinary upload failures"

**Solutions:**

1. **Verify credentials**
   ```typescript
   // Debug Cloudinary config
   console.log({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     // Don't log api_secret!
   });
   ```

2. **Handle upload errors**
   ```typescript
   import { v2 as cloudinary } from 'cloudinary';
   
   async function uploadImage(file: File) {
     try {
       const result = await cloudinary.uploader.upload(file.path, {
         folder: 'travel-itineraries',
         resource_type: 'auto',
       });
       return result;
     } catch (error) {
       console.error('Upload error:', error);
       
       // Fallback to local storage
       return await saveToLocal(file);
     }
   }
   ```

## Debug Tools & Commands

### Useful Debug Commands

```bash
# Check Node processes
ps aux | grep node

# Monitor memory usage
top -p $(pgrep -f "next dev")

# Check port usage
lsof -i :3000

# Clear all caches
rm -rf .next node_modules/.cache

# Check disk space
df -h

# Database connection test
npx prisma db execute --file test.sql

# Network diagnostics
curl -I https://api.travelitinerary.com/health
traceroute api.travelitinerary.com

# DNS check
nslookup api.travelitinerary.com
```

### Debug Environment Setup

```typescript
// lib/debug.ts
export const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
  
  time: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(label);
    }
  },
  
  trace: () => {
    if (process.env.NODE_ENV === 'development') {
      console.trace();
    }
  },
};
```

### Browser Debug Tools

```javascript
// Add to browser console
localStorage.debug = 'app:*';

// Enable React DevTools Profiler
if (typeof window !== 'undefined') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.forEach(r => {
    r.setHotReloadEnabled(true);
  });
}

// Monitor network requests
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 1000) {
      console.warn('Slow request:', entry.name, entry.duration);
    }
  });
});
observer.observe({ entryTypes: ['resource'] });
```

## Emergency Procedures

### Production Down

1. **Immediate Actions**
   ```bash
   # Check status
   curl -I https://app.travelitinerary.com
   
   # Check Vercel status
   vercel logs --follow
   
   # Rollback if needed
   vercel rollback
   ```

2. **Communication**
   - Update status page
   - Notify team via Slack
   - Post on social media if extended

3. **Investigation**
   ```bash
   # Check recent deployments
   vercel list --prod
   
   # Review recent commits
   git log --oneline -10
   
   # Check monitoring
   # Visit monitoring dashboard
   ```

### Data Loss Prevention

1. **Immediate backup**
   ```bash
   # Emergency database backup
   pg_dump $DATABASE_URL > emergency-backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Verify backup**
   ```bash
   # Test restore to dev
   psql $DEV_DATABASE_URL < emergency-backup.sql
   ```

### Security Incident

1. **Isolate**
   ```bash
   # Revoke compromised keys
   vercel env rm COMPROMISED_KEY production
   
   # Rotate secrets
   openssl rand -base64 32 # Generate new secret
   ```

2. **Audit**
   ```bash
   # Check access logs
   vercel logs --since 24h | grep -E "unauthorized|forbidden|hack"
   
   # Review user activity
   ```

## Support Contacts

### Internal Support

- **Development Team**: dev@travelitinerary.com
- **DevOps Team**: devops@travelitinerary.com
- **Emergency Hotline**: +1-xxx-xxx-xxxx

### External Support

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **OpenAI Support**: https://help.openai.com

### Escalation Path

1. Check documentation and this guide
2. Search error in project issues
3. Ask in team Slack channel
4. Contact team lead
5. Open support ticket with vendor
6. Emergency hotline (production issues only)

## Appendix

### Error Code Reference

| Code | Meaning | Common Cause | Solution |
|------|---------|--------------|----------|
| ECONNREFUSED | Connection refused | Service down | Check service status |
| ETIMEDOUT | Request timeout | Network issue | Retry with backoff |
| ENOTFOUND | DNS lookup failed | Wrong URL | Verify configuration |
| ERR_MODULE_NOT_FOUND | Missing module | Bad import | Check import path |
| P2002 | Unique constraint | Duplicate data | Handle in code |
| P2025 | Record not found | Missing data | Add existence check |

### Useful Resources

- [Next.js Error Reference](https://nextjs.org/docs/messages)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [Vercel Error Codes](https://vercel.com/docs/errors)
- [TypeScript Error Messages](https://typescript.tv/errors/)

Remember: When in doubt, check the logs!