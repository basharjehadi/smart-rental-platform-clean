import { prisma } from '../utils/prisma.js';
import { NotificationService } from '../services/notificationService.js';
import { 
  computeEarliestTerminationEnd, 
  resolveTerminationPolicy, 
  formatTerminationDate,
  getTerminationPolicyExplanation 
} from '../utils/dateUtils.js';

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

    // Send notification to tenant about the counter proposal
    if (tenantId) {
      try {
        const landlord = await prisma.user.findUnique({
          where: { id: landlordId },
          select: { name: true }
        });
        
        await NotificationService.createRenewalRequestNotification(
          tenantId,
          counter.id,
          landlord?.name || 'Your landlord',
          false // isTenantRequest = false (landlord initiated)
        );
      } catch (notificationError) {
        console.error('Failed to send counter notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

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
          // New fields for proper lease lifecycle management
          parentLeaseId: renewal.lease.id,
          leaseType: 'RENEWAL',
          renewalEffectiveDate: baseStart,
        },
      });

      // Mark the original lease as EXPIRED when renewal is accepted
      await tx.lease.update({
        where: { id: renewal.leaseId },
        data: {
          status: 'EXPIRED',
          updatedAt: new Date(),
        },
      });

      return newLease;
    });

    // 🚀 NEW: Generate contract for the renewal
    try {
      const { generateContractForLease } = await import('./contractController.js');
      
      // Create a mock request object for contract generation
      const mockReq = {
        user: { id: req.user.id },
        params: { leaseId: newLease.id }
      };
      
      const mockRes = {
        json: (data) => console.log('Contract generation result:', data),
        status: (code) => ({
          json: (data) => console.log('Contract generation error:', code, data)
        })
      };
      
      // Generate contract for the renewal
      await generateContractForLease(mockReq, mockRes);
      console.log('✅ Contract generated for renewal');
    } catch (contractError) {
      console.error('❌ Failed to generate contract for renewal:', contractError);
      // Don't fail the renewal if contract generation fails
    }

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

// 🚀 NEW: Termination Request Functions (as outlined by ChatGPT)

/**
 * Create a termination request for a lease
 * Implements the cutoff + month-end policy
 */
export const createTerminationRequest = async (req, res) => {
  try {
    const { id: leaseId } = req.params;
    const { proposedEndDate, effectiveDate, reason } = req.body;

    // Get lease with all related data for policy resolution
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
                // Authorize any organization member; some datasets may not mark OWNER explicitly
                members: {
                  select: { userId: true }
                }
              }
            }
          }
        },
        property: {
          select: {
            id: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Check authorization
    const tenantId = lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ 
        error: 'Access denied: Not authorized for this lease' 
      });
    }

    // Resolve termination policy
    const policy = resolveTerminationPolicy(lease);
    const earliestEnd = computeEarliestTerminationEnd(new Date(), policy);

    // Validate proposed end date if provided (accept both proposedEndDate/effectiveDate)
    const incomingDateIso = proposedEndDate || effectiveDate;
    if (incomingDateIso) {
      const proposedDate = new Date(incomingDateIso);
      if (proposedDate < earliestEnd) {
        return res.status(400).json({
          error: 'Invalid termination date',
          message: `Earliest possible end date is ${formatTerminationDate(earliestEnd, policy.timezone)}`,
          earliestEnd: earliestEnd.toISOString(),
          policy: {
            cutoffDay: policy.cutoffDay,
            minNoticeDays: policy.minNoticeDays,
            timezone: policy.timezone,
            explanation: getTerminationPolicyExplanation(policy)
          }
        });
      }
    }

    // Use earliest end date if no proposed date or if proposed date is valid
    const finalEndDate = incomingDateIso ? new Date(incomingDateIso) : earliestEnd;

    // Persist termination intent on the Lease itself (no separate table in schema)
    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        terminationNoticeByUserId: req.user.id,
        terminationNoticeDate: new Date(),
        terminationReason: reason || null,
        terminationEffectiveDate: finalEndDate,
      }
    });

    // Send notifications
    try {
      const requester = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true, role: true }
      });

      const targets = [tenantId, landlordId].filter(
        (t) => t && t !== req.user.id
      );

      // Notify the other party (tenant or landlord)
      await NotificationService.createSystemAnnouncementNotification(
        targets,
        'Lease Termination Request',
        `${requester?.name || 'User'} requested lease termination (effective ${formatTerminationDate(
          finalEndDate,
          policy.timezone
        )}).`
      );
    } catch (error) {
      console.error('Error sending termination notifications:', error);
    }

    return res.json({ 
      success: true, 
      termination: {
        leaseId,
        initiatorUserId: req.user.id,
        proposedEndDate: updatedLease.terminationEffectiveDate,
        reason: updatedLease.terminationReason,
        noticeDate: updatedLease.terminationNoticeDate,
      },
      policy: {
        cutoffDay: policy.cutoffDay,
        minNoticeDays: policy.minNoticeDays,
        timezone: policy.timezone,
        explanation: getTerminationPolicyExplanation(policy)
      }
    });
  } catch (e) {
    console.error('Create termination request error:', e);
    return res.status(400).json({ 
      error: e.message || 'Failed to create termination request' 
    });
  }
};

/**
 * Get termination policy preview for a lease
 */
export const getTerminationPolicyPreview = async (req, res) => {
  try {
    const { id: leaseId } = req.params;

    // Get lease with all related data
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
                // Authorize any organization member; some datasets may not mark OWNER explicitly
                members: {
                  select: { userId: true }
                }
              }
            }
          }
        },
        property: {
          select: {
            id: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Check authorization
    const tenantId = lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ 
        error: 'Access denied: Not authorized for this lease' 
      });
    }

    // Resolve termination policy
    const policy = resolveTerminationPolicy(lease);
    const earliestEnd = computeEarliestTerminationEnd(new Date(), policy);

    return res.json({
      success: true,
      terminationPolicyPreview: {
        cutoffDay: policy.cutoffDay,
        minNoticeDays: policy.minNoticeDays,
        timezone: policy.timezone,
        earliestEnd: earliestEnd.toISOString(),
        explanation: getTerminationPolicyExplanation(policy)
      }
    });
  } catch (e) {
    console.error('Get termination policy preview error:', e);
    return res.status(400).json({ 
      error: 'Failed to get termination policy preview' 
    });
  }
};

/**
 * Accept a termination request
 */
export const acceptTerminationRequest = async (req, res) => {
  try {
    const { id: terminationId } = req.params;

    // Get termination request with lease data
    const terminationRequest = await prisma.terminationRequest.findUnique({
      where: { id: terminationId },
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

    if (!terminationRequest) {
      return res.status(404).json({ error: 'Termination request not found' });
    }

    if (terminationRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Termination request is not pending' 
      });
    }

    // Check authorization - either party can accept
    const tenantId = terminationRequest.lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = terminationRequest.lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ 
        error: 'Access denied: Not authorized for this lease' 
      });
    }

    // Update termination request status
    const updatedRequest = await prisma.terminationRequest.update({
      where: { id: terminationId },
      data: {
        status: 'ACCEPTED',
        decidedByUserId: req.user.id,
        decidedAt: new Date()
      }
    });

    // Update lease status
    await prisma.lease.update({
      where: { id: terminationRequest.leaseId },
      data: {
        status: 'TERMINATED',
        terminationReason: terminationRequest.reason,
        terminationEffectiveDate: terminationRequest.proposedEndDate,
        terminationNoticeByUserId: terminationRequest.initiatorUserId,
        terminationNoticeDate: terminationRequest.createdAt,
        updatedAt: new Date()
      }
    });

    // Send notifications
    try {
      const accepter = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
      });

      const otherPartyId = req.user.id === tenantId ? landlordId : tenantId;
      if (otherPartyId) {
        await NotificationService.createNotification({
          userId: otherPartyId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Lease Termination Accepted',
          message: `${accepter?.name || 'User'} has accepted the lease termination request`,
          data: {
            terminationRequestId: terminationId,
            leaseId: terminationRequest.leaseId,
            endDate: terminationRequest.proposedEndDate.toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error sending termination acceptance notifications:', error);
    }

    return res.json({ 
      success: true, 
      terminationRequest: updatedRequest 
    });
  } catch (e) {
    console.error('Accept termination request error:', e);
    return res.status(400).json({ 
      error: 'Failed to accept termination request' 
    });
  }
};

/**
 * Decline a termination request
 */
export const declineTerminationRequest = async (req, res) => {
  try {
    const { id: terminationId } = req.params;

    // Get termination request with lease data
    const terminationRequest = await prisma.terminationRequest.findUnique({
      where: { id: terminationId },
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

    if (!terminationRequest) {
      return res.status(404).json({ error: 'Termination request not found' });
    }

    if (terminationRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Termination request is not pending' 
      });
    }

    // Check authorization - either party can decline
    const tenantId = terminationRequest.lease.tenantGroup?.members?.[0]?.userId;
    const landlordId = terminationRequest.lease.offer?.organization?.members?.[0]?.userId;
    const isTenant = req.user.id === tenantId;
    const isLandlord = req.user.id === landlordId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ 
        error: 'Access denied: Not authorized for this lease' 
      });
    }

    // Update termination request status
    const updatedRequest = await prisma.terminationRequest.update({
      where: { id: terminationId },
      data: {
        status: 'DECLINED',
        decidedByUserId: req.user.id,
        decidedAt: new Date()
      }
    });

    // Send notifications
    try {
      const decliner = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
      });

      const otherPartyId = req.user.id === tenantId ? landlordId : tenantId;
      if (otherPartyId) {
        await NotificationService.createNotification({
          userId: otherPartyId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Lease Termination Declined',
          message: `${decliner?.name || 'User'} has declined the lease termination request`,
          data: {
            terminationRequestId: terminationId,
            leaseId: terminationRequest.leaseId
          }
        });
      }
    } catch (error) {
      console.error('Error sending termination decline notifications:', error);
    }

    return res.json({ 
      success: true, 
      terminationRequest: updatedRequest 
    });
  } catch (e) {
    console.error('Decline termination request error:', e);
    return res.status(400).json({ 
      error: 'Failed to decline termination request' 
    });
  }
};
