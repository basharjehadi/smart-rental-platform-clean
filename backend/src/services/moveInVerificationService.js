import { prisma } from '../utils/prisma.js';

const THRESHOLDS_HOURS = [24, 12, 1];
let verificationScheduler;

const withinWindow = (diffMs, targetHours, windowMinutes = 10) => {
  const targetMs = targetHours * 60 * 60 * 1000;
  return diffMs <= targetMs && diffMs > targetMs - windowMinutes * 60 * 1000;
};

export const runMoveInReminders = async () => {
  const now = new Date();
  const offers = await prisma.offer.findMany({
    where: {
      moveInVerificationStatus: 'PENDING',
      moveInVerificationDeadline: { not: null }
    },
    select: {
      id: true,
      tenantId: true,
      landlordId: true,
      moveInVerificationDeadline: true
    }
  });

  for (const offer of offers) {
    // Double-check status to avoid race with newly reported issues
    const current = await prisma.offer.findUnique({
      where: { id: offer.id },
      select: { moveInVerificationStatus: true }
    });
    if (current?.moveInVerificationStatus !== 'PENDING') continue;

    const diffMs = offer.moveInVerificationDeadline.getTime() - now.getTime();
    if (diffMs <= 0) continue; // handled by finalizer

    for (const h of THRESHOLDS_HOURS) {
      if (withinWindow(diffMs, h)) {
        const title = `Move-in verification reminder (${h}h)`;
        const existing = await prisma.notification.findFirst({
          where: { userId: offer.tenantId, entityId: offer.id, title }
        });
        if (!existing) {
          const n = await prisma.notification.create({
            data: {
              userId: offer.tenantId,
              type: 'SYSTEM_ANNOUNCEMENT',
              entityId: offer.id,
              title,
              body: 'Please confirm your move-in or report an issue within the 24h window.'
            }
          });
          // landlord heads-up at 1h
          if (h === 1) {
            await prisma.notification.create({
              data: {
                userId: offer.landlordId,
                type: 'SYSTEM_ANNOUNCEMENT',
                entityId: offer.id,
                title: 'Tenant move-in verification pending',
                body: 'The tenant has 1 hour left to confirm move-in.'
              }
            });
          }
        }
      }
    }
  }
};

export const runMoveInFinalization = async () => {
  const now = new Date();
  const expired = await prisma.offer.findMany({
    where: {
      moveInVerificationStatus: 'PENDING',
      moveInVerificationDeadline: { lte: now }
    },
    select: { id: true, tenantId: true, landlordId: true }
  });

  for (const offer of expired) {
    // Guard against race where status changed to ISSUE_REPORTED or similar
    const result = await prisma.offer.updateMany({
      where: { id: offer.id, moveInVerificationStatus: 'PENDING' },
      data: {
        moveInVerificationStatus: 'SUCCESS',
        moveInVerificationDate: now
      }
    });

    if (result.count === 0) {
      // Status no longer PENDING (e.g., ISSUE_REPORTED); skip notifications
      continue;
    }

    // Notify both parties
    await prisma.notification.create({
      data: {
        userId: offer.tenantId,
        type: 'SYSTEM_ANNOUNCEMENT',
        entityId: offer.id,
        title: 'Move-in auto-confirmed',
        body: 'Your move-in was automatically confirmed after 24h.'
      }
    });
    await prisma.notification.create({
      data: {
        userId: offer.landlordId,
        type: 'SYSTEM_ANNOUNCEMENT',
        entityId: offer.id,
        title: 'Tenant move-in auto-confirmed',
        body: 'The tenant move-in was automatically confirmed after 24h.'
      }
    });
  }
};

export const startMoveInVerificationScheduler = () => {
  if (verificationScheduler) return;
  verificationScheduler = setInterval(async () => {
    try {
      await runMoveInReminders();
      await runMoveInFinalization();
    } catch (err) {
      console.error('Move-in verification scheduler error:', err);
    }
  }, 5 * 60 * 1000); // every 5 minutes
  console.log('⏰ Move-in verification scheduler started (every 5 minutes).');
};

export const stopMoveInVerificationScheduler = () => {
  if (verificationScheduler) {
    clearInterval(verificationScheduler);
    verificationScheduler = undefined;
  }
};


