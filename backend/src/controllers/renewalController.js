import { prisma } from '../utils/prisma.js';
import { NotificationService } from '../services/notificationService.js';

const ensureLandlordCanSetPrice = async (
  userId,
  leaseId,
  proposedMonthlyRent
) => {
  if (proposedMonthlyRent == null) return; // no price change
  // Only landlord can change price: infer landlord from property via offer
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    select: { propertyId: true, offerId: true },
  });
  if (!lease) throw new Error('Lease not found');
  const offer = lease.offerId
    ? await prisma.offer.findUnique({
        where: { id: lease.offerId },
        select: { organizationId: true },
      })
    : null;

  if (offer?.organizationId) {
    // Check if user is a member of the organization that owns the property
    const isLandlord = await prisma.organizationMember.findFirst({
      where: {
        organizationId: offer.organizationId,
        userId: userId,
        role: 'OWNER',
      },
    });

    if (!isLandlord) {
      throw new Error('Only landlord can set or change proposedMonthlyRent');
    }
  } else {
    throw new Error('Offer not found or invalid');
  }
};

export const createRenewalRequest = async (req, res) => {
  try {
    const { id: leaseId } = req.params;
    const { proposedTermMonths, proposedStartDate, proposedMonthlyRent, note } =
      req.body || {};

    // Prevent duplicate open requests
    const openExists = await prisma.renewalRequest.findFirst({
      where: { leaseId, status: { in: ['PENDING', 'COUNTERED'] } },
    });
    if (openExists)
      return res.status(400).json({
        error: 'An open renewal request already exists for this lease',
      });

    // 🛡️ SECURITY: Check if user is tenant or landlord for this lease
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenantGroup: {
          include: {
            members: {
              where: { isPrimary: true },
              select: { userId: true }
            }
          }
        },
        offer: {
          include: {
            organization: {
              include: {
                members: {
                  where: { role: 'OWNER' },
                  select: { userId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    const tenantId = lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ error: 'Access denied: Not authorized for this lease' });
    }

    // 🛡️ SECURITY: Tenants can only send simple renewal requests (no terms/rent)
    if (isTenant && (proposedTermMonths || proposedStartDate || proposedMonthlyRent)) {
      return res.status(403).json({ 
        error: 'Tenants cannot propose renewal terms. Only landlords can set terms and rent.' 
      });
    }

    // 🛡️ SECURITY: Landlords can set terms and rent
    if (isLandlord) {
      await ensureLandlordCanSetPrice(req.user.id, leaseId, proposedMonthlyRent);
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const request = await prisma.renewalRequest.create({
      data: {
        leaseId,
        initiatorUserId: req.user.id,
        status: 'PENDING',
        proposedTermMonths: proposedTermMonths || null,
        proposedStartDate: proposedStartDate
          ? new Date(proposedStartDate)
          : null,
        proposedMonthlyRent: proposedMonthlyRent ?? null,
        note: note || null,
        expiresAt,
      },
    });

    // 🚀 NEW: Send real-time notifications
    try {
      const requester = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true, role: true }
      });

      const targets = [tenantId, landlordId].filter(
        (t) => t && t !== req.user.id
      );

      for (const targetId of targets) {
        await NotificationService.createRenewalRequestNotification(
          targetId,
          request.id,
          requester?.name || 'User',
          isTenant // true if tenant made the request, false if landlord
        );
      }
    } catch (error) {
      console.error('Error sending renewal notifications:', error);
    }

    return res.json({ success: true, renewal: request });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || 'Failed to create renewal request' });
  }
};

export const counterRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params; // renewal id
    const { proposedTermMonths, proposedStartDate, proposedMonthlyRent, note } =
      req.body || {};
    const existing = await prisma.renewalRequest.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  select: { userId: true }
                }
              }
            },
            offer: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!existing || !['PENDING', 'COUNTERED'].includes(existing.status))
      return res.status(400).json({ error: 'Renewal not open for counter' });

    // 🛡️ SECURITY: Only landlords can counter with terms/rent
    const tenantId = existing.lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = existing.lease.offer?.organization?.members?.[0]?.userId;
    const isLandlord = req.user.id === landlordId;

    if (!isLandlord) {
      return res.status(403).json({ 
        error: 'Only landlords can counter renewal requests with new terms' 
      });
    }

    // Enforce landlord-only price change
    await ensureLandlordCanSetPrice(
      req.user.id,
      existing.leaseId,
      proposedMonthlyRent
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const counter = await prisma.renewalRequest.create({
      data: {
        leaseId: existing.leaseId,
        initiatorUserId: req.user.id,
        status: 'COUNTERED',
        proposedTermMonths: proposedTermMonths || null,
        proposedStartDate: proposedStartDate
          ? new Date(proposedStartDate)
          : null,
        proposedMonthlyRent: proposedMonthlyRent ?? null,
        note: note || null,
        counterOfId: id,
        expiresAt,
      },
    });

    return res.json({ success: true, renewal: counter });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || 'Failed to counter renewal' });
  }
};

export const acceptRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params; // renewal id
    const renewal = await prisma.renewalRequest.findUnique({
      where: { id },
      include: { 
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  select: { userId: true }
                }
              }
            },
            offer: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
    });
    if (!renewal) return res.status(404).json({ error: 'Renewal not found' });
    if (!['PENDING', 'COUNTERED'].includes(renewal.status))
      return res.status(400).json({ error: 'Renewal not open' });

    // 🛡️ SECURITY: Only tenants can accept renewal requests
    const tenantId = renewal.lease.tenantGroup?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;

    if (!isTenant) {
      return res.status(403).json({ 
        error: 'Only tenants can accept renewal requests' 
      });
    }

    // Mark accepted and close siblings
    const accepted = await prisma.$transaction(async (tx) => {
      await tx.renewalRequest.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          decidedByUserId: req.user.id,
          decidedAt: new Date(),
        },
      });
      await tx.renewalRequest.updateMany({
        where: {
          leaseId: renewal.leaseId,
          id: { not: id },
          status: { in: ['PENDING', 'COUNTERED'] },
        },
        data: {
          status: 'CANCELLED',
          decidedByUserId: req.user.id,
          decidedAt: new Date(),
        },
      });

      // Create new lease effective the proposedStartDate or day after endDate
      const baseStart =
        renewal.proposedStartDate ||
        new Date(renewal.lease.endDate.getTime() + 24 * 60 * 60 * 1000);
      const newEnd = new Date(baseStart);
      const months = renewal.proposedTermMonths || 12;
      newEnd.setMonth(newEnd.getMonth() + months);

      // Create a fresh unit to avoid unique constraint on unitId
      let cloneUnit;
      try {
        const src = await tx.unit.findUnique({
          where: { id: renewal.lease.unitId },
          select: {
            unitNumber: true,
            floor: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            rentAmount: true,
            propertyId: true,
          },
        });
        cloneUnit = await tx.unit.create({
          data: {
            unitNumber: `RN-${renewal.lease.id}-${Date.now()}`,
            floor: src?.floor ?? 0,
            bedrooms: src?.bedrooms ?? 1,
            bathrooms: src?.bathrooms ?? 1,
            area: src?.area ?? 0,
            rentAmount:
              src?.rentAmount ??
              (renewal.proposedMonthlyRent || renewal.lease.rentAmount),
            propertyId: src?.propertyId ?? renewal.lease.propertyId,
          },
        });
      } catch {
        cloneUnit = await tx.unit.create({
          data: {
            unitNumber: `RN-${renewal.lease.id}-${Date.now()}`,
            floor: 0,
            bedrooms: 1,
            bathrooms: 1,
            area: 0,
            rentAmount: renewal.proposedMonthlyRent || renewal.lease.rentAmount,
            propertyId: renewal.lease.propertyId,
          },
        });
      }

      const newLease = await tx.lease.create({
        data: {
          startDate: baseStart,
          endDate: newEnd,
          rentAmount: renewal.proposedMonthlyRent || renewal.lease.rentAmount,
          depositAmount: renewal.lease.depositAmount,
          status: 'ACTIVE',
          tenantGroupId: renewal.lease.tenantGroupId,
          unitId: cloneUnit.id,
          rentalRequestId: renewal.lease.rentalRequestId,
          offerId: renewal.lease.offerId,
          propertyId: renewal.lease.propertyId,
        },
      });
      return newLease;
    });

    // 🚀 NEW: Send real-time notifications
    try {
      const accepter = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
      });

      const landlordId = renewal.lease.offer?.organization?.members?.[0]?.userId;
      const tenantId = renewal.lease.tenantGroup?.members?.[0]?.userId;

      // Notify the other party
      const otherPartyId = req.user.id === tenantId ? landlordId : tenantId;
      if (otherPartyId) {
        await NotificationService.createRenewalResponseNotification(
          otherPartyId,
          id,
          accepter?.name || 'User',
          'ACCEPTED'
        );
      }
    } catch (error) {
      console.error('Error sending renewal acceptance notifications:', error);
    }

    return res.json({ success: true });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || 'Failed to accept renewal' });
  }
};

export const declineRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 🛡️ SECURITY: Check if user is authorized to decline this renewal
    const renewal = await prisma.renewalRequest.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  select: { userId: true }
                }
              }
            },
            offer: {
              include: {
                organization: {
                  include: {
                    members: {
                      where: { role: 'OWNER' },
                      select: { userId: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!renewal) {
      return res.status(404).json({ error: 'Renewal not found' });
    }

    const tenantId = renewal.lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = renewal.lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ 
        error: 'Access denied: Not authorized for this lease' 
      });
    }

    const updatedRenewal = await prisma.renewalRequest.update({
      where: { id },
      data: {
        status: 'DECLINED',
        decidedByUserId: req.user.id,
        decidedAt: new Date(),
      },
    });

    // 🚀 NEW: Send real-time notifications
    try {
      const decliner = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
      });

      const landlordId = renewal.lease.offer?.organization?.members?.[0]?.userId;
      const tenantId = renewal.lease.tenantGroup?.members?.[0]?.userId;

      // Notify the other party
      const otherPartyId = req.user.id === tenantId ? landlordId : tenantId;
      if (otherPartyId) {
        await NotificationService.createRenewalResponseNotification(
          otherPartyId,
          id,
          decliner?.name || 'User',
          'DECLINED'
        );
      }
    } catch (error) {
      console.error('Error sending renewal decline notifications:', error);
    }

    return res.json({ success: true, renewal: updatedRenewal });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || 'Failed to decline renewal' });
  }
};

export const listRenewalsForLease = async (req, res) => {
  try {
    const { id: leaseId } = req.params;
    const items = await prisma.renewalRequest.findMany({
      where: { leaseId },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ success: true, renewals: items });
  } catch (e) {
    return res.status(400).json({ error: 'Failed to fetch renewals' });
  }
};

// 🚀 NEW: Proper state machine for renewal workflow
export const getRenewalWorkflow = async (req, res) => {
  try {
    const { id: leaseId } = req.params;
    
    // Get the lease with all related data
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenantGroup: {
          include: {
            members: {
              where: { isPrimary: true },
              select: { userId: true }
            }
          }
        },
        offer: {
          include: {
            organization: {
              include: {
                members: {
                  where: { role: 'OWNER' },
                  select: { userId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Check if user is authorized for this lease
    const tenantId = lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ error: 'Access denied: Not authorized for this lease' });
    }

    // Get all renewal requests for this lease
    const renewals = await prisma.renewalRequest.findMany({
      where: { leaseId },
      orderBy: { createdAt: 'desc' },
      include: {
        initiator: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    // Determine current workflow state
    const activeRenewal = renewals.find(r => 
      ['PENDING', 'COUNTERED'].includes(r.status)
    );

    const workflowState = {
      hasActiveRenewal: !!activeRenewal,
      currentStatus: activeRenewal?.status || null,
      canRequestRenewal: !activeRenewal && isTenant,
      canProposeRenewal: !activeRenewal && isLandlord,
      canCounterRenewal: activeRenewal && 
        ((isTenant && activeRenewal.initiator.role === 'LANDLORD') ||
         (isLandlord && activeRenewal.initiator.role === 'TENANT')),
      canAcceptRenewal: activeRenewal && 
        activeRenewal.status === 'COUNTERED' && 
        isTenant && 
        activeRenewal.initiator.role === 'LANDLORD',
      canDeclineRenewal: activeRenewal && 
        ['PENDING', 'COUNTERED'].includes(activeRenewal.status) &&
        ((isTenant && activeRenewal.initiator.role === 'LANDLORD') ||
         (isLandlord && activeRenewal.initiator.role === 'TENANT')),
      latestRenewal: activeRenewal,
      allRenewals: renewals,
      leaseEndDate: lease.endDate,
      daysUntilExpiry: Math.ceil((new Date(lease.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    };

    return res.json({ success: true, workflow: workflowState });
  } catch (e) {
    console.error('Get renewal workflow error:', e);
    return res.status(400).json({ error: 'Failed to fetch renewal workflow' });
  }
};

// 🚀 NEW: Auto-expire old renewal requests (can be called by cron job)
export const expireOldRenewals = async (req, res) => {
  try {
    const expiredRenewals = await prisma.renewalRequest.updateMany({
      where: {
        status: { in: ['PENDING', 'COUNTERED'] },
        expiresAt: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED',
        decidedAt: new Date()
      }
    });

    return res.json({ 
      success: true, 
      expiredCount: expiredRenewals.count,
      message: `Expired ${expiredRenewals.count} renewal requests`
    });
  } catch (e) {
    console.error('Expire renewals error:', e);
    return res.status(400).json({ error: 'Failed to expire renewals' });
  }
};
