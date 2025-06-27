# Immediate Action Plan for Production Readiness

## Week 1: Critical Infrastructure Fixes

### Day 1-2: Fix Build & Deployment Issues
```bash
# 1. Fix webpack memory issues
- Optimize next.config.mjs for production builds
- Implement proper code splitting
- Remove development-only dependencies from production build

# 2. Fix ChunkLoadError
- Review and fix dynamic imports
- Implement proper error boundaries
- Add chunk retry logic
```

### Day 3-4: Fix Health Check & Monitoring
```typescript
// Fix health check endpoint
- Investigate 503 status issue
- Implement proper health checks for:
  - Database connectivity
  - Redis connectivity
  - External API availability
  - Memory/CPU usage
```

### Day 5: Environment & Security Setup
```env
# Production environment variables needed:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
REDIS_URL=
EMAIL_SERVICE_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

## Week 2: Core Service Integration

### Redis Cache Implementation
```typescript
// lib/cache/redis-cache.ts
- Connect to Redis instance
- Implement caching for:
  - AI-generated itineraries
  - Google Places results
  - User sessions
  - API rate limiting
```

### OpenAI Integration Hardening
```typescript
// lib/ai/enhanced-itinerary-generator.ts
- Add retry logic with exponential backoff
- Implement streaming responses
- Add cost tracking per request
- Cache responses by preference hash
```

### Email Service Setup
```typescript
// lib/email/email-service.ts
- Configure SendGrid/AWS SES
- Implement email templates:
  - Welcome email
  - Lead notification
  - Trip sharing
  - Password reset
```

## Week 3: Security Implementation

### API Security
```typescript
// middleware/security.ts
export const securityMiddleware = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  },
  
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  },
};
```

### Authentication Enhancement
```typescript
// lib/auth/config.ts
- Implement refresh token rotation
- Add session validation middleware
- Implement 2FA for operators
- Add OAuth providers
```

## Week 4: Database & Performance

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_operators_email ON operators(email);
CREATE INDEX idx_leads_operator_id_status ON leads(operator_id, status);

-- Add composite indexes for complex queries
CREATE INDEX idx_itinerary_items_trip_date ON itinerary_items(trip_id, date, order_index);
```

### API Performance
```typescript
// Implement database connection pooling
// lib/db/connection-pool.ts
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add query result caching
// lib/db/cached-queries.ts
const getCachedTrips = cache.wrap(
  'trips:user:',
  async (userId: string) => {
    return await db.trips.findMany({ where: { userId } });
  },
  { ttl: 300 } // 5 minutes
);
```

## Critical Configuration Files

### 1. Production Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 3. Monitoring Setup
```typescript
// lib/monitoring/setup.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

## Testing Requirements

### 1. Critical E2E Tests
```typescript
// tests/e2e/critical-flows.spec.ts
test('User can create itinerary', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="destination"]', 'Paris');
  await page.click('[data-testid="generate-itinerary"]');
  await expect(page.locator('[data-testid="itinerary-canvas"]')).toBeVisible();
});

test('Operator can import tours', async ({ page }) => {
  await loginAsOperator(page);
  await page.goto('/operator/tours/import');
  await page.fill('[data-testid="website-url"]', 'https://example-tours.com');
  await page.click('[data-testid="import-tours"]');
  await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
});
```

### 2. Load Testing Script
```javascript
// tests/load/k6-script.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  const res = http.get('https://your-app.com/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Success Criteria for Go-Live

### Technical Criteria
- [ ] All P0 issues resolved
- [ ] 80% test coverage
- [ ] Load test passing (1000 concurrent users)
- [ ] Security audit passed
- [ ] Zero critical vulnerabilities
- [ ] API response time p95 < 500ms
- [ ] Error rate < 0.1%

### Business Criteria
- [ ] 10 beta operators onboarded
- [ ] 100 test itineraries created
- [ ] Lead capture flow tested E2E
- [ ] Payment processing tested (sandbox)
- [ ] Support documentation complete

### Operational Criteria
- [ ] 24/7 monitoring configured
- [ ] Incident response plan documented
- [ ] Backup/restore tested
- [ ] Rollback procedure tested
- [ ] On-call rotation established

## Next Steps
1. Assign team members to each week's tasks
2. Set up daily standup to track progress
3. Create Jira/Linear tickets for each item
4. Schedule security audit for Week 5
5. Plan beta launch for Week 6