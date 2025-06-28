# Component Migration Example: TourOperatorDashboard

This example shows how to migrate the TourOperatorDashboard component from direct API calls to the new service architecture.

## Original Component Issues

From `components/tour-operator/TourOperatorDashboard.tsx`:
- Direct API calls: `/api/tour-operator/tours`
- Manual state management
- Error handling mixed with UI logic
- No feature flag support

## Migration Steps

### Step 1: Add Feature Flag Support

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

export function TourOperatorDashboard() {
  const useNewService = useFeatureFlag('USE_NEW_TOUR_SERVICE');
  
  // ... existing code
}
```

### Step 2: Import and Use the New Hook

```typescript
import { useTours } from '@/src/presentation/hooks/useTours';

export function TourOperatorDashboard() {
  const useNewService = useFeatureFlag('USE_NEW_TOUR_SERVICE');
  
  // New service hook
  const {
    tours,
    loading,
    error,
    stats,
    createTour,
    updateTour,
    archiveTour,
    publishTour,
    fetchTours
  } = useTours();
  
  // Legacy state (keep during migration)
  const [legacyTours, setLegacyTours] = useState([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  
  // Use new or legacy based on feature flag
  const activeTours = useNewService ? tours : legacyTours;
  const isLoading = useNewService ? loading : legacyLoading;
}
```

### Step 3: Update Data Fetching

**Before:**
```typescript
const fetchTours = async () => {
  setLoading(true);
  try {
    const toursResponse = await fetch('/api/tour-operator/tours');
    if (!toursResponse.ok) throw new Error('Failed to fetch tours');
    const toursData = await toursResponse.json();
    setTours(toursData.tours || []);
  } catch (error) {
    console.error('Error fetching tours:', error);
    toast.error('Failed to load tours');
  } finally {
    setLoading(false);
  }
};
```

**After:**
```typescript
useEffect(() => {
  if (useNewService) {
    // New service automatically handles loading/error states
    fetchTours();
  } else {
    // Keep legacy implementation during migration
    fetchToursLegacy();
  }
}, [useNewService]);
```

### Step 4: Update Delete/Archive Functionality

**Before:**
```typescript
const handleDeleteTour = async (tourId: string) => {
  if (!confirm('Are you sure you want to delete this tour?')) return;
  
  try {
    const response = await fetch(`/api/tour-operator/tours/${tourId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete tour');
    
    setTours(tours.filter(tour => tour.id !== tourId));
    toast.success('Tour deleted successfully');
  } catch (error) {
    console.error('Error deleting tour:', error);
    toast.error('Failed to delete tour');
  }
};
```

**After:**
```typescript
const handleDeleteTour = async (tourId: string) => {
  if (!confirm('Are you sure you want to archive this tour?')) return;
  
  if (useNewService) {
    try {
      await archiveTour(tourId);
      // State is automatically updated by the hook
      toast.success('Tour archived successfully');
    } catch (error) {
      // Error handling is built into the hook
      toast.error('Failed to archive tour');
    }
  } else {
    // Legacy implementation
    await handleDeleteTourLegacy(tourId);
  }
};
```

### Step 5: Update Create/Update Operations

**Before:**
```typescript
const handleSaveTour = async (tourData: any) => {
  try {
    const response = await fetch('/api/tour-operator/tours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tourData),
    });
    
    if (!response.ok) throw new Error('Failed to create tour');
    
    const newTour = await response.json();
    setTours([...tours, newTour]);
    toast.success('Tour created successfully');
  } catch (error) {
    toast.error('Failed to create tour');
  }
};
```

**After:**
```typescript
const handleSaveTour = async (tourData: any) => {
  if (useNewService) {
    try {
      const newTour = await createTour(tourData);
      toast.success('Tour created successfully');
      // State is automatically updated
    } catch (error) {
      // Error is already logged by the service
      toast.error('Failed to create tour');
    }
  } else {
    await handleSaveTourLegacy(tourData);
  }
};
```

### Step 6: Add New Features (Publish)

```typescript
// New feature only available with new service
const handlePublishTour = async (tourId: string) => {
  if (!useNewService) {
    toast.info('Publishing requires new service. Enable feature flag.');
    return;
  }
  
  try {
    await publishTour(tourId);
    toast.success('Tour published successfully');
  } catch (error) {
    toast.error('Failed to publish tour');
  }
};
```

## Complete Migration Example

```typescript
import { useTours } from '@/src/presentation/hooks/useTours';
import { useFeatureFlag } from '@/lib/feature-flags';

export function TourOperatorDashboard() {
  const useNewService = useFeatureFlag('USE_NEW_TOUR_SERVICE');
  const newService = useTours();
  
  // Legacy state for gradual migration
  const [legacyTours, setLegacyTours] = useState([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  
  // Use appropriate data based on feature flag
  const tours = useNewService ? newService.tours : legacyTours;
  const loading = useNewService ? newService.loading : legacyLoading;
  const stats = useNewService ? newService.stats : null;
  
  useEffect(() => {
    if (useNewService) {
      newService.fetchTours();
    } else {
      fetchToursLegacy();
    }
  }, [useNewService]);
  
  const handleCreateTour = async (data: any) => {
    if (useNewService) {
      return await newService.createTour(data);
    }
    return await createTourLegacy(data);
  };
  
  // ... rest of component
}
```

## Benefits After Migration

1. **Cleaner Code**: No manual state management
2. **Better Error Handling**: Centralized in the service
3. **Type Safety**: Full TypeScript support
4. **New Features**: Publish, duplicate, better filtering
5. **Performance**: Optimistic updates and caching
6. **Testing**: Easier to mock the hook

## Testing the Migration

```bash
# Test with new service disabled (default)
npm run dev

# Test with new service enabled
NEXT_PUBLIC_USE_NEW_TOUR_SERVICE=true npm run dev

# Run component tests
npm test TourOperatorDashboard
```

## Gradual Rollout

1. Deploy with feature flag disabled
2. Enable for internal testing
3. Enable for 10% of users
4. Monitor metrics
5. Gradually increase to 100%
6. Remove legacy code after full rollout