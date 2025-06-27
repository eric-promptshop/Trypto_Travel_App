# Component to Backend Service Mapping

## Core AI Travel Planning Components

### 1. AI Request Form & Itinerary Generation
**Component**: `components/ai-request-form.tsx`
**Backend Services**:
- `/api/ai/chat/v2` - AI chat interactions
- `/api/generate-itinerary` - Main itinerary generation
- `/api/trips-ai/generate` - Alternative AI generation endpoint
- `/api/form-chat` - Form-based chat interactions
- `/api/ai/parse-travel-query` - Parse natural language queries

### 2. Voice Input Components
**Components**: 
- `components/voice/VoiceInputButton.tsx`
- `components/voice/VoiceInputModal.tsx`
- `components/voice/VoiceItineraryInput.tsx`
**Backend Services**:
- `/api/voice/parse` - Parse voice input to travel preferences

### 3. Itinerary Display & Management
**Components**:
- `components/itinerary/EnhancedItineraryViewer.tsx`
- `components/itinerary/ConnectedItineraryViewer.tsx`
- `components/itinerary/TimelineWithImagesV2.tsx`
**Backend Services**:
- `/api/trips/[id]/itinerary` - Get/update specific itinerary
- `/api/trips` - Manage trips
- `/api/ai/magic-edit` - AI-powered itinerary editing

### 4. Maps & Places Integration
**Components**:
- `components/GoogleMapCanvas.tsx`
- `components/LeafletMapLoader.tsx`
- `components/ModernExploreSidebar.tsx`
**Backend Services**:
- `/api/places/search` - Google Places search
- `/api/places/autocomplete` - Place autocomplete
- `/api/places/discover` - Discover nearby places
- `/api/geocoding` - Address geocoding
- `/api/maps/config` - Maps configuration

### 5. Tour Operator Dashboard
**Components**:
- `components/tour-operator/TourOperatorDashboard.tsx`
- `components/operator/TourAnalyticsDashboard.tsx`
**Backend Services**:
- `/api/tour-operator/tours` - Manage tours
- `/api/tour-operator/stats` - Tour statistics
- `/api/operators/[operatorId]` - Operator management
- `/api/operators/[operatorId]/stats` - Operator analytics

### 6. Lead Generation & Management
**Components**:
- `components/LeadGenerationPopup.tsx`
- `components/leads/LeadManagementDashboard.tsx`
**Backend Services**:
- `/api/leads/capture` - Capture new leads
- `/api/leads/enhanced` - Enhanced lead management
- `/api/leads/notify` - Lead notifications
- `/api/tours/generate-lead` - Generate leads from tour views

### 7. Admin & White Label Management
**Components**:
- `components/admin/AdminDashboard.tsx`
- `components/admin/ThemeCustomizerConnected.tsx`
- `components/admin/DeploymentManager.tsx`
**Backend Services**:
- `/api/admin/themes` - Theme management
- `/api/admin/deploy` - Deployment management
- `/api/admin/clients` - Client management
- `/api/admin/domains` - Domain management

### 8. Integrations Hub
**Components**:
- `components/integrations/IntegrationHub.tsx`
**Backend Services**:
- `/api/integrations` - List integrations
- `/api/integrations/crm/auth/[provider]` - CRM authentication
- `/api/integrations/crm/webhook/[connectionId]` - CRM webhooks

### 9. Analytics & Monitoring
**Components**:
- `components/analytics/AnalyticsDashboard.tsx`
- `components/performance/performance-monitor.tsx`
**Backend Services**:
- `/api/analytics/track` - Track events
- `/api/analytics/identify` - Identify users
- `/api/monitoring/metrics` - Performance metrics

### 10. Content Import & Processing
**Components**:
- `components/onboarding/screens/content-import-screen.tsx`
- `components/tour-operator/TourImportModal.tsx`
**Backend Services**:
- `/api/content/scan` - Scan and import content
- `/api/tour-operator/tours/import` - Import tours
- `/api/tour-operator/tours/scrape` - Scrape tour data
- `/api/extract-form-data` - Extract form data from content

### 11. Sharing & Collaboration
**Components**:
- `components/ShareItineraryModal.tsx`
**Backend Services**:
- `/api/share/email` - Email sharing

### 12. Widget Builder
**Components**:
- `components/widget-builder/WidgetBuilder.tsx`
**Backend Services**:
- `/api/widgets` - Widget management
- `/api/widgets/analytics` - Widget analytics

## Service Dependencies

### External Services:
1. **OpenAI** - All AI generation endpoints proxy to OpenAI
2. **Google Places API** - All places/maps endpoints
3. **Replicate** - Additional AI features
4. **Supabase** - Database, auth, and storage
5. **Email Services** - For lead notifications and sharing

### Internal Services:
1. **Redis Cache** - Used by AI generation services
2. **Performance Monitor** - Tracks API performance
3. **Analytics Service** - Tracks user behavior