import { Trip, User, Itinerary } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Test data factories for consistent test data generation
 */

export const UserFactory = {
  build: (overrides?: Partial<User>): User => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
    role: 'USER',
    emailVerified: null,
    tenantId: 'default',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  buildAdmin: (overrides?: Partial<User>): User => 
    UserFactory.build({ role: 'ADMIN', ...overrides }),

  buildMany: (count: number, overrides?: Partial<User>): User[] =>
    Array.from({ length: count }, () => UserFactory.build(overrides)),
};

export const TripFactory = {
  build: (overrides?: Partial<Trip>): Trip => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    destination: faker.location.city(),
    startDate: faker.date.future(),
    endDate: faker.date.future({ years: 1 }),
    budget: faker.number.float({ min: 1000, max: 10000 }),
    travelers: faker.number.int({ min: 1, max: 10 }),
    itinerary: JSON.stringify([]),
    userId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  buildWithItinerary: (overrides?: Partial<Trip>): Trip => {
    const days = faker.number.int({ min: 3, max: 7 });
    const itinerary = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      date: faker.date.future().toISOString(),
      activities: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () => ({
        id: faker.string.uuid(),
        name: faker.lorem.words(3),
        time: faker.date.recent().toISOString(),
        duration: faker.number.int({ min: 30, max: 240 }),
        type: faker.helpers.arrayElement(['sightseeing', 'dining', 'activity', 'transport']),
        price: faker.number.float({ min: 10, max: 500 }),
      })),
    }));

    return TripFactory.build({
      itinerary: JSON.stringify(itinerary),
      ...overrides,
    });
  },

  buildMany: (count: number, overrides?: Partial<Trip>): Trip[] =>
    Array.from({ length: count }, () => TripFactory.build(overrides)),
};

export const ApiResponseFactory = {
  success: <T>(data: T, metadata?: any) => ({
    data,
    error: null,
    metadata: metadata || {},
  }),

  error: (message: string, details?: any, status = 400) => ({
    data: null,
    error: message,
    details: details || {},
    status,
  }),

  paginated: <T>(items: T[], page = 1, limit = 10, total?: number) => ({
    data: items,
    error: null,
    metadata: {
      page,
      limit,
      total: total || items.length,
      totalPages: Math.ceil((total || items.length) / limit),
    },
  }),
};

export const TestDataSeeder = {
  /**
   * Seeds the test database with consistent data
   */
  async seedDatabase(prisma: any) {
    // Clear existing data
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    // Create default tenant
    const defaultTenant = await prisma.tenant.create({
      data: {
        id: 'default',
        name: 'Default Organization',
        slug: 'default',
        domain: 'localhost:3000',
        isActive: true,
      },
    });

    // Create test users
    const testUser = await prisma.user.create({
      data: UserFactory.build({ 
        email: 'test@example.com',
        tenantId: defaultTenant.id,
      }),
    });

    const adminUser = await prisma.user.create({
      data: UserFactory.buildAdmin({ 
        email: 'admin@example.com',
        tenantId: defaultTenant.id,
      }),
    });

    // Create test trips
    const trips = await Promise.all(
      TripFactory.buildMany(5, { userId: testUser.id }).map(trip =>
        prisma.trip.create({ data: trip })
      )
    );

    return {
      tenant: defaultTenant,
      users: { testUser, adminUser },
      trips,
    };
  },

  /**
   * Cleans up test data after tests
   */
  async cleanup(prisma: any) {
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
  },
};