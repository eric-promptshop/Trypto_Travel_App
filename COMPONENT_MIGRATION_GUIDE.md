# Component Migration Guide

This guide shows how to migrate existing components to use the new service architecture.

## Example: Migrating Tour Components

### Before (Direct API calls and mixed concerns)

```typescript
// components/operator/TourList.tsx (OLD)
export function TourList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTours() {
      setLoading(true);
      try {
        const res = await fetch('/api/tour-operator/tours');
        const data = await res.json();
        setTours(data.tours);
      } catch (error) {
        toast.error('Failed to load tours');
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  const handlePublish = async (tourId: string) => {
    try {
      const res = await fetch(`/api/tour-operator/tours/${tourId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'PUBLISHED' })
      });
      if (!res.ok) throw new Error();
      
      // Manually update state
      setTours(tours.map(t => 
        t.id === tourId ? { ...t, status: 'PUBLISHED' } : t
      ));
      
      toast.success('Tour published');
    } catch {
      toast.error('Failed to publish');
    }
  };

  // ... render logic
}
```

### After (Using new service hooks)

```typescript
// components/operator/TourList.tsx (NEW)
import { useTours } from '@/src/presentation/hooks/useTours';
import { useFeatureFlag } from '@/lib/feature-flags';

export function TourList() {
  const useNewService = useFeatureFlag('USE_NEW_TOUR_SERVICE');
  
  // New service hook
  const {
    tours,
    loading,
    error,
    stats,
    publishTour,
    archiveTour,
    fetchTours
  } = useTours();

  useEffect(() => {
    if (useNewService) {
      fetchTours();
    } else {
      // Fallback to old implementation
      fetchToursLegacy();
    }
  }, [useNewService]);

  const handlePublish = async (tourId: string) => {
    if (useNewService) {
      // Clean, simple call
      await publishTour(tourId);
      // State is automatically updated by the hook
    } else {
      // Old implementation
      await handlePublishLegacy(tourId);
    }
  };

  // ... render logic stays the same
}
```

## Step-by-Step Migration Process

### 1. Identify Components Using Direct API Calls

Look for patterns like:
- `fetch('/api/...')`
- Direct state management for domain objects
- Business logic in components
- Manual error handling

### 2. Replace with Service Hooks

```typescript
// Before
const [tours, setTours] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// After
const { tours, loading, error } = useTours();
```

### 3. Add Feature Flag Check

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

export function MyComponent() {
  const useNewService = useFeatureFlag('USE_NEW_TOUR_SERVICE');
  
  if (useNewService) {
    return <NewImplementation />;
  }
  
  return <LegacyImplementation />;
}
```

### 4. Gradual Migration Pattern

```typescript
// Temporary wrapper during migration
export function TourManager() {
  const useNewService = useFeatureFlag('USE_NEW_TOUR_SERVICE');
  
  // Both implementations in same component during transition
  const newService = useTours();
  const [legacyTours, setLegacyTours] = useState([]);
  
  const tours = useNewService ? newService.tours : legacyTours;
  const loading = useNewService ? newService.loading : legacyLoading;
  
  // Gradually move logic to new service
  const createTour = useNewService 
    ? newService.createTour 
    : legacyCreateTour;
    
  // ... rest of component
}
```

## Common Patterns to Migrate

### 1. Form Submissions

**Before:**
```typescript
const handleSubmit = async (data) => {
  try {
    const res = await fetch('/api/tours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error();
    const tour = await res.json();
    router.push(`/tours/${tour.id}`);
  } catch {
    setError('Failed to create tour');
  }
};
```

**After:**
```typescript
const { createTour } = useTours();

const handleSubmit = async (data) => {
  const tour = await createTour(data);
  router.push(`/tours/${tour.id}`);
  // Error handling is in the hook
};
```

### 2. Data Fetching

**Before:**
```typescript
useEffect(() => {
  fetch('/api/tours')
    .then(res => res.json())
    .then(data => setTours(data))
    .catch(() => setError(true));
}, []);
```

**After:**
```typescript
const { tours, fetchTours } = useTours();

useEffect(() => {
  fetchTours();
}, []);
```

### 3. Optimistic Updates

**Before:**
```typescript
const handleDelete = async (id) => {
  // Optimistic update
  setTours(tours.filter(t => t.id !== id));
  
  try {
    await fetch(`/api/tours/${id}`, { method: 'DELETE' });
  } catch {
    // Rollback
    fetchTours();
  }
};
```

**After:**
```typescript
const { archiveTour } = useTours();

const handleDelete = async (id) => {
  await archiveTour(id);
  // Hook handles optimistic updates
};
```

## Benefits After Migration

1. **Cleaner Components**: Focus on UI, not business logic
2. **Consistent Error Handling**: Built into hooks
3. **Automatic State Management**: No manual state updates
4. **Type Safety**: Full TypeScript support
5. **Testability**: Easy to mock hooks

## Testing Migrated Components

```typescript
// Easy to test with mock hooks
import { renderHook } from '@testing-library/react-hooks';
import { useTours } from '@/src/presentation/hooks/useTours';

jest.mock('@/src/presentation/hooks/useTours');

test('displays tours', () => {
  const mockTours = [{ id: '1', title: 'Test Tour' }];
  
  (useTours as jest.Mock).mockReturnValue({
    tours: mockTours,
    loading: false,
    error: null
  });
  
  const { getByText } = render(<TourList />);
  expect(getByText('Test Tour')).toBeInTheDocument();
});
```

## Checklist for Component Migration

- [ ] Identify all API calls in the component
- [ ] Check if a service hook exists (or create one)
- [ ] Add feature flag check
- [ ] Replace API calls with hook methods
- [ ] Remove local state management
- [ ] Update error handling to use hook
- [ ] Test both old and new implementations
- [ ] Add logging for monitoring
- [ ] Update component tests
- [ ] Document any breaking changes

## Rollback Strategy

If issues arise, simply toggle the feature flag:

```bash
# Disable new service
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=false

# Re-enable when fixed
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true
```

This ensures zero downtime during migration.