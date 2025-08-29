/**
 * 📝 Review Publisher Job
 * 
 * This job runs hourly to publish reviews based on specific criteria:
 * 1. Publish pair when both reviews are SUBMITTED
 * 2. Publish single review when publishAfter <= now()
 * 
 * After publishing, it calls computeUserAggregate to update user ratings and ranks.
 */

import { prisma } from '../utils/prisma.js';
import rankService from '../services/rankService.js';
import { computeUserAggregate } from '../services/reviews/aggregates.js';

/**
 * Main function to publish reviews
 */
export async function publishReviews() {
  try {
    console.log('🕐 Starting review publisher job...');
    
    const startTime = Date.now();
    let publishedCount = 0;
    let errorCount = 0;

    // 1. Find and publish review pairs (both SUBMITTED)
    console.log('🔍 Looking for review pairs to publish...');
    const pairsPublished = await publishReviewPairs();
    publishedCount += pairsPublished;

    // 2. Find and publish single reviews (publishAfter <= now)
    console.log('🔍 Looking for single reviews to publish...');
    const singlesPublished = await publishSingleReviews();
    publishedCount += singlesPublished;

    const duration = Date.now() - startTime;
    console.log(`✅ Review publisher job completed in ${duration}ms`);
    console.log(`📊 Published: ${publishedCount} reviews, Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error in review publisher job:', error);
    throw error;
  }
}

/**
 * Publish review pairs when both reviews are SUBMITTED
 */
async function publishReviewPairs() {
  try {
    // Find leases with multiple reviews in SUBMITTED status
    const reviewPairs = await prisma.review.groupBy({
      by: ['leaseId', 'reviewStage'],
      where: {
        status: 'SUBMITTED',
        leaseId: { not: null }
      },
      having: {
        leaseId: {
          _count: { gte: 2 }
        }
      }
    });

    console.log(`📋 Found ${reviewPairs.length} potential review pairs`);

    let publishedCount = 0;

    for (const pair of reviewPairs) {
      try {
        // Get all reviews for this lease and stage
        const reviews = await prisma.review.findMany({
          where: {
            leaseId: pair.leaseId,
            reviewStage: pair.reviewStage,
            status: 'SUBMITTED'
          },
          select: {
            id: true,
            targetTenantGroupId: true
          }
        });

        if (reviews.length >= 2) {
          // Publish all reviews in this pair
          await prisma.review.updateMany({
            where: {
              id: { in: reviews.map(r => r.id) }
            },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date()
            }
          });

          // Update user aggregates for all target tenant groups
          for (const review of reviews) {
            await computeUserAggregateForTenantGroup(review.targetTenantGroupId);
          }

          publishedCount += reviews.length;
          console.log(`✅ Published ${reviews.length} reviews for lease ${pair.leaseId}, stage ${pair.reviewStage}`);
        }
      } catch (error) {
        console.error(`❌ Error publishing review pair for lease ${pair.leaseId}:`, error);
      }
    }

    return publishedCount;
  } catch (error) {
    console.error('❌ Error in publishReviewPairs:', error);
    return 0;
  }
}

/**
 * Publish single reviews when publishAfter <= now()
 */
async function publishSingleReviews() {
  try {
    const { getCurrentWarsawTime } = await import('../utils/dateUtils.js');
    const now = getCurrentWarsawTime();
    
    // Find reviews that are ready to publish
    const reviewsToPublish = await prisma.review.findMany({
      where: {
        status: 'SUBMITTED',
        publishAfter: { lte: now }
      },
      select: {
        id: true,
        targetTenantGroupId: true,
        leaseId: true,
        reviewStage: true
      }
    });

    console.log(`📋 Found ${reviewsToPublish.length} single reviews ready to publish`);

    let publishedCount = 0;

    for (const review of reviewsToPublish) {
      try {
        // Publish the review
        await prisma.review.update({
          where: { id: review.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
          }
        });

        // Update user aggregate
        await computeUserAggregateForTenantGroup(review.targetTenantGroupId);

        publishedCount++;
        console.log(`✅ Published single review ${review.id} for lease ${review.leaseId}, stage ${review.reviewStage}`);
      } catch (error) {
        console.error(`❌ Error publishing review ${review.id}:`, error);
      }
    }

    return publishedCount;
  } catch (error) {
    console.error('❌ Error in publishSingleReviews:', error);
    return 0;
  }
}

/**
 * Compute user aggregate for a tenant group
 * This function updates user ratings and ranks based on published reviews
 */
async function computeUserAggregateForTenantGroup(tenantGroupId) {
  try {
    console.log(`🧮 Computing user aggregate for tenant group: ${tenantGroupId}`);

    // Get the tenant group
    const tenantGroup = await prisma.tenantGroup.findUnique({
      where: { id: tenantGroupId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    if (!tenantGroup) {
      console.log(`⚠️  Tenant group ${tenantGroupId} not found`);
      return;
    }

    // Update all members of the tenant group using the new aggregates service
    for (const member of tenantGroup.members) {
      try {
        // Use the new aggregates service to compute user aggregate
        await computeUserAggregate(member.userId);

        // Calculate and update user rank
        await rankService.calculateUserRank(member.userId);

        console.log(`✅ Updated user ${member.userId} aggregate and rank`);
      } catch (error) {
        console.error(`❌ Error updating user ${member.userId}:`, error);
      }
    }

    console.log(`✅ User aggregate computed for tenant group ${tenantGroupId}`);

  } catch (error) {
    console.error(`❌ Error computing user aggregate for tenant group ${tenantGroupId}:`, error);
  }
}

/**
 * Manual trigger for testing
 */
export async function triggerReviewPublishing() {
  console.log('🔧 Manually triggering review publishing...');
  await publishReviews();
}

/**
 * Get job statistics
 */
export async function getJobStats() {
  try {
    const [total, pending, submitted, published, blocked] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'SUBMITTED' } }),
      prisma.review.count({ where: { status: 'PUBLISHED' } }),
      prisma.review.count({ where: { status: 'BLOCKED' } })
    ]);

    return {
      totalReviews: total,
      pendingReviews: pending,
      submittedReviews: submitted,
      publishedReviews: published,
      blockedReviews: blocked
    };
  } catch (error) {
    console.error('❌ Error getting job stats:', error);
    throw error;
  }
}

// Export for use in cron jobs or manual execution
export default {
  publishReviews,
  triggerReviewPublishing,
  getJobStats
};
