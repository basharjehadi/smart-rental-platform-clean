/**
 * ⏰ Renewal Cron Service
 *
 * This service manages scheduled jobs for the renewal system:
 * - Daily renewal expiration
 * - Cleanup of expired renewals
 */

import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';

/**
 * Expire old renewal requests that have passed their expiration date
 */
async function expireOldRenewals() {
  try {
    console.log('🕐 Starting renewal expiration job...');
    
    const now = new Date();
    const expiredRenewals = await prisma.renewalRequest.updateMany({
      where: {
        status: { in: ['PENDING', 'COUNTERED'] },
        expiresAt: { lt: now }
      },
      data: {
        status: 'EXPIRED',
        decidedAt: now,
      },
    });

    console.log(`✅ Expired ${expiredRenewals.count} renewal requests`);
    return expiredRenewals.count;
  } catch (error) {
    console.error('❌ Error expiring old renewals:', error);
    throw error;
  }
}

/**
 * Initialize all renewal-related cron jobs
 */
export function initializeRenewalCronJobs() {
  console.log('⏰ Initializing renewal cron jobs...');

  // Run renewal expiration every hour (at minute 0)
  cron.schedule(
    '0 * * * *',
    async () => {
      console.log('🕐 Hourly renewal expiration job triggered');
      try {
        const expiredCount = await expireOldRenewals();
        console.log(`✅ Hourly renewal expiration job completed - ${expiredCount} renewals expired`);
      } catch (error) {
        console.error('❌ Hourly renewal expiration job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC', // Use UTC for consistency
    }
  );

  // Run daily cleanup at 3 AM UTC
  cron.schedule(
    '0 3 * * *',
    async () => {
      console.log('🌅 Daily renewal cleanup job triggered');
      try {
        await dailyRenewalCleanup();
        console.log('✅ Daily renewal cleanup job completed successfully');
      } catch (error) {
        console.error('❌ Daily renewal cleanup job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  console.log('✅ Renewal cron jobs initialized successfully');
}

/**
 * Daily cleanup of old renewal data
 */
async function dailyRenewalCleanup() {
  try {
    console.log('🧹 Starting daily renewal cleanup...');
    
    // Clean up very old expired renewals (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const deletedRenewals = await prisma.renewalRequest.deleteMany({
      where: {
        status: 'EXPIRED',
        decidedAt: { lt: thirtyDaysAgo }
      },
    });

    console.log(`🗑️ Cleaned up ${deletedRenewals.count} old expired renewals`);
    
    // Log renewal statistics
    const stats = await getRenewalStats();
    console.log('📊 Renewal statistics:', stats);
    
  } catch (error) {
    console.error('❌ Error during daily renewal cleanup:', error);
    throw error;
  }
}

/**
 * Get renewal statistics for monitoring
 */
async function getRenewalStats() {
  try {
    const total = await prisma.renewalRequest.count();
    const pending = await prisma.renewalRequest.count({
      where: { status: 'PENDING' }
    });
    const countered = await prisma.renewalRequest.count({
      where: { status: 'COUNTERED' }
    });
    const accepted = await prisma.renewalRequest.count({
      where: { status: 'ACCEPTED' }
    });
    const declined = await prisma.renewalRequest.count({
      where: { status: 'DECLINED' }
    });
    const expired = await prisma.renewalRequest.count({
      where: { status: 'EXPIRED' }
    });

    return {
      total,
      pending,
      countered,
      accepted,
      declined,
      expired,
      active: pending + countered,
    };
  } catch (error) {
    console.error('❌ Error getting renewal stats:', error);
    return {};
  }
}

export { expireOldRenewals, getRenewalStats };


