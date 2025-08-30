import { jest } from '@jest/globals';
import { prisma } from '../../src/utils/prisma.js';
import leaseEventService from '../../src/services/leaseEventService.js';
import badgeService from '../../src/services/badges.js';

// Mock the services
jest.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    lease: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userBadge: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/badges.js', () => ({
  __esModule: true,
  default: {
    createBadge: jest.fn(),
    awardBadgeToUser: jest.fn(),
  },
}));

describe('LeaseEventService', () => {
  let mockLease;
  let mockTenantGroup;
  let mockProperty;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenantGroup = {
      id: 'tenant-group-1',
      members: [{ userId: 'tenant-1' }, { userId: 'tenant-2' }],
    };

    mockProperty = {
      landlordId: 'landlord-1',
    };

    mockLease = {
      id: 'lease-1',
      status: 'ACTIVE',
      endDate: new Date('2024-12-31T00:00:00Z'), // Add endDate for dateUtils
      tenantGroup: mockTenantGroup,
      property: mockProperty,
    };

    // Default mock implementations
    prisma.lease.findUnique.mockResolvedValue(mockLease);
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.review.create.mockResolvedValue({
      id: 'review-1',
      leaseId: 'lease-1',
      reviewStage: 'END_OF_LEASE',
    });
    prisma.userBadge.findFirst.mockResolvedValue(null);
    badgeService.createBadge.mockResolvedValue({
      id: 'badge-1',
      name: 'EARLY_TERMINATION_HANDLER',
    });
    badgeService.awardBadgeToUser.mockResolvedValue({ success: true });
  });

  describe('handleLeaseStatusChange', () => {
    test('should handle lease ended status', async () => {
      const metadata = { isEarlyMoveOut: false };

      await leaseEventService.handleLeaseStatusChange(
        'lease-1',
        'ACTIVE',
        'ENDED',
        metadata
      );

      expect(prisma.lease.findUnique).toHaveBeenCalledWith({
        where: { id: 'lease-1' },
        include: {
          tenantGroup: {
            include: { members: true },
          },
          property: {
            include: { landlord: true },
          },
        },
      });
    });

    test('should handle TERMINATED_24H status', async () => {
      const metadata = { terminationReason: '24-hour notice' };

      await leaseEventService.handleLeaseStatusChange(
        'lease-1',
        'ACTIVE',
        'TERMINATED_24H',
        metadata
      );

      expect(prisma.lease.findUnique).toHaveBeenCalled();
    });

    test('should handle TERMINATED status', async () => {
      const metadata = { terminationReason: 'Lease terminated' };

      await leaseEventService.handleLeaseStatusChange(
        'lease-1',
        'ACTIVE',
        'TERMINATED',
        metadata
      );

      expect(prisma.lease.findUnique).toHaveBeenCalled();
    });

    test('should handle unknown status gracefully', async () => {
      await leaseEventService.handleLeaseStatusChange(
        'lease-1',
        'ACTIVE',
        'UNKNOWN_STATUS',
        {}
      );

      expect(prisma.lease.findUnique).toHaveBeenCalled();
    });

    test('should handle lease not found gracefully', async () => {
      prisma.lease.findUnique.mockResolvedValue(null);

      // Should not throw, just return early
      await expect(
        leaseEventService.handleLeaseStatusChange(
          'nonexistent-lease',
          'ACTIVE',
          'ENDED',
          {}
        )
      ).resolves.toBeUndefined();
    });
  });

  describe('handleLeaseEnded', () => {
    test('should create end-of-lease reviews for normal termination', async () => {
      const metadata = { isEarlyMoveOut: false };

      await leaseEventService.handleLeaseEnded(mockLease, metadata);

      expect(prisma.review.create).toHaveBeenCalledTimes(2); // Tenant → Landlord + Landlord → Tenant
    });

    test('should create early move-out reviews when specified', async () => {
      const metadata = {
        isEarlyMoveOut: true,
        earlyMoveOutReason: 'Job relocation',
      };

      await leaseEventService.handleLeaseEnded(mockLease, metadata);

      expect(prisma.review.create).toHaveBeenCalledTimes(3); // Normal + early move-out
    });
  });

  describe('handleLeaseTerminated24H', () => {
    test('should create reviews with excludeFromAggregates flag', async () => {
      const metadata = { terminationReason: '24-hour notice' };

      await leaseEventService.handleLeaseTerminated24H(mockLease, metadata);

      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            excludeFromAggregates: true,
            earlyTerminationReason: 'TERMINATED_24H',
          }),
        })
      );
    });

    test('should award early termination badge to tenant', async () => {
      const metadata = { terminationReason: '24-hour notice' };

      await leaseEventService.handleLeaseTerminated24H(mockLease, metadata);

      expect(badgeService.createBadge).toHaveBeenCalledWith({
        name: 'EARLY_TERMINATION_HANDLER',
        description: 'Successfully handled early lease termination',
        criteria: 'Completed lease termination process within 24 hours',
        icon: '⏰',
        color: 'orange',
      });

      expect(badgeService.awardBadgeToUser).toHaveBeenCalledWith(
        'tenant-1',
        'badge-1'
      );
    });

    test('should not award badge if user already has it', async () => {
      prisma.userBadge.findFirst.mockResolvedValue({ id: 'existing-badge' });
      const metadata = { terminationReason: '24-hour notice' };

      await leaseEventService.handleLeaseTerminated24H(mockLease, metadata);

      expect(badgeService.createBadge).not.toHaveBeenCalled();
      expect(badgeService.awardBadgeToUser).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaseTerminated', () => {
    test('should create reviews with excludeFromAggregates flag', async () => {
      const metadata = { terminationReason: 'Lease terminated' };

      await leaseEventService.handleLeaseTerminated(mockLease, metadata);

      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            excludeFromAggregates: true,
            earlyTerminationReason: 'TERMINATED',
          }),
        })
      );
    });
  });

  describe('createEndOfLeaseReviews', () => {
    test('should create tenant → landlord review', async () => {
      const options = {
        isEarlyTermination: false,
        excludeFromAggregates: false,
      };

      await leaseEventService.createEndOfLeaseReviews(mockLease, options);

      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reviewerId: 'tenant-1',
            revieweeId: 'landlord-1',
            reviewStage: 'END_OF_LEASE',
          }),
        })
      );
    });

    test('should create landlord → tenant review', async () => {
      const options = {
        isEarlyTermination: false,
        excludeFromAggregates: false,
      };

      await leaseEventService.createEndOfLeaseReviews(mockLease, options);

      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reviewerId: 'landlord-1',
            revieweeId: 'tenant-1',
            reviewStage: 'END_OF_LEASE',
          }),
        })
      );
    });

    test('should handle missing tenant group gracefully', async () => {
      const leaseWithoutTenantGroup = {
        ...mockLease,
        tenantGroup: null,
      };

      const options = {
        isEarlyTermination: false,
        excludeFromAggregates: false,
      };

      await expect(
        leaseEventService.createEndOfLeaseReviews(
          leaseWithoutTenantGroup,
          options
        )
      ).rejects.toThrow();
    });

    test('should handle missing property gracefully', async () => {
      const leaseWithoutProperty = {
        ...mockLease,
        property: null,
      };

      const options = {
        isEarlyTermination: false,
        excludeFromAggregates: false,
      };

      await expect(
        leaseEventService.createEndOfLeaseReviews(leaseWithoutProperty, options)
      ).rejects.toThrow();
    });
  });

  describe('createEndOfLeaseReview', () => {
    test('should create review with correct data', async () => {
      const options = {
        isEarlyTermination: true,
        earlyTerminationReason: 'EARLY_MOVE_OUT',
        excludeFromAggregates: true,
      };

      await leaseEventService.createEndOfLeaseReview(
        'lease-1',
        'tenant-1',
        'landlord-1',
        'tenant-group-1',
        new Date('2024-01-01'),
        options
      );

      expect(prisma.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leaseId: 'lease-1',
          reviewerId: 'tenant-1',
          revieweeId: 'landlord-1',
          targetTenantGroupId: 'tenant-group-1',
          reviewStage: 'END_OF_LEASE',
          status: 'PENDING',
          isEarlyTermination: true,
          earlyTerminationReason: 'EARLY_MOVE_OUT',
          excludeFromAggregates: true,
          isSystemGenerated: true,
        }),
      });
    });

    test('should return existing review if already exists', async () => {
      const existingReview = { id: 'existing-review' };
      prisma.review.findFirst.mockResolvedValue(existingReview);

      const options = {
        isEarlyTermination: false,
        excludeFromAggregates: false,
      };

      const result = await leaseEventService.createEndOfLeaseReview(
        'lease-1',
        'tenant-1',
        'landlord-1',
        'tenant-group-1',
        new Date('2024-01-01'),
        options
      );

      expect(result).toBe(existingReview);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe('getExcludedReviewIds', () => {
    test('should return array of excluded review IDs', async () => {
      const excludedReviews = [{ id: 'review-1' }, { id: 'review-2' }];

      prisma.review.findMany.mockResolvedValue(excludedReviews);

      const result = await leaseEventService.getExcludedReviewIds('user-1');

      expect(result).toEqual(['review-1', 'review-2']);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { reviewerId: 'user-1', excludeFromAggregates: true },
            { revieweeId: 'user-1', excludeFromAggregates: true },
          ],
        },
        select: { id: true },
      });
    });

    test('should return empty array on error', async () => {
      prisma.review.findMany.mockRejectedValue(new Error('Database error'));

      const result = await leaseEventService.getExcludedReviewIds('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('processLeaseStatusChecks', () => {
    test('should process active leases that have ended', async () => {
      const activeLeases = [
        {
          id: 'lease-1',
          endDate: new Date('2024-01-01'),
          tenantGroup: mockTenantGroup,
          property: mockProperty,
        },
      ];

      prisma.lease.findMany.mockResolvedValue(activeLeases);
      prisma.lease.update.mockResolvedValue({ id: 'lease-1' });

      await leaseEventService.processLeaseStatusChecks();

      expect(prisma.lease.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endDate: { lte: expect.any(Date) },
        },
        include: {
          tenantGroup: {
            include: { members: true },
          },
          property: {
            include: { landlord: true },
          },
        },
      });

      expect(prisma.lease.update).toHaveBeenCalledWith({
        where: { id: 'lease-1' },
        data: { status: 'ENDED' },
      });
    });

    test('should handle errors gracefully and continue processing', async () => {
      const activeLeases = [
        {
          id: 'lease-1',
          endDate: new Date('2024-01-01'),
          tenantGroup: mockTenantGroup,
          property: mockProperty,
        },
      ];

      prisma.lease.findMany.mockResolvedValue(activeLeases);
      prisma.lease.update.mockRejectedValue(new Error('Update failed'));

      // Should not throw due to inner error handling, but should log errors
      await expect(
        leaseEventService.processLeaseStatusChecks()
      ).resolves.toBeUndefined();
    });
  });
});
