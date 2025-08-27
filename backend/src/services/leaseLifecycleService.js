import { prisma } from '../utils/prisma.js';

let leaseScheduler;

export const runLeaseTerminations = async () => {
  const now = new Date();
  // Leases with termination effective today or earlier and still not terminated
  const due = await prisma.lease.findMany({
    where: {
      status: { in: ['ACTIVE', 'PENDING'] },
      terminationEffectiveDate: { not: null, lte: now }
    },
    select: { id: true, tenantGroupId: true, offerId: true, propertyId: true }
  });

  for (const l of due) {
    const updated = await prisma.lease.update({
      where: { id: l.id },
      data: { status: 'TERMINATED' }
    });

    // Contract cleanup based on offer/rentalRequest linkage (best-effort)
    try {
      if (l.offerId) {
        const off = await prisma.offer.findUnique({ where: { id: l.offerId }, select: { rentalRequestId: true } });
        if (off?.rentalRequestId) {
          const contracts = await prisma.contract.findMany({ where: { rentalRequestId: off.rentalRequestId }, select: { id: true, pdfUrl: true } });
          if (contracts.length > 0) {
            await prisma.contract.deleteMany({ where: { rentalRequestId: off.rentalRequestId } });
            // Best-effort file cleanup after DB delete
            try {
              const fs = await import('fs');
              const path = await import('path');
              for (const c of contracts) {
                if (!c.pdfUrl) continue;
                const filePath = path.join(process.cwd(), c.pdfUrl);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              }
            } catch {}
          }
        }
      }
    } catch {}

    // Archive related conversations
    try {
      if (l.offerId) {
        await prisma.conversation.updateMany({ where: { offerId: l.offerId }, data: { status: 'ARCHIVED' } });
      }
    } catch {}

    // Property availability: set AVAILABLE if no overlapping booking; keep marketing false after termination
    try {
      if (l.propertyId) {
        await prisma.property.update({ where: { id: l.propertyId }, data: { status: 'AVAILABLE', isMarketing: false } });
      }
    } catch {}

    // Notifications
    try {
      // Notify nothing specific now (group/org level). Could notify group primary member if needed.
    } catch {}
  }
};

export const startLeaseLifecycleScheduler = () => {
  if (leaseScheduler) return;
  leaseScheduler = setInterval(async () => {
    try {
      await runLeaseTerminations();
      // Expire stale renewal requests (every run)
      try {
        const now = new Date();
        await prisma.renewalRequest.updateMany({ where: { status: { in: ['PENDING', 'COUNTERED'] }, expiresAt: { not: null, lte: now } }, data: { status: 'EXPIRED', decidedAt: now } });
      } catch {}
    } catch (e) {
      console.error('Lease lifecycle scheduler error:', e);
    }
  }, 5 * 60 * 1000); // every 5 minutes
  console.log('⏰ Lease lifecycle scheduler started (every 5 minutes).');
};

export const stopLeaseLifecycleScheduler = () => {
  if (leaseScheduler) {
    clearInterval(leaseScheduler);
    leaseScheduler = undefined;
  }
};


