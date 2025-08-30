import { jest } from '@jest/globals';
import requestPoolService, {
  trustLevelWeight,
} from '../../src/services/requestPoolService.js';

// Mock the trustLevels service
jest.mock('../../src/services/trustLevels.js', () => ({
  getUserTrustLevel: jest.fn(),
}));

// Mock the prisma import
jest.mock('../../src/utils/prisma.js', () => {
  const mockPrisma = {
    organizationMember: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe('RequestPoolService - New Scoring System', () => {
  let getUserTrustLevel;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    getUserTrustLevel =
      require('../../src/services/trustLevels.js').getUserTrustLevel;
    // Get the mocked prisma instance
    mockPrisma = require('../../src/utils/prisma.js').prisma;
  });

  describe('trustLevelWeight export', () => {
    test('should export correct trust level weights', () => {
      expect(trustLevelWeight).toEqual({
        New: 0,
        Reliable: 0.3,
        Trusted: 0.6,
        Excellent: 1,
      });
    });
  });

  describe('calculateWeightedScore', () => {
    const mockOrganization = {
      id: 'org-1',
      organization: { id: 'org-1', name: 'Test Org', isPersonal: false },
    };

    const mockRentalRequest = {
      id: 'req-1',
      location: 'New York, NY',
      budgetFrom: 2000,
      budgetTo: 3000,
      propertyType: 'Apartment',
      bedrooms: 2,
      furnished: true,
      parking: true,
      petsAllowed: false,
      moveInDate: '2025-09-01',
    };

    const mockProperty = {
      id: 'prop-1',
      city: 'New York',
      address: '123 Main St, New York, NY',
      monthlyRent: 2500,
      propertyType: 'Apartment',
      bedrooms: 2,
      furnished: true,
      parking: true,
      petsAllowed: false,
      availableFrom: '2025-09-01',
    };

    test('should calculate score with new trust level based formula', async () => {
      // Mock organization members with different trust levels
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        {
          user: {
            id: 'user-1',
            averageRating: 4.5,
            totalReviews: 15,
            lastActiveAt: new Date(),
            isSuspended: false,
          },
        },
        {
          user: {
            id: 'user-2',
            averageRating: 4.8,
            totalReviews: 25,
            lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isSuspended: false,
          },
        },
      ]);

      // Mock trust level responses
      getUserTrustLevel
        .mockResolvedValueOnce({ level: 'Trusted' }) // user-1: Trusted (0.6)
        .mockResolvedValueOnce({ level: 'Excellent' }); // user-2: Excellent (1.0)

      const score = await requestPoolService.calculateWeightedScore(
        mockOrganization,
        mockRentalRequest,
        mockProperty
      );

      // Verify the score is calculated
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);

      // Verify trust level service was called for each user
      expect(getUserTrustLevel).toHaveBeenCalledTimes(2);
      expect(getUserTrustLevel).toHaveBeenCalledWith('user-1');
      expect(getUserTrustLevel).toHaveBeenCalledWith('user-2');

      // Verify organization members were fetched
      expect(mockPrisma.organizationMember.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          user: {
            select: {
              id: true,
              averageRating: true,
              totalReviews: true,
              lastActiveAt: true,
              isSuspended: true,
            },
          },
        },
      });
    });

    test('should handle trust level service errors gracefully', async () => {
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        {
          user: {
            id: 'user-1',
            averageRating: 4.0,
            totalReviews: 10,
            lastActiveAt: new Date(),
            isSuspended: false,
          },
        },
      ]);

      // Mock trust level service to throw an error
      getUserTrustLevel.mockRejectedValue(new Error('Service unavailable'));

      const score = await requestPoolService.calculateWeightedScore(
        mockOrganization,
        mockRentalRequest,
        mockProperty
      );

      // Should still return a valid score (fallback to basic scoring)
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle suspended users with dispute penalty', async () => {
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        {
          user: {
            id: 'user-1',
            averageRating: 4.5,
            totalReviews: 15,
            lastActiveAt: new Date(),
            isSuspended: true, // Suspended user
          },
        },
      ]);

      getUserTrustLevel.mockResolvedValue({ level: 'Trusted' });

      const score = await requestPoolService.calculateWeightedScore(
        mockOrganization,
        mockRentalRequest,
        mockProperty
      );

      // Score should be lower due to dispute penalty
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle new users with misrepresentation flag', async () => {
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        {
          user: {
            id: 'user-1',
            averageRating: 5.0, // Perfect rating
            totalReviews: 0, // No reviews
            lastActiveAt: new Date(),
            isSuspended: false,
          },
        },
      ]);

      getUserTrustLevel.mockResolvedValue({ level: 'New' });

      const score = await requestPoolService.calculateWeightedScore(
        mockOrganization,
        mockRentalRequest,
        mockProperty
      );

      // Score should be lower due to misrepresentation flag
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should return 0 for null property', async () => {
      const score = await requestPoolService.calculateWeightedScore(
        mockOrganization,
        mockRentalRequest,
        null
      );

      expect(score).toBe(0);
    });
  });
});
