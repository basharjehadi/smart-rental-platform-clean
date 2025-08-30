import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} Badge
 * @property {string} id - Unique badge identifier
 * @property {string} name - Badge display name
 * @property {string} description - Badge description
 * @property {string} category - Badge category (TENANT, HOST, etc.)
 * @property {string} icon - Badge icon identifier
 * @property {string} color - Badge color theme
 * @property {Object} criteria - Badge earning criteria
 * @property {Date} earnedAt - When the badge was earned
 * @property {Object} metadata - Additional badge data
 */

/**
 * @typedef {Object} BadgeCriteria
 * @property {string} type - Criteria type (PERCENTAGE, THRESHOLD, etc.)
 * @property {number} value - Required value to earn badge
 * @property {string} metric - What metric is being measured
 * @property {string} timeframe - Time period for measurement
 */

/**
 * @typedef {Object} UserBadge
 * @property {string} id - Unique user badge identifier
 * @property {string} userId - User who earned the badge
 * @property {string} badgeId - Badge that was earned
 * @property {Date} earnedAt - When the badge was earned
 * @property {Object} metadata - Additional data about earning the badge
 * @property {boolean} isActive - Whether the badge is currently active
 */

// Badge definitions
export const BADGES = {
  TENANT_ON_TIME_12M: {
    id: 'TENANT_ON_TIME_12M',
    name: 'Perfect Payer',
    description: '100% on-time payments for 12 consecutive months',
    category: 'TENANT',
    icon: '💰',
    color: 'gold',
    criteria: {
      type: 'PERCENTAGE',
      value: 100,
      metric: 'on_time_payments',
      timeframe: '12M',
    },
  },
  HOST_ACCURATE_95: {
    id: 'HOST_ACCURATE_95',
    name: 'Accurate Host',
    description: '95%+ move-in "as described" accuracy',
    category: 'HOST',
    icon: '🏠',
    color: 'green',
    criteria: {
      type: 'PERCENTAGE',
      value: 95,
      metric: 'move_in_accuracy',
      timeframe: 'ALL_TIME',
    },
  },
  HOST_RESPONSIVE_24H: {
    id: 'HOST_RESPONSIVE_24H',
    name: 'Quick Responder',
    description: 'Average first response time under 24 hours',
    category: 'HOST',
    icon: '⚡',
    color: 'blue',
    criteria: {
      type: 'THRESHOLD',
      value: 24,
      metric: 'avg_response_time_hours',
      timeframe: 'ALL_TIME',
    },
  },
};

/**
 * Calculate and award badges for a specific user
 * @param {string} userId - User ID to calculate badges for
 * @returns {Promise<Object>} Badge calculation results
 */
export async function calculateUserBadges(userId) {
  try {
    const results = {
      userId,
      badgesEarned: [],
      badgesLost: [],
      totalBadges: 0,
      calculations: {},
    };

    // Calculate each badge type
    const tenantOnTime = await calculateTenantOnTimeBadge(userId);
    const hostAccurate = await calculateHostAccurateBadge(userId);
    const hostResponsive = await calculateHostResponsiveBadge(userId);

    results.calculations = {
      tenantOnTime,
      hostAccurate,
      hostResponsive,
    };

    // Check for new badges earned
    const newBadges = await checkAndAwardBadges(userId, results.calculations);
    results.badgesEarned = newBadges;

    // Get total active badges
    const totalBadges = await getUserActiveBadgeCount(userId);
    results.totalBadges = totalBadges;

    return results;
  } catch (error) {
    console.error('Error calculating user badges:', error);
    throw new Error('Failed to calculate user badges');
  }
}

/**
 * Calculate tenant on-time payment badge eligibility
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Calculation results
 */
async function calculateTenantOnTimeBadge(userId) {
  try {
    // Get user's payment history for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const payments = await prisma.rentPayment.findMany({
      where: {
        userId: userId,
        dueDate: {
          gte: twelveMonthsAgo,
        },
        status: {
          in: ['PAID', 'LATE', 'OVERDUE'],
        },
      },
      select: {
        id: true,
        dueDate: true,
        paidAt: true,
        status: true,
        amount: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    if (payments.length === 0) {
      return {
        eligible: false,
        percentage: 0,
        totalPayments: 0,
        onTimePayments: 0,
        reason: 'No payments in last 12 months',
      };
    }

    // Calculate on-time percentage
    const onTimePayments = payments.filter((payment) => {
      if (payment.status === 'PAID') {
        // Check if paid on or before due date
        return payment.paidAt && payment.paidAt <= payment.dueDate;
      }
      return false;
    }).length;

    const percentage = (onTimePayments / payments.length) * 100;
    const eligible = percentage >= 100;

    return {
      eligible,
      percentage: Math.round(percentage * 100) / 100,
      totalPayments: payments.length,
      onTimePayments,
      reason: eligible
        ? 'Eligible for badge'
        : `Only ${percentage.toFixed(1)}% on-time payments`,
    };
  } catch (error) {
    console.error('Error calculating tenant on-time badge:', error);
    return {
      eligible: false,
      percentage: 0,
      totalPayments: 0,
      onTimePayments: 0,
      reason: 'Error calculating badge eligibility',
    };
  }
}

/**
 * Calculate host accuracy badge eligibility
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Calculation results
 */
async function calculateHostAccurateBadge(userId) {
  try {
    // Get all move-in reviews for properties owned by this user
    const moveInReviews = await prisma.review.findMany({
      where: {
        lease: {
          landlordId: userId,
        },
        reviewStage: 'MOVE_IN',
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        lease: {
          select: {
            property: {
              select: {
                description: true,
              },
            },
          },
        },
      },
    });

    if (moveInReviews.length === 0) {
      return {
        eligible: false,
        percentage: 0,
        totalReviews: 0,
        accurateReviews: 0,
        reason: 'No move-in reviews found',
      };
    }

    // Count reviews that indicate "as described" (high ratings)
    // Consider 4-5 star reviews as "as described"
    const accurateReviews = moveInReviews.filter(
      (review) => review.rating >= 4
    ).length;
    const percentage = (accurateReviews / moveInReviews.length) * 100;
    const eligible = percentage >= 95;

    return {
      eligible,
      percentage: Math.round(percentage * 100) / 100,
      totalReviews: moveInReviews.length,
      accurateReviews,
      reason: eligible
        ? 'Eligible for badge'
        : `Only ${percentage.toFixed(1)}% accuracy`,
    };
  } catch (error) {
    console.error('Error calculating host accurate badge:', error);
    return {
      eligible: false,
      percentage: 0,
      totalReviews: 0,
      accurateReviews: 0,
      reason: 'Error calculating badge eligibility',
    };
  }
}

/**
 * Calculate host responsiveness badge eligibility
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Calculation results
 */
async function calculateHostResponsiveBadge(userId) {
  try {
    // Get all messages where this user is the recipient (as a landlord)
    const messages = await prisma.message.findMany({
      where: {
        recipientId: userId,
        // Only count messages from tenants (not other landlords)
        sender: {
          role: 'TENANT',
        },
      },
      select: {
        id: true,
        createdAt: true,
        conversationId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (messages.length === 0) {
      return {
        eligible: false,
        avgResponseTime: 0,
        totalMessages: 0,
        respondedMessages: 0,
        reason: 'No messages from tenants found',
      };
    }

    // Group messages by conversation to find first responses
    const conversationMap = new Map();
    messages.forEach((message) => {
      if (!conversationMap.has(message.conversationId)) {
        conversationMap.set(message.conversationId, []);
      }
      conversationMap.get(message.conversationId).push(message);
    });

    let totalResponseTime = 0;
    let respondedConversations = 0;

    // Calculate response time for each conversation
    for (const [conversationId, conversationMessages] of conversationMap) {
      if (conversationMessages.length < 2) continue; // Need at least 2 messages

      // Find the first response from the landlord
      const firstTenantMessage = conversationMessages[0];
      const firstLandlordResponse = conversationMessages.find(
        (msg) =>
          msg.id !== firstTenantMessage.id &&
          msg.createdAt > firstTenantMessage.createdAt
      );

      if (firstLandlordResponse) {
        const responseTimeMs =
          firstLandlordResponse.createdAt.getTime() -
          firstTenantMessage.createdAt.getTime();
        const responseTimeHours = responseTimeMs / (1000 * 60 * 60);
        totalResponseTime += responseTimeHours;
        respondedConversations++;
      }
    }

    if (respondedConversations === 0) {
      return {
        eligible: false,
        avgResponseTime: 0,
        totalMessages: 0,
        respondedMessages: 0,
        reason: 'No responses to tenant messages found',
      };
    }

    const avgResponseTime = totalResponseTime / respondedConversations;
    const eligible = avgResponseTime < 24;

    return {
      eligible,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      totalMessages: messages.length,
      respondedMessages: respondedConversations,
      reason: eligible
        ? 'Eligible for badge'
        : `Average response time: ${avgResponseTime.toFixed(1)} hours`,
    };
  } catch (error) {
    console.error('Error calculating host responsive badge:', error);
    return {
      eligible: false,
      avgResponseTime: 0,
      totalMessages: 0,
      respondedMessages: 0,
      reason: 'Error calculating badge eligibility',
    };
  }
}

/**
 * Check and award badges based on calculations
 * @param {string} userId - User ID to award badges to
 * @param {Object} calculations - Badge calculation results
 * @returns {Promise<Array>} Newly awarded badges
 */
async function checkAndAwardBadges(userId, calculations) {
  const newBadges = [];

  try {
    // Check each badge type
    if (calculations.tenantOnTime.eligible) {
      const badge = await awardBadge(
        userId,
        'TENANT_ON_TIME_12M',
        calculations.tenantOnTime
      );
      if (badge) newBadges.push(badge);
    }

    if (calculations.hostAccurate.eligible) {
      const badge = await awardBadge(
        userId,
        'HOST_ACCURATE_95',
        calculations.hostAccurate
      );
      if (badge) newBadges.push(badge);
    }

    if (calculations.hostResponsive.eligible) {
      const badge = await awardBadge(
        userId,
        'HOST_RESPONSIVE_24H',
        calculations.hostResponsive
      );
      if (badge) newBadges.push(badge);
    }

    // Update user profile with badge count
    await updateUserBadgeCount(userId);
  } catch (error) {
    console.error('Error awarding badges:', error);
  }

  return newBadges;
}

/**
 * Award a specific badge to a user
 * @param {string} userId - User ID to award badge to
 * @param {string} badgeId - Badge ID to award
 * @param {Object} metadata - Additional data about earning the badge
 * @returns {Promise<Object|null>} Awarded badge or null if already exists
 */
async function awardBadge(userId, badgeId, metadata) {
  try {
    // Check if user already has this badge
    const existingBadge = await prisma.userBadge.findFirst({
      where: {
        userId,
        badgeId,
        isActive: true,
      },
    });

    if (existingBadge) {
      return null; // Badge already exists
    }

    // Create new badge
    const newBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        earnedAt: new Date(),
        metadata: JSON.stringify(metadata),
        isActive: true,
      },
    });

    console.log(`Badge awarded: ${badgeId} to user ${userId}`);
    return {
      id: newBadge.id,
      badgeId,
      earnedAt: newBadge.earnedAt,
      metadata,
    };
  } catch (error) {
    console.error(`Error awarding badge ${badgeId}:`, error);
    return null;
  }
}

/**
 * Get user's active badge count
 * @param {string} userId - User ID to get badge count for
 * @returns {Promise<number>} Number of active badges
 */
async function getUserActiveBadgeCount(userId) {
  try {
    const count = await prisma.userBadge.count({
      where: {
        userId,
        isActive: true,
      },
    });
    return count;
  } catch (error) {
    console.error('Error getting user badge count:', error);
    return 0;
  }
}

/**
 * Update user profile with current badge count
 * @param {string} userId - User ID to update
 */
async function updateUserBadgeCount(userId) {
  try {
    const badgeCount = await getUserActiveBadgeCount(userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        badgeCount: badgeCount,
      },
    });
  } catch (error) {
    console.error('Error updating user badge count:', error);
  }
}

/**
 * Get all badges for a user
 * @param {string} userId - User ID to get badges for
 * @returns {Promise<Array>} User's badges with details
 */
export async function getUserBadges(userId) {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    return userBadges.map((userBadge) => ({
      id: userBadge.id,
      badgeId: userBadge.badgeId,
      name: BADGES[userBadge.badgeId]?.name || userBadge.badgeId,
      description: BADGES[userBadge.badgeId]?.description || '',
      icon: BADGES[userBadge.badgeId]?.icon || '🏆',
      color: BADGES[userBadge.badgeId]?.color || 'default',
      earnedAt: userBadge.earnedAt,
      metadata: userBadge.metadata ? JSON.parse(userBadge.metadata) : {},
    }));
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

/**
 * Get badge statistics for a user
 * @param {string} userId - User ID to get stats for
 * @returns {Promise<Object>} Badge statistics
 */
export async function getUserBadgeStats(userId) {
  try {
    const totalBadges = await getUserActiveBadgeCount(userId);
    const badges = await getUserBadges(userId);

    // Group badges by category
    const badgesByCategory = badges.reduce((acc, badge) => {
      const category = BADGES[badge.badgeId]?.category || 'OTHER';
      if (!acc[category]) acc[category] = [];
      acc[category].push(badge);
      return acc;
    }, {});

    return {
      totalBadges,
      badgesByCategory,
      recentBadges: badges.slice(0, 5), // Last 5 badges earned
      categories: Object.keys(badgesByCategory),
    };
  } catch (error) {
    console.error('Error getting user badge stats:', error);
    return {
      totalBadges: 0,
      badgesByCategory: {},
      recentBadges: [],
      categories: [],
    };
  }
}

/**
 * Batch calculate badges for multiple users
 * @param {Array<string>} userIds - Array of user IDs to process
 * @returns {Promise<Object>} Results for all users
 */
export async function calculateBadgesForUsers(userIds) {
  const results = {};

  for (const userId of userIds) {
    try {
      results[userId] = await calculateUserBadges(userId);
    } catch (error) {
      console.error(`Error calculating badges for user ${userId}:`, error);
      results[userId] = {
        error: error.message,
        badgesEarned: [],
        badgesLost: [],
        totalBadges: 0,
      };
    }
  }

  return results;
}

/**
 * Get all available badges
 * @returns {Object} All badge definitions
 */
export function getAllBadges() {
  return BADGES;
}

export default {
  calculateUserBadges,
  getUserBadges,
  getUserBadgeStats,
  calculateBadgesForUsers,
  getAllBadges,
};
