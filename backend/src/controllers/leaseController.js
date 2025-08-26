import { prisma } from '../utils/prisma.js';

const getUserRoleForLease = async (userId, lease) => {
  if (!lease) return 'NONE';
  if (lease.tenantId === userId) return 'TENANT';
  // Try to infer landlord via property
  if (lease.propertyId) {
    const prop = await prisma.property.findUnique({ where: { id: lease.propertyId }, select: { landlordId: true } });
    if (prop?.landlordId === userId) return 'LANDLORD';
  }
  // Fallback: infer by offer
  if (lease.offerId) {
    const off = await prisma.offer.findUnique({ where: { id: lease.offerId }, select: { landlordId: true } });
    if (off?.landlordId === userId) return 'LANDLORD';
  }
  return 'NONE';
};

export const postTerminationNotice = async (req, res) => {
  try {
    const { id } = req.params; // lease id
    const { reason, effectiveDate } = req.body || {};

    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease) return res.status(404).json({ error: 'Lease not found' });

    // Irreversible: if already set, reject
    if (lease.terminationNoticeDate || lease.status === 'TERMINATED') {
      return res.status(400).json({ error: 'Termination already initiated' });
    }

    // Role check: must be tenant or landlord of this lease
    const role = await getUserRoleForLease(req.user.id, lease);
    if (role === 'NONE') return res.status(403).json({ error: 'Not authorized' });

    const now = new Date();
    const eff = effectiveDate ? new Date(effectiveDate) : new Date(lease.endDate);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.lease.update({
        where: { id },
        data: {
          terminationNoticeByUserId: req.user.id,
          terminationNoticeDate: now,
          terminationEffectiveDate: eff,
          terminationReason: reason || null,
          status: 'ACTIVE',
        }
      });

      // Immediately market property for new tenants
      if (u.propertyId) {
        await tx.property.update({
          where: { id: u.propertyId },
          data: { isMarketing: true, status: 'AVAILABLE' }
        });
      }

      // Notify tenant and landlord
      const participants = [];
      participants.push(u.tenantId);
      if (u.propertyId) {
        const p = await tx.property.findUnique({ where: { id: u.propertyId }, select: { landlordId: true } });
        if (p?.landlordId) participants.push(p.landlordId);
      }
      const notifications = await Promise.all(participants.map((uid) => tx.notification.create({
        data: {
          userId: uid,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: u.id,
          title: 'Lease termination notice submitted',
          body: 'This notice is irreversible. Property is being marketed for a new tenant.'
        }
      })));

      return u;
    });

    // Emit socket notifications if available
    try {
      const io = req.app.get('io');
      if (io?.emitNotification) {
        // Best-effort: re-fetch landlord
        const prop = updated.propertyId ? await prisma.property.findUnique({ where: { id: updated.propertyId }, select: { landlordId: true } }) : null;
        const targets = [updated.tenantId, prop?.landlordId].filter(Boolean);
        for (const t of targets) {
          await io.emitNotification(t, { id: `lease-${updated.id}`, type: 'SYSTEM_ANNOUNCEMENT', title: 'Lease termination notice submitted', body: 'Irreversible notice recorded.', createdAt: new Date(), isRead: false });
        }
      }
    } catch {}

    return res.json({ success: true, lease: { id: updated.id, terminationEffectiveDate: updated.terminationEffectiveDate } });
  } catch (err) {
    console.error('postTerminationNotice error:', err);
    return res.status(500).json({ error: 'Failed to submit termination notice' });
  }
};

export const postRenewalDecline = async (req, res) => {
  try {
    const { id } = req.params; // lease id
    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease) return res.status(404).json({ error: 'Lease not found' });

    if (lease.renewalStatus === 'DECLINED') {
      return res.status(400).json({ error: 'Renewal already declined' });
    }

    const role = await getUserRoleForLease(req.user.id, lease);
    if (role === 'NONE') return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.lease.update({
        where: { id },
        data: {
          renewalStatus: 'DECLINED',
          renewalDeclinedAt: new Date(),
          renewalDeclinedByUserId: req.user.id
        }
      });

      // Begin marketing immediately as per product decision
      if (u.propertyId) {
        await tx.property.update({ where: { id: u.propertyId }, data: { isMarketing: true, status: 'AVAILABLE' } });
      }

      // Notify both parties
      const participants = [];
      participants.push(u.tenantId);
      if (u.propertyId) {
        const p = await tx.property.findUnique({ where: { id: u.propertyId }, select: { landlordId: true } });
        if (p?.landlordId) participants.push(p.landlordId);
      }
      await Promise.all(participants.map((uid) => tx.notification.create({
        data: {
          userId: uid,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: u.id,
          title: 'Lease renewal declined',
          body: 'Renewal has been declined. Property is being marketed for a new tenant.'
        }
      })));

      return u;
    });

    // Emit socket notifications (best-effort)
    try {
      const io = req.app.get('io');
      if (io?.emitNotification) {
        const prop = updated.propertyId ? await prisma.property.findUnique({ where: { id: updated.propertyId }, select: { landlordId: true } }) : null;
        const targets = [updated.tenantId, prop?.landlordId].filter(Boolean);
        for (const t of targets) {
          await io.emitNotification(t, { id: `lease-${updated.id}`, type: 'SYSTEM_ANNOUNCEMENT', title: 'Lease renewal declined', body: 'Property is being marketed immediately.', createdAt: new Date(), isRead: false });
        }
      }
    } catch {}

    return res.json({ success: true, lease: { id: updated.id, renewalStatus: updated.renewalStatus } });
  } catch (err) {
    console.error('postRenewalDecline error:', err);
    return res.status(500).json({ error: 'Failed to decline renewal' });
  }
};

export const getLeaseByOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    if (!offerId) return res.status(400).json({ error: 'offerId required' });
    let lease = await prisma.lease.findFirst({
      where: { offerId },
      select: {
        id: true,
        status: true,
        terminationNoticeDate: true,
        terminationEffectiveDate: true,
        terminationReason: true,
        renewalStatus: true,
        renewalDeclinedAt: true
      }
    });
    if (!lease) {
      // Fallback: auto-create a Lease for a paid offer if none exists yet
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { rentalRequest: true, property: true }
      });
      if (!offer || offer.status !== 'PAID' || offer.moveInVerificationStatus === 'CANCELLED') {
        return res.json({ success: true, lease: null });
      }

      if (!offer.propertyId) {
        return res.json({ success: true, lease: null });
      }

      const leaseStartDate = offer.leaseStartDate
        || (offer.rentalRequest?.moveInDate ? new Date(offer.rentalRequest.moveInDate) : new Date(offer.availableFrom));
      const leaseEndDate = new Date(leaseStartDate);
      leaseEndDate.setMonth(leaseEndDate.getMonth() + (offer.leaseDuration || 12));

      // Ensure a Unit exists to satisfy Lease.unitId requirement
      const unit = await prisma.unit.create({
        data: {
          unitNumber: `RN-${offer.id}`,
          floor: 0,
          bedrooms: offer.property?.bedrooms || 1,
          bathrooms: offer.property?.bathrooms || 1,
          area: offer.property?.size || 0,
          rentAmount: offer.rentAmount || 0,
          propertyId: offer.propertyId,
        }
      });

      const created = await prisma.lease.create({
        data: {
          startDate: leaseStartDate,
          endDate: leaseEndDate,
          rentAmount: offer.rentAmount || 0,
          depositAmount: offer.depositAmount || 0,
          status: 'ACTIVE',
          tenantId: offer.tenantId,
          unitId: unit.id,
          rentalRequestId: offer.rentalRequestId || null,
          offerId: offer.id,
          propertyId: offer.propertyId
        },
        select: {
          id: true,
          status: true,
          terminationNoticeDate: true,
          terminationEffectiveDate: true,
          terminationReason: true,
          renewalStatus: true,
          renewalDeclinedAt: true
        }
      });
      lease = created;
    }
    return res.json({ success: true, lease });
  } catch (e) {
    console.error('getLeaseByOffer error:', e);
    return res.status(500).json({ error: 'Failed to fetch lease by offer' });
  }
};


