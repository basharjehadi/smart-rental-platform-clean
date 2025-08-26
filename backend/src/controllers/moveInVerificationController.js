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
      include: { rentalRequest: true, property: true, landlord: true, tenant: true },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const deadline = offer.moveInVerificationDeadline
      || (offer.rentalRequest?.moveInDate
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
        moveInVerificationStatus: 'SUCCESS',
        moveInVerificationDate: new Date(),
      },
      select: { id: true, moveInVerificationStatus: true, moveInVerificationDate: true },
    });

    // Notify landlord
    const offer = await prisma.offer.findUnique({ where: { id }, select: { landlordId: true } });
    if (offer?.landlordId) {
      await prisma.notification.create({
        data: {
          userId: offer.landlordId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: id,
          title: 'Tenant confirmed move-in',
          body: 'The tenant confirmed successful move-in.'
        }
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error verifying move-in success:', error);
    return res.status(500).json({ error: 'Failed to verify move-in' });
  }
};

// POST /offers/:id/report-issue
export const reportMoveInIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body || {};
    // Collect evidence paths from multer uploads (single or multiple)
    let evidence = [];
    if (req.files && req.files.length > 0) {
      evidence = req.files.map(f => `/uploads/move_in_evidence/${f.filename}`);
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        moveInVerificationStatus: 'ISSUE_REPORTED',
        cancellationReason: reason || null,
        cancellationEvidence: Array.isArray(evidence) ? evidence : [],
        verificationNotes: notes || null,
      },
      select: {
        id: true,
        moveInVerificationStatus: true,
        cancellationReason: true,
        cancellationEvidence: true,
        verificationNotes: true,
      },
    });

    // Notify landlord immediately
    const offer = await prisma.offer.findUnique({ where: { id }, select: { landlordId: true, tenantId: true, propertyId: true } });
    if (offer?.landlordId) {
      await prisma.notification.create({
        data: {
          userId: offer.landlordId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: id,
          title: 'Move-in issue reported',
          body: 'The tenant reported a move-in issue. Please review.'
        }
      });
    }

    // Auto-create support ticket for admin processing
    const tenant = await prisma.user.findUnique({ where: { id: offer.tenantId }, select: { id: true, email: true } });
    await prisma.supportTicket.create({
      data: {
        userId: offer.tenantId,
        title: `Move-in issue for offer ${id}`,
        description: `Tenant ${tenant?.email || offer.tenantId} reported: ${reason || 'No reason provided'}. Evidence: ${evidence.join(', ')}`,
        category: 'PROPERTY_ISSUE',
        priority: 'HIGH',
        status: 'OPEN'
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error reporting move-in issue:', error);
    return res.status(500).json({ error: 'Failed to report issue' });
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

    const deadline = offer.moveInVerificationDeadline
      || (offer.rentalRequest?.moveInDate
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
    console.error('Error getting latest paid offer status for property:', error);
    return res.status(500).json({ error: 'Failed to get property offer status' });
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
        include: { rentalRequest: true, property: true }
      });
      if (!offer) throw new Error('Offer not found');

      // 1) Update verification status and notes
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: {
          moveInVerificationStatus: 'CANCELLED',
          verificationNotes: notes || null
        },
        select: { id: true, moveInVerificationStatus: true, verificationNotes: true, tenantId: true, landlordId: true, rentalRequestId: true, propertyId: true }
      });

      // 2) Cancel rental request and unlock pool
      if (offer.rentalRequestId) {
        await tx.rentalRequest.update({
          where: { id: offer.rentalRequestId },
          data: { status: 'CANCELLED', isLocked: false, poolStatus: 'CANCELLED' }
        });
      }

      // 3) Unlock property and make AVAILABLE
      if (offer.propertyId) {
        await tx.property.update({
          where: { id: offer.propertyId },
          data: { status: 'AVAILABLE', availability: true }
        });
      }

      // 4) Expire any generated contract for this request
      await tx.contract.updateMany({
        where: { rentalRequestId: offer.rentalRequestId },
        data: { status: 'EXPIRED' }
      });

      // 5) Refund related payments via gateway-specific handler after transaction

      // 6) Archive related conversations for this offer
      await tx.conversation.updateMany({
        where: { offerId: id },
        data: { status: 'ARCHIVED' }
      });

      // 7) Close related support ticket if exists
      const ticket = await tx.supportTicket.findFirst({
        where: {
          userId: offer.rentalRequest?.tenantId || updatedOffer.tenantId,
          status: 'OPEN',
          title: { contains: id }
        }
      });
      if (ticket) {
        await tx.supportTicket.update({ where: { id: ticket.id }, data: { status: 'RESOLVED' } });
      }

      // 8) Create notifications
      const tenantNotif = await tx.notification.create({
        data: { userId: updatedOffer.tenantId, type: 'SYSTEM_ANNOUNCEMENT', entityId: id, title: 'Cancellation approved', body: 'Your move-in cancellation has been approved. Refund initiated.' }
      });
      const landlordNotif = await tx.notification.create({
        data: { userId: updatedOffer.landlordId, type: 'SYSTEM_ANNOUNCEMENT', entityId: id, title: 'Cancellation approved', body: 'The booking was cancelled; property unlocked and available again.' }
      });

      return { updatedOffer, tenantNotif, landlordNotif };
    });

    // Refund payments (Stripe or Mock)
    try {
      const { refundOfferPayments } = await import('./paymentController.js');
      await refundOfferPayments(id);
    } catch (e) {
      console.warn('Refund processing failed or unavailable:', e.message);
    }

    // Try to emit realtime notifications
    try {
      const { default: createIO } = await import('../socket/socketServer.js');
      const io = createIO?.io || global.io;
      if (io?.emitNotification) {
        await io.emitNotification(result.updatedOffer.tenantId, result.tenantNotif);
        await io.emitNotification(result.updatedOffer.landlordId, result.landlordNotif);
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
        verificationNotes: notes || null
      },
      select: { id: true, moveInVerificationStatus: true, verificationNotes: true, tenantId: true, landlordId: true }
    });
    const tenantNotif = await prisma.notification.create({
      data: { userId: updated.tenantId, type: 'SYSTEM_ANNOUNCEMENT', entityId: id, title: 'Cancellation rejected', body: 'Support rejected the cancellation request.' }
    });
    const landlordNotif = await prisma.notification.create({
      data: { userId: updated.landlordId, type: 'SYSTEM_ANNOUNCEMENT', entityId: id, title: 'Cancellation rejected', body: 'Support rejected the tenant cancellation request.' }
    });
    try {
      const { default: createIO } = await import('../socket/socketServer.js');
      const io = createIO?.io || global.io;
      if (io?.emitNotification) {
        await io.emitNotification(updated.tenantId, tenantNotif);
        await io.emitNotification(updated.landlordId, landlordNotif);
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


