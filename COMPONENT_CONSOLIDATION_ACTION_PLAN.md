# Component Consolidation Action Plan

Based on your B2C travel planning app with AI and multi-tenant white-label requirements, here's your prioritized action plan:

## Phase 1: Critical Consolidations (Week 1)

### 1. Button Component Consolidation
**Impact**: High - 82 files need updating
```bash
# Run the automated consolidation script
npx ts-node scripts/consolidate-buttons.ts

# Verify the changes
npm run dev
npm test
```

### 2. AI Request Forms
**Keep**: `ai-request-form-enhanced.tsx`
**Delete**: `ai-request-form.tsx`

```bash
# Update imports
find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "ai-request-form" | grep -v enhanced

# Move old form to archive
mv components/ai-request-form.tsx .archive/components/

# Rename enhanced to be primary
mv components/ai-request-form-enhanced.tsx components/ai-request-form.tsx
```

### 3. Itinerary System Cleanup
```bash
# Archive the wrapper
mv components/itinerary-builder.tsx .archive/components/
mv components/itinerary-builder-legacy-wrapper.tsx .archive/components/

# Update the index export
echo 'export { ModernItineraryViewer as ItineraryViewer } from "./ModernItineraryViewer"
export { ConnectedItineraryViewer } from "./ConnectedItineraryViewer"
export { ActivityManager } from "./ActivityManager"' > components/itinerary/index.ts
```

## Phase 2: Remove Dead Components (Week 1-2)

### Safe to Delete Immediately (233KB savings):
```bash
# UI Components (unused)
mv components/ui/accordion.tsx .archive/components/ui/
mv components/ui/alert-dialog.tsx .archive/components/ui/
mv components/ui/breadcrumb.tsx .archive/components/ui/
mv components/ui/carousel.tsx .archive/components/ui/
mv components/ui/context-menu.tsx .archive/components/ui/
mv components/ui/drawer.tsx .archive/components/ui/
mv components/ui/hover-card.tsx .archive/components/ui/
mv components/ui/input-otp.tsx .archive/components/ui/
mv components/ui/menubar.tsx .archive/components/ui/
mv components/ui/navigation-menu.tsx .archive/components/ui/
mv components/ui/pagination.tsx .archive/components/ui/
mv components/ui/resizable.tsx .archive/components/ui/
mv components/ui/skip-link.tsx .archive/components/ui/
mv components/ui/toaster.tsx .archive/components/ui/
mv components/ui/toggle-group.tsx .archive/components/ui/

# Admin components (unused)
mv components/admin/ContentManagement.tsx .archive/components/admin/
mv components/admin/RoleManagement.tsx .archive/components/admin/

# Demo components
mv components/flight-display/flight-display-demo.tsx .archive/components/
mv components/hotel-display/hotel-display-demo.tsx .archive/components/

# Other unused
mv components/dashboard/TravelDashboard.tsx .archive/components/
mv components/sidebar.tsx .archive/components/
mv components/ui/sidebar.tsx .archive/components/ui/
mv components/landing-page.tsx .archive/components/
mv components/main-content.tsx .archive/components/
mv components/setup-instructions.tsx .archive/components/
mv components/toggle-test.tsx .archive/components/
mv components/BatterySettings.tsx .archive/components/
```

## Phase 3: Multi-Tenant Optimization (Week 2)

### Keep & Enhance for White-Label:
- ✅ `AdminDashboard.tsx` - Central admin interface
- ✅ `ThemeCustomizer.tsx` - White-label theming
- ✅ `ClientManagement.tsx` - Tour operator management  
- ✅ `DeploymentManager.tsx` - Multi-tenant deployments

### Tour Content Upload System:
- ✅ `AssetManager.tsx` - For tour images/media
- ✅ `AssetUpload.tsx` - Upload interface
- ✅ `TemplateEditor.tsx` - Tour templates

### Settings Consolidation:
```bash
# Merge duplicate OneHandedSettings
mv components/OneHandedSettings.tsx .archive/components/
# Keep only components/settings/OneHandedSettings.tsx
```

## Phase 4: Final Structure (Week 2-3)

### Target Component Structure:
```
components/
├── itinerary/           # Core itinerary system
│   ├── ItineraryViewer.tsx
│   ├── ConnectedItineraryViewer.tsx
│   └── ActivityManager.tsx
├── ai/                  # AI features
│   └── AIRequestForm.tsx
├── admin/               # White-label admin
│   ├── AdminDashboard.tsx
│   ├── ThemeCustomizer.tsx
│   ├── ClientManagement.tsx
│   └── DeploymentManager.tsx
├── assets/              # Tour content management
│   ├── AssetManager.tsx
│   └── AssetUpload.tsx
├── trips/               # Trip management
│   └── TripDashboard.tsx
├── forms/               # Reusable form components
│   └── travel-forms/*
└── ui/                  # Shared UI components
    └── [shadcn components]
```

## Verification Steps

### After Each Phase:
1. Run the app: `npm run dev`
2. Check TypeScript: `npm run typecheck`
3. Run tests: `npm test`
4. Check bundle size: `npm run build && npm run analyze`

### Monitor Bundle Size:
```bash
# Before consolidation
du -sh .next/static

# After consolidation (expect ~15-20% reduction)
du -sh .next/static
```

## Quick Commands

### Find component usage:
```bash
# Check if a component is used
grep -r "ComponentName" app/ components/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# Find all imports of a specific component
grep -r "from.*ComponentName" app/ components/ --include="*.tsx" --include="*.ts"
```

### Batch archive unused components:
```bash
# Create a list of unused components
cat component-analysis-report.json | jq -r '.deadComponents[].file' > dead-components.txt

# Archive them all
while read -r file; do
  dir=$(dirname ".archive/$file")
  mkdir -p "$dir"
  mv "$file" ".archive/$file"
  echo "Archived: $file"
done < dead-components.txt
```

## Next Steps

1. **Start with Phase 1** - These are the highest impact changes
2. **Test thoroughly** after button consolidation (82 files affected)
3. **Archive, don't delete** - Use .archive/ folder for safety
4. **Commit frequently** - Make it easy to rollback if needed

This consolidation will:
- Reduce bundle size by ~233KB (13.9%)
- Simplify the codebase for new developers
- Make the multi-tenant features more maintainable
- Improve TypeScript compilation speed