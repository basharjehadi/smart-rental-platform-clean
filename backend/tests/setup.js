const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize Prisma client for tests
  global.prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/smart_rental_test'
      }
    }
  });

  // Test database connection
  try {
    await global.prisma.$connect();
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  if (global.prisma) {
    await global.prisma.$disconnect();
    console.log('✅ Test database disconnected');
  }
});

// Global test utilities
global.createTestUser = async (userData) => {
  return await global.prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'TENANT',
      averageRating: null,
      totalReviews: 0,
      rank: null,
      badgeCount: 0,
      ...userData
    }
  });
};

global.createTestLease = async (leaseData) => {
  return await global.prisma.lease.create({
    data: {
      tenantId: leaseData.tenantId,
      landlordId: leaseData.landlordId,
      tenantGroupId: leaseData.tenantGroupId,
      propertyId: `test-property-${Date.now()}`,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      status: 'ACTIVE',
      monthlyRent: 1500,
      ...leaseData
    }
  });
};

global.createTestReview = async (reviewData) => {
  return await global.prisma.review.create({
    data: {
      reviewerId: reviewData.reviewerId,
      revieweeId: reviewData.revieweeId,
      leaseId: reviewData.leaseId,
      stage: 'END_OF_LEASE',
      status: 'PENDING',
      stars: 4,
      text: 'Test review',
      publishAfter: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      ...reviewData
    }
  });
};

global.cleanupTestData = async () => {
  // Clean up test data in reverse order of dependencies
  await global.prisma.review.deleteMany({
    where: {
      text: { startsWith: 'Test review' }
    }
  });

  await global.prisma.lease.deleteMany({
    where: {
      propertyId: { startsWith: 'test-property-' }
    }
  });

  await global.prisma.user.deleteMany({
    where: {
      email: { startsWith: 'test-' }
    }
  });

  await global.prisma.tenantGroup.deleteMany({
    where: {
      name: { startsWith: 'Test Tenant Group' }
    }
  });
};

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
