import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeASCII(value) {
  if (!value) return '';
  try { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  catch { return value; }
}

async function main() {
  try {
    const request = await prisma.rentalRequest.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!request) {
      console.log('No rental requests found.');
      return;
    }

    console.log('Request:', {
      id: request.id,
      location: request.location,
      budget: request.budget,
      budgetFrom: request.budgetFrom,
      budgetTo: request.budgetTo,
      moveInDate: request.moveInDate
    });

    const rawLocation = request.location || '';
    const cityToken = rawLocation.split(',').pop()?.trim() || rawLocation.trim();
    const cityTokenNorm = normalizeASCII(cityToken);
    const tokens = rawLocation.split(',').map(t => t.trim()).filter(Boolean);
    const tokenSet = Array.from(new Set([cityToken, cityTokenNorm, ...tokens]));

    const maxBudget = request.budgetTo ?? request.budget;
    const minBudget = request.budgetFrom ?? null;
    const moveIn = request.moveInDate ? new Date(request.moveInDate) : null;
    const availableCutoff = moveIn ? new Date(moveIn.getTime() + 30*86400000) : null;

    const totalProps = await prisma.property.count();
    const statusAvail = await prisma.property.count({ where: { status: 'AVAILABLE', availability: true } });

    const cityFiltered = await prisma.property.count({
      where: {
        status: 'AVAILABLE', availability: true,
        OR: [
          cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
          cityTokenNorm && cityTokenNorm !== cityToken ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined,
          tokenSet.length > 0 ? { city: { in: tokenSet } } : undefined
        ].filter(Boolean)
      }
    });

    const budgetFiltered = await prisma.property.count({
      where: {
        status: 'AVAILABLE', availability: true,
        monthlyRent: { lte: maxBudget != null ? Math.round(parseFloat(maxBudget) * 1.2) : 9999999, ...(minBudget != null ? { gte: parseFloat(minBudget) } : {}) },
      }
    });

    const dateFiltered = await prisma.property.count({
      where: {
        status: 'AVAILABLE', availability: true,
        ...(availableCutoff ? { OR: [ { availableFrom: { lte: availableCutoff } }, { availableFrom: null } ] } : {})
      }
    });

    const fullWhereCount = await prisma.property.count({
      where: {
        status: 'AVAILABLE', availability: true,
        ...((cityToken || tokenSet.length > 0) ? {
          OR: [
            cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
            cityTokenNorm && cityTokenNorm !== cityToken ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined,
            tokenSet.length > 0 ? { city: { in: tokenSet } } : undefined
          ].filter(Boolean)
        } : {}),
        monthlyRent: { lte: maxBudget != null ? Math.round(parseFloat(maxBudget) * 1.2) : 9999999, ...(minBudget != null ? { gte: parseFloat(minBudget) } : {}) },
        ...(availableCutoff ? { OR: [ { availableFrom: { lte: availableCutoff } }, { availableFrom: null } ] } : {})
      }
    });

    console.log('\nProperty counts by filter:');
    console.log('- Total properties:', totalProps);
    console.log('- AVAILABLE + availability=true:', statusAvail);
    console.log('- City-filtered:', cityFiltered);
    console.log('- Budget-filtered:', budgetFiltered);
    console.log('- Date-filtered (<= cutoff OR null):', dateFiltered);
    console.log('- Combined (current logic + null-friendly date):', fullWhereCount);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();





