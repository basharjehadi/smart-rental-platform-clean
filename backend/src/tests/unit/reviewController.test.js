import { jest } from '@jest/globals';
import { prisma } from '../../src/utils/prisma.js';
import reviewService from '../../src/services/reviewService.js';
import moderationService from '../../src/services/moderation.js';

// Mock the services
jest.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    review: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    lease: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/reviewService.js', () => ({
  __esModule: true,
  default: {
    createStageReview: jest.fn(),
  },
}));

jest.mock('../../src/services/moderation.js', () => ({
  __esModule: true,
  default: {
    moderateReviewText: jest.fn(),
    enqueueTrustAndSafetyReview: jest.fn(),
  },
}));

// Mock the review transformer
jest.mock('../../src/utils/reviewTransformer.js', () => ({
  transformReview: jest.fn((review) => ({ ...review, transformed: true })),
}));

import { createReview } from '../../src/controllers/reviewController.js';

describe('ReviewController - createReview', () => {
  let mockRequest;
  let mockResponse;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 'user-1',
      role: 'TENANT',
    };

    mockRequest = {
      body: {
        leaseId: 'lease-1',
        rating: 4,
        comment: 'Great experience!',
        reviewStage: 'MOVE_IN',
        targetUserId: 'user-2',
        isAnonymous: false,
      },
      user: mockUser,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Default mock implementations
    moderationService.moderateReviewText.mockReturnValue({ ok: true });
    prisma.lease.findFirst.mockResolvedValue({
      id: 'lease-1',
      tenantId: 'user-1',
      landlordId: 'user-3',
    });
    reviewService.createStageReview.mockResolvedValue({
      id: 'review-1',
      rating: 4,
      comment: 'Great experience!',
    });
    prisma.review.findUnique.mockResolvedValue({
      id: 'review-1',
      rating: 4,
      comment: 'Great experience!',
    });
  });

  describe('Successful Review Creation', () => {
    test('should create a review successfully with valid data', async () => {
      await createReview(mockRequest, mockResponse);

      expect(reviewService.createStageReview).toHaveBeenCalledWith({
        reviewerId: 'user-1',
        targetUserId: 'user-2',
        leaseId: 'lease-1',
        rating: 4,
        comment: 'Great experience!',
        stage: 'MOVE_IN',
        isAnonymous: false,
        revieweeId: 'user-2',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review created successfully',
        data: expect.objectContaining({
          id: 'review-1',
          transformed: true,
        }),
      });
    });

    test('should handle anonymous reviews', async () => {
      mockRequest.body.isAnonymous = true;

      await createReview(mockRequest, mockResponse);

      expect(reviewService.createStageReview).toHaveBeenCalledWith(
        expect.objectContaining({
          isAnonymous: true,
        })
      );
    });

    test('should handle END_OF_LEASE stage', async () => {
      mockRequest.body.reviewStage = 'END_OF_LEASE';

      await createReview(mockRequest, mockResponse);

      expect(reviewService.createStageReview).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'END_OF_LEASE',
        })
      );
    });
  });

  describe('Input Validation', () => {
    test('should return 400 for missing leaseId', async () => {
      delete mockRequest.body.leaseId;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should return 400 for missing rating', async () => {
      delete mockRequest.body.rating;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should return 400 for missing comment', async () => {
      delete mockRequest.body.comment;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should return 400 for missing reviewStage', async () => {
      delete mockRequest.body.reviewStage;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should return 400 for missing targetUserId', async () => {
      delete mockRequest.body.targetUserId;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should return 400 for invalid rating below 1', async () => {
      mockRequest.body.rating = 0;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5',
      });
    });

    test('should return 400 for invalid rating above 5', async () => {
      mockRequest.body.rating = 6;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5',
      });
    });

    test('should return 400 for invalid reviewStage', async () => {
      mockRequest.body.reviewStage = 'INVALID_STAGE';

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid review stage',
        message: 'Stage must be one of: MOVE_IN, END_OF_LEASE',
      });
    });
  });

  describe('Content Moderation', () => {
    test('should create blocked review when content violates policy', async () => {
      moderationService.moderateReviewText.mockReturnValue({
        ok: false,
        redactedText: 'Redacted content',
        reasons: ['Inappropriate language'],
      });

      prisma.review.create.mockResolvedValue({
        id: 'blocked-review-1',
        status: 'BLOCKED',
      });

      await createReview(mockRequest, mockResponse);

      expect(prisma.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rating: 0,
          comment: 'Redacted content',
          status: 'BLOCKED',
          violatesPolicy: true,
          revieweeId: 'user-2',
        }),
      });

      expect(
        moderationService.enqueueTrustAndSafetyReview
      ).toHaveBeenCalledWith(
        'blocked-review-1',
        'Great experience!',
        'Redacted content',
        ['Inappropriate language']
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Content blocked',
        message:
          'Your review contains content that violates our community guidelines',
        reasons: ['Inappropriate language'],
        reviewId: 'blocked-review-1',
      });
    });
  });

  describe('Lease Access Control', () => {
    test('should return 403 when user is not part of the lease', async () => {
      prisma.lease.findFirst.mockResolvedValue(null);

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'You can only review leases you are part of',
      });
    });

    test('should allow tenant to create review', async () => {
      prisma.lease.findFirst.mockResolvedValue({
        id: 'lease-1',
        tenantId: 'user-1',
        landlordId: 'user-3',
      });

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    test('should allow landlord to create review', async () => {
      mockUser.id = 'user-3';
      mockRequest.user = mockUser;

      prisma.lease.findFirst.mockResolvedValue({
        id: 'lease-1',
        tenantId: 'user-1',
        landlordId: 'user-3',
      });

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Unique Constraint Enforcement', () => {
    test('should return 409 with REVIEW_EXISTS code when duplicate review exists', async () => {
      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';

      reviewService.createStageReview.mockRejectedValue(duplicateError);

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'REVIEW_EXISTS',
        code: 'REVIEW_EXISTS',
        message: 'A review for this lease, stage, and reviewer already exists',
      });
    });

    test('should return 409 for unique constraint violation with different error message', async () => {
      const duplicateError = new Error(
        'Unique constraint violation on fields: leaseId, reviewerId, revieweeId, reviewStage'
      );

      reviewService.createStageReview.mockRejectedValue(duplicateError);

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'REVIEW_EXISTS',
        code: 'REVIEW_EXISTS',
        message: 'A review for this lease, stage, and reviewer already exists',
      });
    });

    test('should return 409 for Prisma unique constraint error', async () => {
      const prismaError = {
        code: 'P2002',
        meta: {
          target: ['leaseId', 'reviewerId', 'revieweeId', 'reviewStage'],
        },
      };

      reviewService.createStageReview.mockRejectedValue(prismaError);

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'REVIEW_EXISTS',
        code: 'REVIEW_EXISTS',
        message: 'A review for this lease, stage, and reviewer already exists',
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 500 for unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      reviewService.createStageReview.mockRejectedValue(unexpectedError);

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to create review',
      });
    });

    test('should handle service errors gracefully', async () => {
      const serviceError = new Error('Review service unavailable');
      reviewService.createStageReview.mockRejectedValue(serviceError);

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to create review',
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty comment string', async () => {
      mockRequest.body.comment = '';

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should handle null values in request body', async () => {
      mockRequest.body.rating = null;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });

    test('should handle undefined values in request body', async () => {
      mockRequest.body.reviewStage = undefined;

      await createReview(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message:
          'Lease ID, rating, comment, review stage, and target user ID are required',
      });
    });
  });
});
