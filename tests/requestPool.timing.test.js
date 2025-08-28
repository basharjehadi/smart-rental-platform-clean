import service from '../backend/src/services/requestPoolService.js';

// helper to build test cases
function makeReq(moveInISO) {
  return { location: '', moveInDate: moveInISO };
}
function makeProp(availISO) {
  return {
    id: 'p1',
    city: '',          // so location score = 0
    address: '',
    propertyType: undefined,
    bedrooms: undefined,
    monthlyRent: undefined, // so budget score = 0
    availableFrom: availISO,
    furnished: undefined,
    parking: undefined,
    petsAllowed: undefined,
  };
}

describe('calculateWeightedScore timing component', () => {
  const org = {}; // no isPersonal -> perf = 0

  it('timing = 10 when availableFrom == moveIn', () => {
    const moveIn = '2025-09-10T00:00:00.000Z';
    const req = makeReq(moveIn);
    const prop = makeProp(moveIn);
    const score = service.calculateWeightedScore(org, req, prop);
    expect(score).toBe(10); // only timing contributes, W.timing=10 maps 10/10*10 = 10
  });

  it('timing = 8 within ±7 days', () => {
    const moveIn = new Date('2025-09-10T00:00:00.000Z');
    const plus5 = new Date(moveIn.getTime() + 5 * 86400000).toISOString();
    const minus5 = new Date(moveIn.getTime() - 5 * 86400000).toISOString();

    expect(service.calculateWeightedScore(org, makeReq(moveIn.toISOString()), makeProp(plus5))).toBe(8);
    expect(service.calculateWeightedScore(org, makeReq(moveIn.toISOString()), makeProp(minus5))).toBe(8);
  });

  it('timing = 5 within ±30 days', () => {
    const moveIn = new Date('2025-09-10T00:00:00.000Z');
    const plus20 = new Date(moveIn.getTime() + 20 * 86400000).toISOString();
    const minus20 = new Date(moveIn.getTime() - 20 * 86400000).toISOString();

    expect(service.calculateWeightedScore(org, makeReq(moveIn.toISOString()), makeProp(plus20))).toBe(5);
    expect(service.calculateWeightedScore(org, makeReq(moveIn.toISOString()), makeProp(minus20))).toBe(5);
  });

  it('timing = 3 within ±90 days', () => {
    const moveIn = new Date('2025-09-10T00:00:00.000Z');
    const plus80 = new Date(moveIn.getTime() + 80 * 86400000).toISOString();
    const minus80 = new Date(moveIn.getTime() - 80 * 86400000).toISOString();

    expect(service.calculateWeightedScore(org, makeReq(moveIn.toISOString()), makeProp(plus80))).toBe(3);
    expect(service.calculateWeightedScore(org, makeReq(moveIn.toISOString()), makeProp(minus80))).toBe(3);
  });
});
