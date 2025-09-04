#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('./backend/node_modules/@prisma/client/index.js');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing latest admin-approved move-in issue by applying cascading updates...');

  const issue = await prisma.moveInIssue.findFirst({
    where: { adminDecision: { in: ['APPROVE', 'ACCEPTED'] } },
    orderBy: { adminDecisionAt: 'desc' },
    include: { lease: true },
  });

  if (!issue) {
    console.log('❌ No admin-approved issues found to fix.');
    return;
  }

  const now = new Date();
  const lease = issue.lease;
  if (!lease) {
    console.log('❌ Issue has no lease linked, aborting.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Lease -> TERMINATED
    await tx.lease.update({
      where: { id: lease.id },
      data: { status: 'TERMINATED', updatedAt: now },
    });
    // Offer -> REJECTED + unpaid
    await tx.offer.update({
      where: { id: lease.offerId },
      data: { status: 'REJECTED', isPaid: false, paymentDate: null, updatedAt: now },
    });
    // RentalRequest -> unlock + REJECTED (if exists)
    const rentalRequest = await tx.rentalRequest.findFirst({
      where: { offers: { some: { id: lease.offerId } } },
      select: { id: true },
    });
    if (rentalRequest) {
      await tx.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: { isLocked: false, poolStatus: 'CANCELLED', status: 'CANCELLED', updatedAt: now },
      });
    }
    // Property -> AVAILABLE
    await tx.property.update({
      where: { id: lease.propertyId },
      data: { status: 'AVAILABLE', availability: true, updatedAt: now },
    });
    // Conversations -> ARCHIVED
    await tx.conversation.updateMany({ where: { offerId: lease.offerId }, data: { status: 'ARCHIVED' } });
  });

  console.log('✅ Cascading updates applied.');
}

main()
  .catch((e) => {
    console.error('💥 Fix failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


