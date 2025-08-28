import { vi, describe, it, expect, beforeEach } from 'vitest';

// Point prisma mock to our local mock
vi.mock('../backend/src/utils/prisma.js', async () => {
  const mock = await import('./__mocks__/prisma.js');
  return mock;
});

import service from '../backend/src/services/requestPoolService.js';
import { prisma } from './__mocks__/prisma.js';

describe('markAsViewedForOrg is idempotent', () => {
  const organizationId = 'org_1';
  const rentalRequestId = 123;

  beforeEach(() => {
    prisma.landlordRequestMatch.updateMany.mockReset();
    prisma.rentalRequest.update.mockReset();
  });

  it('increments viewCount by the number of newly viewed matches only once', async () => {
    // First call: two unseen rows -> count=2, expect increment by 2
    prisma.landlordRequestMatch.updateMany.mockResolvedValueOnce({ count: 2 });

    await service.markAsViewedForOrg(organizationId, rentalRequestId);

    expect(prisma.landlordRequestMatch.updateMany).toHaveBeenCalledWith({
      where: { organizationId, rentalRequestId, isViewed: false },
      data: { isViewed: true }
    });
    expect(prisma.rentalRequest.update).toHaveBeenCalledWith({
      where: { id: rentalRequestId },
      data: { viewCount: { increment: 2 } }
    });

    // Second call: nothing new to mark -> count=0, expect no increment
    prisma.landlordRequestMatch.updateMany.mockResolvedValueOnce({ count: 0 });

    await service.markAsViewedForOrg(organizationId, rentalRequestId);

    expect(prisma.rentalRequest.update).toHaveBeenCalledTimes(1); // still only the first increment
  });
});
