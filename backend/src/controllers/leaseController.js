import { prisma } from '../utils/prisma.js';
import leaseEventService from '../services/leaseEventService.js';

/**
 * 🏠 Lease Controller
 * Handles lease operations including status changes
 */

/**
 * Update lease status and trigger appropriate actions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateLeaseStatus = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const {
      newStatus,
      reason,
      effectiveDate,
      isEarlyMoveOut,
      earlyMoveOutReason,
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!newStatus) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'New status is required',
      });
    }

    // Validate status transition
    const validStatuses = [
      'ACTIVE',
      'ENDED',
      'TERMINATED',
      'TERMINATED_24H',
      'EXPIRED',
      'PENDING',
    ];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Get current lease
    const currentLease = await prisma.lease.findUnique({
      where: { id: leaseId },
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

    if (!currentLease) {
      return res.status(404).json({
        error: 'Lease not found',
        message: 'The specified lease does not exist',
      });
    }

    // Check if user has permission to update this lease
    const hasPermission = await checkLeaseUpdatePermission(
      currentLease,
      userId,
      req.user.role
    );
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update this lease',
      });
    }

    const oldStatus = currentLease.status;

    // Update lease status
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        status: newStatus,
        terminationReason: reason || null,
        terminationEffectiveDate: effectiveDate
          ? new Date(effectiveDate)
          : null,
        terminationNoticeByUserId: userId,
        terminationNoticeDate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Handle the status change event
    const metadata = {
      reason,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
      isEarlyMoveOut: isEarlyMoveOut || false,
      earlyMoveOutReason,
      updatedBy: userId,
    };

    await leaseEventService.handleLeaseStatusChange(
      leaseId,
      oldStatus,
      newStatus,
      metadata
    );

    // Get updated lease with relations
    const fullLease = await prisma.lease.findUnique({
      where: { id: leaseId },
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

    res.json({
      success: true,
      message: 'Lease status updated successfully',
      data: {
        lease: fullLease,
        statusChange: {
          from: oldStatus,
          to: newStatus,
          reason,
          effectiveDate,
          updatedBy: userId,
          updatedAt: updatedLease.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update lease status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update lease status',
    });
  }
};

/**
 * Handle early move-out request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleEarlyMoveOut = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const { reason, effectiveDate } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!reason || !effectiveDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Reason and effective date are required for early move-out',
      });
    }

    // Validate effective date is in the future
    const moveOutDate = new Date(effectiveDate);
    if (moveOutDate <= new Date()) {
      return res.status(400).json({
        error: 'Invalid effective date',
        message: 'Effective date must be in the future',
      });
    }

    // Get current lease
    const currentLease = await prisma.lease.findUnique({
      where: { id: leaseId },
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

    if (!currentLease) {
      return res.status(404).json({
        error: 'Lease not found',
        message: 'The specified lease does not exist',
      });
    }

    // Check if user is the tenant
    const isTenant = currentLease.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    if (!isTenant && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the tenant can request early move-out',
      });
    }

    // Update lease with early move-out information
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        status: 'ENDED',
        terminationReason: `Early move-out: ${reason}`,
        terminationEffectiveDate: moveOutDate,
        terminationNoticeByUserId: userId,
        terminationNoticeDate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Handle the status change event
    await leaseEventService.handleLeaseStatusChange(
      leaseId,
      currentLease.status,
      'ENDED',
      {
        reason: `Early move-out: ${reason}`,
        effectiveDate: moveOutDate,
        isEarlyMoveOut: true,
        earlyMoveOutReason: reason,
        updatedBy: userId,
      }
    );

    res.json({
      success: true,
      message: 'Early move-out processed successfully',
      data: {
        lease: updatedLease,
        earlyMoveOut: {
          reason,
          effectiveDate: moveOutDate,
          requestedBy: userId,
          processedAt: updatedLease.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Handle early move-out error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process early move-out',
    });
  }
};

/**
 * Handle 24-hour termination notice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handle24HourTermination = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const { reason, effectiveDate } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!reason || !effectiveDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        message:
          'Reason and effective date are required for 24-hour termination',
      });
    }

    // Validate effective date is at least 24 hours in the future
    const terminationDate = new Date(effectiveDate);
    const minTerminationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    if (terminationDate < minTerminationDate) {
      return res.status(400).json({
        error: 'Invalid effective date',
        message: 'Effective date must be at least 24 hours in the future',
      });
    }

    // Get current lease
    const currentLease = await prisma.lease.findUnique({
      where: { id: leaseId },
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

    if (!currentLease) {
      return res.status(404).json({
        error: 'Lease not found',
        message: 'The specified lease does not exist',
      });
    }

    // Check if user is the landlord or admin
    const isLandlord = currentLease.property.landlordId === userId;
    if (!isLandlord && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the landlord can issue 24-hour termination notices',
      });
    }

    // Update lease status to TERMINATED_24H
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        status: 'TERMINATED_24H',
        terminationReason: `24-hour termination: ${reason}`,
        terminationEffectiveDate: terminationDate,
        terminationNoticeByUserId: userId,
        terminationNoticeDate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Handle the status change event
    await leaseEventService.handleLeaseStatusChange(
      leaseId,
      currentLease.status,
      'TERMINATED_24H',
      {
        reason: `24-hour termination: ${reason}`,
        effectiveDate: terminationDate,
        terminationReason: reason,
        updatedBy: userId,
      }
    );

    res.json({
      success: true,
      message: '24-hour termination notice issued successfully',
      data: {
        lease: updatedLease,
        termination24H: {
          reason,
          effectiveDate: terminationDate,
          issuedBy: userId,
          issuedAt: updatedLease.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Handle 24-hour termination error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process 24-hour termination notice',
    });
  }
};

/**
 * Get lease status history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getLeaseStatusHistory = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;

    // Get lease with status history
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
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

    if (!lease) {
      return res.status(404).json({
        error: 'Lease not found',
        message: 'The specified lease does not exist',
      });
    }

    // Check if user has access to this lease
    const hasAccess = await checkLeaseAccess(lease, userId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this lease',
      });
    }

    // Get reviews related to this lease
    const reviews = await prisma.review.findMany({
      where: { leaseId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        lease,
        reviews,
        statusInfo: {
          current: lease.status,
          terminationReason: lease.terminationReason,
          terminationEffectiveDate: lease.terminationEffectiveDate,
          terminationNoticeDate: lease.terminationNoticeDate,
        },
      },
    });
  } catch (error) {
    console.error('Get lease status history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get lease status history',
    });
  }
};

/**
 * Check if user has permission to update lease
 * @param {Object} lease - Lease object
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {boolean} True if user has permission
 */
async function checkLeaseUpdatePermission(lease, userId, userRole) {
  // Admins can update any lease
  if (userRole === 'ADMIN') {
    return true;
  }

  // Landlords can update their own leases
  if (lease.property?.landlordId === userId) {
    return true;
  }

  // Tenants can update their own leases
  const isTenant = lease.tenantGroup.members.some(
    (member) => member.userId === userId
  );
  if (isTenant) {
    return true;
  }

  return false;
}

/**
 * Check if user has access to lease information
 * @param {Object} lease - Lease object
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {boolean} True if user has access
 */
async function checkLeaseAccess(lease, userId, userRole) {
  // Admins can access any lease
  if (userRole === 'ADMIN') {
    return true;
  }

  // Landlords can access their own leases
  if (lease.property?.landlordId === userId) {
    return true;
  }

  // Tenants can access their own leases
  const isTenant = lease.tenantGroup.members.some(
    (member) => member.userId === userId
  );
  if (isTenant) {
    return true;
  }

  return false;
}
