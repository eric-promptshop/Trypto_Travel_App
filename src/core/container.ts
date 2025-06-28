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

// External Services (temporary implementations)
import { Logger, EventBus } from '@/src/core/domain/tour/TourServiceImpl';
import { EmailService, AnalyticsService } from '@/src/core/application/tour/TourApplicationService';
import { AuthService } from '@/src/presentation/controllers/TourController';

// Simple implementations for now
class ConsoleLogger implements Logger {
  info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data);
  }
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
  }
  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data);
  }
}

class SimpleEventBus implements EventBus {
  async publish(event: any): Promise<void> {
    console.log('Event published:', event.constructor.name, event);
  }
}

class MockEmailService implements EmailService {
  async send(params: { to: string; template: string; data: any }): Promise<void> {
    console.log('Email sent:', params);
  }
}

class MockAnalyticsService implements AnalyticsService {
  async track(event: string, data: any): Promise<void> {
    console.log('Analytics tracked:', event, data);
  }
}

class MockAuthService implements AuthService {
  async authenticate(request: Request): Promise<{ userId: string; email: string } | null> {
    // In production, this would verify the session/JWT
    // For now, return a mock user
    return {
      userId: 'op_123',
      email: 'operator@example.com'
    };
  }
}

// Create and configure container
const container = new Container({ defaultScope: 'Singleton' });

// Bind infrastructure
container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<Logger>(TYPES.Logger).to(ConsoleLogger);
container.bind<EventBus>(TYPES.EventBus).to(SimpleEventBus);

// Bind repositories
container.bind<TourRepository>(TYPES.TourRepository).to(PrismaTourRepository);

// Bind domain services
container.bind<TourService>(TYPES.TourService).to(TourServiceImpl);

// Bind application services
container.bind<TourApplicationService>(TYPES.TourApplicationService).to(TourApplicationService);

// Bind external services
container.bind<EmailService>(TYPES.EmailService).to(MockEmailService);
container.bind<AnalyticsService>(TYPES.AnalyticsService).to(MockAnalyticsService);
container.bind<AuthService>(TYPES.AuthService).to(MockAuthService);

// Bind controllers
container.bind<TourController>(TourController).toSelf();

export { container };