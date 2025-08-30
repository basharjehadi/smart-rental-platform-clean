/**
 * ⏰ Review Cron Service
 *
 * This service manages scheduled jobs for the review system:
 * - Hourly review publishing
 * - Daily cleanup and maintenance
 */

import cron from 'node-cron';
import { publishReviews, getJobStats } from '../jobs/reviewPublisher.js';

/**
 * Initialize all review-related cron jobs
 */
export function initializeReviewCronJobs() {
  console.log('⏰ Initializing review cron jobs...');

  // Run review publisher every hour (at minute 0)
  cron.schedule(
    '0 * * * *',
    async () => {
      console.log('🕐 Hourly review publisher job triggered');
      try {
        await publishReviews();
        console.log('✅ Hourly review publisher job completed successfully');
      } catch (error) {
        console.error('❌ Hourly review publisher job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC', // Use UTC for consistency
    }
  );

  // Run daily cleanup at 2 AM UTC
  cron.schedule(
    '0 2 * * *',
    async () => {
      console.log('🌅 Daily review cleanup job triggered');
      try {
        await dailyReviewCleanup();
        console.log('✅ Daily review cleanup job completed successfully');
      } catch (error) {
        console.error('❌ Daily review cleanup job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  console.log('✅ Review cron jobs initialized');
  console.log('   - Review publisher: Every hour at minute 0');
  console.log('   - Daily cleanup: Every day at 2:00 AM UTC');
}

/**
 * Daily cleanup and maintenance tasks
 */
async function dailyReviewCleanup() {
  try {
    console.log('🧹 Starting daily review cleanup...');

    // Get current statistics
    const stats = await getJobStats();
    console.log('📊 Current review statistics:', stats);

    // Log any blocked reviews for admin attention
    if (stats.blockedReviews > 0) {
      console.log(
        `⚠️  Found ${stats.blockedReviews} blocked reviews that need admin attention`
      );
    }

    // Log any pending reviews that might be stuck
    if (stats.pendingReviews > 0) {
      console.log(`ℹ️  Found ${stats.pendingReviews} pending reviews`);
    }

    // Log any submitted reviews waiting to be published
    if (stats.submittedReviews > 0) {
      console.log(
        `ℹ️  Found ${stats.submittedReviews} submitted reviews waiting to be published`
      );
    }

    console.log('✅ Daily review cleanup completed');
  } catch (error) {
    console.error('❌ Error in daily review cleanup:', error);
    throw error;
  }
}

/**
 * Manual trigger for review publishing (for testing)
 */
export async function triggerReviewPublishing() {
  console.log('🔧 Manually triggering review publishing...');
  try {
    await publishReviews();
    console.log('✅ Manual review publishing completed');
  } catch (error) {
    console.error('❌ Manual review publishing failed:', error);
    throw error;
  }
}

/**
 * Get cron job status
 */
export function getCronJobStatus() {
  return {
    initialized: true,
    jobs: [
      {
        name: 'Review Publisher',
        schedule: '0 * * * *',
        description: 'Publishes reviews every hour',
        timezone: 'UTC',
      },
      {
        name: 'Daily Cleanup',
        schedule: '0 2 * * *',
        description: 'Daily review cleanup and maintenance',
        timezone: 'UTC',
      },
    ],
  };
}

/**
 * Stop all cron jobs
 */
export function stopReviewCronJobs() {
  console.log('🛑 Stopping review cron jobs...');
  // Note: node-cron doesn't have a built-in stop method
  // In production, you might want to implement a more robust job management system
  console.log('ℹ️  Cron jobs will continue running until process termination');
}

export default {
  initializeReviewCronJobs,
  triggerReviewPublishing,
  getCronJobStatus,
  stopReviewCronJobs,
};
