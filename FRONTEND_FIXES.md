# Frontend Deployment Fixes and Refactoring Guide

## Critical Issues to Fix for Vercel Deployment

### 1. SSR/Hydration Fixes

#### Fix Framer Motion SSR Issues
```typescript
// app/page.tsx - Wrap animations with client-only guard
'use client'

import dynamic from 'next/dynamic'

// Dynamic import animation components
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => mod.motion.div),
  { ssr: false }
)

// Or use isClient check
const [isClient, setIsClient] = useState(false)
useEffect(() => setIsClient(true), [])

if (!isClient) return <LoadingSkeleton />
```

#### Fix Theme Provider DOM Access
```typescript
// lib/themes/tenant-theme-provider.tsx
const applyThemeToDOM = useCallback((theme: ThemeConfig) => {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  if (!root) return
  
  // Apply theme variables...
}, [])

// Add SSR-safe initial theme
const getInitialTheme = (): ThemeConfig => {
  if (typeof window === 'undefined') {
    return defaultTheme
  }
  // Client-side theme detection
}
```

### 2. Environment Variable Fixes

#### Create Proper Environment Configuration
```typescript
// lib/config/runtime-env.ts
export const getRuntimeConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'
  
  return {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 
               (isVercel ? `https://${process.env.VERCEL_URL}/api` : '/api'),
      timeout: parseInt(process.env.API_TIMEOUT || '30000')
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    auth: {
      url: process.env.NEXTAUTH_URL || 
           (isVercel ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      secret: process.env.NEXTAUTH_SECRET!
    }
  }
}

// Validate at startup
export const validateEnv = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```

### 3. Component Structure Refactoring

#### Split Large Components
```typescript
// app/page.tsx - Split into smaller components
// components/landing/HeroSection.tsx
export const HeroSection = () => {
  // Hero content only
}

// components/landing/FeaturesSection.tsx
export const FeaturesSection = () => {
  // Features content only
}

// components/landing/AnimatedText.tsx
export const AnimatedText = dynamic(
  () => import('./AnimatedTextClient'),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)
```

#### Implement Error Boundaries
```typescript
// components/error-boundary/ComponentErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

export class ComponentErrorBoundary extends Component<Props> {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Component error:', error, errorInfo)
    this.props.onError?.(error)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }
    return this.props.children
  }
}
```

### 4. API Client Improvements

#### Add Request Interceptors
```typescript
// lib/api/api-client.ts
class APIClient {
  private baseURL: string
  private timeout: number
  
  constructor() {
    const config = getRuntimeConfig()
    this.baseURL = config.api.baseUrl
    this.timeout = config.api.timeout
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.timeout)
      })
      
      if (!response.ok) {
        throw new APIError(response.status, await response.text())
      }
      
      return response.json()
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(500, 'Network error')
    }
  }
  
  // Convenience methods
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' })
  }
  
  post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const apiClient = new APIClient()
```

### 5. Performance Optimizations

#### Implement Code Splitting
```typescript
// app/trips/page.tsx
import dynamic from 'next/dynamic'

const TripDashboard = dynamic(
  () => import('@/components/trips/TripDashboard'),
  {
    loading: () => <TripDashboardSkeleton />,
    ssr: true
  }
)

// components/trips/TripDashboardSkeleton.tsx
export const TripDashboardSkeleton = () => (
  <div className="animate-pulse">
    {/* Skeleton UI */}
  </div>
)
```

#### Add Virtual Scrolling
```typescript
// components/trips/TripList.tsx
import { FixedSizeList } from 'react-window'

export const VirtualTripList = ({ trips }: { trips: Trip[] }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <TripCard trip={trips[index]} />
    </div>
  )
  
  return (
    <FixedSizeList
      height={600}
      itemCount={trips.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### 6. State Management Improvements

#### Implement Zustand for Global State
```typescript
// lib/store/trip-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface TripStore {
  trips: Trip[]
  loading: boolean
  error: Error | null
  
  // Actions
  fetchTrips: () => Promise<void>
  addTrip: (trip: Trip) => void
  updateTrip: (id: string, updates: Partial<Trip>) => void
  deleteTrip: (id: string) => void
}

export const useTripStore = create<TripStore>()(
  devtools(
    persist(
      (set, get) => ({
        trips: [],
        loading: false,
        error: null,
        
        fetchTrips: async () => {
          set({ loading: true, error: null })
          try {
            const trips = await apiClient.get<Trip[]>('/trips')
            set({ trips, loading: false })
          } catch (error) {
            set({ error: error as Error, loading: false })
          }
        },
        
        addTrip: (trip) => {
          set((state) => ({ trips: [...state.trips, trip] }))
        },
        
        updateTrip: (id, updates) => {
          set((state) => ({
            trips: state.trips.map(t => 
              t.id === id ? { ...t, ...updates } : t
            )
          }))
        },
        
        deleteTrip: (id) => {
          set((state) => ({
            trips: state.trips.filter(t => t.id !== id)
          }))
        }
      }),
      {
        name: 'trip-storage',
        partialize: (state) => ({ trips: state.trips })
      }
    )
  )
)
```

### 7. Deployment Checklist

#### Pre-deployment
- [ ] Run `npm run lint:prod` and fix all errors
- [ ] Run `npm run type-check` and fix all TypeScript errors
- [ ] Update all environment variables in Vercel dashboard
- [ ] Test build locally with `npm run build`
- [ ] Check for console.log statements in production code
- [ ] Verify all API endpoints use relative URLs
- [ ] Ensure all images use Next.js Image component
- [ ] Add proper meta tags for SEO

#### Vercel Configuration
```json
// vercel.json updates
{
  "functions": {
    "app/api/generate-itinerary/route.ts": {
      "maxDuration": 60
    },
    "app/api/trips-ai/generate/route.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, must-revalidate" }
      ]
    }
  ]
}
```

#### Post-deployment Verification
- [ ] Check /api/health endpoint
- [ ] Verify authentication flow
- [ ] Test critical user journeys
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify mobile responsiveness

## Implementation Priority

1. **Immediate (Blocking Production)**
   - Fix SSR/hydration errors
   - Update environment variables
   - Fix TypeScript compilation errors
   - Add error boundaries

2. **High Priority (User Experience)**
   - Implement proper loading states
   - Add offline support
   - Optimize bundle size
   - Fix mobile UI issues

3. **Medium Priority (Performance)**
   - Code splitting
   - Virtual scrolling
   - Image optimization
   - Animation performance

4. **Low Priority (Nice to Have)**
   - Advanced monitoring
   - A/B testing
   - Progressive enhancement
   - Internationalization