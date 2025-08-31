import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to compute deadline based on move-in date (+24h)
const computeVerificationDeadline = (moveInDate) => {
  const base = moveInDate ? new Date(moveInDate) : new Date();
  return new Date(base.getTime() + 24 * 60 * 60 * 1000);
};

// GET /offers/:id/move-in-status
export const getMoveInStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        rentalRequest: true,
        property: true,
        organization: {
          include: {
            members: {
              where: { role: 'OWNER' },
              select: { userId: true }
            }
          }
        },
        tenantGroup: {
          include: {
            members: {
              select: { userId: true }
            }
          }
        }
      },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const deadline =
      offer.moveInVerificationDeadline ||
      (offer.rentalRequest?.moveInDate
        ? computeVerificationDeadline(offer.rentalRequest.moveInDate)
        : null);

    return res.json({
      success: true,
      data: {
        offerId: offer.id,
        status: offer.moveInVerificationStatus,
        deadline,
        verifiedAt: offer.moveInVerificationDate,
        cancellationReason: offer.cancellationReason || null,
        evidence: offer.cancellationEvidence || [],
      },
    });
  } catch (error) {
    console.error('Error getting move-in status:', error);
    return res.status(500).json({ error: 'Failed to get move-in status' });
  }
};

// POST /offers/:id/verify-move-in
export const verifyMoveInSuccess = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        moveInVerificationStatus: 'VERIFIED',
        moveInVerificationDate: new Date(),
      },
      select: {
        id: true,
        moveInVerificationStatus: true,
        moveInVerificationDate: true,
        organizationId: true,
        propertyId: true,
        rentalRequestId: true,
      },
    });

    // Notify landlord + emit realtime update for dashboards
    if (updated?.organizationId) {
      // Get the landlord user ID from the organization
      const landlordMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: updated.organizationId,
          role: 'OWNER',
        },
        select: { userId: true },
      });

      if (landlordMember?.userId) {
        const landlordId = landlordMember.userId;

        await prisma.notification.create({
          data: {
            userId: landlordId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: id,
            title: 'Tenant verified move-in',
            body: 'The tenant verified successful move-in.',
          },
        });

        // Get the io instance from the Express app
        const io = req.app.get('io');
        if (io?.emitNotification) {
          await io.emitNotification(landlordId, {
            id: `movein-${id}`,
            type: 'SYSTEM_ANNOUNCEMENT',
            title: 'Tenant confirmed move-in',
            body: 'The tenant confirmed successful move-in.',
            createdAt: new Date(),
            isRead: false,
          });
        }
        if (io?.emitMoveInVerificationUpdate) {
          await io.emitMoveInVerificationUpdate(landlordId, id, 'VERIFIED');
        }
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error verifying move-in success:', error);
    return res.status(500).json({ error: 'Failed to verify move-in' });
  }
};

// POST /offers/:id/deny-move-in
export const denyMoveIn = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the offer and verify user authorization
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        tenantGroup: {
          include: {
            members: {
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found',
        message: 'The specified offer does not exist'
      });
    }

    // Check if user is a tenant member
    const isTenantMember = offer.tenantGroup.members.some(
      (member) => member.userId === userId
    );

    if (!isTenantMember) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only tenant members can deny move-in'
      });
    }

    // Check preconditions
    if (offer.moveInVerificationStatus !== 'PENDING') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Move-in can only be denied when status is PENDING'
      });
    }

    const now = new Date();
    if (offer.moveInVerificationDeadline && now >= offer.moveInVerificationDeadline) {
      return res.status(400).json({
        error: 'Deadline expired',
        message: 'Move-in verification deadline has expired'
      });
    }

    // Update the offer status
    const updated = await prisma.offer.update({
      where: { id },
      data: {
        moveInVerificationStatus: 'DENIED',
        moveInVerifiedAt: now,
      },
      select: {
        id: true,
        moveInVerificationStatus: true,
        moveInVerifiedAt: true,
        organizationId: true,
        propertyId: true,
        rentalRequestId: true,
      },
    });

    // Notify landlord
    if (updated?.organizationId) {
      const landlordMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: updated.organizationId,
          role: 'OWNER',
        },
        select: { userId: true },
      });

      if (landlordMember?.userId) {
        const landlordId = landlordMember.userId;

        await prisma.notification.create({
          data: {
            userId: landlordId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: id,
            title: 'Tenant denied move-in',
            body: 'The tenant denied successful move-in.',
          },
        });

        // Get the io instance from the Express app
        const io = req.app.get('io');
        if (io?.emitNotification) {
          await io.emitNotification(landlordId, {
            id: `movein-deny-${id}`,
            type: 'SYSTEM_ANNOUNCEMENT',
            title: 'Tenant denied move-in',
            body: 'The tenant denied successful move-in.',
            createdAt: new Date(),
            isRead: false,
          });
        }
        if (io?.emitMoveInVerificationUpdate) {
          await io.emitMoveInVerificationUpdate(landlordId, id, 'DENIED');
        }
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error denying move-in:', error);
    return res.status(500).json({ error: 'Failed to deny move-in' });
  }
};

// GET /offers/property/:propertyId/latest-paid-status
export const getLatestPaidOfferStatusForProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const offer = await prisma.offer.findFirst({
      where: { propertyId, status: 'PAID' },
      orderBy: { updatedAt: 'desc' },
      include: { rentalRequest: true },
    });

    if (!offer) {
      return res.json({ success: true, data: null });
    }

    const deadline =
      offer.moveInVerificationDeadline ||
      (offer.rentalRequest?.moveInDate
        ? computeVerificationDeadline(offer.rentalRequest.moveInDate)
        : null);

    return res.json({
      success: true,
      data: {
        offerId: offer.id,
        status: offer.moveInVerificationStatus,
        deadline,
        verifiedAt: offer.moveInVerificationDate,
      },
    });
  } catch (error) {
    console.error(
      'Error getting latest paid offer status for property:',
      error
    );
    return res
      .status(500)
      .json({ error: 'Failed to get property offer status' });
  }
};

export const adminApproveCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    // Wrap in a transaction to ensure atomicity and idempotency
    const result = await prisma.$transaction(async (tx) => {
      // Load offer with relations
      const offer = await tx.offer.findUnique({
        where: { id },
        include: { rentalRequest: true, property: true },
      });
      if (!offer) throw new Error('Offer not found');

      // 1) Update verification status and notes
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: {
          moveInVerificationStatus: 'CANCELLED',
          verificationNotes: notes || null,
        },
        select: {
          id: true,
          moveInVerificationStatus: true,
          verificationNotes: true,
          rentalRequestId: true,
          propertyId: true,
          organizationId: true,
        },
      });

      // 2) Cancel rental request and unlock pool
      if (offer.rentalRequestId) {
        await tx.rentalRequest.update({
          where: { id: offer.rentalRequestId },
          data: {
            status: 'CANCELLED',
            isLocked: false,
            poolStatus: 'CANCELLED',
          },
        });
      }

      // 3) Unlock property and make AVAILABLE
      if (offer.propertyId) {
        await tx.property.update({
          where: { id: offer.propertyId },
          data: { status: 'AVAILABLE', availability: true },
        });
      }

      // 4) Delete any generated contracts for this request (hard delete per product decision)
      const contractsToDelete = await tx.contract.findMany({
        where: { rentalRequestId: offer.rentalRequestId },
        select: { id: true, pdfUrl: true },
      });
      if (contractsToDelete.length > 0) {
        await tx.contract.deleteMany({
          where: { rentalRequestId: offer.rentalRequestId },
        });
      }

      // 5) Refund related payments via gateway-specific handler after transaction

      // 6) Archive related conversations for this offer
      await tx.conversation.updateMany({
        where: { offerId: id },
        data: { status: 'ARCHIVED' },
      });

      // 7) Close related support ticket if exists
      const ticket = await tx.supportTicket.findFirst({
        where: {
          userId: offer.rentalRequest?.tenantGroup?.members?.[0]?.userId,
          status: 'OPEN',
          title: { contains: id },
        },
      });
      if (ticket) {
        await tx.supportTicket.update({
          where: { id: ticket.id },
          data: { status: 'RESOLVED' },
        });
      }

      // 8) Create notifications
      // Get tenant ID from rental request
      const tenantMember = await tx.tenantGroupMember.findFirst({
        where: { tenantGroupId: offer.rentalRequest?.tenantGroupId },
        select: { userId: true },
      });

      // Get landlord ID from organization
      const landlordMember = await tx.organizationMember.findFirst({
        where: {
          organizationId: updatedOffer.organizationId,
          role: 'OWNER',
        },
        select: { userId: true },
      });

      if (tenantMember?.userId) {
        const tenantNotif = await tx.notification.create({
          data: {
            userId: tenantMember.userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: id,
            title: 'Cancellation approved',
            body: 'Your move-in cancellation has been approved. Refund initiated.',
          },
        });
      }

      if (landlordMember?.userId) {
        const landlordNotif = await tx.notification.create({
          data: {
            userId: landlordMember.userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: id,
            title: 'Cancellation approved',
            body: 'The booking was cancelled; property unlocked and available again.',
          },
        });
      }

      return { updatedOffer, contractsToDelete };
    });

    // Delete contract PDF files on disk (best-effort, after DB commit)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const files = (result.contractsToDelete || [])
        .map((c) => c.pdfUrl)
        .filter(Boolean);
      for (const relPath of files) {
        try {
          const filePath = path.join(process.cwd(), relPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.warn(
            'Failed to delete contract PDF:',
            relPath,
            fileErr?.message
          );
        }
      }
    } catch (e) {
      console.warn('Contract file cleanup skipped:', e?.message);
    }

    // Refund payments (Stripe or Mock)
    try {
      const { refundOfferPayments } = await import('./paymentController.js');
      await refundOfferPayments(id);
    } catch (e) {
      console.warn('Refund processing failed or unavailable:', e.message);
    }

    // Update landlord availability since property was unlocked
    try {
      const requestPoolService = (
        await import('../services/requestPoolService.js')
      ).default;
      // Get landlord ID from the offer's organization
      const landlordMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: result.updatedOffer.organizationId,
          role: 'OWNER',
        },
        select: { userId: true },
      });

      if (landlordMember?.userId) {
        await requestPoolService.updateUserAvailability(
          landlordMember.userId,
          true
        );
      }
    } catch (e) {
      console.warn(
        'Could not update landlord availability after cancellation:',
        e?.message
      );
    }

    // Try to emit realtime notifications
    try {
      const io = req.app.get('io');
      if (io?.emitNotification) {
        // Get tenant ID from rental request
        const tenantMember = await prisma.tenantGroupMember.findFirst({
          where: { tenantGroupId: offer.rentalRequest?.tenantGroupId },
          select: { userId: true },
        });

        // Get landlord ID from organization
        const landlordMember = await prisma.organizationMember.findFirst({
          where: {
            organizationId: result.updatedOffer.organizationId,
            role: 'OWNER',
          },
          select: { userId: true },
        });

        if (tenantMember?.userId) {
          await io.emitNotification(tenantMember.userId, {
            type: 'SYSTEM_ANNOUNCEMENT',
            title: 'Cancellation approved',
            body: 'Your move-in cancellation has been approved. Refund initiated.',
          });
        }

        if (landlordMember?.userId) {
          await io.emitNotification(landlordMember.userId, {
            type: 'SYSTEM_ANNOUNCEMENT',
            title: 'Cancellation approved',
            body: 'The booking was cancelled; property unlocked and available again.',
          });
        }
      }
    } catch (e) {
      console.warn('Socket emit not available for adminApproveCancellation');
    }

    res.json({ success: true, data: result.updatedOffer });
  } catch (e) {
    console.error('adminApproveCancellation error:', e);
    res.status(500).json({ error: 'Failed to approve cancellation' });
  }
};

export const adminRejectCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const updated = await prisma.offer.update({
      where: { id },
      data: {
        moveInVerificationStatus: 'SUCCESS',
        verificationNotes: notes || null,
      },
      select: {
        id: true,
        moveInVerificationStatus: true,
        verificationNotes: true,
        organizationId: true,
        rentalRequestId: true,
      },
    });
    // Get tenant ID from rental request
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: updated.rentalRequestId },
      select: { tenantGroupId: true },
    });

    // Get landlord ID from organization
    const landlordMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: updated.organizationId,
        role: 'OWNER',
      },
      select: { userId: true },
    });

    let tenantNotif = null;
    let landlordNotif = null;

    if (rentalRequest?.tenantGroupId) {
      const tenantMember = await prisma.tenantGroupMember.findFirst({
        where: { tenantGroupId: rentalRequest.tenantGroupId },
        select: { userId: true },
      });

      if (tenantMember?.userId) {
        tenantNotif = await prisma.notification.create({
          data: {
            userId: tenantMember.userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            entityId: id,
            title: 'Cancellation rejected',
            body: 'Support rejected the cancellation request.',
          },
        });
      }
    }

    if (landlordMember?.userId) {
      landlordNotif = await prisma.notification.create({
        data: {
          userId: landlordMember.userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: id,
          title: 'Cancellation rejected',
          body: 'Support rejected the tenant cancellation request.',
        },
      });
    }
    try {
      const io = req.app.get('io');
      if (io?.emitNotification) {
        if (tenantNotif) {
          await io.emitNotification(tenantNotif.userId, tenantNotif);
        }
        if (landlordNotif) {
          await io.emitNotification(landlordNotif.userId, landlordNotif);
        }
      }
      if (io?.emitMoveInVerificationUpdate && landlordMember?.userId) {
        await io.emitMoveInVerificationUpdate(
          landlordMember.userId,
          id,
          'SUCCESS'
        );
      }
    } catch (e) {
      console.warn('Socket emit not available for adminRejectCancellation');
    }
    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('adminRejectCancellation error:', e);
    res.status(500).json({ error: 'Failed to reject cancellation' });
  }
};

// GET /offers/:id/move-in-issues
export const getOfferMoveInIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the offer and verify user authorization
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        tenantGroup: {
          include: {
            members: {
              select: { userId: true }
            }
          }
        },
        property: {
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
        },
        leases: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found',
        message: 'The specified offer does not exist'
      });
    }

    // Check if user is authorized to view issues for this offer
    const isTenant = offer.tenantGroup.members.some(
      (member) => member.userId === userId
    );
    const isLandlord = offer.property?.organization.members.some(
      (member) => member.userId === userId
    );

    if (!isTenant && !isLandlord) {
      return res.status(403).json({
        error: 'Not allowed',
        message: 'Only participants can view issues for this offer'
      });
    }

    // Get the lease for this offer
    const lease = offer.leases[0];
    if (!lease) {
      return res.json({
        success: true,
        issues: []
      });
    }

    // Get all move-in issues for this lease
    const issues = await prisma.moveInIssue.findMany({
      where: { leaseId: lease.id },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Get last 5 comments for preview
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      issues
    });
  } catch (error) {
    console.error('Get offer move-in issues error:', error);
    res.status(500).json({
      error: 'Failed to get move-in issues',
      message: 'An error occurred while fetching the issues'
    });
  }
};
