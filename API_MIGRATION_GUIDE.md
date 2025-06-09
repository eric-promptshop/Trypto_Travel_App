# API Migration Guide: Consolidating v1 and v2

This guide explains how to migrate from the versioned API structure to a unified API structure.

## Current Structure Issues

1. **v2 is not a full API version** - It only contains one experimental AI endpoint
2. **Confusion** - The v1/v2 structure suggests two complete API versions
3. **v2 is unused** - No frontend components reference the v2 endpoint
4. **Maintenance overhead** - Managing versions for a single experimental endpoint

## Recommended New Structure

```
/app/api/
├── trips/                    # Core trip management (from v1)
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── itinerary/
│           └── route.ts
├── trips-ai/                 # AI-enhanced features
│   └── generate/
│       └── route.ts          # (moved from v2/generate-itinerary)
├── content/                  # Content management (from v1)
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── admin/                    # Admin features
│   ├── roles/               # (from v1/roles)
│   ├── deploy/              # (from v1/deploy)
│   └── domains/             # (from v1/domains)
├── crm/                      # CRM integrations (from v1)
│   └── sync/
│       └── route.ts
└── generate-itinerary/       # Legacy algorithmic generation (existing)
    └── route.ts
```

## Migration Steps

### Step 1: Move v1 endpoints (keeping same functionality)

```bash
# Move trips endpoints
mv app/api/v1/trips app/api/trips

# Move content endpoints
mv app/api/v1/content app/api/content

# Move CRM endpoints
mv app/api/v1/crm app/api/crm

# Move admin endpoints (already exist in correct location)
# app/api/admin/* - keep as is

# Move role endpoints into admin
mv app/api/v1/roles app/api/admin/roles

# Move deploy endpoint (if not already in admin)
mv app/api/v1/deploy app/api/admin/deploy

# Move domains endpoint (if not already in admin)
mv app/api/v1/domains app/api/admin/domains
```

### Step 2: Move v2 endpoint to trips-ai

```bash
# Create AI endpoints folder
mkdir -p app/api/trips-ai/generate

# Move the v2 generate endpoint
mv app/api/v2/generate-itinerary/route.ts app/api/trips-ai/generate/route.ts

# Remove empty v2 folder
rmdir app/api/v2
```

### Step 3: Update all references

#### Frontend Hooks (`hooks/use-trips.tsx`)
```typescript
// Before
const response = await fetch('/api/v1/trips')

// After
const response = await fetch('/api/trips')
```

#### Frontend Hooks (`hooks/use-itinerary.tsx`)
```typescript
// Before
const url = `/api/v1/trips/${tripId}/itinerary`

// After
const url = `/api/trips/${tripId}/itinerary`
```

#### API Clients (`lib/api/trips-client.ts`)
```typescript
// Before
const API_BASE = '/api/v1/trips'

// After
const API_BASE = '/api/trips'
```

### Step 4: Update imports in moved files

For any imports in the moved API files that reference other API routes, update the paths:

```typescript
// Before (in any moved file)
import { someHelper } from '@/app/api/v1/helpers'

// After
import { someHelper } from '@/app/api/helpers'
```

### Step 5: Test all endpoints

1. Test trips CRUD operations
2. Test content management
3. Test role management
4. Test CRM sync
5. Test AI generation at new path: `/api/trips-ai/generate`

### Step 6: Update documentation

Update any API documentation to reflect the new paths:
- Remove `/v1` prefix from all endpoints
- Document AI endpoint as `/api/trips-ai/generate`
- Update OpenAPI/Swagger specs if any

## Benefits After Migration

1. **Clearer structure** - No version confusion
2. **Feature-based organization** - AI features clearly separated
3. **Easier maintenance** - Single source of truth
4. **Backward compatibility** - Can add redirects if needed
5. **Future-proof** - Easy to add more AI endpoints under `/api/trips-ai/*`

## Optional: Add Redirects for Backward Compatibility

If you need to maintain backward compatibility temporarily:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Redirect v1 to new paths
  if (url.pathname.startsWith('/api/v1/')) {
    url.pathname = url.pathname.replace('/api/v1/', '/api/')
    return NextResponse.redirect(url)
  }
  
  // Redirect v2 to new AI path
  if (url.pathname === '/api/v2/generate-itinerary') {
    url.pathname = '/api/trips-ai/generate'
    return NextResponse.redirect(url)
  }
}
```

## Future Considerations

As you add more AI features:
- Add them under `/api/trips-ai/*`
- Keep core CRUD operations under their respective paths
- Consider `/api/ai/*` for general AI utilities
- Version only when making breaking changes to the entire API