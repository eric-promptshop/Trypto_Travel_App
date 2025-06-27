# MVP End-to-End Test Plan

## Overview
This document outlines the testing procedures for the TripNav AI MVP, covering both the traveler and tour operator experiences.

## Test Environment Setup

### Prerequisites
1. Local development environment running (`npm run dev`)
2. Environment variables configured (see `.env.example`)
3. Database initialized with Prisma
4. Test accounts available:
   - Traveler: `demo@example.com` / `demo123`
   - Operator: `demo-operator@example.com` / `demo123`

### Browser Requirements
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Test Scenarios

### 1. Traveler Flow

#### 1.1 Landing Page Experience
- [ ] Navigate to homepage (`http://localhost:3000`)
- [ ] Verify hero section loads with AI search
- [ ] Check responsive design on mobile/tablet
- [ ] Verify footer links work

#### 1.2 AI Trip Planning
- [ ] Click on AI search/chat interface
- [ ] Enter trip query: "5 day family trip to Paris in June"
- [ ] Verify AI responds with suggestions
- [ ] Check that suggestions are relevant
- [ ] Test category filters work
- [ ] Verify search functionality

#### 1.3 Itinerary Builder
- [ ] Navigate to `/plan`
- [ ] Create new itinerary
- [ ] Set destination and dates
- [ ] Add activities from AI suggestions
- [ ] Drag and drop to reorder activities
- [ ] Test time slot management
- [ ] Save itinerary

#### 1.4 Lead Generation
- [ ] Interact with tour suggestions
- [ ] Fill out interest form
- [ ] Submit lead without creating account
- [ ] Verify success message

### 2. Tour Operator Flow

#### 2.1 Operator Registration
- [ ] Navigate to `/auth/operator/signup`
- [ ] Fill out multi-step registration:
  - Basic information
  - Business details
  - Address and timezone
- [ ] Accept terms and conditions
- [ ] Submit registration
- [ ] Verify welcome email (check console in dev)

#### 2.2 Operator Sign In
- [ ] Navigate to `/auth/operator/signin`
- [ ] Sign in with demo operator account
- [ ] Verify redirect to operator dashboard
- [ ] Check session persistence

#### 2.3 Operator Dashboard
- [ ] Navigate to `/operator/dashboard`
- [ ] Verify stats cards display
- [ ] Check tabs functionality:
  - Tours tab
  - Templates tab
  - Bookings tab
  - Analytics tab
  - Settings tab

#### 2.4 Tour Management
- [ ] Click "Add New Tour" button
- [ ] Test tour creation options:
  - Upload from document
  - Import from URL
  - Create manually
- [ ] View tour list
- [ ] Edit existing tour
- [ ] Delete tour (with confirmation)

#### 2.5 Tour Templates
- [ ] Navigate to Templates tab
- [ ] Click "View Full Library"
- [ ] Verify templates page loads (`/operator/templates`)
- [ ] Test search and filters
- [ ] Use a template
- [ ] Verify template categories

#### 2.6 Lead Notifications
- [ ] Create a test lead (from traveler flow)
- [ ] Check email notification (console in dev)
- [ ] Verify lead appears in dashboard
- [ ] Check lead details and score

### 3. Security Tests

#### 3.1 API Key Protection
- [ ] Verify no `NEXT_PUBLIC_` API keys in browser
- [ ] Check Google Maps loads via proxy
- [ ] Test API routes require authentication
- [ ] Verify operator routes are protected

#### 3.2 Authentication
- [ ] Test login with invalid credentials
- [ ] Verify session timeout
- [ ] Check unauthorized access redirects
- [ ] Test operator-only route protection

### 4. Performance Tests

#### 4.1 Page Load Times
- [ ] Homepage < 3 seconds
- [ ] Dashboard < 3 seconds
- [ ] API responses < 2 seconds

#### 4.2 Responsive Design
- [ ] Test on mobile devices
- [ ] Check tablet layouts
- [ ] Verify touch interactions work

### 5. Integration Tests

#### 5.1 Google Maps/Places
- [ ] Map displays correctly
- [ ] Place search returns results
- [ ] POI details load
- [ ] Geocoding works

#### 5.2 AI Features
- [ ] Chat interface responds
- [ ] Tour scraping works (if Replicate configured)
- [ ] Recommendations are relevant

#### 5.3 Email Service
- [ ] Welcome emails send (or log to console)
- [ ] Lead notifications work
- [ ] Email templates render correctly

## Test Data

### Sample Tours
```json
{
  "name": "Sunset Eiffel Tower Tour",
  "destination": "Paris, France",
  "duration": "3 hours",
  "price": 75,
  "description": "Experience Paris at its most romantic"
}
```

### Sample Lead
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "destination": "Paris",
  "travelDates": "June 15-20, 2024",
  "travelers": 4,
  "interests": ["Culture", "Food", "History"]
}
```

## Known Issues / Limitations

1. **Email Service**: In development, emails log to console instead of sending
2. **Payment Processing**: Not implemented in MVP
3. **Real-time Updates**: WebSocket features planned for future
4. **Multi-language**: Currently English only
5. **Offline Support**: Not available in MVP

## Bug Reporting

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/device info
5. Console errors (if any)
6. Screenshots

## Success Criteria

The MVP is considered ready when:
- [ ] All critical user flows work without errors
- [ ] No security vulnerabilities (exposed keys, unprotected routes)
- [ ] Performance meets targets (< 3s page loads)
- [ ] Mobile experience is functional
- [ ] Lead capture and notifications work
- [ ] Operator can manage tours successfully

## Future Testing

Post-MVP testing should include:
- Load testing (100+ concurrent users)
- Accessibility testing (WCAG 2.1 compliance)
- Cross-browser compatibility
- Internationalization
- Payment flow testing
- API rate limiting verification