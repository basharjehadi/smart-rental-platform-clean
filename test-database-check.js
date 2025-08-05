import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking Database State');
  console.log('==========================');
  
  try {
    // Check rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      include: { tenant: true }
    });
    
    console.log(`📝 Found ${rentalRequests.length} rental requests:`);
    rentalRequests.forEach(request => {
      console.log(`   ID: ${request.id}`);
      console.log(`   Title: ${request.title}`);
      console.log(`   Location: ${request.location}`);
      console.log(`   Budget: ${request.budget}`);
      console.log(`   Budget From: ${request.budgetFrom}`);
      console.log(`   Budget To: ${request.budgetTo}`);
      console.log(`   Bedrooms: ${request.bedrooms}`);
      console.log(`   Move In Date: ${request.moveInDate}`);
      console.log(`   Pool Status: ${request.poolStatus}`);
      console.log(`   Tenant: ${request.tenant.name}`);
      console.log('   ---');
    });
    
    // Check properties
    const properties = await prisma.property.findMany({
      include: { landlord: true }
    });
    
    console.log(`🏠 Found ${properties.length} properties:`);
    properties.forEach(property => {
      console.log(`   ID: ${property.id}`);
      console.log(`   Name: ${property.name}`);
      console.log(`   City: ${property.city}`);
      console.log(`   Address: ${property.address}`);
      console.log(`   Monthly Rent: ${property.monthlyRent}`);
      console.log(`   Bedrooms: ${property.bedrooms}`);
      console.log(`   Available From: ${property.availableFrom}`);
      console.log(`   Landlord: ${property.landlord.name}`);
      console.log('   ---');
    });
    
    // Check matches
    const matches = await prisma.landlordRequestMatch.findMany({
      include: {
        landlord: { select: { name: true, email: true } },
        rentalRequest: { select: { title: true } }
      }
    });
    
    console.log(`📊 Found ${matches.length} matches:`);
    matches.forEach(match => {
      console.log(`   Landlord: ${match.landlord.name}`);
      console.log(`   Request: ${match.rentalRequest.title}`);
      console.log(`   Score: ${match.matchScore}`);
      console.log(`   Reason: ${match.matchReason}`);
      console.log(`   Viewed: ${match.isViewed}`);
      console.log('   ---');
    });
    
    // Manual matching test
    console.log('🔍 Manual Matching Test:');
    if (rentalRequests.length > 0 && properties.length > 0) {
      const request = rentalRequests[0];
      const property = properties[0];
      
      console.log(`   Request: ${request.title}`);
      console.log(`   Property: ${property.name}`);
      
      // Check location match
      const locationMatch = property.city.includes(request.location.split(',')[0].trim());
      console.log(`   Location match: ${locationMatch} (${property.city} contains ${request.location.split(',')[0].trim()})`);
      
      // Check budget match
      const budgetMatch = request.budgetFrom && request.budgetTo && 
        property.monthlyRent >= request.budgetFrom && property.monthlyRent <= request.budgetTo;
      console.log(`   Budget match: ${budgetMatch} (${property.monthlyRent} PLN in range ${request.budgetFrom}-${request.budgetTo})`);
      
      // Check bedrooms match
      const bedroomsMatch = request.bedrooms === property.bedrooms;
      console.log(`   Bedrooms match: ${bedroomsMatch} (${request.bedrooms} === ${property.bedrooms})`);
      
      // Check availability match
      const availabilityMatch = new Date(property.availableFrom) <= new Date(request.moveInDate);
      console.log(`   Availability match: ${availabilityMatch} (${property.availableFrom} <= ${request.moveInDate})`);
      
      const allMatch = locationMatch && budgetMatch && bedroomsMatch && availabilityMatch;
      console.log(`   All criteria match: ${allMatch}`);
      
      if (allMatch) {
        console.log('✅ MANUAL MATCHING TEST PASSED!');
        console.log('✅ The core matching logic works correctly');
        console.log('✅ The issue is in the automated matching system');
      } else {
        console.log('❌ MANUAL MATCHING TEST FAILED');
        console.log('❌ The matching criteria are not being met');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 