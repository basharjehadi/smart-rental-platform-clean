import { prisma } from '../utils/prisma.js';
import reviewService from './reviewService.js';
import badgeService from './badges.js';
import { calculatePublishAfter } from '../utils/dateUtils.js';

/**
 * 🏠 Lease Event Service
 * Handles lease status changes and automatically triggers review actions
 */
class LeaseEventService {
  /**
   * Handle lease status change events
   * @param {string} leaseId - The lease ID
   * @param {string} oldStatus - Previous lease status
   * @param {string} newStatus - New lease status
   * @param {Object} metadata - Additional context (reason, effectiveDate, etc.)
   */
  async handleLeaseStatusChange(leaseId, oldStatus, newStatus, metadata = {}) {
    try {
      console.log(`🔄 Lease status change: ${leaseId} ${oldStatus} → ${newStatus}`);

      // Get lease details
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
        include: {
          tenantGroup: {
            include: {
              members: true
            }
          },
          property: {
            include: {
              landlord: true
            }
          }
        }
      });

      if (!lease) {
        console.error(`❌ Lease not found: ${leaseId}`);
        return;
      }

      // Handle different status transitions
      switch (newStatus) {
        case 'ENDED':
          await this.handleLeaseEnded(lease, metadata);
          break;
        case 'TERMINATED_24H':
          await this.handleLeaseTerminated24H(lease, metadata);
          break;
        case 'TERMINATED':
          await this.handleLeaseTerminated(lease, metadata);
          break;
        default:
          console.log(`ℹ️ No special handling for status: ${newStatus}`);
      }

      console.log(`✅ Lease status change handled: ${leaseId}`);
    } catch (error) {
      console.error(`❌ Error handling lease status change:`, error);
      throw error;
    }
  }

  /**
   * Handle lease ended status (normal or early move-out)
   * @param {Object} lease - Lease object with relations
   * @param {Object} metadata - Additional context
   */
  async handleLeaseEnded(lease, metadata) {
    console.log(`🏁 Handling lease ended: ${lease.id}`);

    const isEarlyMoveOut = metadata.isEarlyMoveOut || false;
    const earlyMoveOutReason = metadata.earlyMoveOutReason || null;

    // Create end-of-lease reviews for all parties
    await this.createEndOfLeaseReviews(lease, {
      isEarlyTermination: isEarlyMoveOut,
      earlyTerminationReason: earlyMoveOutReason,
      excludeFromAggregates: false // Normal end-of-lease reviews count
    });

    // If it's an early move-out, create special reviews
    if (isEarlyMoveOut) {
      await this.createEarlyMoveOutReviews(lease, earlyMoveOutReason);
    }
  }

  /**
   * Handle lease terminated with 24-hour notice
   * @param {Object} lease - Lease object with relations
   * @param {Object} metadata - Additional context
   */
  async handleLeaseTerminated24H(lease, metadata) {
    console.log(`⏰ Handling lease terminated 24H: ${lease.id}`);

    const terminationReason = metadata.terminationReason || '24-hour termination notice';

    // Create special reviews for TERMINATED_24H
    await this.createEndOfLeaseReviews(lease, {
      isEarlyTermination: true,
      earlyTerminationReason: 'TERMINATED_24H',
      excludeFromAggregates: true, // These reviews don't count in aggregates
      terminationReason
    });

    // Award early termination badge to tenant
    await this.awardEarlyTerminationBadge(lease.tenantGroup.members[0]?.userId);
  }

  /**
   * Handle lease terminated status
   * @param {Object} lease - Lease object with relations
   * @param {Object} metadata - Additional context
   */
  async handleLeaseTerminated(lease, metadata) {
    console.log(`🚫 Handling lease terminated: ${lease.id}`);

    const terminationReason = metadata.terminationReason || 'Lease terminated';

    // Create end-of-lease reviews for terminated leases
    await this.createEndOfLeaseReviews(lease, {
      isEarlyTermination: true,
      earlyTerminationReason: 'TERMINATED',
      excludeFromAggregates: true, // Terminated lease reviews don't count
      terminationReason
    });
  }

  /**
   * Create end-of-lease reviews for all parties
   * @param {Object} lease - Lease object with relations
   * @param {Object} options - Review creation options
   */
  async createEndOfLeaseReviews(lease, options = {}) {
    const {
      isEarlyTermination = false,
      earlyTerminationReason = null,
      excludeFromAggregates = false,
      terminationReason = null
    } = options;

    try {
      // Create tenant → landlord review
      if (lease.tenantGroup?.members?.length > 0) {
        const tenantId = lease.tenantGroup.members[0].userId;
        await this.createEndOfLeaseReview(
          lease.id,
          tenantId,
          lease.property.landlordId,
          lease.tenantGroup.id,
          lease.endDate,
          {
            isEarlyTermination,
            earlyTerminationReason,
            excludeFromAggregates,
            terminationReason
          }
        );
      }

      // Create landlord → tenant review
      if (lease.property?.landlordId) {
        await this.createEndOfLeaseReview(
          lease.id,
          lease.property.landlordId,
          lease.tenantGroup.members[0]?.userId,
          lease.tenantGroup.id,
          lease.endDate,
          {
            isEarlyTermination,
            earlyTerminationReason,
            excludeFromAggregates,
            terminationReason
          }
        );
      }

      console.log(`✅ End-of-lease reviews created for lease: ${lease.id}`);
    } catch (error) {
      console.error(`❌ Error creating end-of-lease reviews:`, error);
      throw error;
    }
  }

  /**
   * Create a single end-of-lease review
   * @param {string} leaseId - Lease ID
   * @param {string} reviewerId - User ID of the reviewer
   * @param {string} revieweeId - User ID being reviewed
   * @param {string} targetTenantGroupId - Target tenant group ID
   * @param {Date} leaseEndDate - Lease end date for calculating publishAfter
   * @param {Object} options - Review options
   */
  async createEndOfLeaseReview(leaseId, reviewerId, revieweeId, targetTenantGroupId, leaseEndDate, options = {}) {
    try {
      const {
        isEarlyTermination = false,
        earlyTerminationReason = null,
        excludeFromAggregates = false,
        terminationReason = null
      } = options;

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          leaseId,
          reviewerId,
          revieweeId,
          reviewStage: 'END_OF_LEASE'
        }
      });

      if (existingReview) {
        console.log(`ℹ️ End-of-lease review already exists: ${existingReview.id}`);
        return existingReview;
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          leaseId,
          reviewerId,
          revieweeId,
          targetTenantGroupId,
          reviewStage: 'END_OF_LEASE',
          status: 'PENDING',
          rating: 0, // Placeholder rating
          comment: '', // Placeholder comment
          isAnonymous: false,
          isDoubleBlind: true,
          publishAfter: calculatePublishAfter(leaseEndDate), // 14 days from lease end date using centralized date utilities
          isEarlyTermination,
          earlyTerminationReason,
          excludeFromAggregates,
          isSystemGenerated: true
        }
      });

      console.log(`✅ End-of-lease review created: ${review.id}`);
      return review;
    } catch (error) {
      console.error(`❌ Error creating end-of-lease review:`, error);
      throw error;
    }
  }

  /**
   * Create special reviews for early move-out scenarios
   * @param {Object} lease - Lease object with relations
   * @param {string} reason - Reason for early move-out
   */
  async createEarlyMoveOutReviews(lease, reason) {
    console.log(`🏃 Creating early move-out reviews for lease: ${lease.id}`);

    try {
      // Create additional review for early move-out context
      if (lease.tenantGroup?.members?.length > 0) {
        const tenantId = lease.tenantGroup.members[0].userId;
        
        // Create a special review that captures early move-out context
        await prisma.review.create({
          data: {
            leaseId: lease.id,
            reviewerId: tenantId,
            revieweeId: lease.property.landlordId,
            targetTenantGroupId: lease.tenantGroup.id,
            reviewStage: 'END_OF_LEASE',
            status: 'PENDING',
            rating: 0,
            comment: `Early move-out review: ${reason}`,
            isAnonymous: false,
            isDoubleBlind: true,
            publishAfter: calculatePublishAfter(lease.endDate),
            isEarlyTermination: true,
            earlyTerminationReason: 'EARLY_MOVE_OUT',
            excludeFromAggregates: false, // Early move-out reviews can count
            isSystemGenerated: true
          }
        });
      }

      console.log(`✅ Early move-out reviews created for lease: ${lease.id}`);
    } catch (error) {
      console.error(`❌ Error creating early move-out reviews:`, error);
      throw error;
    }
  }

  /**
   * Award early termination badge to tenant
   * @param {string} tenantId - Tenant user ID
   */
  async awardEarlyTerminationBadge(tenantId) {
    if (!tenantId) {
      console.log(`ℹ️ No tenant ID provided for badge award`);
      return;
    }

    try {
      console.log(`🏆 Awarding early termination badge to tenant: ${tenantId}`);

      // Check if user already has this badge
      const existingBadge = await prisma.userBadge.findFirst({
        where: {
          userId: tenantId,
          badge: {
            name: 'EARLY_TERMINATION_HANDLER'
          }
        }
      });

      if (existingBadge) {
        console.log(`ℹ️ User already has early termination badge: ${tenantId}`);
        return;
      }

      // Create the badge
      const badge = await badgeService.createBadge({
        name: 'EARLY_TERMINATION_HANDLER',
        description: 'Successfully handled early lease termination',
        criteria: 'Completed lease termination process within 24 hours',
        icon: '⏰',
        color: 'orange'
      });

      // Award badge to user
      await badgeService.awardBadgeToUser(tenantId, badge.id);

      console.log(`✅ Early termination badge awarded to tenant: ${tenantId}`);
    } catch (error) {
      console.error(`❌ Error awarding early termination badge:`, error);
      // Don't throw error - badge award failure shouldn't break the main flow
    }
  }

  /**
   * Get reviews that should be excluded from aggregates
   * @param {string} userId - User ID
   * @returns {Array} Array of review IDs to exclude
   */
  async getExcludedReviewIds(userId) {
    try {
      const excludedReviews = await prisma.review.findMany({
        where: {
          OR: [
            { reviewerId: userId, excludeFromAggregates: true },
            { revieweeId: userId, excludeFromAggregates: true }
          ]
        },
        select: { id: true }
      });

      return excludedReviews.map(review => review.id);
    } catch (error) {
      console.error(`❌ Error getting excluded review IDs:`, error);
      return [];
    }
  }

  /**
   * Process all active leases and check for status changes
   * This can be run as a scheduled job
   */
  async processLeaseStatusChecks() {
    try {
      console.log(`🔍 Processing lease status checks...`);

      const activeLeases = await prisma.lease.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lte: new Date() // Lease has ended
          }
        },
        include: {
          tenantGroup: {
            include: {
              members: true
            }
          },
          property: {
            include: {
              landlord: true
            }
          }
        }
      });

      console.log(`📋 Found ${activeLeases.length} leases that need status updates`);

      for (const lease of activeLeases) {
        try {
          // Update lease status to ENDED
          await prisma.lease.update({
            where: { id: lease.id },
            data: { status: 'ENDED' }
          });

          // Handle the status change
          await this.handleLeaseStatusChange(lease.id, 'ACTIVE', 'ENDED', {
            isEarlyMoveOut: false
          });

          console.log(`✅ Processed lease: ${lease.id}`);
        } catch (error) {
          console.error(`❌ Error processing lease ${lease.id}:`, error);
          // Continue with other leases
        }
      }

      console.log(`✅ Lease status checks completed`);
    } catch (error) {
      console.error(`❌ Error in lease status checks:`, error);
      throw error;
    }
  }
}

export default new LeaseEventService();
