#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('./backend/node_modules/@prisma/client/index.js');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Refunding payments for the latest admin-approved move-in issue...');

  const issue = await prisma.moveInIssue.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      lease: { select: { id: true, offerId: true } },
    },
  });

  if (!issue?.lease?.offerId) {
    console.log('❌ No issue/lease/offer found.');
    process.exit(0);
  }

  const { refundOfferPayments } = await import('./backend/src/controllers/paymentController.js');
  const result = await refundOfferPayments(issue.lease.offerId);
  console.log('✅ Refund result:', result);
}

main()
  .catch((e) => {
    console.error('💥 Refund execution failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


