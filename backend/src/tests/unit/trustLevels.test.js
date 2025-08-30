const { PrismaClient } = require('@prisma/client');

// Mock Prisma client
const mockPrisma = {
  review: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  dispute: {
    count: jest.fn(),
  },
  property: {
    findFirst: jest.fn(),
    count: jest.fn(),
  },
};

// Mock the entire @prisma/client module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Import the service after mocking
const trustLevelService = require('../../src/services/trustLevels');

describe('Trust Levels Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tenantTrustLevel', () => {
    test('should return New level for user with no reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.tenantTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain('No reviews yet');
      expect(result.metrics.reviewCount).toBe(0);
      expect(result.metrics.averageRating).toBe(0);
    });

    test('should return Reliable level for user with 3+ reviews, 3.5+ rating, 80%+ on-time', async () => {
      const reviews = [
        { stars: 4, createdAt: new Date() },
        { stars: 3, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
      ];
      const payments = [
        { dueDate: new Date('2024-01-01'), paidAt: new Date('2024-01-01') }, // on time
        { dueDate: new Date('2024-01-02'), paidAt: new Date('2024-01-02') }, // on time
        { dueDate: new Date('2024-01-03'), paidAt: new Date('2024-01-01') }, // on time (paid early)
      ];

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.payment.findMany.mockResolvedValue(payments);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.tenantTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('Reliable');
      expect(result.reasons).toContain('Minimum review count met (3)');
      expect(result.reasons).toContain('Acceptable average rating (3.7)');
      expect(result.reasons).toContain('Good on-time payment rate (100.0%)');
      expect(result.metrics.reviewCount).toBe(3);
      expect(result.metrics.averageRating).toBeCloseTo(3.67, 1);
      expect(result.metrics.onTimePercentage).toBe(100);
    });

    test('should return Trusted level for user with 10+ reviews, 4.2+ rating, 95%+ on-time', async () => {
      const reviews = Array.from({ length: 12 }, (_, i) => ({
        stars: i < 6 ? 5 : 4, // Mix of 4s and 5s to get average >= 4.2
        createdAt: new Date(),
      }));
      const payments = Array.from({ length: 20 }, (_, i) => ({
        dueDate: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        paidAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`), // all on time
      }));

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.payment.findMany.mockResolvedValue(payments);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.tenantTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('Trusted');
      expect(result.reasons).toContain('Good review count (12)');
      expect(result.reasons).toContain('High average rating (4.5)');
      expect(result.reasons).toContain(
        'Excellent on-time payment rate (100.0%)'
      );
      expect(result.metrics.reviewCount).toBe(12);
      expect(result.metrics.averageRating).toBe(4.5);
      expect(result.metrics.onTimePercentage).toBe(100);
    });

    test('should return Excellent level for user with 25+ reviews, 4.8+ rating, 0 unresolved issues', async () => {
      const reviews = Array.from({ length: 30 }, (_, i) => ({
        stars: 5,
        createdAt: new Date(),
      }));

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.tenantTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('Excellent');
      expect(result.reasons).toContain('High review count (30)');
      expect(result.reasons).toContain('Excellent average rating (5.0)');
      expect(result.reasons).toContain('No unresolved issues');
      expect(result.metrics.reviewCount).toBe(30);
      expect(result.metrics.averageRating).toBe(5);
      expect(result.metrics.unresolvedIssues).toBe(0);
    });

    test('should return New level when below Reliable thresholds', async () => {
      const reviews = [
        { stars: 2, createdAt: new Date() },
        { stars: 3, createdAt: new Date() },
      ];
      const payments = [
        { dueDate: new Date('2024-01-01'), paidAt: new Date('2024-01-05') }, // late
        { dueDate: new Date('2024-01-02'), paidAt: new Date('2024-01-02') }, // on time
      ];

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.payment.findMany.mockResolvedValue(payments);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.tenantTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain('Insufficient reviews (2/3)');
      expect(result.reasons).toContain('Rating below threshold (2.5/3.5)');
      expect(result.reasons).toContain(
        'On-time rate below threshold (50.0%/80%)'
      );
    });

    test('should handle edge case with no payments', async () => {
      const reviews = [
        { stars: 4, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
      ];

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.tenantTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain(
        'On-time rate below threshold (0.0%/80%)'
      );
      expect(result.metrics.onTimePercentage).toBe(0);
    });
  });

  describe('landlordTrustLevel', () => {
    test('should return New level for user with no reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.landlordTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain('No reviews yet');
      expect(result.metrics.reviewCount).toBe(0);
      expect(result.metrics.averageRating).toBe(0);
    });

    test('should return Reliable level for user with 3+ reviews, 80%+ accuracy', async () => {
      const endOfLeaseReviews = [
        { stars: 4, createdAt: new Date() },
        { stars: 3, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
      ];
      const moveInReviews = [
        { stars: 4, createdAt: new Date() }, // accurate (4+ stars)
        { stars: 5, createdAt: new Date() }, // accurate (4+ stars)
        { stars: 5, createdAt: new Date() }, // accurate (4+ stars) - 100% accuracy
      ];

      mockPrisma.review.findMany
        .mockResolvedValueOnce(endOfLeaseReviews) // first call for END_OF_LEASE
        .mockResolvedValueOnce(moveInReviews); // second call for MOVE_IN
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.landlordTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('Reliable');
      expect(result.reasons).toContain('Minimum review count met (3)');
      expect(result.reasons).toContain('Good accuracy rate (100.0%)');
      expect(result.metrics.reviewCount).toBe(3);
      expect(result.metrics.accuracyPercentage).toBe(100);
    });

    test('should return Trusted level for user with 10+ reviews, 95%+ accuracy, 4.2+ rating', async () => {
      const endOfLeaseReviews = Array.from({ length: 15 }, (_, i) => ({
        stars: i < 8 ? 5 : 4, // Mix of 4s and 5s to get average >= 4.2
        createdAt: new Date(),
      }));
      const moveInReviews = Array.from({ length: 20 }, (_, i) => ({
        stars: i < 19 ? 5 : 3, // 19 out of 20 are accurate (95%)
      }));

      mockPrisma.review.findMany
        .mockResolvedValueOnce(endOfLeaseReviews)
        .mockResolvedValueOnce(moveInReviews);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.landlordTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('Trusted');
      expect(result.reasons).toContain('Good review count (15)');
      expect(result.reasons).toContain('Excellent accuracy rate (95.0%)');
      expect(result.reasons).toContain('High average rating (4.5)');
      expect(result.metrics.reviewCount).toBe(15);
      expect(result.metrics.accuracyPercentage).toBe(95);
      expect(result.metrics.averageRating).toBeCloseTo(4.53, 1);
    });

    test('should return Excellent level for user with 25+ reviews, 4.8+ rating, 0 unresolved issues', async () => {
      const endOfLeaseReviews = Array.from({ length: 30 }, (_, i) => ({
        stars: 5,
        createdAt: new Date(),
      }));
      const moveInReviews = Array.from({ length: 10 }, (_, i) => ({
        stars: 5,
        createdAt: new Date(),
      }));

      mockPrisma.review.findMany
        .mockResolvedValueOnce(endOfLeaseReviews)
        .mockResolvedValueOnce(moveInReviews);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.landlordTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('Excellent');
      expect(result.reasons).toContain('High review count (30)');
      expect(result.reasons).toContain('Excellent average rating (5.0)');
      expect(result.reasons).toContain('No unresolved issues');
      expect(result.metrics.reviewCount).toBe(30);
      expect(result.metrics.averageRating).toBe(5);
      expect(result.metrics.unresolvedIssues).toBe(0);
    });

    test('should return New level when below Reliable thresholds', async () => {
      const endOfLeaseReviews = [
        { stars: 4, createdAt: new Date() },
        { stars: 3, createdAt: new Date() },
      ];
      const moveInReviews = [
        { stars: 3, createdAt: new Date() }, // not accurate
        { stars: 2, createdAt: new Date() }, // not accurate
      ];

      mockPrisma.review.findMany
        .mockResolvedValueOnce(endOfLeaseReviews)
        .mockResolvedValueOnce(moveInReviews);
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.landlordTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain('Insufficient reviews (2/3)');
      expect(result.reasons).toContain(
        'Accuracy rate below threshold (0.0%/80%)'
      );
    });

    test('should handle edge case with no move-in reviews', async () => {
      const endOfLeaseReviews = [
        { stars: 4, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
      ];

      mockPrisma.review.findMany
        .mockResolvedValueOnce(endOfLeaseReviews)
        .mockResolvedValueOnce([]); // no move-in reviews
      mockPrisma.dispute.count.mockResolvedValue(0);

      const result = await trustLevelService.landlordTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain(
        'Accuracy rate below threshold (0.0%/80%)'
      );
      expect(result.metrics.accuracyPercentage).toBe(0);
    });
  });

  describe('getUserTrustLevel', () => {
    test('should return tenant trust level for user with only tenant history', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment1' });
      mockPrisma.property.findFirst.mockResolvedValue(null);
      mockPrisma.payment.count.mockResolvedValue(5);
      mockPrisma.property.count.mockResolvedValue(0);

      // Mock tenant trust level response
      const mockTenantResult = {
        level: 'Reliable',
        reasons: ['Test reason'],
        metrics: { reviewCount: 3, averageRating: 4.0 },
      };

      // Mock the tenantTrustLevel function
      const originalTenantTrustLevel = trustLevelService.tenantTrustLevel;
      trustLevelService.tenantTrustLevel = jest
        .fn()
        .mockResolvedValue(mockTenantResult);

      const result = await trustLevelService.getUserTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result).toEqual(mockTenantResult);
      expect(trustLevelService.tenantTrustLevel).toHaveBeenCalledWith(
        'user1',
        mockPrisma
      );

      // Restore original function
      trustLevelService.tenantTrustLevel = originalTenantTrustLevel;
    });

    test('should return landlord trust level for user with only landlord history', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.property.findFirst.mockResolvedValue({ id: 'property1' });
      mockPrisma.payment.count.mockResolvedValue(0);
      mockPrisma.property.count.mockResolvedValue(3);

      // Mock landlord trust level response
      const mockLandlordResult = {
        level: 'Trusted',
        reasons: ['Test reason'],
        metrics: { reviewCount: 10, averageRating: 4.5 },
      };

      // Mock the landlordTrustLevel function
      const originalLandlordTrustLevel = trustLevelService.landlordTrustLevel;
      trustLevelService.landlordTrustLevel = jest
        .fn()
        .mockResolvedValue(mockLandlordResult);

      const result = await trustLevelService.getUserTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result).toEqual(mockLandlordResult);
      expect(trustLevelService.landlordTrustLevel).toHaveBeenCalledWith(
        'user1',
        mockPrisma
      );

      // Restore original function
      trustLevelService.landlordTrustLevel = originalLandlordTrustLevel;
    });

    test('should prioritize tenant role when tenant activity > landlord activity', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment1' });
      mockPrisma.property.findFirst.mockResolvedValue({ id: 'property1' });
      mockPrisma.payment.count.mockResolvedValue(10); // more tenant activity
      mockPrisma.property.count.mockResolvedValue(2);

      const mockTenantResult = {
        level: 'Trusted',
        reasons: ['Test reason'],
        metrics: { reviewCount: 15, averageRating: 4.2 },
      };

      const originalTenantTrustLevel = trustLevelService.tenantTrustLevel;
      trustLevelService.tenantTrustLevel = jest
        .fn()
        .mockResolvedValue(mockTenantResult);

      const result = await trustLevelService.getUserTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result).toEqual(mockTenantResult);
      expect(trustLevelService.tenantTrustLevel).toHaveBeenCalledWith(
        'user1',
        mockPrisma
      );

      trustLevelService.tenantTrustLevel = originalTenantTrustLevel;
    });

    test('should prioritize landlord role when landlord activity > tenant activity', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment1' });
      mockPrisma.property.findFirst.mockResolvedValue({ id: 'property1' });
      mockPrisma.payment.count.mockResolvedValue(2);
      mockPrisma.property.count.mockResolvedValue(8); // more landlord activity

      const mockLandlordResult = {
        level: 'Excellent',
        reasons: ['Test reason'],
        metrics: { reviewCount: 25, averageRating: 4.8 },
      };

      const originalLandlordTrustLevel = trustLevelService.landlordTrustLevel;
      trustLevelService.landlordTrustLevel = jest
        .fn()
        .mockResolvedValue(mockLandlordResult);

      const result = await trustLevelService.getUserTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result).toEqual(mockLandlordResult);
      expect(trustLevelService.landlordTrustLevel).toHaveBeenCalledWith(
        'user1',
        mockPrisma
      );

      trustLevelService.landlordTrustLevel = originalLandlordTrustLevel;
    });

    test('should return New level for user with no rental history', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.property.findFirst.mockResolvedValue(null);

      const result = await trustLevelService.getUserTrustLevel(
        'user1',
        mockPrisma
      );

      expect(result.level).toBe('New');
      expect(result.reasons).toContain('No rental history');
      expect(result.metrics.reviewCount).toBe(0);
      expect(result.metrics.averageRating).toBe(0);
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      mockPrisma.review.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        trustLevelService.tenantTrustLevel('user1', mockPrisma)
      ).rejects.toThrow('Failed to calculate tenant trust level');
    });

    test('should handle missing payment data gracefully', async () => {
      const reviews = [
        { stars: 4, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
        { stars: 4, createdAt: new Date() },
      ];

      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.payment.findMany.mockRejectedValue(
        new Error('Payment table not found')
      );
      mockPrisma.dispute.count.mockResolvedValue(0);

      await expect(
        trustLevelService.tenantTrustLevel('user1', mockPrisma)
      ).rejects.toThrow('Failed to calculate tenant trust level');
    });
  });
});
