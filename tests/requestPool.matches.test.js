import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Prisma used by the service
vi.mock('../backend/src/utils/prisma.js', async () => {
  return {
    prisma: {
      landlordRequestMatch: {
        createMany: vi.fn(async ({ data }) => ({ count: data?.length ?? 0 })),
      },
    },
  };
});

// Mock NotificationService (cover both possible specifiers just in case)
vi.mock('../backend/src/services/notificationService.js', () => ({
  createManyRentalRequestNotifications: vi.fn(async () => {}),
}));
vi.mock('../services/notificationService.js', () => ({
  createManyRentalRequestNotifications: vi.fn(async () => {}),
}));

import service from '../backend/src/services/requestPoolService.js';
import { prisma } from '../backend/src/utils/prisma.js';
import * as notifA from '../backend/src/services/notificationService.js';

// Build two org candidates with different best properties
const makeOrg = (id, props) => ({ id, organization: { id, isPersonal: false }, properties: props });

describe('createMatches', () => {
  beforeEach(() => {
    prisma.landlordRequestMatch.createMany.mockClear();
    if (notifA && notifA.createManyRentalRequestNotifications) {
      notifA.createManyRentalRequestNotifications.mockClear();
    }
  });

  it('anchors to best property and notifies org members in bulk', async () => {
    const rentalRequest = { id: 777, title: 'Looking for 2BR', tenant: { name: 'Alice' }, budget: 3000, moveInDate: '2025-09-10' };

    const org1Props = [
      { id: 'p1a', city: 'Poznań', address: 'A', propertyType: 'flat', bedrooms: 1, monthlyRent: 3500, availableFrom: '2025-09-20' },
      { id: 'p1b', city: 'Poznań', address: 'B', propertyType: 'flat', bedrooms: 2, monthlyRent: 2900, availableFrom: '2025-09-10' }, // best
    ];
    const org2Props = [
      { id: 'p2a', city: 'Warszawa', address: 'C', propertyType: 'flat', bedrooms: 2, monthlyRent: 3100, availableFrom: '2025-09-12' },
      { id: 'p2b', city: 'Warszawa', address: 'D', propertyType: 'flat', bedrooms: 2, monthlyRent: 2950, availableFrom: '2025-09-08' }, // best
    ];

    const orgs = [
      makeOrg('org1', org1Props),
      makeOrg('org2', org2Props),
    ].map(o => ({ ...o, matchScore: 80, matchReason: 'test' }));

    await service.createMatches(rentalRequest.id, orgs, rentalRequest);

    // Assert batch insert
    expect(prisma.landlordRequestMatch.createMany).toHaveBeenCalledTimes(1);
    const call = prisma.landlordRequestMatch.createMany.mock.calls[0][0];
    expect(call.skipDuplicates).toBe(true);
    // Ensure each match is anchored to the intended "best" property
    const inserted = call.data;
    const m1 = inserted.find(m => m.organizationId === 'org1');
    const m2 = inserted.find(m => m.organizationId === 'org2');
    expect(m1.propertyId).toBe('p1b');
    expect(m2.propertyId).toBe('p2b');

    // Assert notifications called once with N items
    if (notifA && notifA.createManyRentalRequestNotifications) {
      expect(notifA.createManyRentalRequestNotifications).toHaveBeenCalledTimes(1);
      const items = notifA.createManyRentalRequestNotifications.mock.calls[0][0];
      expect(items).toHaveLength(2);
      expect(items.map(i => i.organizationId).sort()).toEqual(['org1','org2']);
    }
  });
});
