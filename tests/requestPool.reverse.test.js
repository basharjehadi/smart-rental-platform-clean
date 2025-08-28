import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Prisma used by the service
vi.mock('../backend/src/utils/prisma.js', async () => {
  return {
    prisma: {
      property: {
        findUnique: vi.fn(),
      },
      rentalRequest: {
        findMany: vi.fn(),
      },
      landlordRequestMatch: {
        createMany: vi.fn(async ({ data }) => ({ count: data?.length ?? 0 })),
      },
    },
  };
});

// Mock NotificationService
vi.mock('../backend/src/services/notificationService.js', () => ({
  createManyRentalRequestNotifications: vi.fn(async () => {}),
}));

import service from '../backend/src/services/requestPoolService.js';
import { prisma } from '../backend/src/utils/prisma.js';
import * as notifService from '../backend/src/services/notificationService.js';

describe('matchRequestsForNewProperty', () => {
  beforeEach(() => {
    prisma.property.findUnique.mockReset();
    prisma.rentalRequest.findMany.mockReset();
    prisma.landlordRequestMatch.createMany.mockReset();
    if (notifService.createManyRentalRequestNotifications) {
      notifService.createManyRentalRequestNotifications.mockReset();
    }
  });

  it('finds matching requests and creates anchored matches with notifications', async () => {
    // Seed one property in city "Warszawa", AVAILABLE
    const property = {
      id: 'prop_123',
      organizationId: 'org_456',
      city: 'Warszawa',
      address: 'Test Street 1',
      monthlyRent: 2500,
      propertyType: 'flat',
      bedrooms: 2,
      furnished: true,
      parking: false,
      petsAllowed: true,
      availableFrom: new Date('2025-09-01'),
      status: 'AVAILABLE',
      availability: true,
      organization: { id: 'org_456', name: 'Test Org', isPersonal: false }
    };

    // Seed two requests (ACTIVE+not expired) with locations containing "Warszawa", different budgets
    const requests = [
      {
        id: 101,
        title: 'Looking for 2BR in Warsaw',
        location: 'Warszawa, Mokotów',
        budget: 3000,
        budgetFrom: 2000,
        budgetTo: 3500,
        moveInDate: new Date('2025-09-15'),
        poolStatus: 'ACTIVE',
        expiresAt: new Date('2025-10-15'),
        propertyType: 'flat',
        bedrooms: 2,
        furnished: true,
        parking: false,
        petsAllowed: true
      },
      {
        id: 102,
        title: 'Need apartment in Warsaw area',
        location: 'Warszawa, Śródmieście',
        budget: 2800,
        budgetFrom: 2200,
        budgetTo: 3200,
        moveInDate: new Date('2025-09-20'),
        poolStatus: 'ACTIVE',
        expiresAt: new Date('2025-10-20'),
        propertyType: 'flat',
        bedrooms: 2,
        furnished: false,
        parking: true,
        petsAllowed: false
      }
    ];

    // Mock property lookup
    prisma.property.findUnique.mockResolvedValueOnce(property);
    
    // Mock rental request search
    prisma.rentalRequest.findMany.mockResolvedValueOnce(requests);
    
    // Mock match creation
    prisma.landlordRequestMatch.createMany.mockResolvedValueOnce({ count: 2 });

    // Call matchRequestsForNewProperty
    await service.matchRequestsForNewProperty('prop_123');

    // Verify property was loaded
    expect(prisma.property.findUnique).toHaveBeenCalledWith({
      where: { id: 'prop_123' },
      select: {
        id: true, organizationId: true, city: true, address: true, monthlyRent: true,
        propertyType: true, bedrooms: true, furnished: true, parking: true, petsAllowed: true,
        availableFrom: true, status: true, availability: true,
        organization: { select: { id: true, name: true, isPersonal: true } }
      }
    });

    // Verify rental requests were searched with correct criteria
    expect(prisma.rentalRequest.findMany).toHaveBeenCalledWith({
      where: {
        poolStatus: 'ACTIVE',
        expiresAt: { gt: expect.any(Date) },
        // 🚀 PERFORMANCE: Time window for high-volume systems (>100k requests)
        createdAt: { gte: expect.any(Date) }, // last 60 days
        OR: [
          { location: { contains: 'Warszawa', mode: 'insensitive' } },
          { location: { contains: 'Warszawa', mode: 'insensitive' } } // cityTokenNorm same as cityToken
        ].filter(Boolean),
        OR: [
          { budgetTo: { gte: 2500 } },
          { budget: { gte: 2500 } }
        ]
      },
      take: 200,
      orderBy: { createdAt: 'desc' }
    });

    // Verify matches were created with anchored propertyId
    expect(prisma.landlordRequestMatch.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          organizationId: 'org_456',
          rentalRequestId: 101,
          propertyId: 'prop_123', // Anchored to specific property
          status: 'ACTIVE',
          isViewed: false,
          isResponded: false
        }),
        expect.objectContaining({
          organizationId: 'org_456',
          rentalRequestId: 102,
          propertyId: 'prop_123', // Anchored to specific property
          status: 'ACTIVE',
          isViewed: false,
          isResponded: false
        })
      ]),
      skipDuplicates: true
    });

    // Verify notifications were created once with count == matched requests
    expect(notifService.createManyRentalRequestNotifications).toHaveBeenCalledTimes(1);
    const notificationCall = notifService.createManyRentalRequestNotifications.mock.calls[0][0];
    expect(notificationCall).toHaveLength(2);
    expect(notificationCall).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          organizationId: 'org_456',
          rentalRequestId: 101,
          title: 'New tenant request matches your newly listed property',
          tenantName: 'Tenant'
        }),
        expect.objectContaining({
          organizationId: 'org_456',
          rentalRequestId: 102,
          title: 'New tenant request matches your newly listed property',
          tenantName: 'Tenant'
        })
      ])
    );
  });

  it('skips processing when property is not available', async () => {
    const unavailableProperty = {
      id: 'prop_456',
      status: 'RENTED',
      availability: false
    };

    prisma.property.findUnique.mockResolvedValueOnce(unavailableProperty);

    await service.matchRequestsForNewProperty('prop_456');

    // Should not proceed with request search or match creation
    expect(prisma.rentalRequest.findMany).not.toHaveBeenCalled();
    expect(prisma.landlordRequestMatch.createMany).not.toHaveBeenCalled();
    expect(notifService.createManyRentalRequestNotifications).not.toHaveBeenCalled();
  });

  it('handles case when no matching requests found', async () => {
    const property = {
      id: 'prop_789',
      organizationId: 'org_789',
      city: 'Kraków',
      monthlyRent: 3000,
      status: 'AVAILABLE',
      availability: true,
      organization: { id: 'org_789', name: 'Test Org', isPersonal: false }
    };

    prisma.property.findUnique.mockResolvedValueOnce(property);
    prisma.rentalRequest.findMany.mockResolvedValueOnce([]); // No matching requests

    await service.matchRequestsForNewProperty('prop_789');

    // Should not create matches or notifications
    expect(prisma.landlordRequestMatch.createMany).not.toHaveBeenCalled();
    expect(notifService.createManyRentalRequestNotifications).not.toHaveBeenCalled();
  });
});
