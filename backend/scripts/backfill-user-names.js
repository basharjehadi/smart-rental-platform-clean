import { prisma } from '../src/utils/prisma.js';

(async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: null },
          { firstName: '' },
          { lastName: null },
          { lastName: '' }
        ]
      },
      select: { id: true, name: true, firstName: true, lastName: true }
    });

    let updated = 0;
    for (const u of users) {
      const parts = (u.name || '').trim().split(/\s+/).filter(Boolean);
      const derivedFirst = u.firstName && u.firstName.trim() ? u.firstName : (parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : parts[0] || null);
      const derivedLast = u.lastName && u.lastName.trim() ? u.lastName : (parts.length > 1 ? parts[parts.length - 1] : null);

      if (derivedFirst || derivedLast) {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            firstName: derivedFirst,
            lastName: derivedLast
          }
        });
        updated += 1;
      }
    }

    console.log(`Backfill complete. Updated ${updated} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(1);
  }
})();
