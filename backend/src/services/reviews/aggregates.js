/**
 * 📊 Review Aggregates Service
 * 
 * This service handles the computation of user review aggregates with
 * time-weighted calculations for END_OF_LEASE reviews.
 */

import { prisma } from '../../utils/prisma.js';

/**
 * Compute user aggregate based on published END_OF_LEASE reviews
 * with time-weighted calculations
 */
export async function computeUserAggregate(userId) {
  try {
    console.log(`🧮 Computing user aggregate for user: ${userId}`);

    // Get all published END_OF_LEASE reviews for this user
    const publishedReviews = await prisma.review.findMany({
      where: {
        targetTenantGroupId: {
          not: null
        },
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE',
        excludeFromAggregates: false, // Exclude early termination reviews
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
      console.log(`ℹ️  No published END_OF_LEASE reviews found for user ${userId}`);
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

    console.log(`✅ Updated user ${userId} aggregate: rating=${averageRating}, totalReviews=${weightedResult.totalReviews}`);

    return {
      userId: userId,
      averageRating: averageRating,
      totalReviews: weightedResult.totalReviews,
      weightedScore: weightedResult.weightedScore,
      lastReviewDate: weightedResult.lastReviewDate,
      updatedAt: updatedUser.updatedAt
    };

  } catch (error) {
    console.error(`❌ Error computing user aggregate for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Calculate time-weighted average for reviews
 */
function calculateTimeWeightedAverage(reviews) {
  const now = new Date();
  let totalWeightedRating = 0;
  let totalWeight = 0;
  let lastReviewDate = null;

  reviews.forEach((review) => {
    const monthsAgo = calculateMonthsDifference(review.publishedAt, now);
    const weight = calculateTimeWeight(monthsAgo);
    
    totalWeightedRating += review.rating * weight;
    totalWeight += weight;

    if (!lastReviewDate || review.publishedAt > lastReviewDate) {
      lastReviewDate = review.publishedAt;
    }
  });

  const weightedAverage = totalWeight > 0 ? totalWeightedRating / totalWeight : 0;
  const weightedScore = calculateWeightedScore(reviews, weightedAverage);

  return {
    weightedAverage,
    totalReviews: reviews.length,
    weightedScore,
    lastReviewDate
  };
}

/**
 * Calculate months difference between two dates
 */
function calculateMonthsDifference(date1, date2) {
  const yearDiff = date2.getFullYear() - date1.getFullYear();
  const monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * Calculate time weight based on months ago
 * More recent reviews get higher weight
 */
function calculateTimeWeight(monthsAgo) {
  if (monthsAgo <= 6) return 1.0;      // Last 6 months: full weight
  if (monthsAgo <= 12) return 0.8;     // 6-12 months: 80% weight
  if (monthsAgo <= 24) return 0.6;     // 1-2 years: 60% weight
  if (monthsAgo <= 36) return 0.4;     // 2-3 years: 40% weight
  return 0.2;                           // 3+ years: 20% weight
}

/**
 * Calculate weighted score based on rating and recency
 */
function calculateWeightedScore(reviews, averageRating) {
  if (reviews.length === 0) return 0;
  
  const recencyBonus = calculateRecencyBonus(reviews);
  const volumeBonus = calculateVolumeBonus(reviews.length);
  
  return (averageRating * 0.7) + (recencyBonus * 0.2) + (volumeBonus * 0.1);
}

/**
 * Calculate recency bonus based on most recent review
 */
function calculateRecencyBonus(reviews) {
  if (reviews.length === 0) return 0;
  
  const mostRecent = reviews[0];
  const monthsAgo = calculateMonthsDifference(mostRecent.publishedAt, new Date());
  
  if (monthsAgo <= 3) return 1.0;      // Last 3 months: full bonus
  if (monthsAgo <= 6) return 0.8;      // 3-6 months: 80% bonus
  if (monthsAgo <= 12) return 0.6;     // 6-12 months: 60% bonus
  return 0.4;                           // 12+ months: 40% bonus
}

/**
 * Calculate volume bonus based on number of reviews
 */
function calculateVolumeBonus(reviewCount) {
  if (reviewCount >= 10) return 1.0;   // 10+ reviews: full bonus
  if (reviewCount >= 5) return 0.8;    // 5-9 reviews: 80% bonus
  if (reviewCount >= 3) return 0.6;    // 3-4 reviews: 60% bonus
  if (reviewCount >= 1) return 0.4;    // 1-2 reviews: 40% bonus
  return 0;                             // 0 reviews: no bonus
}

/**
 * Create empty aggregate for user with no reviews
 */
async function createEmptyAggregate(userId) {
  const updatedUser = await prisma.user.update({
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
    updatedAt: updatedUser.updatedAt
  };
}

/**
 * Compute aggregate for tenant group (multiple users)
 */
export async function computeTenantGroupAggregate(tenantGroupId) {
  try {
    console.log(`🧮 Computing tenant group aggregate: ${tenantGroupId}`);

    const tenantGroup = await prisma.tenantGroup.findUnique({
      where: { id: tenantGroupId },
      include: {
        members: true
      }
    });

    if (!tenantGroup || tenantGroup.members.length === 0) {
      console.log(`ℹ️  No members found in tenant group: ${tenantGroupId}`);
      return null;
    }

    // Get all published END_OF_LEASE reviews for this tenant group
    const publishedReviews = await prisma.review.findMany({
      where: {
        targetTenantGroupId: tenantGroupId,
        status: 'PUBLISHED',
        reviewStage: 'END_OF_LEASE',
        excludeFromAggregates: false // Exclude early termination reviews
      },
      select: {
        id: true,
        rating: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    if (publishedReviews.length === 0) {
      console.log(`ℹ️  No published reviews found for tenant group: ${tenantGroupId}`);
      return null;
    }

    // Calculate aggregate for the group
    const weightedResult = calculateTimeWeightedAverage(publishedReviews);
    
    const result = {
      tenantGroupId,
      averageRating: weightedResult.totalReviews >= 3 ? weightedResult.weightedAverage : null,
      totalReviews: weightedResult.totalReviews,
      weightedScore: weightedResult.weightedScore,
      lastReviewDate: weightedResult.lastReviewDate,
      memberCount: tenantGroup.members.length
    };

    console.log(`✅ Tenant group aggregate computed: ${tenantGroupId}`);
    return result;

  } catch (error) {
    console.error(`❌ Error computing tenant group aggregate:`, error);
    throw error;
  }
}

/**
 * Get all reviews that should be excluded from aggregates
 */
export async function getExcludedReviews() {
  try {
    const excludedReviews = await prisma.review.findMany({
      where: {
        excludeFromAggregates: true
      },
      select: {
        id: true,
        leaseId: true,
        reviewerId: true,
        revieweeId: true,
        reviewStage: true,
        earlyTerminationReason: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return excludedReviews;
  } catch (error) {
    console.error(`❌ Error getting excluded reviews:`, error);
    return [];
  }
}


