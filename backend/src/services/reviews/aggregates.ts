/**
 * 📊 Review Aggregates Service
 * 
 * This service handles the computation of user review aggregates with
 * time-weighted calculations for END_OF_LEASE reviews.
 */

import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';

export interface UserAggregateResult {
  userId: string;
  averageRating: number | null;
  totalReviews: number;
  weightedScore: number;
  lastReviewDate: Date | null;
  updatedAt: Date;
}

export interface TimeWeightedReview {
  rating: number;
  monthsAgo: number;
  weight: number;
}

/**
 * Compute user aggregate based on published END_OF_LEASE reviews
 * with time-weighted calculations
 */
export async function computeUserAggregate(userId: string): Promise<UserAggregateResult> {
  try {
    logger.info(`🧮 Computing user aggregate for user: ${userId}`);

    // Get all published END_OF_LEASE reviews for this user
    const publishedReviews = await prisma.review.findMany({
      where: {
        targetTenantGroupId: {
          not: null
        },
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE',
        targetTenantGroup: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      },
      select: {
        id: true,
        rating: true,
        publishedAt: true,
        targetTenantGroupId: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    if (publishedReviews.length === 0) {
      logger.info(`ℹ️  No published END_OF_LEASE reviews found for user ${userId}`);
      return await createEmptyAggregate(userId);
    }

    // Calculate time-weighted average
    const weightedResult = calculateTimeWeightedAverage(publishedReviews);
    
    // Only store average if we have at least 3 reviews
    const averageRating = weightedResult.totalReviews >= 3 ? weightedResult.weightedAverage : null;

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: averageRating,
        totalReviews: weightedResult.totalReviews,
        updatedAt: new Date()
      }
    });

    logger.info(`✅ Updated user ${userId} aggregate: rating=${averageRating}, totalReviews=${weightedResult.totalReviews}`);

    return {
      userId: userId,
      averageRating: averageRating,
      totalReviews: weightedResult.totalReviews,
      weightedScore: weightedResult.weightedScore,
      lastReviewDate: weightedResult.lastReviewDate,
      updatedAt: updatedUser.updatedAt
    };

  } catch (error) {
    logger.error(`❌ Error computing user aggregate for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Calculate time-weighted average for reviews
 * - Last 12 months: 60% weight
 * - 13-24 months: 30% weight  
 * - Older than 24 months: 10% weight
 */
function calculateTimeWeightedAverage(reviews: Array<{ rating: number; publishedAt: Date }>) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twentyFourMonthsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  let recentWeight = 0;
  let recentSum = 0;
  let mediumWeight = 0;
  let mediumSum = 0;
  let oldWeight = 0;
  let oldSum = 0;

  let lastReviewDate: Date | null = null;

  for (const review of reviews) {
    const monthsAgo = calculateMonthsDifference(review.publishedAt, now);
    
    if (monthsAgo <= 12) {
      // Last 12 months: 60% weight
      recentWeight += 0.6;
      recentSum += review.rating * 0.6;
    } else if (monthsAgo <= 24) {
      // 13-24 months: 30% weight
      mediumWeight += 0.3;
      mediumSum += review.rating * 0.3;
    } else {
      // Older than 24 months: 10% weight
      oldWeight += 0.1;
      oldSum += review.rating * 0.1;
    }

    if (!lastReviewDate || review.publishedAt > lastReviewDate) {
      lastReviewDate = review.publishedAt;
    }
  }

  // Calculate weighted average
  const totalWeight = recentWeight + mediumWeight + oldWeight;
  const weightedAverage = totalWeight > 0 ? (recentSum + mediumSum + oldSum) / totalWeight : 0;
  const weightedScore = weightedAverage;

  logger.info(`📊 Time-weighted calculation for ${reviews.length} reviews:`, {
    recent: { weight: recentWeight, sum: recentSum },
    medium: { weight: mediumWeight, sum: mediumSum },
    old: { weight: oldWeight, sum: oldSum },
    totalWeight,
    weightedAverage: weightedAverage.toFixed(2)
  });

  return {
    weightedAverage: parseFloat(weightedAverage.toFixed(1)),
    totalReviews: reviews.length,
    weightedScore,
    lastReviewDate
  };
}

/**
 * Calculate months difference between two dates
 */
function calculateMonthsDifference(date1: Date, date2: Date): number {
  const yearDiff = date2.getFullYear() - date1.getFullYear();
  const monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * Create empty aggregate result for users with no reviews
 */
async function createEmptyAggregate(userId: string): Promise<UserAggregateResult> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      averageRating: null,
      totalReviews: 0,
      updatedAt: new Date()
    }
  });

  return {
    userId: userId,
    averageRating: null,
    totalReviews: 0,
    weightedScore: 0,
    lastReviewDate: null,
    updatedAt: user.updatedAt
  };
}

/**
 * Get aggregate statistics for multiple users
 */
export async function getBulkUserAggregates(userIds: string[]): Promise<UserAggregateResult[]> {
  try {
    logger.info(`📊 Computing bulk aggregates for ${userIds.length} users`);
    
    const results: UserAggregateResult[] = [];
    
    for (const userId of userIds) {
      try {
        const result = await computeUserAggregate(userId);
        results.push(result);
      } catch (error) {
        logger.error(`❌ Error computing aggregate for user ${userId}:`, error);
        // Continue with other users
      }
    }

    logger.info(`✅ Completed bulk aggregate computation for ${results.length} users`);
    return results;

  } catch (error) {
    logger.error('❌ Error in bulk user aggregates:', error);
    throw error;
  }
}

/**
 * Get user aggregate summary
 */
export async function getUserAggregateSummary(userId: string): Promise<{
  currentRating: number | null;
  totalReviews: number;
  reviewBreakdown: {
    recent: number;
    medium: number;
    old: number;
  };
  lastReviewDate: Date | null;
}> {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        targetTenantGroupId: {
          not: null
        },
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE',
        targetTenantGroup: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      },
      select: {
        rating: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const twentyFourMonthsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

    let recent = 0;
    let medium = 0;
    let old = 0;

    for (const review of reviews) {
      const monthsAgo = calculateMonthsDifference(review.publishedAt, now);
      
      if (monthsAgo <= 12) {
        recent++;
      } else if (monthsAgo <= 24) {
        medium++;
      } else {
        old++;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        averageRating: true,
        totalReviews: true
      }
    });

    return {
      currentRating: user?.averageRating || null,
      totalReviews: user?.totalReviews || 0,
      reviewBreakdown: { recent, medium, old },
      lastReviewDate: reviews.length > 0 ? reviews[0].publishedAt : null
    };

  } catch (error) {
    logger.error(`❌ Error getting user aggregate summary for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Clean up old aggregates (optional maintenance function)
 */
export async function cleanupOldAggregates(monthsOld: number = 36): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    const result = await prisma.review.deleteMany({
      where: {
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE',
        publishedAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`🧹 Cleaned up ${result.count} old END_OF_LEASE reviews older than ${monthsOld} months`);
    return result.count;

  } catch (error) {
    logger.error('❌ Error cleaning up old aggregates:', error);
    throw error;
  }
}

export default {
  computeUserAggregate,
  getBulkUserAggregates,
  getUserAggregateSummary,
  cleanupOldAggregates
};
