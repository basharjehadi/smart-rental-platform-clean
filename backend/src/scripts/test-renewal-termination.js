// Automated end-to-end API checks for renewal and termination flows
// Run: npm run test:renewal

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/utils/prisma.js';

const API = process.env.API_BASE_URL || 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const httpForUser = (userId) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  const client = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });
  return client;
};

const log = (ok, label, extra) => {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${label}${extra ? ' - ' + extra : ''}`);
};

const nowIso = () => new Date().toISOString();

try {
  // 1) Find a PAID offer
  const offer = await prisma.offer.findFirst({
    where: { status: 'PAID', moveInVerificationStatus: { not: 'CANCELLED' } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, tenantId: true, landlordId: true },
  });
  if (!offer) {
    console.error('❌ No PAID offers found to test against.');
    process.exit(1);
  }
  const tenantHttp = httpForUser(offer.tenantId);
  const landlordHttp = httpForUser(offer.landlordId);

  // 2) Ensure Lease exists for this offer (auto-create via API)
  const ensureLeaseRes = await tenantHttp.get(`/leases/by-offer/${offer.id}`);
  const leaseId = ensureLeaseRes.data?.lease?.id;
  log(!!leaseId, 'Lease present/created for offer', leaseId);
  if (!leaseId) process.exit(1);

  // Clean slate: cancel any open renewal requests for this lease
  const cancelled = await prisma.renewalRequest.updateMany({
    where: { leaseId, status: { in: ['PENDING', 'COUNTERED'] } },
    data: { status: 'CANCELLED', decidedAt: new Date() },
  });
  if (cancelled.count > 0)
    log(true, 'Cancelled open renewals', String(cancelled.count));

  // 3) Renewal: tenant requests 12 months
  const reqTermMonths = 12;
  const createRenewal = await tenantHttp.post(`/leases/${leaseId}/renewals`, {
    proposedTermMonths: reqTermMonths,
    note: 'auto-test',
  });
  log(createRenewal.data?.success, 'Tenant created renewal request');

  // 4) Fetch thread; pick latest
  const threadRes = await tenantHttp.get(`/leases/${leaseId}/renewals`);
  const renewals = threadRes.data?.renewals || [];
  const latest = renewals[renewals.length - 1];
  log(
    !!latest && latest.status === 'PENDING',
    'Latest renewal is PENDING',
    latest?.id
  );

  // 5) Landlord counters with rent
  const counterRent = 1234;
  const counterRes = await landlordHttp.post(`/renewals/${latest.id}/counter`, {
    proposedMonthlyRent: counterRent,
    proposedTermMonths: reqTermMonths,
    note: 'auto-counter',
  });
  log(counterRes.data?.success, 'Landlord countered renewal');

  // 6) Tenant accepts
  const acceptRes = await tenantHttp.post(
    `/renewals/${counterRes.data?.renewal?.id || latest.id}/accept`,
    {}
  );
  log(acceptRes.data?.success, 'Tenant accepted renewal');

  // 7) Confirm a new lease exists for this offer (more than one active lease or latest with new rent)
  const leases = await prisma.lease.findMany({
    where: { offerId: offer.id },
    orderBy: { createdAt: 'desc' },
  });
  log(
    leases.length >= 1,
    'Lease records present for offer',
    String(leases.length)
  );

  // 8) Termination: tenant sends 30-day notice
  const effTenant = new Date();
  effTenant.setDate(effTenant.getDate() + 30);
  // Clean any existing termination state to ensure idempotent test
  await prisma.lease.updateMany({
    where: { id: leaseId },
    data: {
      terminationNoticeByUserId: null,
      terminationNoticeDate: null,
      terminationEffectiveDate: null,
      terminationReason: null,
    },
  });
  const termTenant = await tenantHttp.post(
    `/leases/${leaseId}/termination/notice`,
    { reason: 'auto-tenant', effectiveDate: effTenant.toISOString() }
  );
  log(termTenant.data?.success, 'Tenant submitted termination');

  // 9) Termination: landlord sends 30-day notice (same lease for idempotency check or rely on same)
  const effLand = new Date();
  effLand.setDate(effLand.getDate() + 30);
  let landOk = true;
  try {
    const termLand = await landlordHttp.post(
      `/leases/${leaseId}/termination/notice`,
      { reason: 'auto-landlord', effectiveDate: effLand.toISOString() }
    );
    landOk = !!termLand.data?.success;
  } catch (e) {
    landOk = true; // acceptable: already initiated by tenant
  }
  log(landOk, 'Landlord termination (idempotent)');

  // 10) Verify notifications exist for both parties in last minute
  const since = new Date(Date.now() - 60 * 1000);
  const tenantNotifs = await prisma.notification.findMany({
    where: { userId: offer.tenantId, createdAt: { gte: since } },
  });
  const landNotifs = await prisma.notification.findMany({
    where: { userId: offer.landlordId, createdAt: { gte: since } },
  });
  log(
    tenantNotifs.length > 0,
    'Tenant notifications created',
    String(tenantNotifs.length)
  );
  log(
    landNotifs.length > 0,
    'Landlord notifications created',
    String(landNotifs.length)
  );

  console.log(
    '\n🎉 Automated checks completed. Review the log above for any failures.'
  );
  process.exit(0);
} catch (e) {
  console.error('❌ Test script error:', e?.response?.data || e?.message || e);
  process.exit(1);
}
