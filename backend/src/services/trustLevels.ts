import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TrustLevelResult {
  level: 'New' | 'Reliable' | 'Trusted' | 'Excellent';
  score: number;
  totalReviews: number;
  averageRating: number;
  disputeRate: number;
  unresolvedDisputes: number;
  details: {
    reviewCount: number;
    ratingWeight: number;
    disputePenalty: number;
    finalScore: number;
  };
}

export interface DisputeStats {
  totalDisputes: number;
  resolvedDisputes: number;
  unresolvedDisputes: number;
  disputeRate: number;
}

/**
 * Calculate trust level for a tenant based on their review performance and dispute history
 */
export async function tenantTrustLevel(userId: string): Promise<TrustLevelResult> {
  try {
    // Get user's review aggregates from tenant groups
    const userAggregates = await prisma.userAggregate.findMany({
      where: {
        userId,
        tenantGroup: {
          members: {
            some: { userId }
          }
        }
      },
      include: {
        tenantGroup: true
      }
    });

    if (!userAggregates.length) {
      return {
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

    // Calculate combined metrics across all tenant groups
    let totalReviews = 0;
    let weightedRatingSum = 0;
    let totalWeight = 0;

    for (const aggregate of userAggregates) {
      if (aggregate.totalReviews && aggregate.averageRating) {
        totalReviews += aggregate.totalReviews;
        weightedRatingSum += aggregate.averageRating * aggregate.totalReviews;
        totalWeight += aggregate.totalReviews;
      }
    }

    const averageRating = totalWeight > 0 ? weightedRatingSum / totalWeight : 0;

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
 */
export async function landlordTrustLevel(userId: string): Promise<TrustLevelResult> {
  try {
    // Get landlord's review aggregates
    const userAggregate = await prisma.userAggregate.findUnique({
      where: { userId }
    });

    if (!userAggregate || !userAggregate.totalReviews || !userAggregate.averageRating) {
      return {
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

    const totalReviews = userAggregate.totalReviews;
    const averageRating = userAggregate.averageRating;

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
 */
async function getDisputeStats(userId: string, userType: 'TENANT' | 'LANDLORD'): Promise<DisputeStats> {
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
 */
function calculateTrustLevel(
  totalReviews: number,
  averageRating: number,
  disputeStats: DisputeStats
): Omit<TrustLevelResult, 'totalReviews' | 'averageRating' | 'disputeRate' | 'unresolvedDisputes'> {
  
  // Base score from review count (0-40 points)
  const reviewCountScore = Math.min(totalReviews * 1.6, 40);
  
  // Rating score (0-40 points)
  const ratingScore = Math.max(0, (averageRating - 1) * 10);
  
  // Dispute penalty (0-20 points deducted)
  const disputePenalty = Math.min(20, disputeStats.disputeRate * 0.2);
  
  // Calculate final score
  const finalScore = Math.max(0, reviewCountScore + ratingScore - disputePenalty);
  
  // Determine trust level
  let level: 'New' | 'Reliable' | 'Trusted' | 'Excellent';
  
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
 */
export async function getTrustLevelsForUsers(userIds: string[]): Promise<Record<string, TrustLevelResult>> {
  const results: Record<string, TrustLevelResult> = {};
  
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
