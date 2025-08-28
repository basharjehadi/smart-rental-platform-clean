import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock prisma used by service
vi.mock('../backend/src/utils/prisma.js', async () => {
  return {
    prisma: {
      rentalRequest: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };
});

import service from '../backend/src/services/requestPoolService.js';
import { prisma } from '../backend/src/utils/prisma.js';

describe('cleanupExpiredRequests', () => {
  beforeEach(() => {
    prisma.rentalRequest.findMany.mockReset();
    prisma.rentalRequest.updateMany.mockReset();
  });

  it('marks active+expired as EXPIRED and updates analytics per unique location', async () => {
    const nowPast = new Date(Date.now() - 3600_000).toISOString();
    const expired = [
      { id: 1, title: 'A', moveInDate: nowPast, expiresAt: nowPast, location: 'Poznań' },
      { id: 2, title: 'B', moveInDate: nowPast, expiresAt: nowPast, location: 'Poznań' },
      { id: 3, title: 'C', moveInDate: nowPast, expiresAt: nowPast, location: 'Warszawa' },
    ];
    prisma.rentalRequest.findMany.mockResolvedValueOnce(expired);
    prisma.rentalRequest.updateMany.mockResolvedValueOnce({ count: 3 });

    // spy on analytics method
    const spy = vi.spyOn(service, 'updatePoolAnalytics').mockResolvedValue();

    await service.cleanupExpiredRequests();

    expect(prisma.rentalRequest.findMany).toHaveBeenCalled();
    expect(prisma.rentalRequest.updateMany).toHaveBeenCalled();
    // Only 2 unique locations should trigger analytics
    const calledWith = spy.mock.calls.map(c => c[0]).sort();
    expect(calledWith).toEqual(['Poznań', 'Warszawa']);
    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });

  it('no-op when none expired', async () => {
    prisma.rentalRequest.findMany.mockResolvedValueOnce([]);
    await service.cleanupExpiredRequests();
    expect(prisma.rentalRequest.updateMany).not.toHaveBeenCalled();
  });
});
