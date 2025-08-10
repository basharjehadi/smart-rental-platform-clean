import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPoolStatus() {
  try {
    console.log('🔍 Checking request pool status...\n');

    // Check rental request pool status
    const rentalRequest = await prisma.rentalRequest.findFirst({
      select: {
        id: true,
        title: true,
        poolStatus: true,
        expiresAt: true,
        createdAt: true
      }
    });

    if (rentalRequest) {
      console.log('📝 Rental Request Pool Status:');
      console.log(`  - ID: ${rentalRequest.id}`);
      console.log(`  - Title: "${rentalRequest.title}"`);
      console.log(`  - Pool Status: ${rentalRequest.poolStatus}`);
      console.log(`  - Expires At: ${rentalRequest.expiresAt || 'NULL'}`);
      console.log(`  - Created At: ${rentalRequest.createdAt}`);
    }

    // Check landlord-request matches
    const matches = await prisma.landlordRequestMatch.findMany({
      include: {
        rentalRequest: {
          select: {
            title: true
          }
        },
        landlord: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log('\n🔗 Landlord-Request Matches:', matches.length);
    matches.forEach(match => {
      console.log(`  - Landlord: ${match.landlord.name} (${match.landlord.email})`);
      console.log(`    Request: "${match.rentalRequest.title}"`);
      console.log(`    Match Score: ${match.matchScore}`);
      console.log(`    Match Reason: ${match.matchReason}`);
    });

    // Check if there are any errors in the logs or if the pool service failed
    console.log('\n🔍 Checking for potential issues:');
    
    // Check if the rental request has the right status
    if (rentalRequest && rentalRequest.poolStatus !== 'ACTIVE') {
      console.log('  ❌ Rental request is not in ACTIVE pool status');
    } else if (rentalRequest) {
      console.log('  ✅ Rental request is in ACTIVE pool status');
    }

    // Check if matches should exist but don't
    if (rentalRequest && rentalRequest.poolStatus === 'ACTIVE' && matches.length === 0) {
      console.log('  ❌ Rental request is in pool but has no matches - this indicates a bug!');
      
      // Let's manually trigger the pool service to see what happens
      console.log('\n🔧 Attempting to manually add to pool...');
      try {
        const { default: requestPoolService } = await import('./src/services/requestPoolService.js');
        
        // Get the complete rental request object with all fields
        const completeRentalRequest = await prisma.rentalRequest.findFirst({
          where: { id: rentalRequest.id },
          include: {
            tenant: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        
        const matchCount = await requestPoolService.addToPool(completeRentalRequest);
        console.log(`  ✅ Manually added to pool with ${matchCount} matches`);
        
        // Check matches again
        const newMatches = await prisma.landlordRequestMatch.findMany({
          where: { rentalRequestId: rentalRequest.id }
        });
        console.log(`  🔍 New matches created: ${newMatches.length}`);
        
      } catch (error) {
        console.error('  ❌ Error manually adding to pool:', error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPoolStatus();
