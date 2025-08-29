import { jest } from '@jest/globals';
import { prisma } from '../../src/utils/prisma.js';
import request from 'supertest';
import app from '../../src/app.js';
import leaseEventService from '../../src/services/leaseEventService.js';

describe('Lease Status Hooks - Integration Tests', () => {
  let testUser1, testUser2, testLease, testTenantGroup, testProperty;
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
    await prisma.property.deleteMany({
      where: { id: { startsWith: 'test-property-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-user-' } }
    });

    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        id: 'test-user-1',
        name: 'Test Tenant',
        email: 'tenant@example.com',
        password: 'hashedpassword',
        role: 'TENANT'
      }
    });

    testUser2 = await prisma.user.create({
      data: {
        id: 'test-user-2',
        name: 'Test Landlord',
        email: 'landlord@example.com',
        password: 'hashedpassword',
        role: 'LANDLORD'
      }
    });

    // Create test property
    testProperty = await prisma.property.create({
      data: {
        id: 'test-property-1',
        name: 'Test Property',
        address: '123 Test St',
        landlordId: testUser2.id
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
        propertyId: testProperty.id,
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
    await prisma.property.deleteMany({
      where: { id: { startsWith: 'test-property-' } }
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

  describe('Lease Status Change Hooks', () => {
    test('should create end-of-lease reviews when lease status changes to ENDED', async () => {
      // Update lease status to ENDED
      const response = await request(app)
        .patch(`/api/leases/${testLease.id}/status`)
        .set('Authorization', authToken2)
        .send({
          newStatus: 'ENDED',
          reason: 'Lease term completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify that end-of-lease reviews were created
      const reviews = await prisma.review.findMany({
        where: {
          leaseId: testLease.id,
          reviewStage: 'END_OF_LEASE'
        }
      });

      expect(reviews).toHaveLength(2); // Tenant → Landlord + Landlord → Tenant
      
      // Check tenant → landlord review
      const tenantToLandlordReview = reviews.find(
        r => r.reviewerId === testUser1.id && r.revieweeId === testUser2.id
      );
      expect(tenantToLandlordReview).toBeDefined();
      expect(tenantToLandlordReview.isEarlyTermination).toBe(false);
      expect(tenantToLandlordReview.excludeFromAggregates).toBe(false);

      // Check landlord → tenant review
      const landlordToTenantReview = reviews.find(
        r => r.reviewerId === testUser2.id && r.revieweeId === testUser1.id
      );
      expect(landlordToTenantReview).toBeDefined();
      expect(landlordToTenantReview.isEarlyTermination).toBe(false);
      expect(landlordToTenantReview.excludeFromAggregates).toBe(false);
    });

    test('should create early move-out reviews when lease ends with early move-out', async () => {
      // Update lease status to ENDED with early move-out
      const response = await request(app)
        .patch(`/api/leases/${testLease.id}/status`)
        .set('Authorization', authToken1)
        .send({
          newStatus: 'ENDED',
          reason: 'Early move-out requested',
          isEarlyMoveOut: true,
          earlyMoveOutReason: 'Job relocation'
        });

      expect(response.status).toBe(200);

      // Verify that early move-out reviews were created
      const reviews = await prisma.review.findMany({
        where: {
          leaseId: testLease.id,
          reviewStage: 'END_OF_LEASE'
        }
      });

      expect(reviews.length).toBeGreaterThanOrEqual(2);
      
      // Check for early move-out specific review
      const earlyMoveOutReview = reviews.find(
        r => r.earlyTerminationReason === 'EARLY_MOVE_OUT'
      );
      expect(earlyMoveOutReview).toBeDefined();
      expect(earlyMoveOutReview.isEarlyTermination).toBe(true);
      expect(earlyMoveOutReview.excludeFromAggregates).toBe(false);
    });

    test('should create TERMINATED_24H reviews with excludeFromAggregates flag', async () => {
      const effectiveDate = new Date(Date.now() + 25 * 60 * 60 * 1000); // 25 hours from now

      // Issue 24-hour termination notice
      const response = await request(app)
        .post(`/api/leases/${testLease.id}/terminate-24h`)
        .set('Authorization', authToken2)
        .send({
          reason: 'Property maintenance required',
          effectiveDate: effectiveDate.toISOString()
        });

      expect(response.status).toBe(200);

      // Verify that TERMINATED_24H reviews were created
      const reviews = await prisma.review.findMany({
        where: {
          leaseId: testLease.id,
          reviewStage: 'END_OF_LEASE'
        }
      });

      expect(reviews).toHaveLength(2);
      
      // Check that all reviews have excludeFromAggregates flag
      reviews.forEach(review => {
        expect(review.isEarlyTermination).toBe(true);
        expect(review.earlyTerminationReason).toBe('TERMINATED_24H');
        expect(review.excludeFromAggregates).toBe(true);
      });
    });

    test('should create TERMINATED reviews with excludeFromAggregates flag', async () => {
      // Update lease status to TERMINATED
      const response = await request(app)
        .patch(`/api/leases/${testLease.id}/status`)
        .set('Authorization', authToken2)
        .send({
          newStatus: 'TERMINATED',
          reason: 'Lease violation'
        });

      expect(response.status).toBe(200);

      // Verify that TERMINATED reviews were created
      const reviews = await prisma.review.findMany({
        where: {
          leaseId: testLease.id,
          reviewStage: 'END_OF_LEASE'
        }
      });

      expect(reviews).toHaveLength(2);
      
      // Check that all reviews have excludeFromAggregates flag
      reviews.forEach(review => {
        expect(review.isEarlyTermination).toBe(true);
        expect(review.earlyTerminationReason).toBe('TERMINATED');
        expect(review.excludeFromAggregates).toBe(true);
      });
    });
  });

  describe('Early Move-Out Handling', () => {
    test('should process early move-out request correctly', async () => {
      const response = await request(app)
        .post(`/api/leases/${testLease.id}/early-moveout`)
        .set('Authorization', authToken1)
        .send({
          reason: 'Family emergency',
          effectiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lease.status).toBe('ENDED');

      // Verify early move-out reviews were created
      const reviews = await prisma.review.findMany({
        where: {
          leaseId: testLease.id,
          reviewStage: 'END_OF_LEASE'
        }
      });

      expect(reviews.length).toBeGreaterThanOrEqual(2);
      
      const earlyMoveOutReview = reviews.find(
        r => r.earlyTerminationReason === 'EARLY_MOVE_OUT'
      );
      expect(earlyMoveOutReview).toBeDefined();
      expect(earlyMoveOutReview.comment).toContain('Early move-out review: Family emergency');
    });

    test('should reject early move-out with past effective date', async () => {
      const response = await request(app)
        .post(`/api/leases/${testLease.id}/early-moveout`)
        .set('Authorization', authToken1)
        .send({
          reason: 'Invalid date',
          effectiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid effective date');
    });
  });

  describe('24-Hour Termination Handling', () => {
    test('should process 24-hour termination notice correctly', async () => {
      const effectiveDate = new Date(Date.now() + 30 * 60 * 60 * 1000); // 30 hours from now

      const response = await request(app)
        .post(`/api/leases/${testLease.id}/terminate-24h`)
        .set('Authorization', authToken2)
        .send({
          reason: 'Property damage',
          effectiveDate: effectiveDate.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lease.status).toBe('TERMINATED_24H');

      // Verify termination details
      expect(response.body.data.termination24H.reason).toBe('Property damage');
      expect(new Date(response.body.data.termination24H.effectiveDate)).toEqual(effectiveDate);
    });

    test('should reject 24-hour termination with insufficient notice', async () => {
      const effectiveDate = new Date(Date.now() + 20 * 60 * 60 * 1000); // 20 hours from now

      const response = await request(app)
        .post(`/api/leases/${testLease.id}/terminate-24h`)
        .set('Authorization', authToken2)
        .send({
          reason: 'Insufficient notice',
          effectiveDate: effectiveDate.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid effective date');
    });

    test('should reject 24-hour termination from non-landlord', async () => {
      const effectiveDate = new Date(Date.now() + 30 * 60 * 60 * 1000);

      const response = await request(app)
        .post(`/api/leases/${testLease.id}/terminate-24h`)
        .set('Authorization', authToken1) // Tenant trying to terminate
        .send({
          reason: 'Unauthorized termination',
          effectiveDate: effectiveDate.toISOString()
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Review Aggregation Exclusion', () => {
    test('should exclude early termination reviews from aggregates', async () => {
      // Create a TERMINATED_24H lease
      await request(app)
        .post(`/api/leases/${testLease.id}/terminate-24h`)
        .set('Authorization', authToken2)
        .send({
          reason: 'Test termination',
          effectiveDate: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString()
        });

      // Get excluded review IDs
      const excludedReviewIds = await leaseEventService.getExcludedReviewIds(testUser1.id);
      expect(excludedReviewIds.length).toBeGreaterThan(0);

      // Verify the reviews are marked for exclusion
      const excludedReviews = await prisma.review.findMany({
        where: {
          id: { in: excludedReviewIds }
        }
      });

      excludedReviews.forEach(review => {
        expect(review.excludeFromAggregates).toBe(true);
        expect(review.isEarlyTermination).toBe(true);
      });
    });
  });

  describe('Lease Status History', () => {
    test('should return lease status history with related reviews', async () => {
      // First, change lease status to ENDED
      await request(app)
        .patch(`/api/leases/${testLease.id}/status`)
        .set('Authorization', authToken2)
        .send({
          newStatus: 'ENDED',
          reason: 'Lease completed'
        });

      // Get lease status history
      const response = await request(app)
        .get(`/api/leases/${testLease.id}/status-history`)
        .set('Authorization', authToken1);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lease.status).toBe('ENDED');
      expect(response.body.data.reviews).toBeDefined();
      expect(response.body.data.statusInfo).toBeDefined();
    });

    test('should reject access to lease status history for unauthorized users', async () => {
      // Create another user who doesn't have access to this lease
      const unauthorizedUser = await prisma.user.create({
        data: {
          id: 'test-user-3',
          name: 'Unauthorized User',
          email: 'unauthorized@example.com',
          password: 'hashedpassword',
          role: 'TENANT'
        }
      });

      const unauthorizedToken = `Bearer test-token-${unauthorizedUser.id}`;

      const response = await request(app)
        .get(`/api/leases/${testLease.id}/status-history`)
        .set('Authorization', unauthorizedToken);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');

      // Clean up
      await prisma.user.delete({ where: { id: unauthorizedUser.id } });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing required fields gracefully', async () => {
      const response = await request(app)
        .patch(`/api/leases/${testLease.id}/status`)
        .set('Authorization', authToken2)
        .send({
          // Missing newStatus
          reason: 'Test reason'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('should handle invalid status transitions gracefully', async () => {
      const response = await request(app)
        .patch(`/api/leases/${testLease.id}/status`)
        .set('Authorization', authToken2)
        .send({
          newStatus: 'INVALID_STATUS',
          reason: 'Test reason'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status');
    });

    test('should handle lease not found gracefully', async () => {
      const response = await request(app)
        .patch('/api/leases/nonexistent-lease/status')
        .set('Authorization', authToken2)
        .send({
          newStatus: 'ENDED',
          reason: 'Test reason'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Lease not found');
    });
  });
});
