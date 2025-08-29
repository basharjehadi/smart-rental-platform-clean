import { jest } from '@jest/globals';
import { prisma } from '../../src/utils/prisma.js';
import request from 'supertest';
import app from '../../src/app.js';

describe('Review Unique Constraint - Integration Tests', () => {
  let testUser1, testUser2, testLease, testTenantGroup;
  let authToken1, authToken2;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerId: { startsWith: 'test-user-' } },
          { revieweeId: { startsWith: 'test-user-' } }
        ]
      }
    });
    await prisma.lease.deleteMany({
      where: { id: { startsWith: 'test-lease-' } }
    });
    await prisma.tenantGroup.deleteMany({
      where: { id: { startsWith: 'test-group-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-user-' } }
    });

    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        id: 'test-user-1',
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'hashedpassword',
        role: 'TENANT'
      }
    });

    testUser2 = await prisma.user.create({
      data: {
        id: 'test-user-2',
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'hashedpassword',
        role: 'LANDLORD'
      }
    });

    // Create test tenant group
    testTenantGroup = await prisma.tenantGroup.create({
      data: {
        id: 'test-group-1',
        name: 'Test Group',
        maxTenants: 2
      }
    });

    // Create test lease
    testLease = await prisma.lease.create({
      data: {
        id: 'test-lease-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        monthlyRent: 1000,
        depositAmount: 1000,
        status: 'ACTIVE',
        tenantId: testUser1.id,
        landlordId: testUser2.id,
        propertyId: 'test-property-1',
        tenantGroupId: testTenantGroup.id
      }
    });

    // Generate auth tokens (simplified for testing)
    authToken1 = `Bearer test-token-${testUser1.id}`;
    authToken2 = `Bearer test-token-${testUser2.id}`;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerId: { startsWith: 'test-user-' } },
          { revieweeId: { startsWith: 'test-user-' } }
        ]
      }
    });
    await prisma.lease.deleteMany({
      where: { id: { startsWith: 'test-lease-' } }
    });
    await prisma.tenantGroup.deleteMany({
      where: { id: { startsWith: 'test-group-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-user-' } }
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up reviews before each test
    await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerId: { startsWith: 'test-user-' } },
          { revieweeId: { startsWith: 'test-user-' } }
        ]
      }
    });
  });

  describe('POST /api/reviews - Unique Constraint Enforcement', () => {
    const validReviewData = {
      leaseId: 'test-lease-1',
      rating: 4,
      comment: 'Great experience with this landlord!',
      reviewStage: 'MOVE_IN',
      targetUserId: 'test-group-1',
      isAnonymous: false
    };

    test('should create first review successfully', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.rating).toBe(4);
    });

    test('should return 409 with REVIEW_EXISTS code for duplicate review', async () => {
      // Create first review
      const firstResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(firstResponse.status).toBe(201);

      // Try to create duplicate review
      const duplicateResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.error).toBe('REVIEW_EXISTS');
      expect(duplicateResponse.body.code).toBe('REVIEW_EXISTS');
      expect(duplicateResponse.body.message).toBe('A review for this lease, stage, and reviewer already exists');
    });

    test('should allow different users to review the same lease and stage', async () => {
      // User 1 creates review
      const user1Response = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(user1Response.status).toBe(201);

      // User 2 creates review for same lease and stage
      const user2Response = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken2)
        .send({
          ...validReviewData,
          targetUserId: 'test-group-1' // Same target
        });

      expect(user2Response.status).toBe(201);
    });

    test('should allow same user to review different stages', async () => {
      // Create MOVE_IN review
      const moveInResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(moveInResponse.status).toBe(201);

      // Create END_OF_LEASE review (different stage)
      const endOfLeaseResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send({
          ...validReviewData,
          reviewStage: 'END_OF_LEASE'
        });

      expect(endOfLeaseResponse.status).toBe(201);
    });

    test('should allow same user to review different leases', async () => {
      // Create another test lease
      const testLease2 = await prisma.lease.create({
        data: {
          id: 'test-lease-2',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          monthlyRent: 1200,
          depositAmount: 1200,
          status: 'ACTIVE',
          tenantId: testUser1.id,
          landlordId: testUser2.id,
          propertyId: 'test-property-2',
          tenantGroupId: testTenantGroup.id
        }
      });

      // Create review for first lease
      const firstLeaseResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(firstLeaseResponse.status).toBe(201);

      // Create review for second lease (different leaseId)
      const secondLeaseResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send({
          ...validReviewData,
          leaseId: 'test-lease-2'
        });

      expect(secondLeaseResponse.status).toBe(201);

      // Clean up second lease
      await prisma.lease.delete({
        where: { id: 'test-lease-2' }
      });
    });

    test('should enforce unique constraint at database level', async () => {
      // Create review through API
      const apiResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(apiResponse.status).toBe(201);

      // Try to create duplicate directly in database (should fail)
      try {
        await prisma.review.create({
          data: {
            rating: 5,
            comment: 'Another review',
            isAnonymous: false,
            leaseId: 'test-lease-1',
            reviewStage: 'MOVE_IN',
            reviewerId: 'test-user-1',
            targetTenantGroupId: 'test-group-1',
            revieweeId: 'test-user-2'
          }
        });
        // If we reach here, the constraint failed
        fail('Database should have enforced unique constraint');
      } catch (error) {
        expect(error.code).toBe('P2002');
        expect(error.meta?.target).toContain('leaseId');
        expect(error.meta?.target).toContain('reviewerId');
        expect(error.meta?.target).toContain('revieweeId');
        expect(error.meta?.target).toContain('reviewStage');
      }
    });

    test('should handle unique constraint violation gracefully', async () => {
      // Create first review
      const firstResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(validReviewData);

      expect(firstResponse.status).toBe(201);

      // Try to create duplicate with slightly different data
      const duplicateData = {
        ...validReviewData,
        rating: 5, // Different rating
        comment: 'Different comment' // Different comment
      };

      const duplicateResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send(duplicateData);

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.error).toBe('REVIEW_EXISTS');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null values in unique constraint fields', async () => {
      // This test verifies that the database properly handles the constraint
      // when all required fields are present
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send({
          leaseId: 'test-lease-1',
          rating: 4,
          comment: 'Test review',
          reviewStage: 'MOVE_IN',
          targetUserId: 'test-group-1'
        });

      expect(response.status).toBe(201);
    });

    test('should maintain data integrity after constraint violations', async () => {
      // Create initial review
      const initialResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send({
          leaseId: 'test-lease-1',
          rating: 4,
          comment: 'Initial review',
          reviewStage: 'MOVE_IN',
          targetUserId: 'test-group-1'
        });

      expect(initialResponse.status).toBe(201);
      const initialReviewId = initialResponse.body.data.id;

      // Try to create duplicate
      const duplicateResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', authToken1)
        .send({
          leaseId: 'test-lease-1',
          rating: 5,
          comment: 'Duplicate review',
          reviewStage: 'MOVE_IN',
          targetUserId: 'test-group-1'
        });

      expect(duplicateResponse.status).toBe(409);

      // Verify original review still exists and is unchanged
      const originalReview = await prisma.review.findUnique({
        where: { id: initialReviewId }
      });

      expect(originalReview).toBeDefined();
      expect(originalReview.rating).toBe(4);
      expect(originalReview.comment).toBe('Initial review');
    });
  });
});
