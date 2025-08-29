import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} TrustLevelResult
 * @property {'New' | 'Reliable' | 'Trusted' | 'Excellent'} level
 * @property {number} score
 * @property {number} totalReviews
 * @property {number} averageRating
 * @property {number} disputeRate
 * @property {number} unresolvedDisputes
 * @property {Object} details
 * @property {number} details.reviewCount
 * @property {number} details.ratingWeight
 * @property {number} details.disputePenalty
 * @property {number} details.finalScore
 */

/**
 * @typedef {Object} DisputeStats
 * @property {number} totalDisputes
 * @property {number} resolvedDisputes
 * @property {number} unresolvedDisputes
 * @property {number} disputeRate
 */

/**
 * Calculate trust level for a tenant based on their review performance and dispute history
 * @param {string} userId - The user ID to calculate trust level for
 * @returns {Promise<TrustLevelResult>} The trust level result
 */
export async function tenantTrustLevel(userId) {
  try {
    // Get user's basic rating data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        averageRating: true,
        totalReviews: true,
        rank: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's review aggregates from tenant groups (if they exist)
    const tenantGroupReviews = await prisma.review.findMany({
      where: {
        targetTenantGroup: {
          members: {
            some: { userId }
          }
        },
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE'
      },
      select: {
        rating: true,
        createdAt: true
      }
    });

    // Calculate metrics from actual reviews if available
    let totalReviews = user.totalReviews || 0;
    let averageRating = user.averageRating || 0;

    if (tenantGroupReviews.length > 0) {
      totalReviews = tenantGroupReviews.length;
      const ratingSum = tenantGroupReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = ratingSum / totalReviews;
    }

    // Get dispute statistics
    const disputeStats = await getDisputeStats(userId, 'TENANT');

    // Calculate trust level
    const result = calculateTrustLevel(totalReviews, averageRating, disputeStats);

    return {
      ...result,
      totalReviews,
      averageRating,
      disputeRate: disputeStats.disputeRate,
      unresolvedDisputes: disputeStats.unresolvedDisputes
    };
  } catch (error) {
    console.error('Error calculating tenant trust level:', error);
    throw new Error('Failed to calculate tenant trust level');
  }
}

/**
 * Calculate trust level for a landlord based on their review performance and dispute history
 * @param {string} userId - The user ID to calculate trust level for
 * @returns {Promise<TrustLevelResult>} The trust level result
 */
export async function landlordTrustLevel(userId) {
  try {
    // Get user's basic rating data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        averageRating: true,
        totalReviews: true,
        rank: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get landlord's review aggregates from actual reviews
    const landlordReviews = await prisma.review.findMany({
      where: {
        lease: {
          landlordId: userId
        },
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE'
      },
      select: {
        rating: true,
        createdAt: true
      }
    });

    // Calculate metrics from actual reviews if available
    let totalReviews = user.totalReviews || 0;
    let averageRating = user.averageRating || 0;

    if (landlordReviews.length > 0) {
      totalReviews = landlordReviews.length;
      const ratingSum = landlordReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = ratingSum / totalReviews;
    }

    // Get dispute statistics
    const disputeStats = await getDisputeStats(userId, 'LANDLORD');

    // Calculate trust level
    const result = calculateTrustLevel(totalReviews, averageRating, disputeStats);

    return {
      ...result,
      totalReviews,
      averageRating,
      disputeRate: disputeStats.disputeRate,
      unresolvedDisputes: disputeStats.unresolvedDisputes
    };
  } catch (error) {
    console.error('Error calculating landlord trust level:', error);
    throw new Error('Failed to calculate landlord trust level');
  }
}

/**
 * Get dispute statistics for a user
 * @param {string} userId - The user ID to get dispute stats for
 * @param {string} userType - The type of user ('TENANT' or 'LANDLORD')
 * @returns {Promise<DisputeStats>} The dispute statistics
 */
async function getDisputeStats(userId, userType) {
  try {
    // Check if dispute model exists
    try {
      // Count total disputes involving this user
      const totalDisputes = await prisma.dispute.count({
        where: {
          OR: [
            { tenantId: userId },
            { landlordId: userId }
          ]
        }
      });

      // Count resolved disputes
      const resolvedDisputes = await prisma.dispute.count({
        where: {
          OR: [
            { tenantId: userId },
            { landlordId: userId }
          ],
          status: {
            in: ['RESOLVED', 'CLOSED', 'DISMISSED']
          }
        }
      });

      const unresolvedDisputes = totalDisputes - resolvedDisputes;
      const disputeRate = totalDisputes > 0 ? (unresolvedDisputes / totalDisputes) * 100 : 0;

      return {
        totalDisputes,
        resolvedDisputes,
        unresolvedDisputes,
        disputeRate
      };
    } catch (error) {
      // If dispute model doesn't exist, return default values
      console.log('Dispute model not available, using default dispute stats');
      return {
        totalDisputes: 0,
        resolvedDisputes: 0,
        unresolvedDisputes: 0,
        disputeRate: 0
      };
    }
  } catch (error) {
    console.error('Error getting dispute stats:', error);
    // Return safe defaults if dispute data is unavailable
    return {
      totalDisputes: 0,
      resolvedDisputes: 0,
      unresolvedDisputes: 0,
      disputeRate: 0
    };
  }
}

/**
 * Calculate trust level based on review count, average rating, and dispute statistics
 * @param {number} totalReviews - Total number of reviews
 * @param {number} averageRating - Average rating
 * @param {DisputeStats} disputeStats - Dispute statistics
 * @returns {Object} The trust level result without the full details
 */
function calculateTrustLevel(totalReviews, averageRating, disputeStats) {
  
  // Base score from review count (0-40 points)
  const reviewCountScore = Math.min(totalReviews * 1.6, 40);
  
  // Rating score (0-40 points)
  const ratingScore = Math.max(0, (averageRating - 1) * 10);
  
  // Dispute penalty (0-20 points deducted)
  const disputePenalty = Math.min(20, disputeStats.disputeRate * 0.2);
  
  // Calculate final score
  const finalScore = Math.max(0, reviewCountScore + ratingScore - disputePenalty);
  
  // Determine trust level
  let level;
  
  if (totalReviews < 3) {
    level = 'New';
  } else if (totalReviews >= 3 && averageRating >= 3.5 && disputeStats.disputeRate < 20) {
    level = 'Reliable';
  } else if (totalReviews >= 10 && averageRating >= 4.2 && disputeStats.disputeRate < 10) {
    level = 'Trusted';
  } else if (totalReviews >= 25 && averageRating >= 4.8 && disputeStats.unresolvedDisputes === 0) {
    level = 'Excellent';
  } else {
    // Fallback to Reliable if criteria not met for higher levels
    level = 'Reliable';
  }
  
  return {
    level,
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
    details: {
      reviewCount: Math.round(reviewCountScore * 10) / 10,
      ratingWeight: Math.round(ratingScore * 10) / 10,
      disputePenalty: Math.round(disputePenalty * 10) / 10,
      finalScore: Math.round(finalScore * 10) / 10
    }
  };
}

/**
 * Get trust level summary for multiple users
 * @param {string[]} userIds - Array of user IDs to get trust levels for
 * @returns {Promise<Record<string, TrustLevelResult>>} Object mapping user IDs to trust level results
 */
export async function getTrustLevelsForUsers(userIds) {
  const results = {};
  
  for (const userId of userIds) {
    try {
      // Determine if user is primarily a tenant or landlord
      const tenantGroups = await prisma.tenantGroupMember.count({
        where: { userId }
      });
      
      const landlordLeases = await prisma.lease.count({
        where: { landlordId: userId }
      });
      
      if (tenantGroups > landlordLeases) {
        results[userId] = await tenantTrustLevel(userId);
      } else {
        results[userId] = await landlordTrustLevel(userId);
      }
    } catch (error) {
      console.error(`Error calculating trust level for user ${userId}:`, error);
      // Set default values for failed calculations
      results[userId] = {
        level: 'New',
        score: 0,
        totalReviews: 0,
        averageRating: 0,
        disputeRate: 0,
        unresolvedDisputes: 0,
        details: {
          reviewCount: 0,
          ratingWeight: 0,
          disputePenalty: 0,
          finalScore: 0
        }
      };
    }
  }
  
  return results;
}

export default {
  tenantTrustLevel,
  landlordTrustLevel,
  getTrustLevelsForUsers
};
