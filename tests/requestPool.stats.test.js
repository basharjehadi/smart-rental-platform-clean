import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../backend/src/utils/prisma.js', async () => {
  return {
    prisma: {
      rentalRequest: { count: vi.fn() },
      property: { groupBy: vi.fn() },
      landlordRequestMatch: { count: vi.fn() },
    },
  };
});

import service from '../backend/src/services/requestPoolService.js';
import { prisma } from '../backend/src/utils/prisma.js';

describe('getPoolStats', () => {
  beforeEach(() => {
    prisma.rentalRequest.count.mockReset();
    prisma.property.groupBy.mockReset();
    prisma.landlordRequestMatch.count.mockReset();
  });

  it('returns activeRequests, availableOrganizations, recentMatches', async () => {
    prisma.rentalRequest.count.mockResolvedValueOnce(7);
    // groupBy returns one row per organization with available properties
    prisma.property.groupBy.mockResolvedValueOnce([
      { organizationId: 'org1', _count: { _all: 3 } },
      { organizationId: 'org2', _count: { _all: 5 } },
    ]);
    prisma.landlordRequestMatch.count.mockResolvedValueOnce(4);

    const stats = await service.getPoolStats();

    expect(stats.activeRequests).toBe(7);
    expect(stats.availableOrganizations).toBe(2);
    expect(stats.recentMatches).toBe(4);
    expect(stats.timestamp instanceof Date).toBe(true);

    // Assert proper prisma calls were made
    expect(prisma.property.groupBy).toHaveBeenCalledWith({
      by: ['organizationId'],
      where: { status: 'AVAILABLE', availability: true },
      _count: { _all: true },
    });
  });
});
