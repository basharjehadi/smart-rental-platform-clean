import prisma from './lib/prisma.js';
import requestPoolService from './services/requestPoolService.js';

const triggerMatching = async () => {
  try {
    console.log('🔧 Triggering matching for existing requests...\n');
    
    // Get all active rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: { poolStatus: 'ACTIVE' },
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
    
    console.log(`📋 Found ${rentalRequests.length} active rental requests`);
    
    // Process each request
    for (const request of rentalRequests) {
      console.log(`\n🏊 Processing request ${request.id} (${request.location})`);
      
      try {
        const matchCount = await requestPoolService.addToPool(request);
        console.log(`✅ Request ${request.id} processed with ${matchCount} matches`);
      } catch (error) {
        console.error(`❌ Error processing request ${request.id}:`, error);
      }
    }
    
    // Check if matches were created
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { landlordId: 'cmdr7oyu40000ex7g9n56mcwz' }, // Anna Landlord
      include: {
        rentalRequest: {
          select: {
            id: true,
            location: true,
            budget: true
          }
        }
      }
    });
    
    console.log(`\n🔗 Total matches for landlord: ${matches.length}`);
    matches.forEach(match => {
      console.log(`  - Request ${match.rentalRequest.id}: ${match.rentalRequest.location} (Score: ${match.matchScore})`);
    });
    
  } catch (error) {
    console.error('❌ Error triggering matching:', error);
  } finally {
    await prisma.$disconnect();
  }
};

triggerMatching(); 