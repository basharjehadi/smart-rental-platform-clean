#!/usr/bin/env node

/**
 * Backfill script for review publishAfter field
 *
 * This script finds reviews with status='SUBMITTED' AND publishAfter IS NULL
 * and sets publishAfter = addDays(14, lease.endDate) in Europe/Warsaw timezone
 *
 * Usage:
 *   npm run backfill:publishAfter -- --check    # Dry run (check only)
 *   npm run backfill:publishAfter               # Execute backfill
 */

import { PrismaClient } from '@prisma/client';
import { addDays } from '../src/utils/dateUtils.js';

const prisma = new PrismaClient();

/**
 * @typedef {Object} BackfillResult
 * @property {number} totalReviews - Total reviews in database
 * @property {number} reviewsToUpdate - Number of reviews needing update
 * @property {number} updatedReviews - Number of reviews successfully updated
 * @property {string[]} errors - Array of error messages
 * @property {boolean} dryRun - Whether this was a dry run
 */

/**
 * Backfill publishAfter field for reviews that are missing it
 * @param {boolean} dryRun - Whether to run in dry run mode
 * @returns {Promise<BackfillResult>} Result of the backfill operation
 */
async function backfillPublishAfter(dryRun = false) {
  const result = {
    totalReviews: 0,
    reviewsToUpdate: 0,
    updatedReviews: 0,
    errors: [],
    dryRun,
  };

  try {
    console.log(
      `🔄 Starting publishAfter backfill... ${dryRun ? '(DRY RUN)' : ''}`
    );

    // Get total count of reviews
    result.totalReviews = await prisma.review.count();
    console.log(`📊 Total reviews in database: ${result.totalReviews}`);

    // Find reviews that need publishAfter backfill
    const reviewsNeedingBackfill = await prisma.review.findMany({
      where: {
        status: 'SUBMITTED',
        publishAfter: null,
        lease: {
          endDate: {
            not: null,
          },
        },
      },
      include: {
        lease: {
          select: {
            id: true,
            endDate: true,
          },
        },
      },
    });

    result.reviewsToUpdate = reviewsNeedingBackfill.length;
    console.log(
      `🔍 Found ${result.reviewsToUpdate} reviews needing publishAfter backfill`
    );

    if (result.reviewsToUpdate === 0) {
      console.log('✅ No reviews need backfill. All set!');
      return result;
    }

    // Group reviews by lease for batch processing
    const reviewsByLease = new Map();
    reviewsNeedingBackfill.forEach((review) => {
      const leaseId = review.leaseId || 'no-lease';
      if (!reviewsByLease.has(leaseId)) {
        reviewsByLease.set(leaseId, []);
      }
      reviewsByLease.get(leaseId).push(review);
    });

    console.log(`📋 Processing ${reviewsByLease.size} unique leases`);

    // Process each lease's reviews
    for (const [leaseId, reviews] of reviewsByLease) {
      try {
        if (leaseId === 'no-lease') {
          console.log(
            `⚠️  Skipping reviews without lease (${reviews.length} reviews)`
          );
          continue;
        }

        const lease = reviews[0].lease;
        if (!lease?.endDate) {
          console.log(`⚠️  Skipping lease ${leaseId} - no end date`);
          continue;
        }

        console.log(
          `📅 Processing lease ${leaseId} with end date: ${lease.endDate.toISOString()}`
        );

        // Calculate publishAfter for this lease
        const publishAfter = addDays(lease.endDate, 14);
        console.log(
          `   📅 Calculated publishAfter: ${publishAfter.toISOString()}`
        );

        // Update all reviews for this lease
        for (const review of reviews) {
          try {
            if (dryRun) {
              console.log(
                `   🔍 [DRY RUN] Would update review ${review.id}: publishAfter = ${publishAfter.toISOString()}`
              );
            } else {
              await prisma.review.update({
                where: { id: review.id },
                data: { publishAfter },
              });
              console.log(
                `   ✅ Updated review ${review.id}: publishAfter = ${publishAfter.toISOString()}`
              );
              result.updatedReviews++;
            }
          } catch (error) {
            const errorMsg = `Failed to update review ${review.id}: ${error}`;
            console.error(`   ❌ ${errorMsg}`);
            result.errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process lease ${leaseId}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // Summary
    console.log('\n📊 Backfill Summary:');
    console.log(`   Total reviews: ${result.totalReviews}`);
    console.log(`   Reviews needing update: ${result.reviewsToUpdate}`);
    if (dryRun) {
      console.log(
        `   [DRY RUN] Would update: ${result.reviewsToUpdate} reviews`
      );
    } else {
      console.log(`   Successfully updated: ${result.updatedReviews} reviews`);
    }
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.forEach((error) => console.log(`     ❌ ${error}`));
    }

    return result;
  } catch (error) {
    const errorMsg = `Backfill failed: ${error}`;
    console.error(`❌ ${errorMsg}`);
    result.errors.push(errorMsg);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--check') || args.includes('--dry-run');
  return { dryRun };
}

/**
 * Main execution function
 */
async function main() {
  try {
    const { dryRun } = parseArgs();

    if (dryRun) {
      console.log('🔍 Running in DRY RUN mode (--check flag detected)');
      console.log('   No changes will be made to the database\n');
    }

    const result = await backfillPublishAfter(dryRun);

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETED');
      console.log('   Use without --check flag to execute the backfill');
    } else {
      console.log('\n✅ BACKFILL COMPLETED');
    }

    // Exit with error code if there were errors
    if (result.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main();

export { backfillPublishAfter };
