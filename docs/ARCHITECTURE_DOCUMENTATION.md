# Architecture Documentation - Travel Itinerary Builder

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Database Design](#database-design)
7. [API Architecture](#api-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Security Architecture](#security-architecture)
10. [Infrastructure](#infrastructure)
11. [Scalability & Performance](#scalability--performance)
12. [Monitoring & Observability](#monitoring--observability)

## System Overview

The Travel Itinerary Builder is a multi-tenant SaaS platform that enables travel agencies and tour operators to create, manage, and customize travel itineraries using AI-powered recommendations.

### Key Features

- **AI-Powered Itinerary Generation**: Leverages OpenAI GPT-4 for intelligent trip planning
- **Multi-Tenant White-Label Support**: Customizable instances for different travel agencies
- **Real-Time Collaboration**: Multiple users can work on itineraries simultaneously
- **Content Management**: Scraping and normalization of travel content from various sources
- **Mobile-First Design**: Responsive and optimized for mobile devices
- **Offline Support**: Progressive Web App capabilities

## Architecture Principles

### 1. Microservices-Oriented Monolith

While deployed as a monolith, the codebase is organized around bounded contexts that could be extracted into microservices:

- **Itinerary Engine**: Core business logic for trip planning
- **Content Processing**: Web scraping and data normalization
- **User Management**: Authentication and authorization
- **Analytics**: Usage tracking and insights
- **Admin Portal**: White-label management

### 2. Domain-Driven Design (DDD)

The system is organized around business domains:

```
Domain Boundaries:
├── Trip Planning Domain
│   ├── Itinerary Generation
│   ├── Activity Management
│   └── Pricing Calculation
├── Content Domain
│   ├── Web Scraping
│   ├── Content Storage
│   └── Search & Retrieval
├── User Domain
│   ├── Authentication
│   ├── Profiles
│   └── Preferences
└── Tenant Domain
    ├── White-Label Config
    ├── Theme Management
    └── Domain Routing
```

### 3. Event-Driven Architecture

Key events flow through the system:

```typescript
// Event Examples
interface TripCreatedEvent {
  tripId: string;
  userId: string;
  destination: string;
  timestamp: Date;
}

interface ItineraryGeneratedEvent {
  itineraryId: string;
  tripId: string;
  aiModel: string;
  generationTime: number;
}
```

### 4. API-First Design

All functionality is exposed through well-defined APIs, enabling:
- Mobile app development
- Third-party integrations
- White-label customization
- Partner ecosystems

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Clients    │     │  Mobile Apps    │     │  Partner APIs   │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │    Load Balancer        │
                    │    (Vercel Edge)        │
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │   Next.js Application   │
                    │                         │
                    ├─────────────────────────┤
                    │   API Routes Layer      │
                    ├─────────────────────────┤
                    │   Business Logic        │
                    ├─────────────────────────┤
                    │   Data Access Layer     │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────┴────────┐   ┌─────────┴──────────┐  ┌────────┴────────┐
│                 │   │                    │  │                 │
│   PostgreSQL    │   │      Redis         │  │   Cloudinary    │
│   (Supabase)    │   │   (Caching)       │  │   (Images)      │
│                 │   │                    │  │                 │
└─────────────────┘   └────────────────────┘  └─────────────────┘
```

### Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │   Pages    │  │ Components  │  │    Hooks     │        │
│  └──────┬─────┘  └──────┬──────┘  └──────┬───────┘        │
│         │               │                 │                  │
│         └───────────────┴─────────────────┘                 │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │                  State Management                    │   │
│  │         (Context API + Custom Stores)               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                         │        Backend                      │
├─────────────────────────┼────────────────────────────────────┤
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │                   API Gateway                        │   │
│  │              (Next.js API Routes)                   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌─────────┬────────────┴────────────┬──────────┐         │
│  │         │                         │          │         │
│  │ Auth    │   Business Services     │  Admin   │         │
│  │ Service │                         │ Service  │         │
│  │         │  ┌────────────────┐    │          │         │
│  │         │  │ Itinerary      │    │          │         │
│  │         │  │ Engine         │    │          │         │
│  │         │  ├────────────────┤    │          │         │
│  │         │  │ Content        │    │          │         │
│  │         │  │ Processor      │    │          │         │
│  │         │  ├────────────────┤    │          │         │
│  │         │  │ Pricing        │    │          │         │
│  │         │  │ Calculator     │    │          │         │
│  │         │  └────────────────┘    │          │         │
│  └─────────┴─────────────────────────┴──────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Data Access Layer                   │   │
│  │                   (Prisma ORM)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Itinerary Engine

The core business logic for generating personalized travel itineraries:

```typescript
// Architecture Pattern: Strategy + Factory
class ItineraryEngine {
  private strategies: Map<string, GenerationStrategy>;
  private validators: ValidationChain;
  private optimizer: ItineraryOptimizer;
  
  async generateItinerary(request: ItineraryRequest): Promise<Itinerary> {
    // 1. Validate request
    await this.validators.validate(request);
    
    // 2. Select generation strategy
    const strategy = this.strategies.get(request.type);
    
    // 3. Generate base itinerary
    const baseItinerary = await strategy.generate(request);
    
    // 4. Optimize for constraints
    const optimized = await this.optimizer.optimize(baseItinerary, {
      budget: request.budget,
      preferences: request.preferences,
      constraints: request.constraints
    });
    
    // 5. Enhance with AI
    const enhanced = await this.aiEnhancer.enhance(optimized);
    
    return enhanced;
  }
}
```

### 2. Content Processing System

Web scraping and content normalization pipeline:

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Scraper   │────▶│  Normalizer  │────▶│   Storage     │
│   Engine    │     │   Pipeline   │     │   Service     │
└─────────────┘     └──────────────┘     └───────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ Rate Limiter│     │ Data Cleaner │     │  PostgreSQL   │
│ User Agent  │     │ Deduplicator │     │  Embeddings   │
│ Proxy Pool  │     │ Validator    │     │  Full Text    │
└─────────────┘     └──────────────┘     └───────────────┘
```

### 3. Multi-Tenant Architecture

Tenant isolation and customization:

```typescript
// Tenant Resolution Middleware
export async function resolveTenant(req: Request): Promise<Tenant> {
  // 1. Check subdomain
  const subdomain = extractSubdomain(req.headers.host);
  if (subdomain) {
    return await getTenantBySubdomain(subdomain);
  }
  
  // 2. Check custom domain
  const domain = req.headers.host;
  const customTenant = await getTenantByDomain(domain);
  if (customTenant) {
    return customTenant;
  }
  
  // 3. Default tenant
  return getDefaultTenant();
}
```

### 4. Theme System

Dynamic theming for white-label support:

```typescript
interface Theme {
  id: string;
  name: string;
  colors: ColorPalette;
  typography: Typography;
  components: ComponentStyles;
  customCSS?: string;
}

class ThemeEngine {
  compile(theme: Theme): CompiledTheme {
    return {
      cssVariables: this.generateCSSVariables(theme),
      componentOverrides: this.generateComponentStyles(theme),
      utilities: this.generateUtilityClasses(theme)
    };
  }
}
```

## Data Flow

### 1. Itinerary Generation Flow

```
User Request
    │
    ▼
┌─────────────────┐
│ Input Validation│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Check Cache     │────▶│ Return Cached    │
└────────┬────────┘     └──────────────────┘
         │ (miss)
         ▼
┌─────────────────┐
│ Query Content   │
│ Database        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply User      │
│ Preferences     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Enhancement  │
│ (OpenAI GPT-4)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cost Calculator │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Optimization    │
│ Engine          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cache Result    │
└────────┬────────┘
         │
         ▼
    Response
```

### 2. Content Processing Flow

```
External Website
       │
       ▼
┌──────────────┐
│ Rate Limiter │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Web Scraper  │────▶│ Retry Queue  │
└──────┬───────┘     └──────────────┘
       │ (success)
       ▼
┌──────────────┐
│ HTML Parser  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Data Extract │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Normalizer   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deduplicator │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ ML Embeddings│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Store in DB  │
└──────────────┘
```

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Users    │────▶│    Trips    │────▶│ Itineraries │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    ▼
       │                    │            ┌─────────────┐
       │                    │            │ Activities  │
       │                    │            └─────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Tenants   │     │   Bookings  │     │   Content   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Key Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  tenant_id UUID REFERENCES tenants(id),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

#### Trips Table
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10, 2),
  travelers INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',
  itinerary_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_destination ON trips(destination);
```

#### Content Table with Vector Embeddings
```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location JSONB,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI embeddings
  search_vector tsvector,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_embedding ON content 
  USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_content_search ON content 
  USING gin(search_vector);
```

### Database Optimization Strategies

1. **Indexing Strategy**
   - B-tree indexes for exact matches
   - GIN indexes for JSONB queries
   - IVFFlat indexes for vector similarity
   - Partial indexes for filtered queries

2. **Partitioning**
   - Time-based partitioning for trips
   - Tenant-based partitioning for multi-tenancy

3. **Connection Pooling**
   - PgBouncer for connection management
   - Prisma connection pool configuration

## API Architecture

### RESTful Design Principles

1. **Resource-Based URLs**
   ```
   GET    /api/v1/trips          # List trips
   POST   /api/v1/trips          # Create trip
   GET    /api/v1/trips/{id}     # Get trip
   PUT    /api/v1/trips/{id}     # Update trip
   DELETE /api/v1/trips/{id}     # Delete trip
   ```

2. **Consistent Response Format**
   ```typescript
   interface ApiResponse<T> {
     success: boolean;
     data?: T;
     error?: ApiError;
     meta?: ResponseMeta;
   }
   ```

3. **API Versioning**
   - URL path versioning: `/api/v1/`
   - Version negotiation via headers
   - Graceful deprecation

### API Gateway Pattern

```typescript
// API Route Handler
export async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Authentication
    const user = await authenticate(req);
    
    // 2. Rate Limiting
    await rateLimiter.check(user);
    
    // 3. Validation
    const validated = await validate(req.body, schema);
    
    // 4. Authorization
    await authorize(user, resource, action);
    
    // 5. Business Logic
    const result = await businessLogic(validated);
    
    // 6. Response Transformation
    const response = transform(result);
    
    // 7. Caching
    setCacheHeaders(res, resource);
    
    return res.json({ success: true, data: response });
  } catch (error) {
    return handleError(error, res);
  }
}
```

## Frontend Architecture

### Component Structure

```
components/
├── atoms/           # Basic building blocks
│   ├── Button/
│   ├── Input/
│   └── Typography/
├── molecules/       # Combinations of atoms
│   ├── FormField/
│   ├── Card/
│   └── SearchBar/
├── organisms/       # Complex components
│   ├── TripCard/
│   ├── ItineraryViewer/
│   └── Navigation/
├── templates/       # Page templates
│   ├── DashboardLayout/
│   └── AuthLayout/
└── pages/          # Next.js pages
```

### State Management

```typescript
// Global State Architecture
interface AppState {
  auth: AuthState;
  trips: TripsState;
  ui: UIState;
  cache: CacheState;
}

// Context-based State Management
const StateContext = createContext<AppState>();

// Custom Hooks for State Access
function useTrips() {
  const { trips, dispatch } = useContext(StateContext);
  
  return {
    trips: trips.data,
    loading: trips.loading,
    error: trips.error,
    actions: {
      fetchTrips: () => dispatch({ type: 'FETCH_TRIPS' }),
      createTrip: (data) => dispatch({ type: 'CREATE_TRIP', data }),
      updateTrip: (id, data) => dispatch({ type: 'UPDATE_TRIP', id, data })
    }
  };
}
```

### Performance Optimization

1. **Code Splitting**
   ```typescript
   // Dynamic imports for route-based splitting
   const ItineraryBuilder = dynamic(
     () => import('@/components/ItineraryBuilder'),
     { 
       loading: () => <SkeletonLoader />,
       ssr: false 
     }
   );
   ```

2. **Image Optimization**
   ```typescript
   // Cloudinary integration for responsive images
   function OptimizedImage({ src, alt, ...props }) {
     const url = cloudinary.url(src, {
       fetch_format: 'auto',
       quality: 'auto',
       responsive: true,
       width: 'auto'
     });
     
     return <Image src={url} alt={alt} {...props} />;
   }
   ```

## Security Architecture

### Authentication & Authorization

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ JWT Validation  │────▶│ Refresh Token    │
└────────┬────────┘     └──────────────────┘
         │ (valid)
         ▼
┌─────────────────┐
│ Load User Data  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Permissions│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Request │
└─────────────────┘
```

### Security Measures

1. **Input Validation**
   - Zod schemas for type validation
   - SQL injection prevention via Prisma
   - XSS protection through React

2. **Authentication**
   - NextAuth.js with JWT
   - Secure session management
   - Multi-factor authentication support

3. **Authorization**
   - Role-Based Access Control (RBAC)
   - Resource-level permissions
   - Tenant isolation

4. **Data Protection**
   - Encryption at rest (Supabase)
   - TLS for data in transit
   - PII data masking

## Infrastructure

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│             Vercel Edge Network             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐      ┌─────────────┐     │
│  │   CDN       │      │   WAF       │     │
│  └─────────────┘      └─────────────┘     │
│                                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Vercel Serverless Functions        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐      ┌─────────────┐     │
│  │  Next.js    │      │   API       │     │
│  │  SSR/SSG    │      │  Routes     │     │
│  └─────────────┘      └─────────────┘     │
│                                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              External Services              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌──────────────┐        │
│  │  Supabase   │  │  Cloudinary  │        │
│  │  Database   │  │   Images     │        │
│  └─────────────┘  └──────────────┘        │
│                                             │
│  ┌─────────────┐  ┌──────────────┐        │
│  │   OpenAI    │  │    Redis     │        │
│  │   GPT-4     │  │   Cache      │        │
│  └─────────────┘  └──────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

### Environment Configuration

```yaml
# Production Environment
production:
  region: us-east-1
  instances:
    min: 3
    max: 20
  database:
    type: postgresql
    version: 14
    connections: 100
  cache:
    type: redis
    memory: 4GB
  monitoring:
    - vercel-analytics
    - custom-metrics
    - error-tracking

# Staging Environment  
staging:
  region: us-east-1
  instances:
    min: 1
    max: 5
  database:
    type: postgresql
    version: 14
    connections: 25
```

## Scalability & Performance

### Horizontal Scaling Strategy

1. **Stateless Application Design**
   - No server-side sessions
   - JWT for authentication
   - External session storage

2. **Database Scaling**
   - Read replicas for queries
   - Connection pooling
   - Query optimization

3. **Caching Strategy**
   ```
   Browser Cache (1h)
        │
        ▼
   CDN Cache (24h)
        │
        ▼
   API Cache (5m)
        │
        ▼
   Redis Cache (1h)
        │
        ▼
   Database
   ```

### Performance Metrics

1. **Target Metrics**
   - Page Load: < 2s (LCP)
   - API Response: < 200ms (p95)
   - Time to Interactive: < 3s
   - Availability: 99.9%

2. **Optimization Techniques**
   - Static generation where possible
   - Incremental Static Regeneration
   - Edge caching
   - Database query optimization

## Monitoring & Observability

### Monitoring Stack

```
Application Metrics
       │
       ▼
┌──────────────┐
│   Vercel     │
│  Analytics   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   Custom     │────▶│   Alerts     │
│   Metrics    │     │   System     │
└──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│  Dashboards  │
└──────────────┘
```

### Key Metrics

1. **Business Metrics**
   - Itineraries generated/day
   - User engagement rates
   - Conversion funnel
   - API usage by endpoint

2. **Technical Metrics**
   - Response times (p50, p95, p99)
   - Error rates by endpoint
   - Database query performance
   - Cache hit rates

3. **Infrastructure Metrics**
   - CPU/Memory usage
   - Request rate
   - Concurrent connections
   - Cold start frequency

### Logging Strategy

```typescript
// Structured Logging
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: {
    userId?: string;
    tenantId?: string;
    requestId: string;
    endpoint?: string;
    duration?: number;
  };
  metadata?: Record<string, any>;
}

// Centralized Logger
class Logger {
  log(entry: LogEntry) {
    // Send to monitoring service
    // Store for analysis
    // Trigger alerts if needed
  }
}
```

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery (7 days)
   - Cross-region replication

2. **Code & Configuration**
   - Git-based version control
   - Infrastructure as Code
   - Environment variable backup

### Recovery Procedures

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour

### Incident Response

```
Incident Detection
       │
       ▼
┌──────────────┐
│   Alerting   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   Triage     │────▶│   Rollback   │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│   Fix &      │
│   Deploy     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Post-Mortem │
└──────────────┘
```

## Future Architecture Considerations

### Microservices Migration Path

1. **Phase 1**: Extract Itinerary Engine
2. **Phase 2**: Separate Content Processing
3. **Phase 3**: Independent Tenant Service
4. **Phase 4**: Dedicated Analytics Service

### Technology Upgrades

1. **GraphQL Federation** for API gateway
2. **Kubernetes** for container orchestration
3. **Event Streaming** with Kafka
4. **Machine Learning Pipeline** for recommendations

### Scaling Considerations

1. **Global Distribution**
   - Multi-region deployment
   - Data residency compliance
   - Edge computing for personalization

2. **Performance Enhancements**
   - WebAssembly for compute-intensive tasks
   - Service mesh for microservices
   - Advanced caching strategies