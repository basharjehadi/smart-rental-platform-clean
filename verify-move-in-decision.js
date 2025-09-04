#!/usr/bin/env node

/**
 * Verify post-approval state for the most recent move-in issue.
 * - Prints issue status
 * - Lease status
 * - Offer status
 * - RentalRequest status/poolStatus
 * - Property status/availability
 * - Payments refund summary
 * - Conversations archived summary
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('./backend/node_modules/@prisma/client/index.js');

const prisma = new PrismaClient();

async function main() {
  console.log('🔎 Verifying latest move-in issue and related entities...');

  const issue = await prisma.moveInIssue.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      lease: {
        select: {
          id: true,
          status: true,
          offerId: true,
          propertyId: true,
          rentalRequestId: true,
        },
      },
    },
  });

  if (!issue) {
    console.log('❌ No move-in issues found.');
    process.exit(0);
  }

  console.log('🧾 Issue:', { id: issue.id, status: issue.status, createdAt: issue.createdAt });

  const { offerId, propertyId, rentalRequestId, id: leaseId } = issue.lease || {};

  const [lease, offer, property, rentalRequest] = await Promise.all([
    leaseId ? prisma.lease.findUnique({ where: { id: leaseId }, select: { id: true, status: true } }) : null,
    offerId ? prisma.offer.findUnique({ where: { id: offerId }, select: { id: true, status: true, isPaid: true } }) : null,
    propertyId ? prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, status: true, availability: true } }) : null,
    typeof rentalRequestId === 'number'
      ? prisma.rentalRequest.findUnique({ where: { id: rentalRequestId }, select: { id: true, status: true, poolStatus: true } })
      : null,
  ]);

  console.log('🏷️ Lease:', lease || 'N/A');
  console.log('🏷️ Offer:', offer || 'N/A');
  console.log('🏷️ RentalRequest:', rentalRequest || 'N/A');
  console.log('🏷️ Property:', property || 'N/A');

  // Payments (refunded)
  const payments = offerId
    ? await prisma.payment.findMany({
        where: { OR: [{ offerId }, { rentalRequestId }] },
        select: { id: true, status: true, amount: true, gateway: true },
      })
    : [];
  const refunded = payments.filter((p) => {
    const s = String(p.status).toUpperCase();
    return s.includes('REFUND') || s === 'CANCELLED';
  });
  console.log('💳 Payments:', payments);
  console.log(`💰 Refund summary: ${refunded.length}/${payments.length} refunded or cancelled (mock)`);

  // Conversations (archived)
  const conversations = offerId
    ? await prisma.conversation.findMany({
        where: { offerId },
        select: { id: true, status: true },
      })
    : [];
  const archived = conversations.filter((c) => c.status === 'ARCHIVED');
  console.log('💬 Conversations:', conversations);
  console.log(`📦 Conversations archived: ${archived.length}/${conversations.length}`);

  console.log('\n✅ Expected post-approval state:');
  console.log('- Issue: RESOLVED or ADMIN_APPROVED');
  console.log('- Lease: TERMINATED');
  console.log('- Offer: REJECTED');
  console.log('- RentalRequest: CANCELLED/REJECTED and unlocked');
  console.log('- Property: AVAILABLE & availability=true');
  console.log('- Payments: refunded via provider');
  console.log('- Conversations: ARCHIVED');
}

main()
  .catch((e) => {
    console.error('💥 Verification failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


