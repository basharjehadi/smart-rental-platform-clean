/**
 * 📊 Review Signal Service
 *
 * This service manages review signals for tracking payment events
 * without affecting public review averages. Signals are private
 * and used for internal tracking and analytics.
 */

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new review signal
 */
export async function createReviewSignal(data) {
  try {
    const { signalType, leaseId, tenantGroupId, metadata = {} } = data;

    logger.info(
      `📊 Creating review signal: ${signalType} for lease ${leaseId}`
    );

    // Validate signal type
    const validSignalTypes = ['PAYMENT_CONFIRMED', 'DEPOSIT_RETURNED'];
    if (!validSignalTypes.includes(signalType)) {
      throw new Error(`Invalid signal type: ${signalType}`);
    }

    // Verify lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenantGroup: true,
      },
    });

    if (!lease) {
      throw new Error(`Lease not found: ${leaseId}`);
    }

    // Verify tenant group exists
    if (lease.tenantGroupId !== tenantGroupId) {
      throw new Error(`Tenant group mismatch for lease ${leaseId}`);
    }

    // Create the signal
    const signal = await prisma.reviewSignal.create({
      data: {
        signalType,
        leaseId,
        tenantGroupId,
        metadata,
      },
      include: {
        lease: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        tenantGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`✅ Review signal created: ${signal.id} (${signalType})`);

    return signal;
  } catch (error) {
    logger.error(`❌ Error creating review signal:`, error);
    throw error;
  }
}

/**
 * Get review signals for a specific lease
 */
export async function getLeaseReviewSignals(leaseId) {
  try {
    logger.info(`📊 Fetching review signals for lease: ${leaseId}`);

    const signals = await prisma.reviewSignal.findMany({
      where: { leaseId },
      include: {
        tenantGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(
      `✅ Found ${signals.length} review signals for lease ${leaseId}`
    );

    return signals;
  } catch (error) {
    logger.error(`❌ Error fetching lease review signals:`, error);
    throw error;
  }
}

/**
 * Get review signals for a specific tenant group
 */
export async function getTenantGroupReviewSignals(tenantGroupId) {
  try {
    logger.info(
      `📊 Fetching review signals for tenant group: ${tenantGroupId}`
    );

    const signals = await prisma.reviewSignal.findMany({
      where: { tenantGroupId },
      include: {
        lease: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(
      `✅ Found ${signals.length} review signals for tenant group ${tenantGroupId}`
    );

    return signals;
  } catch (error) {
    logger.error(`❌ Error fetching tenant group review signals:`, error);
    throw error;
  }
}

/**
 * Get review signals by type
 */
export async function getReviewSignalsByType(signalType, options = {}) {
  try {
    const { limit = 100, offset = 0, leaseId, tenantGroupId } = options;

    logger.info(`📊 Fetching review signals by type: ${signalType}`);

    const where = { signalType };

    if (leaseId) where.leaseId = leaseId;
    if (tenantGroupId) where.tenantGroupId = tenantGroupId;

    const signals = await prisma.reviewSignal.findMany({
      where,
      include: {
        lease: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        tenantGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.reviewSignal.count({ where });

    logger.info(
      `✅ Found ${signals.length} ${signalType} signals (total: ${total})`
    );

    return {
      signals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    logger.error(`❌ Error fetching review signals by type:`, error);
    throw error;
  }
}

/**
 * Get review signal statistics
 */
export async function getReviewSignalStats(options = {}) {
  try {
    const { leaseId, tenantGroupId, startDate, endDate } = options;

    logger.info(`📊 Fetching review signal statistics`);

    const where = {};

    if (leaseId) where.leaseId = leaseId;
    if (tenantGroupId) where.tenantGroupId = tenantGroupId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalSignals, paymentConfirmed, depositReturned] = await Promise.all(
      [
        prisma.reviewSignal.count({ where }),
        prisma.reviewSignal.count({
          where: { ...where, signalType: 'PAYMENT_CONFIRMED' },
        }),
        prisma.reviewSignal.count({
          where: { ...where, signalType: 'DEPOSIT_RETURNED' },
        }),
      ]
    );

    const stats = {
      totalSignals,
      paymentConfirmed,
      depositReturned,
      breakdown: {
        paymentConfirmed:
          totalSignals > 0
            ? ((paymentConfirmed / totalSignals) * 100).toFixed(1)
            : 0,
        depositReturned:
          totalSignals > 0
            ? ((depositReturned / totalSignals) * 100).toFixed(1)
            : 0,
      },
    };

    logger.info(`✅ Review signal statistics:`, stats);

    return stats;
  } catch (error) {
    logger.error(`❌ Error fetching review signal statistics:`, error);
    throw error;
  }
}

/**
 * Delete a review signal (admin only)
 */
export async function deleteReviewSignal(signalId) {
  try {
    logger.info(`🗑️ Deleting review signal: ${signalId}`);

    const signal = await prisma.reviewSignal.delete({
      where: { id: signalId },
    });

    logger.info(`✅ Review signal deleted: ${signalId}`);

    return signal;
  } catch (error) {
    logger.error(`❌ Error deleting review signal:`, error);
    throw error;
  }
}

/**
 * Clean up old review signals (maintenance)
 */
export async function cleanupOldReviewSignals(monthsOld = 24) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    logger.info(`🧹 Cleaning up review signals older than ${monthsOld} months`);

    const result = await prisma.reviewSignal.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`✅ Cleaned up ${result.count} old review signals`);

    return result.count;
  } catch (error) {
    logger.error(`❌ Error cleaning up old review signals:`, error);
    throw error;
  }
}

export default {
  createReviewSignal,
  getLeaseReviewSignals,
  getTenantGroupReviewSignals,
  getReviewSignalsByType,
  getReviewSignalStats,
  deleteReviewSignal,
  cleanupOldReviewSignals,
};
