import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} AnonymizationResult
 * @property {string} userId - The ID of the user being anonymized
 * @property {boolean} success - Whether the anonymization was successful
 * @property {string} message - Description of what was anonymized
 * @property {Object} changes - Details of what was changed
 * @property {Date} anonymizedAt - When the anonymization occurred
 */

/**
 * @typedef {Object} AnonymizationChanges
 * @property {boolean} displayNameChanged - Whether display name was changed
 * @property {boolean} avatarChanged - Whether avatar was changed
 * @property {number} reviewsAnonymized - Number of reviews anonymized
 * @property {number} repliesAnonymized - Number of replies anonymized
 * @property {number} reportsAnonymized - Number of reports anonymized
 * @property {number} signalsAnonymized - Number of signals anonymized
 */

/**
 * Anonymize a deleted user by replacing personal information while preserving ratings and content
 * @param {string} userId - The ID of the user to anonymize
 * @returns {Promise<AnonymizationResult>} Result of the anonymization process
 */
export async function anonymizeDeletedUser(userId) {
  const startTime = new Date();
  console.log(`🔄 Starting anonymization for user ${userId} at ${startTime.toISOString()}`);

  try {
    // Verify user exists and is marked as deleted
    const user = await prisma.user.findUnique({
      where: { id: userId },
              select: {
          id: true,
          email: true,
          name: true,
          profileImage: true,
          isDeleted: true,
          deletedAt: true
        }
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (!user.isDeleted) {
      throw new Error(`User ${userId} is not marked as deleted`);
    }

    console.log(`📝 Anonymizing user: ${user.name || user.email} (${userId})`);

    const changes = {
      displayNameChanged: false,
      avatarChanged: false,
      reviewsAnonymized: 0,
      repliesAnonymized: 0,
      reportsAnonymized: 0,
      signalsAnonymized: 0
    };

    // 1. Anonymize user profile
    const profileUpdate = await prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Former user',
        profileImage: null,
        anonymizedAt: new Date()
      }
    });

    if (profileUpdate.name === 'Former user') {
      changes.displayNameChanged = true;
    }
    if (profileUpdate.profileImage === null) {
      changes.avatarChanged = true;
    }

    console.log(`✅ User profile anonymized`);

    // 2. Anonymize reviews (preserve stars and scrubbed text)
    const reviewsResult = await anonymizeUserReviews(userId);
    changes.reviewsAnonymized = reviewsResult.count;

    // 3. Anonymize review replies (preserve content)
    const repliesResult = await anonymizeUserReplies(userId);
    changes.repliesAnonymized = repliesResult.count;

    // 4. Anonymize review reports (preserve reason and status)
    const reportsResult = await anonymizeUserReports(userId);
    changes.reportsAnonymized = reportsResult.count;

    // 5. Anonymize review signals (preserve type and metadata)
    const signalsResult = await anonymizeUserSignals(userId);
    changes.signalsAnonymized = signalsResult.count;

    // 6. Anonymize messages (preserve content but remove sender identity)
    await anonymizeUserMessages(userId);

    // 7. Anonymize audit logs (preserve action details but remove user identity)
    await anonymizeUserAuditLogs(userId);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const result = {
      userId,
      success: true,
      message: `Successfully anonymized user ${userId}`,
      changes,
      anonymizedAt: endTime
    };

    console.log(`✅ Anonymization completed successfully in ${duration}ms`);
    console.log(`📊 Changes made:`, changes);

    return result;

  } catch (error) {
    console.error(`❌ Error anonymizing user ${userId}:`, error);
    
    const result = {
      userId,
      success: false,
      message: `Failed to anonymize user: ${error.message}`,
      changes: {
        displayNameChanged: false,
        avatarChanged: false,
        reviewsAnonymized: 0,
        repliesAnonymized: 0,
        reportsAnonymized: 0,
        signalsAnonymized: 0
      },
      anonymizedAt: new Date()
    };

    return result;
  }
}

/**
 * Anonymize user's reviews while preserving stars and scrubbed text
 * @param {string} userId - User ID to anonymize
 * @returns {Promise<{count: number}>} Number of reviews anonymized
 */
async function anonymizeUserReviews(userId) {
  try {
    const result = await prisma.review.updateMany({
      where: {
        OR: [
          { reviewerId: userId },
          { revieweeId: userId }
        ]
      },
      data: {
        reviewerDisplayName: 'Former user',
        revieweeDisplayName: 'Former user'
      }
    });

    console.log(`✅ Anonymized ${result.count} reviews`);
    return { count: result.count };
  } catch (error) {
    console.error('Error anonymizing reviews:', error);
    return { count: 0 };
  }
}

/**
 * Anonymize user's review replies while preserving content
 * @param {string} userId - User ID to anonymize
 * @returns {Promise<{count: number}>} Number of replies anonymized
 */
async function anonymizeUserReplies(userId) {
  try {
    const result = await prisma.reviewReply.updateMany({
      where: { userId },
      data: {
        userDisplayName: 'Former user'
      }
    });

    console.log(`✅ Anonymized ${result.count} review replies`);
    return { count: result.count };
  } catch (error) {
    console.error('Error anonymizing replies:', error);
    return { count: 0 };
  }
}

/**
 * Anonymize user's review reports while preserving reason and status
 * @param {string} userId - User ID to anonymize
 * @returns {Promise<{count: number}>} Number of reports anonymized
 */
async function anonymizeUserReports(userId) {
  try {
    const result = await prisma.reviewReport.updateMany({
      where: { reporterId: userId },
      data: {
        reporterDisplayName: 'Former user'
      }
    });

    console.log(`✅ Anonymized ${result.count} review reports`);
    return { count: result.count };
  } catch (error) {
    console.error('Error anonymizing reports:', error);
    return { count: 0 };
  }
}

/**
 * Anonymize user's review signals while preserving type and metadata
 * @param {string} userId - User ID to anonymize
 * @returns {Promise<{count: number}>} Number of signals anonymized
 */
async function anonymizeUserSignals(userId) {
  try {
    const result = await prisma.reviewSignal.updateMany({
      where: { userId },
      data: {
        userDisplayName: 'Former user'
      }
    });

    console.log(`✅ Anonymized ${result.count} review signals`);
    return { count: result.count };
  } catch (error) {
    console.error('Error anonymizing signals:', error);
    return { count: 0 };
  }
}

/**
 * Anonymize user's messages while preserving content
 * @param {string} userId - User ID to anonymize
 */
async function anonymizeUserMessages(userId) {
  try {
    // Anonymize messages where user is sender
    const senderResult = await prisma.message.updateMany({
      where: { senderId: userId },
      data: {
        senderDisplayName: 'Former user'
      }
    });

    // Anonymize messages where user is recipient
    const recipientResult = await prisma.message.updateMany({
      where: { recipientId: userId },
      data: {
        recipientDisplayName: 'Former user'
      }
    });

    console.log(`✅ Anonymized ${senderResult.count} sent messages and ${recipientResult.count} received messages`);
  } catch (error) {
    console.error('Error anonymizing messages:', error);
  }
}

/**
 * Anonymize user's audit logs while preserving action details
 * @param {string} userId - User ID to anonymize
 */
async function anonymizeUserAuditLogs(userId) {
  try {
    const result = await prisma.auditLog.updateMany({
      where: { userId },
      data: {
        userDisplayName: 'Former user'
      }
    });

    console.log(`✅ Anonymized ${result.count} audit log entries`);
  } catch (error) {
    console.error('Error anonymizing audit logs:', error);
  }
}

/**
 * Batch anonymize multiple deleted users
 * @param {string[]} userIds - Array of user IDs to anonymize
 * @returns {Promise<AnonymizationResult[]>} Results for all users
 */
export async function anonymizeDeletedUsers(userIds) {
  console.log(`🔄 Starting batch anonymization for ${userIds.length} users`);

  const results = [];

  for (const userId of userIds) {
    try {
      const result = await anonymizeDeletedUser(userId);
      results.push(result);
    } catch (error) {
      console.error(`Error in batch anonymization for user ${userId}:`, error);
      results.push({
        userId,
        success: false,
        message: `Batch anonymization failed: ${error.message}`,
        changes: {
          displayNameChanged: false,
          avatarChanged: false,
          reviewsAnonymized: 0,
          repliesAnonymized: 0,
          reportsAnonymized: 0,
          signalsAnonymized: 0
        },
        anonymizedAt: new Date()
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Batch anonymization completed: ${successCount}/${userIds.length} users successfully anonymized`);

  return results;
}

/**
 * Get anonymization statistics
 * @returns {Promise<Object>} Anonymization statistics
 */
export async function getAnonymizationStats() {
  try {
    const [
      totalAnonymizedUsers,
      totalAnonymizedReviews,
      totalAnonymizedReplies,
      totalAnonymizedReports,
      totalAnonymizedSignals,
      lastAnonymizedUser
    ] = await Promise.all([
      prisma.user.count({ where: { anonymizedAt: { not: null } } }),
      prisma.review.count({ where: { reviewerDisplayName: 'Former user' } }),
      prisma.reviewReply.count({ where: { userDisplayName: 'Former user' } }),
      prisma.reviewReport.count({ where: { reporterDisplayName: 'Former user' } }),
      prisma.reviewSignal.count({ where: { userDisplayName: 'Former user' } }),
      prisma.user.findFirst({
        where: { anonymizedAt: { not: null } },
        orderBy: { anonymizedAt: 'desc' },
        select: { anonymizedAt: true }
      })
    ]);

    return {
      totalAnonymizedUsers,
      totalAnonymizedReviews,
      totalAnonymizedReplies,
      totalAnonymizedReports,
      totalAnonymizedSignals,
      lastAnonymization: lastAnonymizedUser?.anonymizedAt || null
    };
  } catch (error) {
    console.error('Error getting anonymization stats:', error);
    return {
      totalAnonymizedUsers: 0,
      totalAnonymizedReviews: 0,
      totalAnonymizedReplies: 0,
      totalAnonymizedReports: 0,
      totalAnonymizedSignals: 0,
      lastAnonymization: null
    };
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Anonymization worker disconnected from database');
  } catch (error) {
    console.error('❌ Error during anonymization worker cleanup:', error);
  }
}

export default {
  anonymizeDeletedUser,
  anonymizeDeletedUsers,
  getAnonymizationStats,
  cleanup
};
