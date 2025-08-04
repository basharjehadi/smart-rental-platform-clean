import { prisma } from './backend/src/utils/prisma.js';
import requestPoolService from './backend/src/services/requestPoolService.js';

const testManualPool = async () => {
  try {
    console.log('🔧 Testing Manual Pool Processing...\n');
    
    // Get the latest rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: { poolStatus: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!rentalRequest) {
      console.log('❌ No active rental requests found');
      return;
    }
    
    console.log(`📋 Processing rental request: ${rentalRequest.title}`);
    console.log(`   ID: ${rentalRequest.id}`);
    console.log(`   Location: ${rentalRequest.location}`);
    console.log(`   Budget: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN`);
    console.log(`   Bedrooms: ${rentalRequest.bedrooms}`);
    console.log(`   Tenant: ${rentalRequest.tenant.name} (${rentalRequest.tenant.email})`);
    
    // Manually add to pool
    console.log('\n🏊 Manually adding to pool...');
    const matchCount = await requestPoolService.addToPool(rentalRequest);
    
    console.log(`✅ Pool processing completed with ${matchCount} matches`);
    
    // Check if matches were created
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { rentalRequestId: rentalRequest.id },
      include: {
        rentalRequest: {
          select: { title: true }
        }
      }
    });
    
    console.log(`\n📊 Results:`);
    console.log(`   Total matches created: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log('\n🏆 Created matches:');
      matches.forEach(match => {
        console.log(`   - Landlord ${match.landlordId}: Score ${match.matchScore}, Reason: ${match.matchReason}`);
      });
    } else {
      console.log('\n❌ No matches were created in the database');
    }
    
    // Check if landlords can see the request
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      select: { id: true, email: true }
    });
    
    console.log(`\n👥 Checking ${landlords.length} landlords for request visibility...`);
    
    for (const landlord of landlords) {
      const landlordMatches = await prisma.landlordRequestMatch.findMany({
        where: { 
          landlordId: landlord.id,
          rentalRequestId: rentalRequest.id
        }
      });
      
      if (landlordMatches.length > 0) {
        console.log(`   ✅ ${landlord.email}: ${landlordMatches.length} matches`);
      } else {
        console.log(`   ❌ ${landlord.email}: No matches`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testManualPool(); 