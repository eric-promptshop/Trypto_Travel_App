# Tour Feature Deployment Checklist

## Pre-Deployment Verification

### 1. Database Setup
- [ ] Ensure Content table has all required fields for tours
  - [ ] `operatorId` field exists
  - [ ] `metadata` JSON field can store tour details
  - [ ] `featured` boolean field exists
  - [ ] `instantBooking` boolean field exists
- [ ] Verify indexes on frequently queried fields
  - [ ] Index on `type` + `active`
  - [ ] Index on `location`, `city`, `country`
  - [ ] Index on `featured`
- [ ] Run database migrations if needed

### 2. Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` is set correctly
- [ ] `DATABASE_URL` points to production database
- [ ] API keys are configured:
  - [ ] `GOOGLE_PLACES_API_KEY` (if using Google Places)
  - [ ] Analytics tracking keys
  - [ ] Image service API keys

### 3. Tour Data Import
- [ ] Run tour metadata enhancement script: `npm run enhance-tours`
- [ ] Verify at least 50 tours have complete metadata
- [ ] Ensure tour images are properly stored/referenced
- [ ] Check that operator information is populated

## Feature Testing Checklist

### 1. Tour Discovery Panel
- [ ] Tours appear in the itinerary builder sidebar
- [ ] "Verified Tour" badges display correctly
- [ ] Instant booking indicators work
- [ ] Tours can be added to itinerary
- [ ] Lead generation triggers when adding tours
- [ ] "Browse More Tours" button links correctly

### 2. Tour Template Library (/tours)
- [ ] Page loads without errors
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Price range filtering works
- [ ] Sort options work correctly
- [ ] Pagination functions properly
- [ ] Tours display with correct information
- [ ] Mobile responsive design works
- [ ] Analytics tracking fires correctly

### 3. Tour Detail Pages (/tours/[tourId])
- [ ] Individual tour pages load
- [ ] Image gallery works with navigation
- [ ] Tour information displays correctly
- [ ] Booking card shows pricing
- [ ] "Add to Trip Planner" button works
- [ ] "Contact Operator" generates leads
- [ ] Mobile layout is optimized
- [ ] Structured data is present in page source

### 4. Integration Flow
- [ ] Selecting tour from library → redirects to planner
- [ ] Tour pre-populates in itinerary
- [ ] Lead capture works at all touchpoints:
  - [ ] Tour card clicks
  - [ ] Favorite button
  - [ ] Share functionality
  - [ ] Start planning button
  - [ ] Contact operator

### 5. Performance
- [ ] Page load time < 3 seconds
- [ ] Images lazy load properly
- [ ] Search debouncing works
- [ ] No JavaScript errors in console
- [ ] Network requests are optimized

### 6. SEO & Analytics
- [ ] Meta tags are present on all pages
- [ ] Structured data validates in testing tools
- [ ] Analytics events fire correctly:
  - [ ] Page views
  - [ ] Tour interactions
  - [ ] Search events
  - [ ] Filter changes
  - [ ] Lead generation

### 7. Error Handling
- [ ] 404 pages for invalid tour IDs
- [ ] Graceful fallbacks for missing images
- [ ] API error messages are user-friendly
- [ ] Rate limiting prevents abuse
- [ ] Network failures handled gracefully

## API Endpoints Verification

### 1. Tour Discovery API
```
POST /api/tours/discover
- [ ] Returns operator tours
- [ ] Filters by destination
- [ ] Sorts by relevance
- [ ] Handles missing parameters
```

### 2. Public Tours API
```
GET /api/tours/public
- [ ] Pagination works
- [ ] Search functionality works
- [ ] Filtering by category/price/duration
- [ ] Sorting options work
- [ ] Returns proper error codes
```

### 3. Tour Detail API
```
GET /api/tours/[tourId]
- [ ] Returns complete tour data
- [ ] Handles invalid IDs
- [ ] Includes all metadata fields
```

### 4. Lead Generation API
```
POST /api/tours/generate-lead
- [ ] Creates leads successfully
- [ ] Validates required fields
- [ ] Handles different lead sources
- [ ] Stores interaction types
```

## Production Deployment Steps

1. **Pre-deployment**
   - [ ] Run full test suite: `npm test`
   - [ ] Build production bundle: `npm run build`
   - [ ] Test production build locally: `npm start`
   - [ ] Review bundle size report

2. **Database Updates**
   - [ ] Backup production database
   - [ ] Run migrations (if any)
   - [ ] Verify tour data integrity

3. **Deployment**
   - [ ] Deploy to staging environment first
   - [ ] Run smoke tests on staging
   - [ ] Deploy to production
   - [ ] Clear CDN cache
   - [ ] Verify deployment successful

4. **Post-deployment**
   - [ ] Monitor error logs for 30 minutes
   - [ ] Check analytics data flowing
   - [ ] Verify lead generation working
   - [ ] Test critical user flows
   - [ ] Monitor performance metrics

## Rollback Plan

If issues arise:
1. [ ] Revert to previous deployment
2. [ ] Clear CDN cache
3. [ ] Restore database backup if needed
4. [ ] Notify team of rollback
5. [ ] Document issues for fix

## Monitoring Setup

- [ ] Set up alerts for:
  - [ ] API error rates > 5%
  - [ ] Page load time > 5 seconds
  - [ ] Lead generation failures
  - [ ] Database query timeouts
- [ ] Dashboard for:
  - [ ] Tour view metrics
  - [ ] Lead generation counts
  - [ ] Search query analytics
  - [ ] Conversion funnel

## Documentation Updates

- [ ] Update API documentation
- [ ] Create operator onboarding guide
- [ ] Document tour import process
- [ ] Update user guide with tour features
- [ ] Create troubleshooting guide

## Communication

- [ ] Notify tour operators of launch
- [ ] Update marketing materials
- [ ] Prepare launch announcement
- [ ] Brief support team on new features
- [ ] Schedule follow-up review meeting

---

**Sign-off Required:**
- [ ] Technical Lead: _________________
- [ ] Product Manager: _______________
- [ ] QA Lead: ______________________
- [ ] Operations: ___________________

**Deployment Date:** _________________
**Deployed By:** ____________________