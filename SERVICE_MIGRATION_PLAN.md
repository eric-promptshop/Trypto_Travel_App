# TripNav Service Migration Plan

## Executive Summary

This migration plan outlines the step-by-step process to transform TripNav from its current mixed-concern architecture to a clean, service-oriented architecture. The migration is designed to be incremental, allowing continuous delivery while improving the codebase.

## Migration Priorities

Based on the codebase analysis, we've identified the following priority order:

### Priority 1: Tour Management (Critical)
- **Why**: Core business feature with the most technical debt
- **Impact**: Affects operators, lead generation, and revenue
- **Complexity**: High due to multiple import sources and data models

### Priority 2: Itinerary Generation (High)
- **Why**: Key differentiator with performance issues
- **Impact**: User experience and API costs
- **Complexity**: Medium, mainly needs service extraction

### Priority 3: Lead Management (High)
- **Why**: Direct revenue impact
- **Impact**: Operator satisfaction and conversion rates
- **Complexity**: Low, well-defined domain

### Priority 4: User Management (Medium)
- **Why**: Foundation for other features
- **Impact**: Security and authorization
- **Complexity**: Medium, requires auth migration

### Priority 5: Integration Hub (Low)
- **Why**: Important but not critical path
- **Impact**: Partner integrations
- **Complexity**: Low, mostly refactoring

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Directory Structure Creation

```bash
# Create new directory structure
mkdir -p src/{core,infrastructure,presentation}
mkdir -p src/core/{domain,application,shared}
mkdir -p src/infrastructure/{database,external,cache}
mkdir -p src/presentation/{components,hooks,contexts,controllers}
```

### 1.2 Base Infrastructure Setup

```typescript
// src/infrastructure/database/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// src/core/shared/errors.ts
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}
```

### 1.3 Dependency Injection Setup

```typescript
// src/core/container.ts
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container({ defaultScope: 'Singleton' });

// Base bindings
container.bind(TYPES.Logger).to(ConsoleLogger);
container.bind(TYPES.EventBus).to(EventEmitter);

export { container };

// src/core/types.ts
export const TYPES = {
  // Infrastructure
  Logger: Symbol.for('Logger'),
  EventBus: Symbol.for('EventBus'),
  Cache: Symbol.for('Cache'),
  
  // Repositories
  TourRepository: Symbol.for('TourRepository'),
  ItineraryRepository: Symbol.for('ItineraryRepository'),
  LeadRepository: Symbol.for('LeadRepository'),
  
  // Domain Services
  TourService: Symbol.for('TourService'),
  ItineraryService: Symbol.for('ItineraryService'),
  LeadService: Symbol.for('LeadService'),
  
  // Application Services
  TourApplicationService: Symbol.for('TourApplicationService'),
  ItineraryApplicationService: Symbol.for('ItineraryApplicationService'),
  LeadApplicationService: Symbol.for('LeadApplicationService'),
  
  // External Services
  AIService: Symbol.for('AIService'),
  MapsService: Symbol.for('MapsService'),
  EmailService: Symbol.for('EmailService'),
};
```

## Phase 2: Tour Management Migration (Week 3-4)

### 2.1 Domain Model Creation

```typescript
// src/core/domain/tour/Tour.ts
export enum TourStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface TourProps {
  id: string;
  operatorId: string;
  title: string;
  description: string;
  duration: number;
  price: Money;
  destinations: string[];
  activities: Activity[];
  images: Image[];
  status: TourStatus;
  template?: TourTemplate;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Tour {
  private constructor(private props: TourProps) {}

  static create(props: Omit<TourProps, 'id' | 'createdAt' | 'updatedAt'>): Tour {
    return new Tour({
      ...props,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static reconstitute(props: TourProps): Tour {
    return new Tour(props);
  }

  publish(): Result<Tour> {
    if (this.props.status !== TourStatus.DRAFT) {
      return Result.fail('Only draft tours can be published');
    }

    if (!this.isValid()) {
      return Result.fail('Tour must be complete before publishing');
    }

    this.props.status = TourStatus.PUBLISHED;
    this.props.updatedAt = new Date();
    
    return Result.ok(this);
  }

  private isValid(): boolean {
    return !!(
      this.props.title &&
      this.props.description &&
      this.props.duration > 0 &&
      this.props.destinations.length > 0 &&
      this.props.activities.length > 0
    );
  }

  // Getters
  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get status(): TourStatus { return this.props.status; }
  
  toJSON(): TourProps {
    return { ...this.props };
  }
}
```

### 2.2 Repository Implementation

```typescript
// src/core/domain/tour/TourRepository.ts
export interface TourRepository {
  save(tour: Tour): Promise<Tour>;
  findById(id: string): Promise<Tour | null>;
  findByOperator(operatorId: string, options?: PaginationOptions): Promise<PaginatedResult<Tour>>;
  search(criteria: SearchCriteria): Promise<PaginatedResult<Tour>>;
  delete(id: string): Promise<void>;
}

// src/infrastructure/database/repositories/PrismaTourRepository.ts
import { injectable } from 'inversify';
import { prisma } from '../prisma';
import { TourRepository } from '@/core/domain/tour/TourRepository';
import { Tour, TourStatus } from '@/core/domain/tour/Tour';

@injectable()
export class PrismaTourRepository implements TourRepository {
  async save(tour: Tour): Promise<Tour> {
    const data = tour.toJSON();
    
    const saved = await prisma.tour.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        operatorId: data.operatorId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price.amount,
        currency: data.price.currency,
        destinations: data.destinations,
        status: data.status,
        metadata: data.metadata,
      },
      update: {
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price.amount,
        destinations: data.destinations,
        status: data.status,
        metadata: data.metadata,
        updatedAt: new Date()
      },
      include: {
        activities: true,
        images: true
      }
    });
    
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Tour | null> {
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        activities: true,
        images: true
      }
    });
    
    return tour ? this.toDomain(tour) : null;
  }

  private toDomain(data: any): Tour {
    return Tour.reconstitute({
      id: data.id,
      operatorId: data.operatorId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      price: Money.create(data.price, data.currency),
      destinations: data.destinations,
      activities: data.activities.map(this.activityToDomain),
      images: data.images.map(this.imageToDomain),
      status: data.status as TourStatus,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }
}
```

### 2.3 Service Implementation

```typescript
// src/core/domain/tour/TourService.ts
export interface TourService {
  createTour(data: CreateTourDTO): Promise<Result<Tour>>;
  updateTour(id: string, data: UpdateTourDTO): Promise<Result<Tour>>;
  publishTour(id: string): Promise<Result<Tour>>;
  archiveTour(id: string): Promise<Result<void>>;
}

// src/core/domain/tour/TourServiceImpl.ts
@injectable()
export class TourServiceImpl implements TourService {
  constructor(
    @inject(TYPES.TourRepository) private repository: TourRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async createTour(data: CreateTourDTO): Promise<Result<Tour>> {
    try {
      // Validate business rules
      const validation = await this.validateTourData(data);
      if (!validation.isSuccess) {
        return Result.fail(validation.error);
      }

      // Create domain object
      const tour = Tour.create({
        operatorId: data.operatorId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: Money.create(data.price.amount, data.price.currency),
        destinations: data.destinations,
        activities: data.activities.map(a => Activity.create(a)),
        images: data.images.map(i => Image.create(i)),
        status: TourStatus.DRAFT,
        metadata: data.metadata || {}
      });

      // Save to repository
      const saved = await this.repository.save(tour);

      // Publish domain event
      await this.eventBus.publish(new TourCreatedEvent(saved));

      this.logger.info('Tour created', { tourId: saved.id });

      return Result.ok(saved);
    } catch (error) {
      this.logger.error('Failed to create tour', error);
      return Result.fail('Failed to create tour');
    }
  }

  async publishTour(id: string): Promise<Result<Tour>> {
    const tour = await this.repository.findById(id);
    if (!tour) {
      return Result.fail(`Tour ${id} not found`);
    }

    const publishResult = tour.publish();
    if (!publishResult.isSuccess) {
      return publishResult;
    }

    const saved = await this.repository.save(tour);
    
    await this.eventBus.publish(new TourPublishedEvent(saved));

    return Result.ok(saved);
  }
}
```

### 2.4 Application Service

```typescript
// src/core/application/tour/TourApplicationService.ts
@injectable()
export class TourApplicationService {
  constructor(
    @inject(TYPES.TourService) private tourService: TourService,
    @inject(TYPES.TourRepository) private tourRepository: TourRepository,
    @inject(TYPES.EmailService) private emailService: EmailService,
    @inject(TYPES.AnalyticsService) private analytics: AnalyticsService
  ) {}

  async createTour(command: CreateTourCommand): Promise<TourDTO> {
    // Validate command
    const validation = await CreateTourCommand.validate(command);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // Execute domain logic
    const result = await this.tourService.createTour({
      operatorId: command.operatorId,
      title: command.title,
      description: command.description,
      duration: command.duration,
      price: command.price,
      destinations: command.destinations,
      activities: command.activities,
      images: command.images,
      metadata: command.metadata
    });

    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    const tour = result.getValue();

    // Side effects
    await this.emailService.send({
      to: command.operatorEmail,
      template: 'tour-created',
      data: { tourTitle: tour.title, tourId: tour.id }
    });

    await this.analytics.track('tour_created', {
      tourId: tour.id,
      operatorId: tour.operatorId,
      price: tour.price.amount
    });

    return TourMapper.toDTO(tour);
  }

  async importTour(command: ImportTourCommand): Promise<TourDTO> {
    // Parse import data based on source
    const parser = ParserFactory.create(command.source);
    const parsedData = await parser.parse(command.data);

    // Create tour through service
    const result = await this.tourService.createTour({
      ...parsedData,
      operatorId: command.operatorId,
      metadata: {
        ...parsedData.metadata,
        importSource: command.source,
        importedAt: new Date()
      }
    });

    if (!result.isSuccess) {
      throw new Error(result.error);
    }

    return TourMapper.toDTO(result.getValue());
  }
}
```

### 2.5 API Controller Migration

```typescript
// src/presentation/controllers/TourController.ts
@injectable()
export class TourController {
  constructor(
    @inject(TYPES.TourApplicationService) private tourAppService: TourApplicationService,
    @inject(TYPES.AuthService) private auth: AuthService
  ) {}

  async createTour(request: Request): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return new Response('Unauthorized', { status: 401 });
      }

      const body = await request.json();
      
      const tour = await this.tourAppService.createTour({
        ...body,
        operatorId: session.userId,
        operatorEmail: session.email
      });

      return Response.json(tour, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json({ errors: error.errors }, { status: 400 });
      }
      
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async getTours(request: Request): Promise<Response> {
    const session = await this.auth.authenticate(request);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const tours = await this.tourAppService.getToursByOperator(session.userId);
    return Response.json(tours);
  }
}

// app/api/v1/tours/route.ts
import { container } from '@/core/container';
import { TourController } from '@/presentation/controllers/TourController';

const controller = container.get<TourController>(TourController);

export async function POST(request: Request) {
  return controller.createTour(request);
}

export async function GET(request: Request) {
  return controller.getTours(request);
}
```

## Phase 3: Testing Strategy

### 3.1 Unit Tests

```typescript
// src/core/domain/tour/__tests__/Tour.test.ts
describe('Tour', () => {
  describe('create', () => {
    it('should create a tour with valid data', () => {
      const tour = Tour.create({
        operatorId: 'op123',
        title: 'Test Tour',
        description: 'Test Description',
        duration: 5,
        price: Money.create(100, 'USD'),
        destinations: ['Paris'],
        activities: [],
        images: [],
        status: TourStatus.DRAFT,
        metadata: {}
      });

      expect(tour.id).toBeDefined();
      expect(tour.title).toBe('Test Tour');
      expect(tour.status).toBe(TourStatus.DRAFT);
    });
  });

  describe('publish', () => {
    it('should publish a draft tour', () => {
      const tour = createValidTour({ status: TourStatus.DRAFT });
      
      const result = tour.publish();
      
      expect(result.isSuccess).toBe(true);
      expect(tour.status).toBe(TourStatus.PUBLISHED);
    });

    it('should not publish an already published tour', () => {
      const tour = createValidTour({ status: TourStatus.PUBLISHED });
      
      const result = tour.publish();
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Only draft tours can be published');
    });
  });
});
```

### 3.2 Integration Tests

```typescript
// src/core/application/tour/__tests__/TourApplicationService.integration.test.ts
describe('TourApplicationService Integration', () => {
  let container: Container;
  let tourAppService: TourApplicationService;
  
  beforeEach(() => {
    container = createTestContainer();
    tourAppService = container.get<TourApplicationService>(TYPES.TourApplicationService);
  });

  it('should create a tour and send notification', async () => {
    const command: CreateTourCommand = {
      operatorId: 'op123',
      operatorEmail: 'operator@example.com',
      title: 'Integration Test Tour',
      description: 'Test Description',
      duration: 5,
      price: { amount: 100, currency: 'USD' },
      destinations: ['Paris'],
      activities: [],
      images: []
    };

    const tour = await tourAppService.createTour(command);

    expect(tour.id).toBeDefined();
    expect(tour.title).toBe('Integration Test Tour');
    
    // Verify email was sent
    const emailService = container.get<EmailService>(TYPES.EmailService);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'operator@example.com',
        template: 'tour-created'
      })
    );
  });
});
```

## Phase 4: Gradual Migration with Feature Flags

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_NEW_TOUR_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_TOUR_SERVICE === 'true',
  USE_NEW_ITINERARY_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_ITINERARY_SERVICE === 'true',
  USE_NEW_LEAD_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_LEAD_SERVICE === 'true'
};

// Adapter during migration
export async function createTour(data: CreateTourData) {
  if (FEATURE_FLAGS.USE_NEW_TOUR_SERVICE) {
    const controller = container.get<TourController>(TourController);
    return controller.createTour(data);
  }
  
  // Old implementation
  return legacyCreateTour(data);
}
```

## Phase 5: Performance Monitoring

```typescript
// src/infrastructure/monitoring/PerformanceMonitor.ts
@injectable()
export class PerformanceMonitor {
  async measureServiceCall<T>(
    serviceName: string,
    methodName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    const labels = { service: serviceName, method: methodName };
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.metrics.histogram('service_call_duration', duration, labels);
      this.metrics.increment('service_call_total', labels);
      
      return result;
    } catch (error) {
      this.metrics.increment('service_call_errors', labels);
      throw error;
    }
  }
}

// Usage in service
@injectable()
export class TourServiceImpl implements TourService {
  constructor(
    private repository: TourRepository,
    private monitor: PerformanceMonitor
  ) {}

  async createTour(data: CreateTourDTO): Promise<Result<Tour>> {
    return this.monitor.measureServiceCall(
      'TourService',
      'createTour',
      () => this.doCreateTour(data)
    );
  }
}
```

## Migration Timeline

### Week 1-2: Foundation
- ✅ Set up directory structure
- ✅ Configure dependency injection
- ✅ Create base infrastructure
- ✅ Set up testing framework

### Week 3-4: Tour Management
- ✅ Create Tour domain model
- ✅ Implement TourRepository
- ✅ Build TourService
- ✅ Create TourApplicationService
- ✅ Migrate tour API routes

### Week 5-6: Itinerary Generation
- ⬜ Create Itinerary domain model
- ⬜ Extract AI service interface
- ⬜ Build caching layer
- ⬜ Implement ItineraryService
- ⬜ Migrate itinerary routes

### Week 7-8: Lead Management
- ⬜ Create Lead domain model
- ⬜ Build routing logic
- ⬜ Implement notification system
- ⬜ Create LeadService
- ⬜ Update lead capture forms

### Week 9-10: Integration & Testing
- ⬜ Complete integration tests
- ⬜ Performance testing
- ⬜ Documentation
- ⬜ Gradual rollout
- ⬜ Monitoring setup

## Success Metrics

1. **Code Quality**
   - Test coverage > 80%
   - Cyclomatic complexity < 10
   - Zero circular dependencies

2. **Performance**
   - API response time < 200ms (p95)
   - Database queries < 50ms (p95)
   - Bundle size reduction > 20%

3. **Developer Experience**
   - Build time < 30s
   - Test execution < 2min
   - Clear error messages

4. **Business Metrics**
   - No increase in error rates
   - No degradation in conversion
   - Improved feature velocity

This migration plan provides a clear path forward with concrete examples and measurable outcomes. The incremental approach ensures business continuity while systematically improving the codebase.