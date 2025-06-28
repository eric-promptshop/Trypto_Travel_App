import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from '@/src/core/types';
import { TourService } from '../TourService';
import { TourServiceImpl } from '../TourServiceImpl';
import { TourRepository } from '../TourRepository';
import { PrismaTourRepository } from '@/src/infrastructure/database/repositories/PrismaTourRepository';
import { Logger, EventBus } from '../TourServiceImpl';
import { Money } from '@/src/core/shared/types';
import { TourStatus } from '../Tour';

// Mock implementations for testing
class TestLogger implements Logger {
  logs: Array<{ level: string; message: string; data?: any }> = [];
  
  info(message: string, data?: any): void {
    this.logs.push({ level: 'info', message, data });
  }
  error(message: string, error?: any): void {
    this.logs.push({ level: 'error', message, data: error });
  }
  warn(message: string, data?: any): void {
    this.logs.push({ level: 'warn', message, data });
  }
}

class TestEventBus implements EventBus {
  events: Array<{ type: string; event: any }> = [];
  
  async publish(event: any): Promise<void> {
    this.events.push({ type: event.constructor.name, event });
  }
}

describe('TourService Integration Tests', () => {
  let container: Container;
  let tourService: TourService;
  let testLogger: TestLogger;
  let testEventBus: TestEventBus;
  let prisma: PrismaClient;

  beforeEach(() => {
    // Set up test container
    container = new Container();
    
    // Create test doubles
    testLogger = new TestLogger();
    testEventBus = new TestEventBus();
    prisma = new PrismaClient();
    
    // Bind test implementations
    container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
    container.bind<Logger>(TYPES.Logger).toConstantValue(testLogger);
    container.bind<EventBus>(TYPES.EventBus).toConstantValue(testEventBus);
    container.bind<TourRepository>(TYPES.TourRepository).to(PrismaTourRepository);
    container.bind<TourService>(TYPES.TourService).to(TourServiceImpl);
    
    // Get service instance
    tourService = container.get<TourService>(TYPES.TourService);
  });

  afterEach(async () => {
    // Clean up database
    await prisma.$disconnect();
  });

  describe('createTour', () => {
    it('should create a tour successfully', async () => {
      // Arrange
      const tourData = {
        operatorId: 'op_123',
        title: 'Amazing Paris Tour',
        description: 'Experience the best of Paris in 3 days',
        duration: 3,
        price: Money.create(299, 'USD'),
        destinations: ['Paris', 'Versailles'],
        activities: [
          {
            title: 'Eiffel Tower Visit',
            description: 'Skip-the-line access',
            duration: '2 hours'
          }
        ],
        images: [
          {
            url: 'https://example.com/paris.jpg',
            alt: 'Paris'
          }
        ],
        included: ['Guide', 'Tickets'],
        excluded: ['Meals'],
        languages: ['English', 'French']
      };

      // Act
      const result = await tourService.createTour(tourData);

      // Assert
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const tour = result.getValue();
        expect(tour.title).toBe(tourData.title);
        expect(tour.status).toBe(TourStatus.DRAFT);
        expect(tour.operatorId).toBe(tourData.operatorId);
      }

      // Verify event was published
      expect(testEventBus.events).toHaveLength(1);
      expect(testEventBus.events[0].type).toBe('TourCreatedEvent');

      // Verify logging
      expect(testLogger.logs).toContainEqual(
        expect.objectContaining({
          level: 'info',
          message: 'Tour created'
        })
      );
    });

    it('should fail validation for invalid tour data', async () => {
      // Arrange
      const invalidData = {
        operatorId: 'op_123',
        title: 'Bad', // Too short
        description: 'Short', // Too short
        duration: 0, // Invalid
        price: Money.create(0, 'USD'), // Invalid
        destinations: [], // Empty
        activities: [], // Empty
        images: [], // Empty
        included: [],
        excluded: [],
        languages: []
      };

      // Act
      const result = await tourService.createTour(invalidData);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Title must be at least 5 characters');
      expect(testEventBus.events).toHaveLength(0);
    });
  });

  describe('publishTour', () => {
    it('should publish a valid draft tour', async () => {
      // Arrange - Create a tour first
      const createResult = await tourService.createTour({
        operatorId: 'op_123',
        title: 'Complete Tour',
        description: 'A complete tour ready for publishing',
        duration: 5,
        price: Money.create(499, 'USD'),
        destinations: ['London'],
        activities: [{
          title: 'City Tour',
          description: 'Comprehensive city tour'
        }],
        images: [{
          url: 'https://example.com/london.jpg',
          alt: 'London'
        }],
        included: ['Everything'],
        excluded: ['Nothing'],
        languages: ['English']
      });

      expect(createResult.isSuccess).toBe(true);
      const tour = createResult.getValue()!;

      // Act
      const publishResult = await tourService.publishTour(tour.id);

      // Assert
      expect(publishResult.isSuccess).toBe(true);
      if (publishResult.isSuccess) {
        const publishedTour = publishResult.getValue();
        expect(publishedTour.status).toBe(TourStatus.PUBLISHED);
        expect(publishedTour.publishedAt).toBeDefined();
      }

      // Verify events
      expect(testEventBus.events).toHaveLength(2);
      expect(testEventBus.events[1].type).toBe('TourPublishedEvent');
    });

    it('should not publish an incomplete tour', async () => {
      // Arrange - Create incomplete tour
      const createResult = await tourService.createTour({
        operatorId: 'op_123',
        title: 'Incomplete',
        description: 'Missing required fields',
        duration: 3,
        price: Money.create(100, 'USD'),
        destinations: ['Paris'],
        activities: [], // No activities
        images: [{
          url: 'https://example.com/image.jpg',
          alt: 'Image'
        }],
        included: [],
        excluded: [],
        languages: []
      });

      const tour = createResult.getValue()!;

      // Act
      const publishResult = await tourService.publishTour(tour.id);

      // Assert
      expect(publishResult.isSuccess).toBe(false);
      expect(publishResult.error).toContain('At least one activity is required');
    });
  });

  describe('archiveTour', () => {
    it('should archive a tour', async () => {
      // Arrange
      const createResult = await tourService.createTour({
        operatorId: 'op_123',
        title: 'Tour to Archive',
        description: 'This tour will be archived',
        duration: 2,
        price: Money.create(199, 'USD'),
        destinations: ['Rome'],
        activities: [{
          title: 'Colosseum Visit',
          description: 'Ancient Rome tour'
        }],
        images: [{
          url: 'https://example.com/rome.jpg',
          alt: 'Rome'
        }],
        included: ['Guide'],
        excluded: ['Lunch'],
        languages: ['English', 'Italian']
      });

      const tour = createResult.getValue()!;

      // Act
      const archiveResult = await tourService.archiveTour(tour.id);

      // Assert
      expect(archiveResult.isSuccess).toBe(true);

      // Verify event
      expect(testEventBus.events).toHaveLength(2);
      expect(testEventBus.events[1].type).toBe('TourArchivedEvent');
    });
  });
});

// Note: These are unit tests. For true integration tests, you would:
// 1. Use a test database
// 2. Not mock the Prisma client
// 3. Test actual database operations
// 4. Clean up test data after each test