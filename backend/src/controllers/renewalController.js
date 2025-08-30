import { prisma } from '../utils/prisma.js';

const ensureLandlordCanSetPrice = async (userId, leaseId, proposedMonthlyRent) => {
  if (proposedMonthlyRent == null) return; // no price change
  // Only landlord can change price: infer landlord from property via offer
  const lease = await prisma.lease.findUnique({ where: { id: leaseId }, select: { propertyId: true, offerId: true } });
  if (!lease) throw new Error('Lease not found');
  const offer = lease.offerId ? await prisma.offer.findUnique({ where: { id: lease.offerId }, select: { organizationId: true } }) : null;
  
  if (offer?.organizationId) {
    // Check if user is a member of the organization that owns the property
    const isLandlord = await prisma.organizationMember.findFirst({
      where: {
        organizationId: offer.organizationId,
        userId: userId,
        role: 'OWNER'
      }
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
    const { proposedTermMonths, proposedStartDate, proposedMonthlyRent, note } = req.body || {};

    // Prevent duplicate open requests
    const openExists = await prisma.renewalRequest.findFirst({ where: { leaseId, status: { in: ['PENDING', 'COUNTERED'] } } });
    if (openExists) return res.status(400).json({ error: 'An open renewal request already exists for this lease' });

    // Enforce landlord-only price change
    await ensureLandlordCanSetPrice(req.user.id, leaseId, proposedMonthlyRent);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const request = await prisma.renewalRequest.create({
      data: {
        leaseId,
        initiatorUserId: req.user.id,
        status: 'PENDING',
        proposedTermMonths: proposedTermMonths || null,
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
        proposedMonthlyRent: proposedMonthlyRent ?? null,
        note: note || null,
        expiresAt
      }
    });

    // Notify counterparty (best-effort)
    try {
      const lease = await prisma.lease.findUnique({ where: { id: leaseId }, select: { tenantId: true, offerId: true } });
      const offer = lease?.offerId ? await prisma.offer.findUnique({ where: { id: lease.offerId }, select: { organizationId: true } }) : null;
      
      // Get landlord ID from organization
      let landlordId = null;
      if (offer?.organizationId) {
        const landlordMember = await prisma.organizationMember.findFirst({
          where: {
            organizationId: offer.organizationId,
            role: 'OWNER'
          },
          select: { userId: true }
        });
        landlordId = landlordMember?.userId;
      }
      
      const targets = [lease?.tenantId, landlordId].filter(t => t && t !== req.user.id);
      for (const t of targets) {
        await prisma.notification.create({ data: { userId: t, type: 'SYSTEM_ANNOUNCEMENT', entityId: request.id, title: 'Renewal request created', body: 'A lease renewal request is awaiting your response.' } });
      }
    } catch {}

    return res.json({ success: true, renewal: request });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Failed to create renewal request' });
  }
};

export const counterRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params; // renewal id
    const { proposedTermMonths, proposedStartDate, proposedMonthlyRent, note } = req.body || {};
    const existing = await prisma.renewalRequest.findUnique({ where: { id }, select: { leaseId: true, status: true } });
    if (!existing || !['PENDING', 'COUNTERED'].includes(existing.status)) return res.status(400).json({ error: 'Renewal not open for counter' });

    // Enforce landlord-only price change
    await ensureLandlordCanSetPrice(req.user.id, existing.leaseId, proposedMonthlyRent);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const counter = await prisma.renewalRequest.create({
      data: {
        leaseId: existing.leaseId,
        initiatorUserId: req.user.id,
        status: 'COUNTERED',
        proposedTermMonths: proposedTermMonths || null,
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
        proposedMonthlyRent: proposedMonthlyRent ?? null,
        note: note || null,
        counterOfId: id,
        expiresAt
      }
    });

    return res.json({ success: true, renewal: counter });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Failed to counter renewal' });
  }
};

export const acceptRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params; // renewal id
    const renewal = await prisma.renewalRequest.findUnique({ where: { id }, include: { lease: true } });
    if (!renewal) return res.status(404).json({ error: 'Renewal not found' });
    if (!['PENDING', 'COUNTERED'].includes(renewal.status)) return res.status(400).json({ error: 'Renewal not open' });

    // Mark accepted and close siblings
    const accepted = await prisma.$transaction(async (tx) => {
      await tx.renewalRequest.update({ where: { id }, data: { status: 'ACCEPTED', decidedByUserId: req.user.id, decidedAt: new Date() } });
      await tx.renewalRequest.updateMany({ where: { leaseId: renewal.leaseId, id: { not: id }, status: { in: ['PENDING', 'COUNTERED'] } }, data: { status: 'CANCELLED', decidedByUserId: req.user.id, decidedAt: new Date() } });

      // Create new lease effective the proposedStartDate or day after endDate
      const baseStart = renewal.proposedStartDate || new Date(renewal.lease.endDate.getTime() + 24 * 60 * 60 * 1000);
      const newEnd = new Date(baseStart);
      const months = renewal.proposedTermMonths || 12;
      newEnd.setMonth(newEnd.getMonth() + months);

      // Create a fresh unit to avoid unique constraint on unitId
      let cloneUnit;
      try {
        const src = await tx.unit.findUnique({
          where: { id: renewal.lease.unitId },
          select: { unitNumber: true, floor: true, bedrooms: true, bathrooms: true, area: true, rentAmount: true, propertyId: true }
        });
        cloneUnit = await tx.unit.create({
          data: {
            unitNumber: `RN-${renewal.lease.id}-${Date.now()}`,
            floor: src?.floor ?? 0,
            bedrooms: src?.bedrooms ?? 1,
            bathrooms: src?.bathrooms ?? 1,
            area: src?.area ?? 0,
            rentAmount: src?.rentAmount ?? (renewal.proposedMonthlyRent || renewal.lease.rentAmount),
            propertyId: src?.propertyId ?? renewal.lease.propertyId
          }
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
            propertyId: renewal.lease.propertyId
          }
        });
      }

      const newLease = await tx.lease.create({
        data: {
          startDate: baseStart,
          endDate: newEnd,
          rentAmount: renewal.proposedMonthlyRent || renewal.lease.rentAmount,
          depositAmount: renewal.lease.depositAmount,
          status: 'ACTIVE',
          tenantId: renewal.lease.tenantId,
          unitId: cloneUnit.id,
          rentalRequestId: renewal.lease.rentalRequestId,
          offerId: renewal.lease.offerId,
          propertyId: renewal.lease.propertyId
        }
      });
      return newLease;
    });

    // Notify both parties
    try {
      const offer = renewal.lease.offerId ? await prisma.offer.findUnique({ where: { id: renewal.lease.offerId }, select: { organizationId: true } }) : null;
      
      // Get landlord ID from organization
      let landlordId = null;
      if (offer?.organizationId) {
        const landlordMember = await prisma.organizationMember.findFirst({
          where: {
            organizationId: offer.organizationId,
            role: 'OWNER'
          },
          select: { userId: true }
        });
        landlordId = landlordMember?.userId;
      }
      
      const targets = [landlordId].filter(Boolean);
      for (const t of targets) {
        await prisma.notification.create({ data: { userId: t, type: 'SYSTEM_ANNOUNCEMENT', entityId: id, title: 'Renewal accepted', body: 'A new lease has been created from the renewal.' } });
      }
    } catch {}

    return res.json({ success: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Failed to accept renewal' });
  }
};

export const declineRenewalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const renewal = await prisma.renewalRequest.update({ where: { id }, data: { status: 'DECLINED', decidedByUserId: req.user.id, decidedAt: new Date() } });
    return res.json({ success: true, renewal });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Failed to decline renewal' });
  }
};

export const listRenewalsForLease = async (req, res) => {
  try {
    const { id: leaseId } = req.params;
    const items = await prisma.renewalRequest.findMany({ where: { leaseId }, orderBy: { createdAt: 'asc' } });
    return res.json({ success: true, renewals: items });
  } catch (e) {
    return res.status(400).json({ error: 'Failed to fetch renewals' });
  }
};


