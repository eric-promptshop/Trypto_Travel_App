# Component Consolidation Plan

## Overview
This plan will help you consolidate duplicate components, choosing the best implementation for production while safely removing unused code.

## Step 1: Identify Your Core Use Case

Before consolidating, answer these questions:
1. Are you building a B2C travel planning app or B2B tour operator platform?
2. Do you need multi-tenant/white-label functionality?
3. Is AI-powered trip generation core to your product?
4. Do you need real-time collaboration features?
5. What's your primary user interaction model (chat-based, form-based, visual builder)?

## Step 2: Component Consolidation Strategy

### 🔴 CRITICAL PATH - Itinerary Components

**KEEP:** 
- `components/itinerary/ModernItineraryViewer.tsx` - Your primary itinerary display
- `components/itinerary/ConnectedItineraryViewer.tsx` - For API integration

**DELETE:**
- `components/itinerary-builder.tsx` - Just a re-export file
- `components/itinerary-builder-legacy-wrapper.tsx` - Remove unless you have legacy data

**REFACTOR:**
```typescript
// Create a single entry point: components/itinerary/index.ts
export { ModernItineraryViewer as ItineraryViewer } from './ModernItineraryViewer'
export { ConnectedItineraryViewer } from './ConnectedItineraryViewer'
export { ActivityManager } from './ActivityManager'

// Update all imports to use the new structure
// Old: import ItineraryBuilder from '@/components/itinerary-builder'
// New: import { ItineraryViewer } from '@/components/itinerary'
```

### 🟡 HIGH PRIORITY - Form Components

**For AI-Chat Based Experience (Recommended):**
- **KEEP:** `components/ai-request-form-enhanced.tsx` - Cleaner, simpler implementation
- **DELETE:** `components/ai-request-form.tsx` - Overly complex original version

**For Traditional Form Experience:**
- **KEEP:** `components/travel-forms/*` - Modular form components
- **ENHANCE:** Create a unified form using the modular components

**Migration Path:**
```typescript
// 1. Rename enhanced version to be the primary
mv components/ai-request-form-enhanced.tsx components/ai-request-form.tsx

// 2. Create feature flags for gradual migration
const useEnhancedForm = process.env.NEXT_PUBLIC_USE_ENHANCED_FORMS === 'true'

// 3. Update imports gradually
```

### 🟢 MEDIUM PRIORITY - Dashboard Components

**Production Setup:**
```typescript
// Keep these dashboards for different user types:
- components/trips/TripDashboard.tsx       → Main user dashboard
- components/admin/AdminDashboard.tsx     → Admin users only
- components/analytics/AnalyticsDashboard.tsx → Analytics view

// Delete these:
- components/dashboard/TravelDashboard.tsx → Redundant with TripDashboard
- components/mobile-audit/mobile-audit-dashboard.tsx → Dev tool only
```

### 🔵 LOW PRIORITY - Demo/Showcase Pages

**Quick Cleanup:**
```bash
# Move all demo pages to a separate folder that's excluded from production
mkdir app/(development)
mv app/demo app/(development)/
mv app/ui-showcase* app/(development)/

# Update next.config.mjs to exclude in production
if (process.env.NODE_ENV === 'production') {
  config.exclude = ['app/(development)/**/*']
}
```

## Step 3: Safe Deletion Process

### 1. Create a Deprecation Branch
```bash
git checkout -b feature/component-consolidation
```

### 2. Mark Components as Deprecated First
```typescript
// Add to components you plan to remove
/**
 * @deprecated Use {@link ModernItineraryViewer} instead
 * This component will be removed in the next major version
 */
export default function LegacyItineraryBuilder() {
  console.warn('LegacyItineraryBuilder is deprecated')
  // existing code
}
```

### 3. Find All Usages
```bash
# Create a script to find component usage
cat > scripts/find-component-usage.sh << 'EOF'
#!/bin/bash
COMPONENT=$1
echo "Finding usage of: $COMPONENT"
grep -r "$COMPONENT" app/ components/ --include="*.tsx" --include="*.ts" | grep -v node_modules
EOF

chmod +x scripts/find-component-usage.sh

# Run for each component
./scripts/find-component-usage.sh "ItineraryBuilder"
./scripts/find-component-usage.sh "ai-request-form"
```

### 4. Update Imports Systematically
```typescript
// Create a codemod script: scripts/update-imports.ts
import { Project } from 'ts-morph'

const project = new Project()
project.addSourceFilesAtPaths('app/**/*.{ts,tsx}')
project.addSourceFilesAtPaths('components/**/*.{ts,tsx}')

const sourceFiles = project.getSourceFiles()

const importMappings = {
  '@/components/itinerary-builder': '@/components/itinerary',
  'ItineraryBuilder': 'ItineraryViewer',
  // Add more mappings
}

sourceFiles.forEach(sourceFile => {
  // Update imports
  sourceFile.getImportDeclarations().forEach(importDecl => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()
    Object.entries(importMappings).forEach(([oldImport, newImport]) => {
      if (moduleSpecifier.includes(oldImport)) {
        importDecl.setModuleSpecifier(moduleSpecifier.replace(oldImport, newImport))
      }
    })
  })
  
  sourceFile.save()
})
```

## Step 4: Component Merger Strategy

### For Similar Components with Different Features

**Example: Merging AI Request Forms**
```typescript
// components/ai-request-form/index.tsx
interface AIRequestFormProps {
  variant?: 'simple' | 'advanced'
  features?: {
    voice?: boolean
    progressPanel?: boolean
    mobileNav?: boolean
  }
}

export function AIRequestForm({ 
  variant = 'simple',
  features = {} 
}: AIRequestFormProps) {
  // Conditionally include features
  const showVoice = features.voice ?? variant === 'advanced'
  const showProgress = features.progressPanel ?? variant === 'advanced'
  
  return (
    <div>
      {/* Core chat interface - always shown */}
      <ChatInterface />
      
      {/* Optional features */}
      {showVoice && <VoiceInput />}
      {showProgress && <ProgressPanel />}
    </div>
  )
}
```

### For Overlapping Trip Management Components

**Consolidate into a single system:**
```typescript
// components/trip-management/index.ts
export * from './TripDashboard'        // Main dashboard
export * from './TripCustomizer'       // Combines all customization
export * from './ActivityManager'      // Activity CRUD
export * from './AccommodationPicker'  // Accommodation selection
export * from './PricingCalculator'    // All pricing logic

// Remove duplicate timeline components, keep best one
export { DragDropTimeline as Timeline } from './Timeline'
```

## Step 5: Testing During Consolidation

### 1. Create Component Tests Before Deletion
```typescript
// __tests__/components/migration.test.tsx
describe('Component Migration', () => {
  it('ModernItineraryViewer renders same as LegacyBuilder', () => {
    const testData = { /* test data */ }
    
    const { container: legacy } = render(<LegacyBuilder data={testData} />)
    const { container: modern } = render(<ModernViewer data={testData} />)
    
    // Compare key elements exist
    expect(modern.querySelector('.itinerary')).toBeTruthy()
  })
})
```

### 2. Add Console Warnings
```typescript
// In components you're deprecating
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ ${ComponentName} is deprecated and will be removed. ` +
      `Please use ${ReplacementName} instead.`
    )
  }
}, [])
```

## Step 6: Cleanup Checklist

### Before Deleting Each Component:
- [ ] Find all imports and usages
- [ ] Update all imports to new component
- [ ] Test all affected pages/features
- [ ] Check for CSS/style dependencies
- [ ] Look for related test files
- [ ] Search for string references in comments/docs
- [ ] Verify no dynamic imports use the component

### Safe Deletion Commands:
```bash
# 1. Move to archive first (safer than immediate deletion)
mkdir -p .archive/components
mv components/old-component.tsx .archive/components/

# 2. Run the app and test
npm run dev

# 3. If everything works, commit
git add -A
git commit -m "Archive deprecated components"

# 4. After a sprint, permanently delete
rm -rf .archive
```

## Step 7: Final Production Structure

```
components/
├── itinerary/
│   ├── index.ts              # Public API
│   ├── ItineraryViewer.tsx   # Main viewer
│   ├── ActivityManager.tsx   # Activity CRUD
│   └── __tests__/
├── forms/
│   ├── AIRequestForm.tsx     # Unified AI form
│   ├── TravelForm.tsx        # Traditional form
│   └── components/           # Shared form components
├── trip-management/
│   ├── TripDashboard.tsx     # Main dashboard
│   ├── TripCustomizer.tsx    # All customization
│   └── PricingEngine.tsx     # Pricing logic
└── shared/
    ├── ui/                   # Your existing ui components
    └── layouts/              # Shared layouts
```

## Implementation Timeline

### Week 1: Analysis & Planning
- Map all component dependencies
- Identify which components are actually used in production
- Create deprecation notices

### Week 2: Core Components
- Consolidate itinerary components
- Merge form implementations
- Update all imports

### Week 3: Feature Components  
- Consolidate trip management
- Clean up dashboards
- Remove demo pages

### Week 4: Testing & Cleanup
- Run full test suite
- Performance testing
- Final cleanup and documentation

## Monitoring Success

Track these metrics before and after:
- Bundle size reduction
- Build time improvement
- Type checking speed
- Developer confusion (survey team)
- Bug reports related to wrong component usage

This consolidation should reduce your codebase by ~30-40% and significantly improve maintainability.