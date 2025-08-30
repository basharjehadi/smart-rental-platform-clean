import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { calculateBadgesForUsers } from '../services/badges.js';

const prisma = new PrismaClient();

/**
 * Nightly badge calculation job
 * Runs every day at 2:00 AM to calculate and award badges for all users
 */
export async function runBadgeCalculation() {
  const startTime = new Date();
  console.log(
    `🕐 Starting nightly badge calculation at ${startTime.toISOString()}`
  );

  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        isSuspended: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log(`📊 Processing ${users.length} users for badge calculation`);

    if (users.length === 0) {
      console.log('⚠️  No users found for badge calculation');
      return;
    }

    const userIds = users.map((user) => user.id);

    // Calculate badges for all users
    const results = await calculateBadgesForUsers(userIds);

    // Process results and log statistics
    let totalNewBadges = 0;
    let usersWithNewBadges = 0;
    let totalErrors = 0;

    for (const [userId, result] of Object.entries(results)) {
      if (result.error) {
        totalErrors++;
        console.error(`❌ Error for user ${userId}:`, result.error);
      } else {
        if (result.badgesEarned.length > 0) {
          totalNewBadges += result.badgesEarned.length;
          usersWithNewBadges++;

          const user = users.find((u) => u.id === userId);
          console.log(
            `🏆 User ${user?.email || userId} earned ${result.badgesEarned.length} new badge(s):`,
            result.badgesEarned.map((b) => b.badgeId).join(', ')
          );
        }
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`✅ Badge calculation completed in ${duration}ms`);
    console.log(`📊 Summary:`);
    console.log(`   - Total users processed: ${users.length}`);
    console.log(`   - Users with new badges: ${usersWithNewBadges}`);
    console.log(`   - Total new badges awarded: ${totalNewBadges}`);
    console.log(`   - Errors encountered: ${totalErrors}`);

    // Log performance metrics
    if (users.length > 0) {
      const avgTimePerUser = duration / users.length;
      console.log(`   - Average time per user: ${avgTimePerUser.toFixed(2)}ms`);
    }
  } catch (error) {
    console.error('❌ Fatal error in badge calculation job:', error);
    throw error;
  }
}

/**
 * Manual badge calculation trigger
 * Can be called via admin API or manually
 */
export async function triggerBadgeCalculation() {
  console.log('🚀 Manual badge calculation triggered');
  await runBadgeCalculation();
}

/**
 * Calculate badges for a specific user
 * Useful for testing or on-demand calculation
 */
export async function calculateUserBadges(userId) {
  try {
    const { calculateUserBadges } = await import('../services/badges.js');
    const result = await calculateUserBadges(userId);

    console.log(`✅ Badge calculation completed for user ${userId}:`, {
      totalBadges: result.totalBadges,
      newBadges: result.badgesEarned.length,
    });

    return result;
  } catch (error) {
    console.error(`❌ Error calculating badges for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get badge calculation statistics
 */
export async function getBadgeCalculationStats() {
  try {
    const totalUsers = await prisma.user.count({
      where: { isSuspended: false },
    });

    const totalBadges = await prisma.userBadge.count({
      where: { isActive: true },
    });

    const badgesByCategory = await prisma.userBadge.groupBy({
      by: ['badgeId'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    });

    const totalUserBadges = await prisma.userBadge.groupBy({
      by: ['userId'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    });

    const usersWithBadges = totalUserBadges.length;
    const avgBadgesPerUser =
      usersWithBadges > 0 ? totalBadges / usersWithBadges : 0;

    return {
      totalUsers,
      totalBadges,
      usersWithBadges,
      avgBadgesPerUser: Math.round(avgBadgesPerUser * 100) / 100,
      badgesByCategory: badgesByCategory.reduce((acc, item) => {
        acc[item.badgeId] = item._count.id;
        return acc;
      }, {}),
      lastCalculation: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting badge calculation stats:', error);
    throw error;
  }
}

/**
 * Initialize the nightly cron job
 */
export function initializeBadgeCalculationJob() {
  // Schedule badge calculation to run every day at 2:00 AM
  cron.schedule(
    '0 2 * * *',
    async () => {
      console.log('🕐 Nightly badge calculation job triggered');
      try {
        await runBadgeCalculation();
      } catch (error) {
        console.error('❌ Nightly badge calculation job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  console.log('✅ Badge calculation job scheduled: daily at 2:00 AM UTC');
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Badge calculation service disconnected from database');
  } catch (error) {
    console.error('❌ Error during badge calculation cleanup:', error);
  }
}

// Auto-initialize if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting badge calculation service...');

  // Run immediate calculation
  runBadgeCalculation()
    .then(() => {
      console.log('✅ Badge calculation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Badge calculation failed:', error);
      process.exit(1);
    })
    .finally(cleanup);
}

export default {
  runBadgeCalculation,
  triggerBadgeCalculation,
  calculateUserBadges,
  getBadgeCalculationStats,
  initializeBadgeCalculationJob,
  cleanup,
};
