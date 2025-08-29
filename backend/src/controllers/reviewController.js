import { prisma } from '../utils/prisma.js';
import reviewService from '../services/reviewService.js';
import { transformReviews, getReviewStageInfo, transformReview } from '../utils/reviewTransformer.js';
import moderationService from '../services/moderation.js';

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
    
    // Get reviews with replies for this user
    const reviewsWithReplies = await prisma.review.findMany({
      where: {
        targetTenantGroup: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      },
      include: {
        reply: {
          include: {
            reviewee: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Add stage information with labels
    const enhancedSummary = {
      ...summary,
      stageInfo: {
        moveIn: getReviewStageInfo('MOVE_IN'),
        endOfLease: getReviewStageInfo('END_OF_LEASE'),
        initial: getReviewStageInfo('INITIAL')
      },
      reviewsWithReplies: reviewsWithReplies
    };
    
    res.json({
      success: true,
      data: enhancedSummary
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
    const validStages = ['MOVE_IN', 'END_OF_LEASE'];
    if (!validStages.includes(reviewStage)) {
      return res.status(400).json({
        error: 'Invalid review stage',
        message: 'Stage must be one of: MOVE_IN, END_OF_LEASE'
      });
    }

    // Moderate the comment text
    const moderationResult = moderationService.moderateReviewText(comment);
    if (!moderationResult.ok) {
      // Create blocked review with redacted text
      const blockedReview = await prisma.review.create({
        data: {
          rating: 0,
          comment: moderationResult.redactedText,
          isAnonymous,
          leaseId,
          reviewStage,
          reviewerId,
          targetTenantGroupId: targetUserId, // Assuming targetUserId maps to tenant group
          revieweeId: targetUserId, // Add revieweeId for the new unique constraint
          status: 'BLOCKED',
          redactedText: moderationResult.redactedText,
          violatesPolicy: true
        }
      });

      // Enqueue for Trust & Safety review
      await moderationService.enqueueTrustAndSafetyReview(
        blockedReview.id,
        comment,
        moderationResult.redactedText,
        moderationResult.reasons
      );

      return res.status(400).json({
        error: 'Content blocked',
        message: 'Your review contains content that violates our community guidelines',
        reasons: moderationResult.reasons,
        reviewId: blockedReview.id
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
      isAnonymous,
      revieweeId: targetUserId // Pass revieweeId for the new unique constraint
    });

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: transformedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    // Check for duplicate review error (unique constraint violation)
    if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
      return res.status(409).json({
        error: 'REVIEW_EXISTS',
        code: 'REVIEW_EXISTS',
        message: 'A review for this lease, stage, and reviewer already exists'
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

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: updatedReview.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: transformedReview
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
    
    // Get pending reviews with replies
    const pendingReviewsWithReplies = await prisma.review.findMany({
      where: {
        reviewerId: userId,
        status: 'PENDING'
      },
      include: {
        reply: {
          include: {
            reviewee: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform pending reviews to include labels
    const transformedPendingReviews = transformReviews(pendingReviews);
    
    // Transform pending reviews with replies
    const transformedPendingReviewsWithReplies = transformReviews(pendingReviewsWithReplies);

    res.json({
      success: true,
      data: transformedPendingReviews,
      dataWithReplies: transformedPendingReviewsWithReplies
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
        },
        reply: {
          include: {
            reviewee: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform reviews to include labels and metadata
    const transformedReviews = transformReviews(reviews);

    res.json({
      success: true,
      data: transformedReviews
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

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.json({
      success: true,
      message: 'User rating initialized successfully',
      data: transformedReview
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
    const validEventTypes = ['MOVE_IN', 'END_OF_LEASE'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(500).json({
        error: 'Invalid event type',
        message: 'Event type must be one of: MOVE_IN, END_OF_LEASE'
      });
    }

    const review = await reviewService.triggerReviewByEvent(eventType, leaseId, tenantId);

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.json({
      success: true,
      message: 'Review triggered successfully',
      data: transformedReview
    });
  } catch (error) {
    console.error('Trigger review by event error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to trigger review'
    });
  }
};

// Create a minimal review (just leaseId and stage)
export const createMinimalReview = async (req, res) => {
  try {
    const { stage } = req.body;
    const { lease } = req; // From canSubmitReview middleware
    const reviewerId = req.user.id;

    // Validate required fields
    if (!stage) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Stage is required'
      });
    }

    // Validate stage
    const validStages = ['MOVE_IN', 'END_OF_LEASE'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        error: 'Invalid review stage',
        message: 'Stage must be one of: MOVE_IN, END_OF_LEASE'
      });
    }

    // Determine targetTenantGroupId based on user role
    let targetTenantGroupId;
    if (req.userRoleInLease === 'TENANT') {
      // Tenant is reviewing the landlord/organization
      // For now, we'll use a placeholder since landlords don't have tenant groups
      // In a real system, you might want to create a system tenant group for landlords
      targetTenantGroupId = 'system-landlord-group';
    } else {
      // Landlord is reviewing the tenant group
      targetTenantGroupId = lease.tenantGroupId;
    }

    // Calculate publishAfter using centralized date utilities
    // publishAfter = addDays(14, leaseEndAtTZ) as per user request
    const { calculatePublishAfter } = await import('../utils/dateUtils.js');
    const publishAfter = calculatePublishAfter(lease.endDate);

    // Create the review
    const review = await prisma.review.create({
      data: {
        leaseId: lease.id,
        reviewerId,
        targetTenantGroupId,
        reviewStage: stage,
        status: 'PENDING',
        publishAfter,
        rating: 0, // Placeholder rating
        comment: '', // Placeholder comment
        isAnonymous: false,
        isDoubleBlind: true
      }
    });

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: transformedReview
    });
  } catch (error) {
    console.error('Create minimal review error:', error);
    
    // Check for duplicate review error (unique constraint violation)
    if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
      return res.status(409).json({
        error: 'Review already exists',
        message: 'A review for this lease, stage, and reviewer already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create review'
    });
  }
};

// Submit a review (set status to SUBMITTED)
export const submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { stars, text } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!stars || !text) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Stars and text are required'
      });
    }

    // Validate stars range
    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        error: 'Invalid stars',
        message: 'Stars must be between 1 and 5'
      });
    }

    // Validate text length
    if (text.length < 1 || text.length > 1000) {
      return res.status(400).json({
        error: 'Invalid text',
        message: 'Text must be between 1 and 1000 characters'
      });
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Validate ownership - user must be the reviewer
    if (review.reviewerId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only submit your own reviews'
      });
    }

    // Check if review is already submitted
    if (review.status === 'SUBMITTED') {
      return res.status(400).json({
        error: 'Review already submitted',
        message: 'This review has already been submitted'
      });
    }

    // Check if review is in a valid state for submission
    if (review.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Invalid review state',
        message: 'Review must be in PENDING state to submit'
      });
    }

    // Moderate the text content
    const moderationResult = moderationService.moderateReviewText(text);
    if (!moderationResult.ok) {
      // Update review to blocked status with redacted text
      const blockedReview = await prisma.review.update({
        where: { id },
        data: {
          comment: moderationResult.redactedText,
          status: 'BLOCKED',
          redactedText: moderationResult.redactedText,
          violatesPolicy: true,
          updatedAt: new Date()
        }
      });

      // Enqueue for Trust & Safety review
      await moderationService.enqueueTrustAndSafetyReview(
        blockedReview.id,
        text,
        moderationResult.redactedText,
        moderationResult.reasons
      );

      return res.status(400).json({
        error: 'Content blocked',
        message: 'Your review text contains content that violates our community guidelines',
        reasons: moderationResult.reasons,
        reviewId: blockedReview.id
      });
    }

    // Update the review with submitted data
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: stars,
        comment: text,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update target user's average rating if applicable
    if (review.targetTenantGroupId) {
      // For tenant group reviews, we might need to update the group's rating
      // This would depend on your business logic for group ratings
      console.log(`Review submitted for tenant group: ${review.targetTenantGroupId}`);
    }

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: updatedReview.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: transformedReview
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit review'
    });
  }
};

// Edit review text (within 24 hours of submission)
export const editReviewText = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!text) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Text is required'
      });
    }

    // Validate text length
    if (text.length < 1 || text.length > 1000) {
      return res.status(400).json({
        error: 'Invalid text',
        message: 'Text must be between 1 and 1000 characters'
      });
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Validate ownership - user must be the reviewer
    if (review.reviewerId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only edit your own reviews'
      });
    }

    // Check if review is submitted
    if (review.status !== 'SUBMITTED') {
      return res.status(400).json({
        error: 'Invalid review state',
        message: 'Review must be in SUBMITTED state to edit text'
      });
    }

    // Check if review has been submitted
    if (!review.submittedAt) {
      return res.status(400).json({
        error: 'Invalid review state',
        message: 'Review must have a submission date to edit text'
      });
    }

    // Check if 24 hours have passed since submission
    const now = new Date();
    const submittedAt = new Date(review.submittedAt);
    const hoursSinceSubmission = (now - submittedAt) / (1000 * 60 * 60);

    if (hoursSinceSubmission >= 24) {
      return res.status(400).json({
        error: 'Edit time expired',
        message: 'Review text can only be edited within 24 hours of submission'
      });
    }

    // Moderate the new text content
    const moderationResult = moderationService.moderateReviewText(text);
    if (!moderationResult.ok) {
      // Update review to blocked status with redacted text
      const blockedReview = await prisma.review.update({
        where: { id },
        data: {
          comment: moderationResult.redactedText,
          status: 'BLOCKED',
          redactedText: moderationResult.redactedText,
          violatesPolicy: true,
          updatedAt: new Date()
        }
      });

      // Enqueue for Trust & Safety review
      await moderationService.enqueueTrustAndSafetyReview(
        blockedReview.id,
        text,
        moderationResult.redactedText,
        moderationResult.reasons
      );

      return res.status(400).json({
        error: 'Content blocked',
        message: 'Your edited review text contains content that violates our community guidelines',
        reasons: moderationResult.reasons,
        reviewId: blockedReview.id
      });
    }

    // Update only the text and updatedAt timestamp
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        comment: text,
        updatedAt: new Date()
      }
    });

    // Get the full review with all fields for transformation
    const fullReview = await prisma.review.findUnique({
      where: { id: updatedReview.id },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    landlord: true
                  }
                }
              }
            },
            tenantGroup: true
          }
        }
      }
    });

    // Transform the review to include labels
    const transformedReview = transformReview(fullReview);

    res.json({
      success: true,
      message: 'Review text updated successfully',
      data: transformedReview
    });
  } catch (error) {
    console.error('Edit review text error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update review text'
    });
  }
};

// Report a review (any party can report)
export const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Reason is required'
      });
    }

    // Validate reason length
    if (reason.length < 1 || reason.length > 200) {
      return res.status(400).json({
        error: 'Invalid reason',
        message: 'Reason must be between 1 and 200 characters'
      });
    }

    // Validate description length if provided
    if (description && (description.length < 1 || description.length > 1000)) {
      return res.status(400).json({
        error: 'Invalid description',
        message: 'Description must be between 1 and 1000 characters'
      });
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Check if user has already reported this review
    const existingReport = await prisma.reviewReport.findFirst({
      where: {
        reviewId: id,
        reporterId: reporterId
      }
    });

    if (existingReport) {
      return res.status(400).json({
        error: 'Already reported',
        message: 'You have already reported this review'
      });
    }

    // Create the report
    const report = await prisma.reviewReport.create({
      data: {
        reviewId: id,
        reporterId: reporterId,
        reason: reason,
        description: description || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review reported successfully',
      data: {
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to report review'
    });
  }
};

// Reply to a review (reviewee only, once)
export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const revieweeId = req.user.id;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Content is required'
      });
    }

    // Validate content length
    if (content.length < 1 || content.length > 1000) {
      return res.status(400).json({
        error: 'Invalid content',
        message: 'Content must be between 1 and 1000 characters'
      });
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        targetTenantGroup: {
          include: {
            members: true
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Check if user is the reviewee (member of target tenant group)
    const isReviewee = review.targetTenantGroup.members.some(
      member => member.userId === revieweeId
    );

    if (!isReviewee) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the reviewee can reply to this review'
      });
    }

    // Check if review already has a reply
    const existingReply = await prisma.reviewReply.findUnique({
      where: { reviewId: id }
    });

    if (existingReply) {
      return res.status(400).json({
        error: 'Reply already exists',
        message: 'This review already has a reply'
      });
    }

    // Moderate the reply content
    const moderationResult = moderationService.moderateReviewText(content);
    if (!moderationResult.ok) {
      return res.status(400).json({
        error: 'Content blocked',
        message: 'Your reply contains content that violates our community guidelines',
        reasons: moderationResult.reasons
      });
    }

    // Create the reply
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: id,
        revieweeId: revieweeId,
        content: content
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      data: {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt
      }
    });
  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create reply'
    });
  }
};

// Edit review reply (within 24 hours)
export const editReviewReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const revieweeId = req.user.id;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Content is required'
      });
    }

    // Validate content length
    if (content.length < 1 || content.length > 1000) {
      return res.status(400).json({
        error: 'Invalid content',
        message: 'Content must be between 1 and 1000 characters'
      });
    }

    // Find the reply
    const reply = await prisma.reviewReply.findUnique({
      where: { reviewId: id }
    });

    if (!reply) {
      return res.status(404).json({
        error: 'Reply not found',
        message: 'The specified reply does not exist'
      });
    }

    // Validate ownership - user must be the reviewee
    if (reply.revieweeId !== revieweeId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only edit your own replies'
      });
    }

    // Check if 24 hours have passed since creation
    const now = new Date();
    const createdAt = new Date(reply.createdAt);
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

    if (hoursSinceCreation >= 24) {
      return res.status(400).json({
        error: 'Edit time expired',
        message: 'Reply can only be edited within 24 hours of creation'
      });
    }

    // Moderate the new content
    const moderationResult = moderationService.moderateReviewText(content);
    if (!moderationResult.ok) {
      return res.status(400).json({
        error: 'Content blocked',
        message: 'Your edited reply contains content that violates our community guidelines',
        reasons: moderationResult.reasons
      });
    }

    // Update the reply
    const updatedReply = await prisma.reviewReply.update({
      where: { reviewId: id },
      data: {
        content: content,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Reply updated successfully',
      data: {
        id: updatedReply.id,
        content: updatedReply.content,
        updatedAt: updatedReply.updatedAt
      }
    });
  } catch (error) {
    console.error('Edit review reply error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update reply'
    });
  }
};

// Redact a review (admin only) - replace text with redactedText, keep stars
export const redactReview = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        targetTenantGroup: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    // Check if review has redactedText (was blocked by moderation)
    if (!review.redactedText) {
      return res.status(400).json({
        error: 'Review cannot be redacted',
        message: 'This review does not have redacted content available'
      });
    }

    // Store original text for audit logging
    const originalText = review.comment || review.text;
    const originalStatus = review.status;

    // Update the review: replace comment with redactedText, set status to PUBLISHED
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        comment: review.redactedText,
        text: review.redactedText, // Also update text alias for compatibility
        status: 'PUBLISHED',
        redactedAt: new Date(),
        redactedBy: adminId
      }
    });

    // Log the redaction action
    const AuditService = await import('../services/auditService.js');
    await AuditService.AuditService.logAction({
      adminId,
      action: 'REVIEW_REDACTED',
      resourceType: 'REVIEW',
      resourceId: id,
      details: {
        originalText,
        originalStatus,
        redactedText: review.redactedText,
        redactedAt: new Date(),
        targetTenantGroupId: review.targetTenantGroupId,
        leaseId: review.leaseId
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // If this is an END_OF_LEASE review, recompute user aggregates
    if (review.reviewStage === 'END_OF_LEASE') {
      try {
        const { computeUserAggregate } = await import('../services/reviews/aggregates.js');
        // Since targetUserId was removed, we need to get it from the tenant group
        const tenantGroup = await prisma.tenantGroup.findUnique({
          where: { id: review.targetTenantGroupId },
          include: { members: { take: 1 } }
        });
        if (tenantGroup?.members?.[0]?.userId) {
          await computeUserAggregate(tenantGroup.members[0].userId);
        }
      } catch (aggregateError) {
        console.error('Failed to recompute user aggregates after redaction:', aggregateError);
        // Don't fail the redaction if aggregate computation fails
      }
    }

    res.json({
      success: true,
      message: 'Review redacted successfully',
      data: {
        id: updatedReview.id,
        comment: updatedReview.comment,
        text: updatedReview.text,
        status: updatedReview.status,
        redactedAt: updatedReview.redactedAt,
        redactedBy: updatedReview.redactedBy
      }
    });
  } catch (error) {
    console.error('Redact review error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to redact review'
    });
  }
};
