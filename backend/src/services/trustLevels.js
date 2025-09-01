import { PrismaClient } from '@prisma/client';

// Default Prisma client for production use
const defaultPrisma = new PrismaClient();

/**
 * Calculate trust level for a tenant based on Option B thresholds
 * @param {string} userId - The tenant's user ID
 * @param {Object} prismaClient - Prisma client instance (optional, uses default if not provided)
 * @returns {Promise<Object>} Trust level with reasons and metrics
 */
async function tenantTrustLevel(userId, prismaClient = defaultPrisma) {
  try {
    // Get tenant's review data
    const reviews = await prismaClient.review.findMany({
      where: {
        revieweeId: userId,
        stage: 'END_OF_LEASE',
        status: 'PUBLISHED',
      },
      select: {
        stars: true,
        createdAt: true,
      },
    });

    // Get rent payment history for on-time percentage
    const rentPayments = await prismaClient.rentPayment.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            tenantGroup: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
        ],
        status: 'SUCCEEDED',
      },
      select: {
        dueDate: true,
        paidDate: true,
      },
    });

    // Calculate metrics
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviewCount
        : 0;

    // Calculate on-time payment percentage
    const onTimePayments = rentPayments.filter((payment) => {
      if (!payment.paidDate || !payment.dueDate) return false;
      return new Date(payment.paidDate) <= new Date(payment.dueDate);
    }).length;
    const onTimePercentage =
      rentPayments.length > 0 ? (onTimePayments / rentPayments.length) * 100 : 0;

    // No dispute system in current schema - set to 0
    const unresolvedDisputes = 0;

    // Determine trust level based on Option B thresholds
    if (reviewCount === 0) {
      return {
        level: 'New',
        reasons: ['No reviews yet'],
        metrics: {
          reviewCount: 0,
          averageRating: 0,
          onTimePercentage: 0,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    if (reviewCount >= 25 && averageRating >= 4.8 && unresolvedDisputes === 0) {
      return {
        level: 'Excellent',
        reasons: [
          `High review count (${reviewCount})`,
          `Excellent average rating (${averageRating.toFixed(1)})`,
          'No unresolved issues',
        ],
        metrics: {
          reviewCount,
          averageRating,
          onTimePercentage,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    if (reviewCount >= 10 && averageRating >= 4.2 && onTimePercentage >= 95) {
      return {
        level: 'Trusted',
        reasons: [
          `Good review count (${reviewCount})`,
          `High average rating (${averageRating.toFixed(1)})`,
          `Excellent on-time payment rate (${onTimePercentage.toFixed(1)}%)`,
        ],
        metrics: {
          reviewCount,
          averageRating,
          onTimePercentage,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    if (reviewCount >= 3 && averageRating >= 3.5 && onTimePercentage >= 80) {
      return {
        level: 'Reliable',
        reasons: [
          `Minimum review count met (${reviewCount})`,
          `Acceptable average rating (${averageRating.toFixed(1)})`,
          `Good on-time payment rate (${onTimePercentage.toFixed(1)}%)`,
        ],
        metrics: {
          reviewCount,
          averageRating,
          onTimePercentage,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    // Below threshold
    return {
      level: 'New',
      reasons: [
        `Insufficient reviews (${reviewCount}/3)`,
        `Rating below threshold (${averageRating.toFixed(1)}/3.5)`,
        `On-time rate below threshold (${onTimePercentage.toFixed(1)}%/80%)`,
      ],
      metrics: {
        reviewCount,
        averageRating,
        onTimePercentage,
        unresolvedIssues: unresolvedDisputes,
      },
    };
  } catch (error) {
    console.error('Error calculating tenant trust level:', error);
    throw new Error('Failed to calculate tenant trust level');
  }
}

/**
 * Calculate trust level for a landlord based on Option B thresholds
 * @param {string} userId - The landlord's user ID
 * @param {Object} prismaClient - Prisma client instance (optional, uses default if not provided)
 * @returns {Promise<Object>} Trust level with reasons and metrics
 */
async function landlordTrustLevel(userId, prismaClient = defaultPrisma) {
  try {
    // Get landlord's review data
    const reviews = await prismaClient.review.findMany({
      where: {
        revieweeId: userId,
        reviewStage: 'END_OF_LEASE',
        status: 'PUBLISHED',
      },
      select: {
        rating: true,
        createdAt: true,
      },
    });

    // Get move-in reviews for accuracy percentage
    const moveInReviews = await prismaClient.review.findMany({
      where: {
        revieweeId: userId,
        reviewStage: 'MOVE_IN',
        status: 'PUBLISHED',
      },
      select: {
        rating: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;

    // Calculate 'as described' accuracy percentage (4+ stars in move-in reviews)
    const accurateMoveIns = moveInReviews.filter(
      (review) => review.rating >= 4
    ).length;
    const accuracyPercentage =
      moveInReviews.length > 0
        ? (accurateMoveIns / moveInReviews.length) * 100
        : 0;

    // No dispute system in current schema - set to 0
    const unresolvedDisputes = 0;

    // Determine trust level based on Option B thresholds
    if (reviewCount === 0) {
      return {
        level: 'New',
        reasons: ['No reviews yet'],
        metrics: {
          reviewCount: 0,
          averageRating: 0,
          accuracyPercentage: 0,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    if (reviewCount >= 25 && averageRating >= 4.8 && unresolvedDisputes === 0) {
      return {
        level: 'Excellent',
        reasons: [
          `High review count (${reviewCount})`,
          `Excellent average rating (${averageRating.toFixed(1)})`,
          'No unresolved issues',
        ],
        metrics: {
          reviewCount,
          averageRating,
          accuracyPercentage,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    if (reviewCount >= 10 && accuracyPercentage >= 95 && averageRating >= 4.2) {
      return {
        level: 'Trusted',
        reasons: [
          `Good review count (${reviewCount})`,
          `Excellent accuracy rate (${accuracyPercentage.toFixed(1)}%)`,
          `High average rating (${averageRating.toFixed(1)})`,
        ],
        metrics: {
          reviewCount,
          averageRating,
          accuracyPercentage,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    if (reviewCount >= 3 && accuracyPercentage >= 80) {
      return {
        level: 'Reliable',
        reasons: [
          `Minimum review count met (${reviewCount})`,
          `Good accuracy rate (${accuracyPercentage.toFixed(1)}%)`,
        ],
        metrics: {
          reviewCount,
          averageRating,
          accuracyPercentage,
          unresolvedIssues: unresolvedDisputes,
        },
      };
    }

    // Below threshold
    return {
      level: 'New',
      reasons: [
        `Insufficient reviews (${reviewCount}/3)`,
        `Accuracy rate below threshold (${accuracyPercentage.toFixed(1)}%/80%)`,
      ],
      metrics: {
        reviewCount,
        averageRating,
        accuracyPercentage,
        unresolvedIssues: unresolvedDisputes,
      },
    };
  } catch (error) {
    console.error('Error calculating landlord trust level:', error);
    throw new Error('Failed to calculate landlord trust level');
  }
}

/**
 * Get trust level for any user (auto-detects tenant vs landlord)
 * @param {string} userId - The user's ID
 * @param {Object} prismaClient - Prisma client instance (optional, uses default if not provided)
 * @returns {Promise<Object>} Trust level with reasons and metrics
 */
async function getUserTrustLevel(userId, prismaClient = defaultPrisma) {
  try {
    // Check if user has been a tenant (has payments)
    const hasTenantHistory = await prismaClient.payment.findFirst({
      where: {
        OR: [
          { userId: userId },
          {
            rentalRequest: {
              tenantGroup: {
                members: {
                  some: {
                    userId: userId,
                  },
                },
              },
            },
          },
        ],
      },
    });

    // Check if user has been a landlord (has properties)
    const hasLandlordHistory = await prismaClient.property.findFirst({
      where: {
        organization: {
          members: {
            some: {
              userId: userId,
              role: 'OWNER',
            },
          },
        },
      },
    });

    // If user has both histories, prioritize the role with more activity
    if (hasTenantHistory && hasLandlordHistory) {
      const tenantPayments = await prismaClient.payment.count({
        where: {
          OR: [
            { userId: userId },
            {
              rentalRequest: {
                tenantGroup: {
                  members: {
                    some: {
                      userId: userId,
                    },
                  },
                },
              },
            },
          ],
        },
      });
      const landlordProperties = await prismaClient.property.count({
        where: {
          organization: {
            members: {
              some: {
                userId: userId,
                role: 'OWNER',
              },
            },
          },
        },
      });

      if (tenantPayments > landlordProperties) {
        return tenantTrustLevel(userId, prismaClient);
      } else {
        return landlordTrustLevel(userId, prismaClient);
      }
    }

    // If only tenant history
    if (hasTenantHistory) {
      return tenantTrustLevel(userId, prismaClient);
    }

    // If only landlord history
    if (hasLandlordHistory) {
      return landlordTrustLevel(userId, prismaClient);
    }

    // No history - return New
    return {
      level: 'New',
      reasons: ['No rental history'],
      metrics: {
        reviewCount: 0,
        averageRating: 0,
      },
    };
  } catch (error) {
    console.error('Error getting user trust level:', error);
    throw new Error('Failed to get user trust level');
  }
}

export { tenantTrustLevel, landlordTrustLevel, getUserTrustLevel };
