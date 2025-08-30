import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    review: {
      create: vi.fn(),
    },
  },
}));

// Mock the canSubmitReview middleware
vi.mock('../../src/middleware/reviews/index.js', () => ({
  canSubmitReview: vi.fn((req, res, next) => next()),
}));

import { createMinimalReview } from '../../src/controllers/reviewController.js';
import { prisma } from '../../src/utils/prisma.js';

describe('createMinimalReview Controller', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockRequest = {
      body: {
        stage: 'MOVE_IN',
      },
      user: {
        id: 'user-123',
        role: 'TENANT',
      },
      lease: {
        id: 'lease-123',
        tenantGroupId: 'tenant-group-123',
        organization: {
          id: 'org-123',
        },
      },
      userRoleInLease: 'TENANT',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 if stage is missing', async () => {
      delete mockRequest.body.stage;

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message: 'Stage is required',
      });
    });

    it('should return 400 if stage is invalid', async () => {
      mockRequest.body.stage = 'INVALID_STAGE';

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid review stage',
        message: 'Stage must be one of: MOVE_IN, END_OF_LEASE',
      });
    });

    it('should accept MOVE_IN stage', async () => {
      mockRequest.body.stage = 'MOVE_IN';
      const mockReview = {
        id: 'review-123',
        status: 'PENDING',
        reviewStage: 'MOVE_IN',
        publishAfter: new Date(),
      };
      prisma.review.create.mockResolvedValue(mockReview);

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review created successfully',
        data: {
          id: mockReview.id,
          status: mockReview.status,
          stage: mockReview.reviewStage,
          publishAfter: mockReview.publishAfter,
        },
      });
    });

    it('should accept END_OF_LEASE stage', async () => {
      mockRequest.body.stage = 'END_OF_LEASE';
      const mockReview = {
        id: 'review-123',
        status: 'PENDING',
        reviewStage: 'END_OF_LEASE',
        publishAfter: new Date(),
      };
      prisma.review.create.mockResolvedValue(mockReview);

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review created successfully',
        data: {
          id: mockReview.id,
          status: mockReview.status,
          stage: mockReview.reviewStage,
          publishAfter: mockReview.publishAfter,
        },
      });
    });
  });

  describe('Review Creation', () => {
    it('should create review with correct data for tenant', async () => {
      const mockReview = {
        id: 'review-123',
        status: 'PENDING',
        reviewStage: 'MOVE_IN',
        publishAfter: new Date(),
      };
      prisma.review.create.mockResolvedValue(mockReview);

      await createMinimalReview(mockRequest, mockResponse);

      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          leaseId: 'lease-123',
          reviewerId: 'user-123',
          targetTenantGroupId: 'system-landlord-group',
          reviewStage: 'MOVE_IN',
          status: 'PENDING',
          publishAfter: expect.any(Date),
          rating: 0,
          comment: '',
          isAnonymous: false,
          isDoubleBlind: true,
        },
      });
    });

    it('should create review with correct data for landlord', async () => {
      mockRequest.userRoleInLease = 'LANDLORD';
      const mockReview = {
        id: 'review-123',
        status: 'PENDING',
        reviewStage: 'MOVE_IN',
        publishAfter: new Date(),
      };
      prisma.review.create.mockResolvedValue(mockReview);

      await createMinimalReview(mockRequest, mockResponse);

      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          leaseId: 'lease-123',
          reviewerId: 'user-123',
          targetTenantGroupId: 'tenant-group-123',
          reviewStage: 'MOVE_IN',
          status: 'PENDING',
          publishAfter: expect.any(Date),
          rating: 0,
          comment: '',
          isAnonymous: false,
          isDoubleBlind: true,
        },
      });
    });

    it('should set publishAfter to 14 days from now', async () => {
      const mockReview = {
        id: 'review-123',
        status: 'PENDING',
        reviewStage: 'MOVE_IN',
        publishAfter: new Date(),
      };
      prisma.review.create.mockResolvedValue(mockReview);

      const beforeCall = new Date();
      await createMinimalReview(mockRequest, mockResponse);
      const afterCall = new Date();

      const createCall = prisma.review.create.mock.calls[0][0];
      const publishAfter = createCall.data.publishAfter;

      // Should be approximately 14 days from now
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 14);

      // Allow for small timing differences (within 1 second)
      expect(
        Math.abs(publishAfter.getTime() - expectedDate.getTime())
      ).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should return 409 for duplicate review', async () => {
      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';
      prisma.review.create.mockRejectedValue(duplicateError);

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Review already exists',
        message: 'A review for this lease, stage, and reviewer already exists',
      });
    });

    it('should return 500 for other errors', async () => {
      const otherError = new Error('Database connection failed');
      prisma.review.create.mockRejectedValue(otherError);

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to create review',
      });
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const mockReview = {
        id: 'review-123',
        status: 'PENDING',
        reviewStage: 'MOVE_IN',
        publishAfter: new Date('2024-01-15'),
      };
      prisma.review.create.mockResolvedValue(mockReview);

      await createMinimalReview(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review created successfully',
        data: {
          id: 'review-123',
          status: 'PENDING',
          stage: 'MOVE_IN',
          publishAfter: new Date('2024-01-15'),
        },
      });
    });
  });
});
