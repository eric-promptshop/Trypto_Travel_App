# MVP Refactor Plan: AI Travel Planner

## Overview
This plan outlines a systematic refactor to achieve a secure, focused MVP that validates the core value proposition: connecting tour operators with travelers through an AI-powered platform.

## Phase 1: Critical Security Fixes (Week 1)

### 1.1 Remove Exposed API Keys
**Problem**: API keys exposed via NEXT_PUBLIC_ prefix can be stolen and misused.

**Files to Update**:
- `.env.local` - Remove NEXT_PUBLIC_ prefix from:
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → `GOOGLE_MAPS_API_KEY`
  - `NEXT_PUBLIC_MAPBOX_TOKEN` → `MAPBOX_TOKEN`
  - Keep only: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (safe for client)
  - Keep: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (designed for client use)

### 1.2 Create Server-Side API Proxy Routes
**New API Routes to Create**:
- `/api/maps/config` - Returns Google Maps config with server-injected API key
- `/api/places/search` - Proxy for Google Places searches
- `/api/geocoding` - Proxy for geocoding requests
- `/api/mapbox/search` - Proxy for Mapbox geocoding

**Components to Update**:
- `components/GoogleMapCanvas.tsx` - Use server-side API key injection
- `lib/services/google-places.ts` - Route through proxy
- `lib/services/geocoding-service.ts` - Use proxy endpoints

### 1.3 Add Authentication Middleware
**Create**: `/middleware/auth.ts`
```typescript
// Protect all /api/operator/* and /api/admin/* routes
// Verify NextAuth session before allowing access
```

**Apply to Routes**:
- `/api/operator/*` - All operator endpoints
- `/api/admin/*` - All admin endpoints
- `/api/leads/*` - Lead management
- `/api/tours/create`, `/api/tours/update`, `/api/tours/delete`

## Phase 2: Component Consolidation (Week 2)

### 2.1 Itinerary Components
**Keep**:
- `components/EnhancedItineraryBuilder.tsx` - Main traveler interface
- `components/itinerary/TimelineWithImagesV2.tsx` - Primary timeline
- `components/itinerary/AIAssistantChat.tsx` - AI chat interface
- All voice components in `components/voice/*`

**Remove**:
- `components/itinerary/ModernItineraryBuilder.tsx`
- `components/itinerary/ThreeColumnItineraryBuilder.tsx`
- `components/itinerary/TimelineWithImages.tsx` (v1)
- `components/DayTimeline.tsx`
- `components/ModernDayTimeline.tsx`
- `components/itinerary/ModernTimeline.tsx`

### 2.2 Dashboard Components
**Keep**:
- `components/tour-operator/TourOperatorDashboard.tsx`
- `components/leads/LeadManagementDashboard.tsx`

**Remove**:
- `components/operator/OperatorDashboard.tsx`
- `components/operator/TourAnalyticsDashboard.tsx`
- `components/analytics/AnalyticsDashboard.tsx`

### 2.3 Search/Explore Components
**Keep**:
- `components/ModernExploreSidebar.tsx` - Primary search interface
- `components/ai-request-form.tsx` - Main AI request form

**Remove**:
- `components/ExploreSidebar.tsx`
- `components/AISearchHatbox.tsx` (keep V2)
- `components/ai-request-form-backup.tsx`

## Phase 3: Code Cleanup (Week 3)

### 3.1 Remove Test/Development Files
**Delete**:
```
- /app/test-*/* - All test directories
- test-flow.js
- test-integration.html
- test-redirect-fix.md
- phase-*-report.json
- scripts/test-*.ts
- app/page-enhanced.tsx
- app/layout-enhanced.tsx
- app/layout-original.tsx
- All *-backup.tsx files
```

### 3.2 Clean Console Statements
**Tools**: Use ESLint rule or grep to find and remove:
- `console.log()` - Replace with proper logging service
- `console.error()` - Keep only critical error logging
- `console.trace()` - Remove all
- `console.debug()` - Remove all

### 3.3 Fix TypeScript "any" Types
**Priority Files** (most critical for MVP):
- API route handlers
- Authentication logic
- Database queries
- Component props interfaces

## Phase 4: Complete MVP Features (Weeks 4-5)

### 4.1 Operator Authentication Flow
**Create**:
- `/app/auth/operator/signin/page.tsx` - Operator sign-in page
- `/app/auth/operator/signup/page.tsx` - Operator registration
- `/lib/auth/operator-auth.ts` - Operator-specific auth logic

**Update**:
- Extend NextAuth configuration for operator role
- Add operator onboarding flow after first login

### 4.2 Tour Import & Preview System
**Enhance**:
- `/api/tour-operator/tours/scrape/route.ts` - Ensure it works with Replicate
- Add preview functionality to `TourOperatorDashboard.tsx`
- Create sandboxed preview mode for `EnhancedItineraryBuilder.tsx`

**Create**:
- `/api/operator/tours/[id]/preview/route.ts` - Preview endpoint
- Preview modal component for operator dashboard

### 4.3 Tour Template Library
**Create**:
- `/app/explore/page.tsx` - Public template library
- `/app/explore/[tourId]/page.tsx` - Individual tour template pages
- `/components/tour-templates/TemplateCard.tsx`
- `/components/tour-templates/TemplateGrid.tsx`

**API**:
- `/api/tours/templates/route.ts` - Public endpoint for published tours

### 4.4 Lead Generation & Notifications
**Integrate**:
- Email service (Resend or SendGrid) in `/lib/email/`
- Lead capture webhook in Supabase
- Email templates for lead notifications

**Create**:
- `/api/leads/notify/route.ts` - Send email notifications
- Email templates in `/lib/email/templates/`

## Phase 5: Testing & Validation (Week 6)

### 5.1 End-to-End Testing Checklist
1. **Operator Flow**:
   - [ ] Sign up as new operator
   - [ ] Import tours from demo website
   - [ ] Preview tour in AI Canvas
   - [ ] Publish tour as template
   - [ ] View in dashboard

2. **Traveler Flow**:
   - [ ] Browse tour template library
   - [ ] Select tour template
   - [ ] Use voice/AI chat to customize
   - [ ] Save itinerary
   - [ ] Trigger lead generation

3. **Lead Flow**:
   - [ ] Lead appears in operator dashboard
   - [ ] Email notification sent
   - [ ] Lead details include full context

### 5.2 Performance Optimization
- Add React.memo to heavy components
- Implement lazy loading for routes
- Add request caching for API calls
- Optimize bundle size

## Implementation Order

1. **Week 1**: Security fixes (Phase 1)
2. **Week 2**: Component consolidation (Phase 2)
3. **Week 3**: Code cleanup (Phase 3)
4. **Weeks 4-5**: MVP features (Phase 4)
5. **Week 6**: Testing & optimization (Phase 5)

## Success Criteria

The MVP is complete when:
1. All API keys are secure and not exposed client-side
2. Operator can import tours from their website
3. Operator can preview tours before publishing
4. Published tours appear in template library
5. Travelers can select templates and customize
6. Leads are captured and operators notified
7. No console statements in production
8. No TypeScript "any" in critical paths
9. All duplicate components removed
10. End-to-end flow works smoothly

## Files to Keep for MVP

### Core Components
- EnhancedItineraryBuilder.tsx
- TourOperatorDashboard.tsx
- ModernExploreSidebar.tsx
- LeadManagementDashboard.tsx
- All voice components
- AIAssistantChat.tsx

### API Routes
- /api/generate-itinerary
- /api/tour-operator/tours/*
- /api/leads/*
- /api/places/* (secured)
- /api/operators/*

### Services
- lib/services/itinerary-converter.ts
- lib/services/lead-service.ts
- lib/services/operator-service.ts
- lib/services/recommendation-engine.ts

### State Management
- store/planStore.ts (clean up console.logs)

This focused refactor will deliver a secure, clean MVP that validates the core business model while maintaining the voice and AI chat features for an enhanced traveler experience.