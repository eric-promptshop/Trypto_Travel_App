# Proposed Service-Oriented Architecture for TripNav

## Overview

This document outlines a comprehensive service-oriented architecture (SOA) for TripNav that addresses the pain points identified in our codebase analysis. The new architecture emphasizes clear service boundaries, separation of concerns, and testability.

## 1. Core Architecture Principles

### 1.1 Domain-Driven Design
- Clear bounded contexts for each business domain
- Ubiquitous language across the codebase
- Rich domain models with business logic

### 1.2 Service Layer Pattern
- All business logic encapsulated in services
- Clear service interfaces with contracts
- Repository pattern for data access
- Dependency injection for flexibility

### 1.3 Clean Architecture
- Dependencies point inward
- Business logic independent of frameworks
- UI and database are implementation details
- Testable by design

## 2. Proposed Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Authenticated routes
│   │   ├── dashboard/
│   │   ├── trips/
│   │   └── operator/
│   ├── (public)/                     # Public routes
│   │   ├── explore/
│   │   ├── tours/
│   │   └── auth/
│   ├── api/                          # API Routes (thin controllers)
│   │   ├── v1/                       # Versioned API
│   │   │   ├── tours/
│   │   │   ├── itineraries/
│   │   │   ├── leads/
│   │   │   ├── operators/
│   │   │   └── auth/
│   │   └── webhooks/                 # External webhooks
│   └── layout.tsx
│
├── core/                             # Core business logic
│   ├── domain/                       # Domain models
│   │   ├── tour/
│   │   │   ├── Tour.ts              # Tour entity
│   │   │   ├── TourTemplate.ts     # Template value object
│   │   │   ├── TourRepository.ts   # Repository interface
│   │   │   └── TourService.ts      # Domain service
│   │   ├── itinerary/
│   │   │   ├── Itinerary.ts
│   │   │   ├── Activity.ts
│   │   │   ├── ItineraryRepository.ts
│   │   │   └── ItineraryService.ts
│   │   ├── lead/
│   │   │   ├── Lead.ts
│   │   │   ├── LeadRepository.ts
│   │   │   └── LeadService.ts
│   │   └── operator/
│   │       ├── Operator.ts
│   │       ├── OperatorRepository.ts
│   │       └── OperatorService.ts
│   │
│   ├── application/                  # Application services
│   │   ├── tour/
│   │   │   ├── CreateTourUseCase.ts
│   │   │   ├── PublishTourUseCase.ts
│   │   │   ├── ImportTourUseCase.ts
│   │   │   └── TourApplicationService.ts
│   │   ├── itinerary/
│   │   │   ├── GenerateItineraryUseCase.ts
│   │   │   ├── CustomizeItineraryUseCase.ts
│   │   │   └── ItineraryApplicationService.ts
│   │   └── lead/
│   │       ├── CaptureLeadUseCase.ts
│   │       ├── RouteLeadUseCase.ts
│   │       └── LeadApplicationService.ts
│   │
│   └── shared/                       # Shared kernel
│       ├── types.ts
│       ├── errors.ts
│       ├── validators.ts
│       └── utils.ts
│
├── infrastructure/                   # Infrastructure layer
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── repositories/
│   │       ├── PrismaTourRepository.ts
│   │       ├── PrismaItineraryRepository.ts
│   │       └── PrismaLeadRepository.ts
│   │
│   ├── external/                     # External service integrations
│   │   ├── maps/
│   │   │   ├── GoogleMapsAdapter.ts
│   │   │   ├── MapboxAdapter.ts
│   │   │   └── MapsService.ts      # Interface
│   │   ├── ai/
│   │   │   ├── OpenAIAdapter.ts
│   │   │   └── AIService.ts        # Interface
│   │   ├── email/
│   │   │   ├── SendGridAdapter.ts
│   │   │   └── EmailService.ts     # Interface
│   │   └── storage/
│   │       ├── S3Adapter.ts
│   │       └── StorageService.ts   # Interface
│   │
│   └── cache/
│       ├── RedisCache.ts
│       └── CacheService.ts          # Interface
│
├── presentation/                     # Presentation layer
│   ├── components/
│   │   ├── features/                # Feature components
│   │   │   ├── tour-import/
│   │   │   ├── itinerary-builder/
│   │   │   ├── lead-capture/
│   │   │   └── operator-dashboard/
│   │   ├── shared/                  # Shared UI components
│   │   │   ├── buttons/
│   │   │   ├── forms/
│   │   │   ├── layouts/
│   │   │   └── modals/
│   │   └── widgets/                 # Embeddable widgets
│   │
│   ├── hooks/                       # React hooks
│   │   ├── api/                     # API hooks
│   │   │   ├── useTours.ts
│   │   │   ├── useItinerary.ts
│   │   │   └── useLeads.ts
│   │   └── ui/                      # UI hooks
│   │       ├── useModal.ts
│   │       ├── useToast.ts
│   │       └── useDebounce.ts
│   │
│   └── contexts/                    # React contexts
│       ├── AuthContext.tsx
│       ├── ThemeContext.tsx
│       └── FeatureFlagContext.tsx
│
├── lib/                             # Framework-specific utilities
│   ├── api/
│   │   ├── middleware.ts
│   │   ├── auth.ts
│   │   └── errors.ts
│   ├── prisma.ts
│   └── config.ts
│
└── tests/                           # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

## 3. Service Definitions

### 3.1 Tour Service

```typescript
// core/domain/tour/TourService.ts
export interface TourService {
  createTour(data: CreateTourDTO): Promise<Tour>;
  updateTour(id: string, data: UpdateTourDTO): Promise<Tour>;
  publishTour(id: string): Promise<Tour>;
  archiveTour(id: string): Promise<void>;
  findTourById(id: string): Promise<Tour | null>;
  findToursByOperator(operatorId: string): Promise<Tour[]>;
  searchTours(criteria: SearchCriteria): Promise<PaginatedResult<Tour>>;
}

// core/application/tour/TourApplicationService.ts
export class TourApplicationService {
  constructor(
    private tourService: TourService,
    private tourRepository: TourRepository,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async createTour(command: CreateTourCommand): Promise<TourDTO> {
    this.logger.info('Creating tour', { command });
    
    // Validate command
    await this.validateCreateTourCommand(command);
    
    // Create tour through domain service
    const tour = await this.tourService.createTour({
      operatorId: command.operatorId,
      title: command.title,
      description: command.description,
      // ... other fields
    });
    
    // Publish domain event
    await this.eventBus.publish(new TourCreatedEvent(tour));
    
    // Return DTO
    return TourMapper.toDTO(tour);
  }
}
```

### 3.2 Itinerary Service

```typescript
// core/domain/itinerary/ItineraryService.ts
export interface ItineraryService {
  generateItinerary(params: GenerateItineraryParams): Promise<Itinerary>;
  customizeItinerary(id: string, customizations: Customization[]): Promise<Itinerary>;
  saveItinerary(itinerary: Itinerary): Promise<Itinerary>;
  shareItinerary(id: string, shareOptions: ShareOptions): Promise<ShareResult>;
}

// core/application/itinerary/GenerateItineraryUseCase.ts
export class GenerateItineraryUseCase {
  constructor(
    private itineraryService: ItineraryService,
    private aiService: AIService,
    private placesService: PlacesService,
    private cache: CacheService
  ) {}

  async execute(command: GenerateItineraryCommand): Promise<ItineraryDTO> {
    // Check cache first
    const cacheKey = this.generateCacheKey(command);
    const cached = await this.cache.get<Itinerary>(cacheKey);
    if (cached) {
      return ItineraryMapper.toDTO(cached);
    }
    
    // Generate using AI
    const aiResponse = await this.aiService.generateItinerary({
      destination: command.destination,
      duration: command.duration,
      interests: command.interests,
      budget: command.budget
    });
    
    // Enrich with places data
    const enrichedActivities = await this.enrichActivities(
      aiResponse.activities,
      command.destination
    );
    
    // Create itinerary through domain service
    const itinerary = await this.itineraryService.generateItinerary({
      ...aiResponse,
      activities: enrichedActivities
    });
    
    // Cache result
    await this.cache.set(cacheKey, itinerary, { ttl: 3600 });
    
    return ItineraryMapper.toDTO(itinerary);
  }
}
```

### 3.3 Lead Service

```typescript
// core/domain/lead/LeadService.ts
export interface LeadService {
  captureLead(data: CaptureLeadData): Promise<Lead>;
  routeLeadToOperator(leadId: string, operatorId: string): Promise<void>;
  updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead>;
  getLeadsByOperator(operatorId: string): Promise<Lead[]>;
}

// core/application/lead/LeadApplicationService.ts
export class LeadApplicationService {
  constructor(
    private leadService: LeadService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService
  ) {}

  async captureLead(command: CaptureLeadCommand): Promise<LeadDTO> {
    // Capture lead
    const lead = await this.leadService.captureLead({
      email: command.email,
      name: command.name,
      tourId: command.tourId,
      source: command.source,
      metadata: command.metadata
    });
    
    // Track analytics
    await this.analyticsService.track('lead_captured', {
      leadId: lead.id,
      source: lead.source,
      tourId: lead.tourId
    });
    
    // Notify operator
    if (lead.operatorId) {
      await this.notificationService.notifyOperator(
        lead.operatorId,
        new LeadCapturedNotification(lead)
      );
    }
    
    return LeadMapper.toDTO(lead);
  }
}
```

## 4. API Route Implementation

```typescript
// app/api/v1/tours/route.ts
import { container } from '@/core/container';
import { authenticate } from '@/lib/api/auth';
import { validateRequest } from '@/lib/api/validation';
import { handleError } from '@/lib/api/errors';

const tourApplicationService = container.get<TourApplicationService>('TourApplicationService');

export async function POST(request: Request) {
  try {
    // Authenticate
    const session = await authenticate(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request
    const body = await request.json();
    const validation = validateRequest(CreateTourSchema, body);
    if (!validation.success) {
      return Response.json({ errors: validation.errors }, { status: 400 });
    }
    
    // Execute use case
    const tour = await tourApplicationService.createTour({
      ...validation.data,
      operatorId: session.user.id
    });
    
    return Response.json(tour, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

## 5. Dependency Injection Container

```typescript
// core/container.ts
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';

const container = new Container();

// Infrastructure
container.bind<PrismaClient>('PrismaClient').toConstantValue(new PrismaClient());
container.bind<Logger>('Logger').to(WinstonLogger).inSingletonScope();
container.bind<EventBus>('EventBus').to(EventEmitterBus).inSingletonScope();
container.bind<CacheService>('CacheService').to(RedisCache).inSingletonScope();

// External Services
container.bind<AIService>('AIService').to(OpenAIAdapter).inSingletonScope();
container.bind<MapsService>('MapsService').to(GoogleMapsAdapter).inSingletonScope();
container.bind<EmailService>('EmailService').to(SendGridAdapter).inSingletonScope();

// Repositories
container.bind<TourRepository>('TourRepository').to(PrismaTourRepository);
container.bind<ItineraryRepository>('ItineraryRepository').to(PrismaItineraryRepository);
container.bind<LeadRepository>('LeadRepository').to(PrismaLeadRepository);

// Domain Services
container.bind<TourService>('TourService').to(TourServiceImpl);
container.bind<ItineraryService>('ItineraryService').to(ItineraryServiceImpl);
container.bind<LeadService>('LeadService').to(LeadServiceImpl);

// Application Services
container.bind<TourApplicationService>('TourApplicationService').to(TourApplicationService);
container.bind<ItineraryApplicationService>('ItineraryApplicationService').to(ItineraryApplicationService);
container.bind<LeadApplicationService>('LeadApplicationService').to(LeadApplicationService);

export { container };
```

## 6. Migration Strategy

### Phase 1: Foundation (Week 1-2)
1. Set up new directory structure
2. Create core domain models
3. Define service interfaces
4. Set up dependency injection container
5. Create base repository implementations

### Phase 2: Tour Management (Week 3-4)
1. Migrate Tour domain model
2. Implement TourService and TourRepository
3. Create TourApplicationService with use cases
4. Update API routes to use new services
5. Migrate tour-related components to use new hooks

### Phase 3: Itinerary Generation (Week 5-6)
1. Migrate Itinerary domain model
2. Implement ItineraryService with AI integration
3. Create caching layer for itineraries
4. Update itinerary API routes
5. Refactor itinerary builder components

### Phase 4: Lead Management (Week 7-8)
1. Migrate Lead domain model
2. Implement LeadService with routing logic
3. Create notification system
4. Update lead capture forms
5. Integrate with operator dashboard

### Phase 5: Integration & Testing (Week 9-10)
1. Complete integration tests
2. Performance optimization
3. Documentation
4. Gradual rollout with feature flags
5. Monitor and fix issues

## 7. Example: Tour Service Refactoring

### Before (Current Implementation)
```typescript
// app/api/tour-operator/tours/route.ts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Business logic mixed with API handling
    const tour = await prisma.tour.create({
      data: {
        title: data.title,
        description: data.description,
        operatorId: session.user.id,
        // ... more fields
      }
    })
    
    // Direct email sending in API route
    await sendEmail({
      to: session.user.email,
      subject: 'Tour Created',
      body: `Your tour ${tour.title} has been created`
    })
    
    return NextResponse.json(tour)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 })
  }
}
```

### After (Service-Oriented Architecture)
```typescript
// core/domain/tour/Tour.ts
export class Tour {
  constructor(
    public readonly id: string,
    public readonly operatorId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly status: TourStatus,
    public readonly createdAt: Date
  ) {}

  publish(): Tour {
    if (this.status !== TourStatus.DRAFT) {
      throw new Error('Only draft tours can be published');
    }
    return new Tour(
      this.id,
      this.operatorId,
      this.title,
      this.description,
      TourStatus.PUBLISHED,
      this.createdAt
    );
  }
}

// core/domain/tour/TourService.ts
export class TourServiceImpl implements TourService {
  constructor(
    private repository: TourRepository,
    private eventBus: EventBus
  ) {}

  async createTour(data: CreateTourDTO): Promise<Tour> {
    const tour = new Tour(
      generateId(),
      data.operatorId,
      data.title,
      data.description,
      TourStatus.DRAFT,
      new Date()
    );
    
    const saved = await this.repository.save(tour);
    
    await this.eventBus.publish(new TourCreatedEvent(saved));
    
    return saved;
  }
}

// app/api/v1/tours/route.ts
export async function POST(request: Request) {
  const controller = container.get<TourController>('TourController');
  return controller.createTour(request);
}

// presentation/controllers/TourController.ts
export class TourController {
  constructor(
    private tourAppService: TourApplicationService,
    private auth: AuthService
  ) {}

  async createTour(request: Request): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      const body = await request.json();
      
      const tour = await this.tourAppService.createTour({
        ...body,
        operatorId: session.userId
      });
      
      return Response.json(tour, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

## 8. Benefits of This Architecture

### 8.1 Testability
- Business logic isolated from frameworks
- Easy to mock dependencies
- Unit tests for domain logic
- Integration tests for services

### 8.2 Maintainability
- Clear separation of concerns
- Single responsibility principle
- Easy to locate and modify code
- Consistent patterns across domains

### 8.3 Scalability
- Services can be extracted to microservices
- Easy to add new features
- Performance optimizations isolated
- Database changes don't affect business logic

### 8.4 Developer Experience
- Clear code organization
- Type safety throughout
- Predictable patterns
- Comprehensive documentation

## 9. Next Steps

1. **Team Alignment**: Review and discuss architecture with team
2. **Proof of Concept**: Implement Tour domain as POC
3. **Tooling Setup**: Configure DI container and testing framework
4. **Migration Planning**: Create detailed tickets for each phase
5. **Documentation**: Create architecture decision records (ADRs)

This architecture provides a solid foundation for TripNav's growth while addressing all identified pain points. The incremental migration approach ensures business continuity while improving code quality.