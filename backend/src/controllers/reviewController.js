import { prisma } from '../utils/prisma.js';
import reviewService from '../services/reviewService.js';

/**
 * 🏆 REVIEW CONTROLLER - 3-Stage Review System
 */

// Get user's review summary
export const getUserReviewSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Users can only view their own reviews or admin can view all
    if (requestingUserId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own reviews'
      });
    }

    const summary = await reviewService.getUserReviewSummary(userId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get user review summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get review summary'
    });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { leaseId, rating, comment, reviewStage, targetUserId, isAnonymous = false } = req.body;
    const reviewerId = req.user.id;

    // Validate required fields
    if (!leaseId || !rating || !comment || !reviewStage || !targetUserId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Lease ID, rating, comment, review stage, and target user ID are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate stage
    const validStages = ['PAYMENT_COMPLETED', 'MOVE_IN', 'LEASE_END'];
    if (!validStages.includes(reviewStage)) {
      return res.status(400).json({
        error: 'Invalid review stage',
        message: 'Stage must be one of: PAYMENT_COMPLETED, MOVE_IN, LEASE_END'
      });
    }

    // Check if user has access to this lease
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        OR: [
          { tenantId: reviewerId },
          { landlordId: reviewerId }
        ]
      }
    });

    if (!lease) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only review leases you are part of'
      });
    }

    // Create the review
    const review = await reviewService.createStageReview({
      reviewerId,
      targetUserId,
      leaseId,
      rating,
      comment,
      stage: reviewStage,
      isAnonymous
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        error: 'Review already exists',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create review'
    });
  }
};

// Update an existing review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, isAnonymous } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Check if user owns this review
    if (review.reviewerId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own reviews'
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating || review.rating,
        comment: comment || review.comment,
        isAnonymous: isAnonymous !== undefined ? isAnonymous : review.isAnonymous,
        updatedAt: new Date()
      }
    });

    // Update target user's average rating
    await reviewService.updateUserAverageRating(review.targetUserId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update review'
    });
  }
};

// Get pending reviews for a specific user
export const getPendingReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Users can only view their own pending reviews or admin can view all
    if (requestingUserId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own pending reviews'
      });
    }

    const pendingReviews = await reviewService.getPendingReviews(userId);

    res.json({
      success: true,
      data: pendingReviews
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get pending reviews'
    });
  }
};

// Delete a review (admin only)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can delete reviews'
      });
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    });

    // Update target user's average rating
    await reviewService.updateUserAverageRating(review.targetUserId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete review'
    });
  }
};

// Get all reviews for a specific lease (admin/landlord)
export const getLeaseReviews = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this lease
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        OR: [
          { tenantId: userId },
          { unit: { property: { landlordId: userId } } }
        ]
      }
    });

    if (!lease && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this lease'
      });
    }

    // Get reviews for the lease
    const reviews = await prisma.review.findMany({
      where: { leaseId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get lease reviews error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get lease reviews'
    });
  }
};

// Initialize user rating (called when user registers)
export const initializeUserRating = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can initialize user ratings'
      });
    }

    const review = await reviewService.initializeUserRating(userId);

    res.json({
      success: true,
      message: 'User rating initialized successfully',
      data: review
    });
  } catch (error) {
    console.error('Initialize user rating error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to initialize user rating'
    });
  }
};

// Trigger review by event (called by other services)
export const triggerReviewByEvent = async (req, res) => {
  try {
    const { eventType, leaseId, tenantId } = req.body;

    // Validate required fields
    if (!eventType || !leaseId || !tenantId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Event type, lease ID, and tenant ID are required'
      });
    }

    // Validate event type
    const validEventTypes = ['PAYMENT_COMPLETED', 'MOVE_IN', 'LEASE_END'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        error: 'Invalid event type',
        message: 'Event type must be one of: PAYMENT_COMPLETED, MOVE_IN, LEASE_END'
      });
    }

    const review = await reviewService.triggerReviewByEvent(eventType, leaseId, tenantId);

    res.json({
      success: true,
      message: 'Review triggered successfully',
      data: review
    });
  } catch (error) {
    console.error('Trigger review by event error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to trigger review'
    });
  }
};
