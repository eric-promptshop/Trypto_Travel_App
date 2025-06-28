import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from './types';

// Infrastructure
import { prisma } from '@/src/infrastructure/database/prisma';
import { PrismaTourRepository } from '@/src/infrastructure/database/repositories/PrismaTourRepository';

// Domain Services
import { TourService } from '@/src/core/domain/tour/TourService';
import { TourServiceImpl } from '@/src/core/domain/tour/TourServiceImpl';
import { TourRepository } from '@/src/core/domain/tour/TourRepository';

// Application Services
import { TourApplicationService } from '@/src/core/application/tour/TourApplicationService';

// Controllers
import { TourController } from '@/src/presentation/controllers/TourController';

// External Services
import { Logger, EventBus } from '@/src/core/domain/tour/TourServiceImpl';
import { EmailService, AnalyticsService } from '@/src/core/application/tour/TourApplicationService';
import { AuthService } from '@/src/presentation/controllers/TourController';

// Real implementations
import { StructuredLogger } from '@/src/infrastructure/logging/Logger';
import { InMemoryEventBus } from '@/src/infrastructure/events/EventBus';
import { ResendEmailService } from '@/src/infrastructure/external/email/ResendEmailService';
import { MixedAnalyticsService } from '@/src/infrastructure/external/analytics/MixedAnalyticsService';
import { NextAuthService } from '@/src/infrastructure/external/auth/NextAuthService';

// Create and configure container
const container = new Container({ defaultScope: 'Singleton' });

// Bind infrastructure
container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<Logger>(TYPES.Logger).to(StructuredLogger);
container.bind<EventBus>(TYPES.EventBus).to(InMemoryEventBus);

// Bind repositories
container.bind<TourRepository>(TYPES.TourRepository).to(PrismaTourRepository);

// Bind domain services
container.bind<TourService>(TYPES.TourService).to(TourServiceImpl);

// Bind application services
container.bind<TourApplicationService>(TYPES.TourApplicationService).to(TourApplicationService);

// Bind external services with real implementations
container.bind<EmailService>(TYPES.EmailService).to(ResendEmailService);
container.bind<AnalyticsService>(TYPES.AnalyticsService).to(MixedAnalyticsService);
container.bind<AuthService>(TYPES.AuthService).to(NextAuthService);

// Bind controllers
container.bind<TourController>(TourController).toSelf();

export { container };