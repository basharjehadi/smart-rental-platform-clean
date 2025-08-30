import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if a user can submit a review for a lease
 *
 * Requirements:
 * - Lease must exist and be active
 * - Lease start date must be in the past
 * - User must be either a tenant or landlord in the lease
 * - Lease must have associated payments (indicating it's paid on platform)
 */
export const canSubmitReview = async (req, res, next) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!leaseId) {
      return res.status(400).json({
        error: 'Lease ID is required',
      });
    }

    // Load lease with related data
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        tenantGroupId: true,
        tenantGroup: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          where: {
            status: 'SUCCEEDED',
          },
        },
      },
    });

    if (!lease) {
      return res.status(404).json({
        error: 'Lease not found',
      });
    }

    // Check if lease is active
    if (lease.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Cannot submit review for inactive lease',
      });
    }

    // Check if lease start date is in the past
    const now = new Date();
    if (lease.startDate > now) {
      return res.status(403).json({
        error: 'Cannot submit review before lease start date',
      });
    }

    // Check if lease has payments (indicating it's paid on platform)
    const hasPayments = lease.payments.length > 0;
    if (!hasPayments) {
      return res.status(403).json({
        error: 'Cannot submit review for lease without platform payments',
      });
    }

    // Check if user is a tenant in the lease
    const isTenant = lease.tenantGroup.members.some(
      (member) => member.user.id === userId && member.user.role === 'TENANT'
    );

    // Check if user is a landlord in the lease
    const isLandlord = lease.organization?.members.some(
      (member) => member.user.id === userId && member.user.role === 'LANDLORD'
    );

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error:
          'User must be a tenant or landlord in the lease to submit a review',
      });
    }

    // Add lease data to request for use in subsequent middleware/controllers
    req.lease = lease;
    req.userRoleInLease = isTenant ? 'TENANT' : 'LANDLORD';

    next();
  } catch (error) {
    console.error('Error in canSubmitReview middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

export default canSubmitReview;
