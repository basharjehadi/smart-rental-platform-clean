import cron from 'node-cron';
import leaseEventService from '../services/leaseEventService.js';
import { prisma } from '../utils/prisma.js';

/**
 * 🏠 Lease Status Checker Job
 * Automatically processes lease status changes and triggers review actions
 */

class LeaseStatusCheckerJob {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Start the lease status checker job
   * Runs every hour to check for lease status changes
   */
  start() {
    if (this.job) {
      console.log('ℹ️ Lease status checker job is already running');
      return;
    }

    console.log('🚀 Starting lease status checker job...');

    // Run every hour at minute 0
    this.job = cron.schedule(
      '0 * * * *',
      async () => {
        await this.runLeaseStatusChecks();
      },
      {
        scheduled: false,
        timezone: 'Europe/Warsaw',
      }
    );

    this.job.start();
    console.log('✅ Lease status checker job started (runs every hour)');
  }

  /**
   * Stop the lease status checker job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      this.isRunning = false;
      console.log('🛑 Lease status checker job stopped');
    }
  }

  /**
   * Run lease status checks manually
   */
  async runLeaseStatusChecks() {
    if (this.isRunning) {
      console.log('ℹ️ Lease status checker is already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🔍 Running lease status checks...');

      // Process lease status checks
      await leaseEventService.processLeaseStatusChecks();

      // Check for leases that need immediate attention
      await this.checkUrgentLeases();

      const duration = Date.now() - startTime;
      console.log(`✅ Lease status checks completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ Error in lease status checks:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check for leases that need immediate attention
   */
  async checkUrgentLeases() {
    try {
      console.log('🚨 Checking for urgent lease situations...');

      // Check for leases ending within 24 hours
      const { getCurrentWarsawTime, addDaysUTC } = await import(
        '../utils/dateUtils.js'
      );
      const now = getCurrentWarsawTime();
      const next24Hours = addDaysUTC(now, 1);

      const endingSoon = await prisma.lease.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: next24Hours,
          },
        },
        include: {
          tenantGroup: {
            include: {
              members: true,
            },
          },
          property: {
            include: {
              landlord: true,
            },
          },
        },
      });

      if (endingSoon.length > 0) {
        console.log(
          `⚠️  Found ${endingSoon.length} leases ending within 24 hours`
        );

        for (const lease of endingSoon) {
          await this.handleLeaseEndingSoon(lease);
        }
      }

      // Check for TERMINATED_24H leases that are now effective
      const terminated24H = await prisma.lease.findMany({
        where: {
          status: 'TERMINATED_24H',
          terminationEffectiveDate: {
            lte: now, // Termination is now effective (using Warsaw time)
          },
        },
        include: {
          tenantGroup: {
            include: {
              members: true,
            },
          },
          property: {
            include: {
              landlord: true,
            },
          },
        },
      });

      if (terminated24H.length > 0) {
        console.log(
          `⏰ Found ${terminated24H.length} TERMINATED_24H leases now effective`
        );

        for (const lease of terminated24H) {
          await this.handleTerminationEffective(lease);
        }
      }
    } catch (error) {
      console.error('❌ Error checking urgent leases:', error);
    }
  }

  /**
   * Handle lease ending soon (within 24 hours)
   */
  async handleLeaseEndingSoon(lease) {
    try {
      console.log(
        `⚠️  Lease ending soon: ${lease.id} (ends: ${lease.endDate})`
      );

      // Check if end-of-lease reviews already exist
      const existingReviews = await prisma.review.findMany({
        where: {
          leaseId: lease.id,
          reviewStage: 'END_OF_LEASE',
        },
      });

      if (existingReviews.length === 0) {
        console.log(`📝 Creating end-of-lease reviews for lease: ${lease.id}`);

        // Create end-of-lease reviews
        await leaseEventService.createEndOfLeaseReviews(lease, {
          isEarlyTermination: false,
          excludeFromAggregates: false,
        });
      } else {
        console.log(
          `ℹ️  End-of-lease reviews already exist for lease: ${lease.id}`
        );
      }
    } catch (error) {
      console.error(`❌ Error handling lease ending soon ${lease.id}:`, error);
    }
  }

  /**
   * Handle TERMINATED_24H lease that is now effective
   */
  async handleTerminationEffective(lease) {
    try {
      console.log(`⏰ TERMINATED_24H lease now effective: ${lease.id}`);

      // Update lease status to TERMINATED
      await prisma.lease.update({
        where: { id: lease.id },
        data: {
          status: 'TERMINATED',
          updatedAt: new Date(),
        },
      });

      // Handle the status change
      await leaseEventService.handleLeaseStatusChange(
        lease.id,
        'TERMINATED_24H',
        'TERMINATED',
        {
          reason:
            lease.terminationReason || '24-hour termination now effective',
          effectiveDate: lease.terminationEffectiveDate,
          updatedBy: 'system',
        }
      );

      console.log(`✅ Lease ${lease.id} status updated to TERMINATED`);
    } catch (error) {
      console.error(
        `❌ Error handling termination effective for lease ${lease.id}:`,
        error
      );
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: !!this.job,
      lastRun: this.lastRun,
      nextRun: this.job ? this.job.nextDate() : null,
    };
  }

  /**
   * Force run the job (for testing or manual execution)
   */
  async forceRun() {
    console.log('🔄 Force running lease status checks...');
    await this.runLeaseStatusChecks();
  }
}

// Create singleton instance
const leaseStatusCheckerJob = new LeaseStatusCheckerJob();

export default leaseStatusCheckerJob;
